// Blistra 3 — entry point.
// Decides which screen to show, draws it, and turns taps into actions.

import { A, prefs, savePrefs, L, emit, onRender } from "./state.js";
import { esc, fmt, ymd, hm, toMin, uid, clone, sha256, compressImage, download, reducedMotion } from "./util.js";
import { patientById, currentPatientId, logFor, dosesFor, alerts } from "./domain.js";
import { icon, brandMark, modal, closeModal, modalOpen, toast, blisterFlat } from "./ui.js";
import { site, current, loadSite, applyLook } from "./site.js";
import { viewLanding } from "./views/landing.js";
import { viewAuth, viewConsent, viewOnboard, authUI } from "./views/auth.js";
import { viewPrivacy, viewTerms } from "./views/legal.js";
import { viewToday } from "./views/today.js";
import { viewCircle, viewMeds, viewReminders, viewWeek, viewAccount } from "./views/manage.js";
import * as St from "./views/studio.js";
import { drafts, openMedForm, drawMedForm, syncMedDraft, openRemForm, drawRemForm, openPatientForm, openSheet, openLockSetup, openPinForm, openBoxForm } from "./forms.js";
import { unlockAudio, ring, checkAlarms, dismissAlarm, snoozes } from "./alarms.js";
import { downloadICS } from "./ics.js";
import { demoStore } from "./stores/demo.js";
import { LIMITS } from "./config.js";

let store = null;

// ---- routes ------------------------------------------------------------------------------

const PUBLIC = ["about", "login", "privacy", "terms"];
const APP = ["today", "circle", "meds", "reminders", "week", "account", "studio"];
function route() {
  const h = (location.hash || "").slice(1);
  if (PUBLIC.includes(h) || APP.includes(h)) return h;
  return A.user ? "today" : "about";
}

// ---- the 3D stage: created once, moved into whichever page has a slot ---------------------

let stage = null, hero = null, lookSig = "";
function placeStage() {
  const slot = document.querySelector("[data-stage-slot]");
  if (!slot) return;
  const lk = current().look;
  if (!stage) {
    stage = document.createElement("div");
    stage.className = "stage";
    import("./hero3d.js")
      .then(m => { hero = m.mountHero3D(stage, { pills: lk.pills, spin: lk.spin, motion: lk.motion, sun: lk.sun }); if (!hero) stage.innerHTML = blisterFlat(lk.pills); })
      .catch(e => { console.warn("3D", e); stage.innerHTML = blisterFlat(lk.pills); });
  }
  if (stage.parentElement !== slot) slot.appendChild(stage);
  const sig = JSON.stringify([lk.pills, lk.spin, lk.motion, lk.sun]);
  if (hero && sig !== lookSig) hero.update({ pills: lk.pills, spin: lk.spin, motion: lk.motion, sun: lk.sun });
  lookSig = sig;
}

// ---- app shell -----------------------------------------------------------------------------

function shell(body, r) {
  const t = L();
  const crit = A.family ? alerts().filter(a => a.level === "critical").length : 0;
  const tabs = [["today", "today"], ["circle", "circle"], ["meds", "meds"], ["reminders", "reminders"], ["account", "account"]];
  const active = r === "week" ? "meds" : r === "studio" ? "account" : r;
  return '<a class="skip" href="#main" data-skip>' + esc(t.skip) + "</a>" +
    '<div class="app"><header class="app-top"><a class="brand" href="#today">' + brandMark(32) + "<b>Blistra</b></a>" +
    (A.family ? '<span class="circle-name">' + esc(A.family.name) + "</span>" : "<span></span>") +
    (A.isAdmin ? '<a class="admin-chip" href="#studio">' + icon("studio", 16) + "Studio</a>" : "") + "</header>" +
    (A.mode === "demo" ? '<div class="demo-bar"><span>' + esc(t.demo_bar) + '</span><button class="linkish" data-demo-exit>' + esc(t.demo_exit) + "</button></div>" : "") +
    (A.family ? '<nav class="tabbar" aria-label="' + esc(t.menu) + '">' + tabs.map(([k, ic]) => '<a href="#' + k + '"' + (k === active ? ' aria-current="page"' : "") + ">" + icon(ic, 26) + "<span>" + esc(t.tabs[k]) + "</span>" + (k === "circle" && crit ? '<i class="badge" aria-label="' + crit + '"></i>' : "") + "</a>").join("") + "</nav>" : "") +
    '<main id="main" class="app-main' + (r === "studio" ? " wide" : "") + '" tabindex="-1">' + body + "</main></div>";
}

function splash() { return '<div class="splash" role="status">' + brandMark(64) + '<span class="sr">' + esc(L().loading) + "</span></div>"; }

// ---- drawing -----------------------------------------------------------------------------------

let lastKey = "", pending = false;
function render() {
  const appEl = document.getElementById("app");
  const r = route();
  // While someone types in a field of the page, wait: redrawing would wipe what they are writing.
  const ae = document.activeElement;
  const key = r + "|" + !!A.user + "|" + (A.family && A.family.id) + "|" + authUI.mode + "|" + St.studio.tab;
  if (ae && appEl.contains(ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && key === lastKey && ae.type !== "checkbox") { pending = true; return; }
  pending = false; lastKey = key;
  document.documentElement.lang = prefs.lang;

  if (r !== "studio" && r !== "about" && site.draft) St.closeStudio();
  let html;
  if (PUBLIC.includes(r)) {
    if (r === "login" && A.user) { location.replace("#today"); return; }
    html = r === "about" ? viewLanding() + (site.draft ? '<div class="preview-bar">' + icon("eye", 18) + '<span>Anteprima delle modifiche non pubblicate.</span><a class="btn sm" href="#studio">Torna allo Studio</a></div>' : "")
      : r === "login" ? viewAuth() : r === "privacy" ? viewPrivacy() : viewTerms();
  } else if (A.loading) html = splash();
  else if (!A.user) html = viewAuth();
  else if (A.needsConsent) html = shell(viewConsent(), r);
  else if (r === "studio") {
    if (!A.isAdmin) { location.replace("#account"); return; }
    St.openStudio(); applyLook(site.draft.look);
    html = shell(St.viewStudio(), r);
  } else if (!A.family && A.familyLoading) html = shell(splash(), r);
  else if (!A.family && r === "account") html = shell(viewAccount(store.kind), r);
  else if (!A.family) html = shell(viewOnboard(store && store.kind), r);
  else if (prefs.lock) html = '<div class="app locked"><main id="main" class="app-main">' + viewToday(true) + "</main></div>";
  else {
    const body = r === "circle" ? viewCircle(store.kind) : r === "meds" ? viewMeds() : r === "reminders" ? viewReminders() : r === "week" ? viewWeek() : r === "account" ? viewAccount(store.kind) : viewToday(false);
    html = shell(body, r);
  }
  if (A.error) html += '<p class="err app-err" role="alert">' + esc(errText(A.error)) + "</p>";
  const y = window.scrollY;
  appEl.innerHTML = html;
  window.scrollTo(0, y);
  placeStage();
}
onRender(render);
document.addEventListener("focusout", () => { if (pending) setTimeout(() => { if (pending) render(); }, 0); });

function errText(e) {
  const t = L(), code = (e && e.code) || e;
  if (code === "auth/weak-password") return t.pw_short;
  return t.err[code] || t.err.generic;
}

// ---- actions ---------------------------------------------------------------------------------

async function act(fn) {
  try { A.error = ""; await fn(); }
  catch (e) { console.warn(e); toast(errText(e)); }
}

function takeDose(key, medId) {
  const m = A.meds.find(x => x.id === medId); if (!m) return;
  const now = new Date(), date = ymd(now), p = patientById(m.patientId);
  const entry = { at: hm(now), by: prefs.lock ? "device" : A.user.uid, byName: (prefs.lock ? (p ? p.name : "") : A.user.name).slice(0, 40), ts: Date.now() };
  const go = () => act(async () => { await store.take(date, key, m, entry); toast(fmt(L().recorded, { t: entry.at }), { key, med: m.id, date }); });
  const pocket = document.querySelector('[data-pocket="' + CSS.escape(key) + '"]');
  if (pocket && !reducedMotion() && current().look.motion) { pocket.classList.add("pop"); setTimeout(go, 420); } else go();
}

let studioTimer = null;
function refreshPreview() {
  clearTimeout(studioTimer);
  studioTimer = setTimeout(() => {
    const box = document.querySelector("[data-preview]");
    if (box) { box.innerHTML = St.previewHTML(); placeStage(); }
    const state = document.querySelector(".st-state"), pub = document.querySelector("[data-st-publish]"), dis = document.querySelector("[data-st-discard]");
    const dirty = St.dirty();
    const ok = !St.checkDraft(site.draft).length;
    if (state) { state.textContent = dirty ? "Modifiche non pubblicate" : "Tutto pubblicato"; state.classList.toggle("dirty", dirty); }
    if (pub) pub.disabled = !(dirty && ok);
    if (dis) dis.disabled = !dirty;
  }, 120);
}

document.addEventListener("click", e => {
  unlockAudio();
  const b = e.target.closest("button, a[data-st-fullpreview], a[data-skip], [data-close-bg]");
  if (!b) return;
  const ds = b.dataset, t = L();
  if (ds.closeBg !== undefined) { if (e.target === b && !document.getElementById("layer").dataset.alarm) closeModal(); return; }
  if (ds.skip !== undefined) { e.preventDefault(); const m = document.getElementById("main"); if (m) { m.setAttribute("tabindex", "-1"); m.focus(); } return; }
  if (ds.lang) { if (drafts.med) syncMedDraft(); prefs.lang = ds.lang; savePrefs(); render(); if (drafts.med && modalOpen()) drawMedForm(""); return; }
  if (ds.demo !== undefined) { prefs.demo = true; savePrefs(); location.hash = "today"; location.reload(); return; }  // a clean start, without the cloud listeners
  if (ds.demoExit !== undefined) { store.signOut(); return; }
  if (ds.popOne !== undefined) { if (hero) hero.popOne(); return; }
  if (ds.authMode) { authUI.mode = ds.authMode; render(); return; }
  if (ds.pwToggle !== undefined) { const i = document.getElementById("a-pw"); i.type = i.type === "password" ? "text" : "password"; return; }
  if (ds.google !== undefined) { if (!store || store.kind !== "cloud") return; act(() => store.google()); return; }
  if (ds.forgot !== undefined) {
    const em = (document.getElementById("a-email") || {}).value;
    if (!em) { document.getElementById("a-err").textContent = t.err["auth/invalid-email"]; return; }
    act(async () => { await store.reset(em); toast(t.reset_sent); }); return;
  }
  if (ds.signout !== undefined) { prefs.lock = null; savePrefs(); if (store.kind === "demo") store.signOut(); else act(async () => { await store.signOut(); location.hash = "about"; }); return; }
  if (ds.alarmOk !== undefined && !ds.take) { dismissAlarm(); return; }
  if (ds.take) { if (ds.alarmOk !== undefined) dismissAlarm(); takeDose(ds.take, ds.med); return; }
  if (ds.untake) { const m = A.meds.find(x => x.id === ds.med); if (m) act(async () => { await store.untake(ds.date || ymd(new Date()), ds.untake, m); toast(t.undone); }); return; }
  if (ds.pocketInfo) { const lg = logFor(ymd(new Date()), ds.pocketInfo); const m = A.meds.find(x => ds.pocketInfo.startsWith(x.id + "_")); if (lg && m) toast(fmt(t.recorded, { t: lg.at }) + ", " + lg.byName, { key: ds.pocketInfo, med: m.id, date: ymd(new Date()) }); return; }
  if (ds.snooze) { snoozes[ds.snooze] = Date.now() + 10 * 60000; dismissAlarm(); return; }
  if (ds.patient) { prefs.patientId = ds.patient; savePrefs(); render(); return; }
  if (ds.openPatient) { prefs.patientId = ds.openPatient; savePrefs(); location.hash = "today"; return; }
  if (ds.lockSetup) { openLockSetup(ds.lockSetup); return; }
  if (ds.unlock !== undefined) { if (prefs.lock && prefs.lock.pinHash) openPinForm(); else { prefs.lock = null; savePrefs(); location.hash = "circle"; render(); } return; }
  if (ds.close !== undefined) { closeModal(); drafts.med = drafts.rem = null; return; }
  if (ds.addPatient !== undefined) { openPatientForm(null); return; }
  if (ds.editPatient) { openPatientForm(patientById(ds.editPatient)); return; }
  if (ds.pcolor) { document.getElementById("p-color").value = ds.pcolor; document.querySelectorAll("[data-pcolor]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.pcolor === ds.pcolor))); return; }
  if (ds.rmPatient) { const p = patientById(ds.rmPatient); if (!p) return; if (b.dataset.armed) { act(() => store.removePatient(ds.rmPatient)); closeModal(); } else { b.dataset.armed = "1"; b.textContent = fmt(t.confirm_remove_patient, { p: p.name }); } return; }
  if (ds.addMed !== undefined) { openMedForm(null); return; }
  if (ds.edit) { const m = A.meds.find(x => x.id === ds.edit); if (m) openMedForm(m); return; }
  if (ds.sheet) { const m = A.meds.find(x => x.id === ds.sheet); if (m) openSheet(m); return; }
  if (ds.addBox) { const m = A.meds.find(x => x.id === ds.addBox); if (m && m.stock && m.stock.box) act(async () => { await store.addStock(m.id, m.stock.box); toast("+" + m.stock.box + ", " + m.name); }); return; }
  if (ds.addTime !== undefined) { syncMedDraft(); drafts.med.times.push("12:00"); drawMedForm(""); return; }
  if (ds.rmTime) { syncMedDraft(); const d = drafts.med, tm = d.times[+ds.rmTime]; d.times.splice(+ds.rmTime, 1); delete d.deadlines[tm]; drawMedForm(""); return; }
  if (ds.day) { syncMedDraft(); const d = drafts.med, i = +ds.day; d.days = d.days.includes(i) ? d.days.filter(x => x !== i) : [...d.days, i].sort(); drawMedForm(""); return; }
  if (ds.allDays !== undefined) { syncMedDraft(); drafts.med.days = [0, 1, 2, 3, 4, 5, 6]; drawMedForm(""); return; }
  if (ds.food) { syncMedDraft(); drafts.med.food = ds.food; drawMedForm(""); return; }
  if (ds.color) { syncMedDraft(); drafts.med.color = ds.color; drawMedForm(""); return; }
  if (ds.shape) { syncMedDraft(); drafts.med.shape = ds.shape; drawMedForm(""); return; }
  if (ds.photoRm !== undefined) { syncMedDraft(); drafts.med.photo = ""; drawMedForm(""); return; }
  if (ds.delMed) { const m = A.meds.find(x => x.id === ds.delMed); if (b.dataset.armed) { act(() => store.deleteMed(ds.delMed)); closeModal(); } else { b.dataset.armed = "1"; b.textContent = fmt(t.confirm_del, { m: m ? m.name : "" }); } return; }
  if (ds.addBoxDevice !== undefined) { if (!Object.keys(A.family.patients || {}).length) { toast(t.need_patient); return; } openBoxForm(null, A.family.id); return; }
  if (ds.editBox) { const d = A.devices.find(x => x.id === ds.editBox); if (d) openBoxForm(d, A.family.id); return; }
  if (ds.delBox) { if (b.dataset.armed) { act(() => store.deleteDevice(ds.delBox)); closeModal(); } else { b.dataset.armed = "1"; b.textContent = t.box.confirm_del; } return; }
  if (ds.addRem !== undefined) { openRemForm(null); return; }
  if (ds.editRem) { openRemForm(A.reminders.find(r => r.id === ds.editRem)); return; }
  if (ds.delRem) { if (b.dataset.armed) { act(() => store.deleteReminder(ds.delRem)); closeModal(); } else { b.dataset.armed = "1"; b.textContent = t.del + "?"; } return; }
  if (ds.copy) { const txt = ds.copy; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast(t.copied), () => toast(txt)); return; }
  if (ds.enableAlarms !== undefined) {
    prefs.alarms = true; savePrefs(); unlockAudio();
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().then(render, render); else render();
    return;
  }
  if (ds.testAlarm !== undefined) { unlockAudio(); const d = dosesFor(new Date(), currentPatientId())[0]; if (d) ring("now", { dose: d }); else toast(t.no_patient_today); return; }
  if (ds.ics !== undefined) { downloadICS(); return; }
  if (ds.print !== undefined) { window.print(); return; }
  if (ds.switch) { act(() => store.switchFamily(ds.switch)); return; }
  if (ds.newCircle !== undefined) { A.family = null; render(); return; }
  if (ds.leave !== undefined) { if (b.dataset.armed) { prefs.lock = null; savePrefs(); act(() => store.leaveFamily()); } else { b.dataset.armed = "1"; b.textContent = fmt(t.confirm_leave, { n: A.family.name }); } return; }
  if (ds.export !== undefined) { act(async () => { const data = await store.exportData(); download("blistra-dati-" + ymd(new Date()) + ".json", JSON.stringify(data, (k, v) => (v && typeof v.toDate === "function" ? v.toDate().toISOString() : v), 2)); }); return; }
  if (ds.deleteAccount !== undefined) {
    if (!b.dataset.armed) { b.dataset.armed = "1"; b.textContent = t.confirm_delete; return; }
    act(async () => { await store.deleteAccount(); toast(t.deleted); location.hash = "about"; }); return;
  }

  // ---- Studio ----
  if (ds.stTab) { St.studio.tab = ds.stTab; if (ds.stTab === "users" && !St.studio.users) St.loadUsers(store).then(render); render(); return; }
  if (ds.stLang) { St.studio.lang = ds.stLang; render(); return; }
  if (ds.bannerTone) { site.draft.banner.tone = ds.bannerTone; render(); return; }
  if (ds.preset) { St.applyPreset(+ds.preset); applyLook(site.draft.look); render(); return; }
  if (ds.listAdd) { St.listAction("add", ds.listAdd); render(); return; }
  if (ds.listDel) { St.listAction("del", ds.listDel, +ds.i); render(); return; }
  if (ds.listMove) { St.listAction("move", ds.listMove, +ds.i, +ds.dir); render(); return; }
  if (ds.stPublish !== undefined) { b.disabled = true; act(async () => { await St.publish(store); render(); }); return; }
  if (ds.stDiscard !== undefined) { St.discard(); render(); return; }
  if (ds.stReset !== undefined) { if (St.studio.armedReset) { St.resetDefaults(); St.studio.armedReset = false; } else St.studio.armedReset = true; render(); return; }
  if (ds.heroImage) { site.draft.look.hero3d = false; site.draft.look.heroImage = ds.heroImage; render(); return; }
  if (ds.mediaDel) { if (b.dataset.armed) { act(() => store.deleteMedia(ds.mediaDel)); if (site.draft && site.draft.look.heroImage === ds.mediaDel) site.draft.look.heroImage = ""; } else { b.dataset.armed = "1"; b.classList.add("armed"); b.setAttribute("aria-label", "Tocca di nuovo per eliminare"); toast("Tocca di nuovo il cestino per eliminare l'immagine."); } return; }
  if (ds.mediaMove) { act(() => St.moveMedia(store, ds.mediaMove, +ds.dir)); return; }
  if (ds.usersCsv !== undefined) { St.usersCSV(); return; }
});

document.addEventListener("input", e => {
  const el = e.target;
  if (el.dataset && el.dataset.k && site.draft) {
    const r = St.onStudioInput(el);
    if (r.look) applyLook(site.draft.look);
    if (r.structural) render(); else refreshPreview();
    return;
  }
  if (el.id === "st-filter") { St.studio.filter = el.value; const pos = el.selectionStart; render(); const f = document.getElementById("st-filter"); if (f) { f.focus(); f.setSelectionRange(pos, pos); } }
});

document.addEventListener("change", async e => {
  const el = e.target;
  if (el.id === "f-photo" && el.files && el.files[0]) {
    syncMedDraft();
    try { drafts.med.photo = (await compressImage(el.files[0], { max: 480, quality: 0.72, maxChars: LIMITS.medPhotoChars })).src; }
    catch (err) { toast(L().err.generic); }
    drawMedForm(""); return;
  }
  if (el.id === "st-upload" && el.files) { St.studio.busy = true; render(); await St.uploadImages(store, el.files); St.studio.busy = false; render(); return; }
  if (el.dataset && el.dataset.media) {
    const v = el.type === "checkbox" ? el.checked : el.value.trim();
    act(() => store.updateMedia(el.dataset.media, { [el.dataset.mk]: v }));
  }
});

// Drag and drop of images onto the Studio upload area.
document.addEventListener("dragover", e => { if (e.target.closest && e.target.closest(".drop")) { e.preventDefault(); e.target.closest(".drop").classList.add("over"); } });
document.addEventListener("dragleave", e => { if (e.target.closest && e.target.closest(".drop")) e.target.closest(".drop").classList.remove("over"); });
document.addEventListener("drop", e => {
  const d = e.target.closest && e.target.closest(".drop"); if (!d) return;
  e.preventDefault(); St.studio.busy = true; render();
  St.uploadImages(store, e.dataTransfer.files).then(() => { St.studio.busy = false; render(); });
});

document.addEventListener("submit", e => {
  e.preventDefault();
  const t = L(), id = e.target.id, g = x => document.getElementById(x);
  if (id === "authform") {
    const em = g("a-email").value.trim(), pw = g("a-pw").value, nm = g("a-name") ? g("a-name").value.trim() : "", err = g("a-err");
    if (!store || store.kind !== "cloud") { err.textContent = t.no_cloud; return; }
    if (authUI.mode === "signup") {
      if (pw.length < 8) { err.textContent = t.pw_short; return; }
      if (!g("a-health").checked || !g("a-age").checked) { err.textContent = t.need_consent; return; }
    }
    act(async () => {
      try {
        if (authUI.mode === "signup") { await store.signUp((nm || em.split("@")[0]).slice(0, 40), em, pw); toast(t.verify_sent); }
        else await store.signIn(em, pw);
        location.hash = "today";
      } catch (er) { err.textContent = errText(er); }
    });
    return;
  }
  if (id === "consentform") {
    if (!g("a-health").checked || !g("a-age").checked) { g("cs-err").textContent = t.need_consent; return; }
    act(() => store.giveConsent()); return;
  }
  if (id === "createform") { const n = g("c-name").value.trim(); if (!n) { g("c-err").textContent = t.circle_name; return; } act(() => store.createFamily(n.slice(0, 40), g("c-pat").value.trim().slice(0, 30))); return; }
  if (id === "joinform") { const c = g("j-code").value.trim(); act(async () => { try { await store.joinFamily(c); } catch (er) { g("j-err").textContent = errText(er); } }); return; }
  if (id === "medform") {
    syncMedDraft(); const d = drafts.med;
    d.name = d.name.trim(); d.dose = d.dose.trim();
    d.times = [...new Set(d.times.filter(Boolean))].sort((a, b) => toMin(a) - toMin(b));
    Object.keys(d.deadlines).forEach(k => { if (!d.times.includes(k) || toMin(d.deadlines[k]) <= toMin(k)) delete d.deadlines[k]; });
    if (!d.name) return drawMedForm(t.need_name);
    if (!d.times.length) { d.times = ["08:00"]; return drawMedForm(t.need_time); }
    if (!d.days.length) return drawMedForm(t.need_day);
    delete d._new; const m = clone(d); closeModal(); drafts.med = null; act(() => store.saveMed(m)); return;
  }
  if (id === "remform") {
    const r = drafts.rem;
    r.title = g("r-title").value.trim(); r.date = g("r-date").value; r.time = g("r-time").value; r.repeat = g("r-rep").value; r.patientId = g("r-pat").value; r.alarm = g("r-alarm").checked; r.note = g("r-note").value.trim();
    if (!r.title) return drawRemForm(t.rem_title);
    if (!r.date || !r.time) return drawRemForm(t.rem_date + ", " + t.rem_time);
    delete r._new; const x = clone(r); closeModal(); drafts.rem = null; act(() => store.saveReminder(x)); return;
  }
  if (id === "patform") { const n = g("p-name").value.trim(); if (!n) return; const p = { id: e.target.dataset.pid, name: n, color: g("p-color").value }; closeModal(); act(() => store.savePatient(p)); return; }
  if (id === "boxform") {
    const n = g("b-name").value.trim(), m = g("b-morning").value, ev = g("b-evening").value;
    if (!n || !/^\d\d:\d\d$/.test(m) || !/^\d\d:\d\d$/.test(ev)) return;
    const d = { id: e.target.dataset.id, name: n.slice(0, 40), patientId: g("b-pat").value, morning: m, evening: ev };
    closeModal(); act(() => store.saveDevice(d)); return;
  }
  if (id === "lockform") {
    const pin = g("l-pin").value.replace(/\D/g, ""), pid = e.target.dataset.pid;
    (async () => {
      const salt = uid(12);
      prefs.lock = { patientId: pid, pinHash: pin.length === 4 ? await sha256(salt + pin) : "", salt };
      prefs.alarms = true; savePrefs(); unlockAudio(); closeModal(); location.hash = "today"; render();
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    })();
    return;
  }
  if (id === "pinform") {
    (async () => {
      const ok = prefs.lock && (await sha256(prefs.lock.salt + g("pin-in").value)) === prefs.lock.pinHash;
      if (ok) { prefs.lock = null; savePrefs(); closeModal(); location.hash = "circle"; render(); }
      else { g("pin-err").textContent = t.pin_wrong; g("pin-in").value = ""; }
    })();
  }
});

document.addEventListener("keydown", e => { if (e.key === "Escape" && modalOpen() && !document.getElementById("layer").dataset.alarm) { closeModal(); drafts.med = drafts.rem = null; } });
window.addEventListener("hashchange", () => { closeModal(); lastKey = ""; render(); window.scrollTo(0, 0); });
window.addEventListener("online", () => { A.error = ""; emit(); });

// The blister on "Today" leans gently toward the pointer, like a real foil sheet catching the light.
document.addEventListener("pointermove", e => {
  const f = e.target.closest && e.target.closest("[data-tilt]");
  if (!f || reducedMotion() || !current().look.motion) return;
  const r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
  f.style.setProperty("--ry", (x * 6).toFixed(2) + "deg"); f.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg"); f.style.setProperty("--mx", ((x + 0.5) * 100).toFixed(1) + "%");
});
document.addEventListener("pointerout", e => { const f = e.target.closest && e.target.closest("[data-tilt]"); if (f && !f.contains(e.relatedTarget)) { f.style.removeProperty("--rx"); f.style.removeProperty("--ry"); } });

// ---- start --------------------------------------------------------------------------------------

function startDemo() { A.mode = "demo"; if (!prefs.patientId) { prefs.patientId = "p_maria"; savePrefs(); } store = demoStore(); store.start(); }

/** Clickjacking guard: GitHub Pages cannot send X-Frame-Options, so the page checks it itself. */
function framedByOthers() {
  if (window.top === window.self) return false;
  try { return window.top.location.origin !== location.origin; } catch (e) { return true; }
}

async function boot() {
  if (framedByOthers() && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    document.getElementById("app").innerHTML = '<div class="framed"><p>' + esc(L().framed) + '</p><a class="btn primary" href="' + esc(location.href) + '" target="_blank" rel="noopener">' + esc(L().open_here) + "</a></div>";
    return;
  }
  render();
  loadSite();
  if (prefs.demo) startDemo();
  else {
    A.mode = "cloud";
    try { const { cloudStore } = await import("./stores/cloud.js"); store = await cloudStore(); }
    catch (e) { console.warn(e); A.loading = false; A.error = "auth/network-request-failed"; render(); }
  }
  setInterval(() => { if (!modalOpen() && route() === "today") emit(); checkAlarms(); }, 20000);
  setTimeout(checkAlarms, 1500);
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__blistra = { A, site, St, get store() { return store; }, set store(s) { store = s; }, render };
}
boot();
