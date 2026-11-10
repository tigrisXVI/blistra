// Cloud mode: real accounts (Firebase Authentication) and family circles shared
// in real time (Cloud Firestore).
//
// Database layout
//   users/{uid}                     profile: name, email, familyIds, consent, dates
//   admins/{uid}                    { name: "Vasco" } — created only from the Firebase console
//   families/{fid}                  circle: name, members, people cared for, invite code
//   families/{fid}/meds/{id}        one medicine with its schedule, stock and prescription
//   families/{fid}/reminders/{id}   appointments and other reminders
//   families/{fid}/logs/{yyyy-mm-dd} doses taken that day
//   families/{fid}/devices/{id}     a Scatoletta Blistra: who it is for, its times, its last status
//   invites/{CODE}                  invite code -> circle id
//   site/public                     texts and look of the public page (edited in Studio)
//   media/{id}                      images uploaded from Studio
//
// Who can read and write what is decided by firestore.rules, not by this file.

import { A, prefs, savePrefs, emit } from "../state.js";
import { firebase } from "../firebase.js";
import { ymd, addDays, uid, inviteCode, clone } from "../util.js";
import { PCOLORS } from "../domain.js";
import { HISTORY_DAYS, VERSION } from "../config.js";

export async function cloudStore() {
  const { auth, db, authM, fs } = await firebase();
  const { doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc, getDocs, writeBatch,
    arrayUnion, arrayRemove, increment, deleteField, query, where, documentId, serverTimestamp } = fs;

  let famUnsubs = [], userUnsub = null, currentFid;
  const onErr = e => { console.warn(e); A.error = e.code || e.message; emit(); };
  const clearFam = () => { famUnsubs.forEach(u => u()); famUnsubs = []; };
  const me = () => auth.currentUser.uid;
  const fid = () => A.family && A.family.id;
  const strip = o => { const c = clone(o); delete c.id; delete c._new; c.updatedAt = Date.now(); return c; };

  function subscribeFamily(id) {
    clearFam();
    currentFid = id;
    Object.assign(A, { family: null, meds: [], reminders: [], devices: [], logs: {}, familyLoading: !!id });
    if (!id) { emit(); return; }
    prefs.lastFamily = id; savePrefs();
    famUnsubs.push(onSnapshot(doc(db, "families", id), s => {
      A.familyLoading = false;
      A.family = s.exists() ? Object.assign({ id: s.id }, s.data()) : null;
      if (A.family) A.familyNames[id] = A.family.name;
      emit();
    }, onErr));
    famUnsubs.push(onSnapshot(collection(db, "families", id, "meds"), qs => { A.meds = qs.docs.map(d => Object.assign({ id: d.id }, d.data())); emit(); }, onErr));
    famUnsubs.push(onSnapshot(collection(db, "families", id, "reminders"), qs => { A.reminders = qs.docs.map(d => Object.assign({ id: d.id }, d.data())); emit(); }, onErr));
    famUnsubs.push(onSnapshot(collection(db, "families", id, "devices"), qs => { A.devices = qs.docs.map(d => Object.assign({ id: d.id }, d.data())); emit(); }, onErr));
    const since = ymd(addDays(new Date(), -HISTORY_DAYS));
    famUnsubs.push(onSnapshot(query(collection(db, "families", id, "logs"), where(documentId(), ">=", since)), qs => {
      const out = {}; qs.docs.forEach(d => { out[d.id] = d.data().entries || {}; }); A.logs = out; emit();
    }, onErr));
  }

  authM.onAuthStateChanged(auth, async u => {
    clearFam();
    if (userUnsub) { userUnsub(); userUnsub = null; }
    currentFid = undefined;
    if (!u) {
      Object.assign(A, { user: null, isAdmin: false, needsConsent: false, family: null, familyIds: [], meds: [], reminders: [], devices: [], logs: {}, loading: false });
      emit(); return;
    }
    A.user = { uid: u.uid, name: u.displayName || (u.email || "").split("@")[0], email: u.email || "", verified: u.emailVerified };
    const uref = doc(db, "users", u.uid);
    try {
      const s = await getDoc(uref);
      if (!s.exists()) {
        await setDoc(uref, { name: A.user.name.slice(0, 40), email: A.user.email, familyIds: [], createdAt: serverTimestamp(), lastSeen: ymd(new Date()) });
      } else if (s.data().lastSeen !== ymd(new Date())) {
        updateDoc(uref, { lastSeen: ymd(new Date()) }).catch(() => {});
      }
    } catch (e) { onErr(e); }
    // Only the administrator can read their own admins/{uid} document; for everyone else it does not exist.
    getDoc(doc(db, "admins", u.uid)).then(s => { A.isAdmin = s.exists(); emit(); }).catch(() => { A.isAdmin = false; });
    userUnsub = onSnapshot(uref, async s => {
      const d = s.data() || {};
      A.familyIds = d.familyIds || [];
      A.needsConsent = !(d.consent && d.consent.health && d.consent.age14);
      if (d.name) A.user.name = d.name;
      const want = A.familyIds.includes(prefs.lastFamily) ? prefs.lastFamily : (A.familyIds[0] || null);
      if (want !== currentFid) subscribeFamily(want);
      A.loading = false; emit();
      for (const f of A.familyIds) {
        if (A.familyNames[f]) continue;
        try { const x = await getDoc(doc(db, "families", f)); if (x.exists()) { A.familyNames[f] = x.data().name; emit(); } } catch (e) { /* not a member any more */ }
      }
    }, onErr);
  });

  /** Removes every document of a circle. Used when its last member leaves or deletes the account. */
  async function deleteCircle(f) {
    const fam = await getDoc(doc(db, "families", f));
    if (fam.exists() && fam.data().inviteCode) await deleteDoc(doc(db, "invites", fam.data().inviteCode)).catch(() => {});
    for (const sub of ["meds", "reminders", "logs", "devices"]) {
      const qs = await getDocs(collection(db, "families", f, sub));
      for (let i = 0; i < qs.docs.length; i += 400) {
        const b = writeBatch(db);
        qs.docs.slice(i, i + 400).forEach(d => b.delete(d.ref));
        await b.commit();
      }
    }
    await deleteDoc(doc(db, "families", f));
  }

  async function leave(f) {
    const fam = await getDoc(doc(db, "families", f));
    if (fam.exists()) {
      const ids = fam.data().memberIds || [];
      if (ids.length <= 1) await deleteCircle(f);
      else await updateDoc(doc(db, "families", f), { memberIds: arrayRemove(me()), ["members." + me()]: deleteField() });
    }
    await updateDoc(doc(db, "users", me()), { familyIds: arrayRemove(f) });
  }

  return {
    kind: "cloud",
    start() {},

    // ---- account -------------------------------------------------------------
    async signUp(name, email, pw) {
      const c = await authM.createUserWithEmailAndPassword(auth, email, pw);
      await authM.updateProfile(c.user, { displayName: name });
      if (A.user) A.user.name = name;
      await setDoc(doc(db, "users", c.user.uid), { name, email, familyIds: [], createdAt: serverTimestamp(), lastSeen: ymd(new Date()),
        consent: { health: true, age14: true, at: serverTimestamp(), version: VERSION } }, { merge: true });
      authM.sendEmailVerification(c.user).catch(() => {});
    },
    async giveConsent() {
      await updateDoc(doc(db, "users", me()), { consent: { health: true, age14: true, at: serverTimestamp(), version: VERSION } });
    },
    async signIn(email, pw) { await authM.signInWithEmailAndPassword(auth, email, pw); },
    async google() { await authM.signInWithPopup(auth, new authM.GoogleAuthProvider()); },
    async reset(email) { await authM.sendPasswordResetEmail(auth, email); },
    async signOut() { await authM.signOut(auth); },
    async rename(name) {
      await authM.updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, "users", me()), { name });
    },

    async exportData() {
      const out = { exportedAt: new Date().toISOString(), app: "Blistra " + VERSION, profile: null, circles: [] };
      const u = await getDoc(doc(db, "users", me()));
      out.profile = u.data() || null;
      for (const f of A.familyIds) {
        try {
          const fam = await getDoc(doc(db, "families", f));
          const c = { id: f, ...fam.data() };
          for (const sub of ["meds", "reminders", "logs", "devices"]) c[sub] = (await getDocs(collection(db, "families", f, sub))).docs.map(d => ({ id: d.id, ...d.data() }));
          out.circles.push(c);
        } catch (e) { /* skip circles we can no longer read */ }
      }
      return out;
    },

    async deleteAccount() {
      for (const f of [...A.familyIds]) await leave(f);
      await deleteDoc(doc(db, "users", me()));
      prefs.lastFamily = null; prefs.lock = null; savePrefs();
      await authM.deleteUser(auth.currentUser);
    },

    // ---- circles ------------------------------------------------------------
    async createFamily(name, patientName) {
      const f = doc(collection(db, "families"));
      const code = inviteCode();
      const patients = {};
      if (patientName) patients["p_" + uid(8)] = { name: patientName, color: PCOLORS[0] };
      const b = writeBatch(db);
      b.set(f, { name, inviteCode: code, memberIds: [me()], members: { [me()]: { name: A.user.name } }, patients, createdBy: me(), createdAt: serverTimestamp() });
      b.set(doc(db, "invites", code), { familyId: f.id, createdBy: me() });
      b.update(doc(db, "users", me()), { familyIds: arrayUnion(f.id) });
      prefs.lastFamily = f.id; savePrefs();
      await b.commit();
    },
    async joinFamily(code) {
      code = String(code || "").replace(/\s/g, "").toUpperCase();
      if (!/^[A-Z0-9]{6,8}$/.test(code)) throw { code: "bad_code" };
      const inv = await getDoc(doc(db, "invites", code)).catch(() => null);
      if (!inv || !inv.exists()) throw { code: "bad_code" };
      const famId = inv.data().familyId;
      // The rules accept this only if joinCode matches a real invite for this circle.
      await updateDoc(doc(db, "families", famId), { memberIds: arrayUnion(me()), ["members." + me()]: { name: A.user.name }, joinCode: code });
      prefs.lastFamily = famId; savePrefs();
      await updateDoc(doc(db, "users", me()), { familyIds: arrayUnion(famId) });
    },
    async switchFamily(id) { prefs.lastFamily = id; savePrefs(); subscribeFamily(id); },
    async leaveFamily() { const f = fid(); prefs.lastFamily = null; savePrefs(); await leave(f); },

    // ---- people, medicines, doses, reminders --------------------------------------
    async savePatient(p) { await updateDoc(doc(db, "families", fid()), { ["patients." + p.id]: { name: p.name, color: p.color } }); },
    async removePatient(pid) {
      const b = writeBatch(db);
      b.update(doc(db, "families", fid()), { ["patients." + pid]: deleteField() });
      A.meds.filter(m => m.patientId === pid).forEach(m => b.delete(doc(db, "families", fid(), "meds", m.id)));
      await b.commit();
    },
    async saveMed(m) { await setDoc(doc(db, "families", fid(), "meds", m.id), strip(m)); },
    async deleteMed(id) { await deleteDoc(doc(db, "families", fid(), "meds", id)); },
    async take(date, key, med, entry) {
      const b = writeBatch(db);
      b.set(doc(db, "families", fid(), "logs", date), { entries: { [key]: entry } }, { merge: true });
      if (med.stock && typeof med.stock.count === "number") b.update(doc(db, "families", fid(), "meds", med.id), { "stock.count": increment(-(med.units || 1)) });
      await b.commit();
    },
    async untake(date, key, med) {
      const b = writeBatch(db);
      b.update(doc(db, "families", fid(), "logs", date), { ["entries." + key]: deleteField() });
      if (med.stock && typeof med.stock.count === "number") b.update(doc(db, "families", fid(), "meds", med.id), { "stock.count": increment(med.units || 1) });
      await b.commit();
    },
    async addStock(medId, n) { await updateDoc(doc(db, "families", fid(), "meds", medId), { "stock.count": increment(n) }); },
    async saveReminder(r) { await setDoc(doc(db, "families", fid(), "reminders", r.id), strip(r)); },
    async deleteReminder(id) { await deleteDoc(doc(db, "families", fid(), "reminders", id)); },
    // The box itself writes only its "status"; merge keeps it when the family edits the settings.
    async saveDevice(d) { await setDoc(doc(db, "families", fid(), "devices", d.id), { name: d.name, patientId: d.patientId, morning: d.morning, evening: d.evening }, { merge: true }); },
    async deleteDevice(id) { await deleteDoc(doc(db, "families", fid(), "devices", id)); },

    // ---- administrator only (the rules refuse these calls to anyone else) -------------
    async listUsers() {
      const qs = await getDocs(collection(db, "users"));
      return qs.docs.map(d => {
        const x = d.data();
        return { id: d.id, name: x.name || "", email: x.email || "", circles: (x.familyIds || []).length,
          createdAt: x.createdAt && x.createdAt.toDate ? x.createdAt.toDate() : null, lastSeen: x.lastSeen || "" };
      });
    },
    async saveSite(data) { await setDoc(doc(db, "site", "public"), { ...data, updatedAt: serverTimestamp() }); },
    async addMedia(m) { const id = uid(10); await setDoc(doc(db, "media", id), { ...m, createdAt: serverTimestamp() }); return id; },
    async updateMedia(id, patch) { await updateDoc(doc(db, "media", id), patch); },
    async deleteMedia(id) { await deleteDoc(doc(db, "media", id)); }
  };
}
