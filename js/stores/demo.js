// Demo mode: everything lives in this browser's localStorage, nothing is sent anywhere.
// It exposes exactly the same methods as the cloud store, so the screens do not
// need to know which one they are talking to.

import { A, prefs, emit, savePrefs } from "../state.js";
import { ymd, dow, toMin, fromMin, addDays, parseYmd, entryKey, uid } from "../util.js";
import { PCOLORS } from "../domain.js";

const DEMO_KEY = "blistra.demo.v3";
function demoSeed() {
  const now = new Date();
  const me = "demo-me", luca = "demo-luca";
  const p1 = "p_maria", p2 = "p_giorgio";
  const exp = n => ymd(addDays(now, n));
  const meds = [
    { id: "m1", patientId: p1, name: "Pantoprazolo 20 mg", dose: "1 compressa", units: 1, times: ["07:30"], deadlines: {}, alarm: true, days: [0,1,2,3,4,5,6], food: "before", color: "#FFC93C", shape: "oval", photo: "", look: "compressa ovale gialla", note: "", stock: { count: 19, box: 28, threshold: 7 }, rx: { doctor: "Dott.ssa Bianchi", expires: exp(40), note: "" } },
    { id: "m2", patientId: p1, name: "Ramipril 5 mg", dose: "1 compressa", units: 1, times: ["08:00"], deadlines: { "08:00": "10:00" }, alarm: true, days: [0,1,2,3,4,5,6], food: "any", color: "#F4A7B9", shape: "round", photo: "", look: "compressa rotonda rosa divisibile", note: "", stock: { count: 4, box: 28, threshold: 7 }, rx: { doctor: "Dott.ssa Bianchi", expires: exp(20), note: "ricetta elettronica" } },
    { id: "m3", patientId: p1, name: "Metformina 500 mg", dose: "1 compressa", units: 1, times: ["08:00", "20:00"], deadlines: { "20:00": "21:00" }, alarm: true, days: [0,1,2,3,4,5,6], food: "with", color: "#FFFFFF", shape: "oval", photo: "", look: "", note: "Con un bicchiere d'acqua", stock: { count: 41, box: 60, threshold: 7 }, rx: { doctor: "Dott.ssa Bianchi", expires: exp(55), note: "" } },
    { id: "m4", patientId: p1, name: "Atorvastatina 20 mg", dose: "1 compressa", units: 1, times: ["21:00"], deadlines: { "21:00": "22:30" }, alarm: true, days: [0,1,2,3,4,5,6], food: "any", color: "#8FB8E8", shape: "round", photo: "", look: "", note: "", stock: { count: 23, box: 30, threshold: 7 }, rx: { doctor: "Dott.ssa Bianchi", expires: exp(3), note: "" } },
    { id: "m5", patientId: p1, name: "Colecalciferolo (vitamina D3)", dose: "1 capsula", units: 1, times: ["13:00"], deadlines: {}, alarm: false, days: [6], food: "after", color: "#F2A65A", shape: "capsule", photo: "", look: "", note: "Solo la domenica", stock: { count: 3, box: 4, threshold: 14 }, rx: { doctor: "", expires: "", note: "" } },
    { id: "m6", patientId: p2, name: "Levotiroxina 50 mcg", dose: "1 compressa", units: 1, times: ["07:00"], deadlines: { "07:00": "09:00" }, alarm: true, days: [0,1,2,3,4,5,6], food: "before", color: "#FFFFFF", shape: "round", photo: "", look: "", note: "30 minuti prima della colazione", stock: { count: 52, box: 50, threshold: 7 }, rx: { doctor: "Dott. Russo", expires: exp(70), note: "" } },
    { id: "m7", patientId: p2, name: "Tamsulosina 0,4 mg", dose: "1 capsula", units: 1, times: ["21:00"], deadlines: { "21:00": "22:00" }, alarm: true, days: [0,1,2,3,4,5,6], food: "after", color: "#F2A65A", shape: "capsule", photo: "", look: "", note: "Dopo cena", stock: { count: 11, box: 30, threshold: 7 }, rx: { doctor: "Dott. Russo", expires: exp(-2), note: "" } }
  ];
  const fam = { id: "demo", name: prefs.lang === "it" ? "Famiglia Rossi (demo)" : "The Rossi family (demo)", inviteCode: "DEMO42", memberIds: [me, luca],
    members: { [me]: { name: prefs.lang === "it" ? "Tu" : "You" }, [luca]: { name: "Luca" } },
    patients: { [p1]: { name: "Maria", color: PCOLORS[0] }, [p2]: { name: "Giorgio", color: PCOLORS[1] } }, createdBy: me };
  const logs = {};
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (let back = 6; back >= 0; back--) {
    const d = addDays(now, -back), key = ymd(d), day = dow(d);
    logs[key] = {};
    const doses = [];
    meds.forEach(m => { if (m.days.includes(day)) m.times.forEach(t => doses.push({ m, t })); });
    doses.sort((a, b) => toMin(a.t) - toMin(b.t));
    const pastToday = doses.filter(x => toMin(x.t) <= nowMin);
    const leaveOpen = pastToday.filter(x => x.m.patientId === p1).slice(-1)[0];
    doses.forEach((x, i) => {
      const k = entryKey(x.m.id, x.t), tm = toMin(x.t);
      let take;
      if (back === 0) take = tm <= nowMin && x !== leaveOpen;
      else take = (i * 7 + back * 3) % 11 !== 0;
      if (take) {
        const at = fromMin(tm + ((i * 5 + back) % 18));
        const byLuca = (i + back) % 3 === 0;
        logs[key][k] = { at, by: byLuca ? luca : "device", byName: byLuca ? "Luca" : fam.patients[x.m.patientId].name, ts: parseYmd(key).getTime() + toMin(at) * 60000 };
      }
    });
  }
  const reminders = [
    { id: "r1", title: prefs.lang === "it" ? "Visita dal medico di base" : "GP appointment", patientId: p1, date: exp(4), time: "10:30", repeat: "none", alarm: true, note: prefs.lang === "it" ? "Portare la lista dei farmaci" : "Bring the medicine list" },
    { id: "r2", title: prefs.lang === "it" ? "Rinnovare la ricetta della tamsulosina" : "Renew the tamsulosin prescription", patientId: p2, date: exp(1), time: "09:00", repeat: "none", alarm: false, note: "" },
    { id: "r3", title: prefs.lang === "it" ? "Misurare la pressione" : "Check blood pressure", patientId: p1, date: exp(0), time: "18:00", repeat: "daily", alarm: true, note: "" }
  ];
  return { user: { uid: me, name: fam.members[me].name, email: "demo@blistra.app" }, family: fam, meds, reminders, logs };
}
export function demoStore() {
  let D;
  try { D = JSON.parse(localStorage.getItem(DEMO_KEY)); } catch (e) { D = null; }
  if (!D || !D.family) D = demoSeed();
  const persist = () => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(D)); } catch (e) { } };
  const sync = () => {
    A.user = D.user; A.family = D.family; A.familyIds = D.family ? [D.family.id] : []; A.familyNames = D.family ? { [D.family.id]: D.family.name } : {};
    A.meds = D.meds; A.reminders = D.reminders; A.logs = D.logs; A.loading = false; persist(); emit();
  };
  return {
    kind: "demo",
    start() { sync(); },
    async signOut() { prefs.demo = false; prefs.lock = null; savePrefs(); try { localStorage.removeItem(DEMO_KEY); } catch (e) { } location.hash = ""; location.reload(); },
    async exportData() { return { exportedAt: new Date().toISOString(), mode: "demo", ...D }; },
    async deleteAccount() { return this.signOut(); },
    async verifyLock() { return true; },
    async createFamily(name, patientName) { D.family = { id: "demo", name, inviteCode: "DEMO42", memberIds: [D.user.uid], members: { [D.user.uid]: { name: D.user.name } }, patients: {}, createdBy: D.user.uid }; if (patientName) D.family.patients["p_" + uid(6)] = { name: patientName, color: PCOLORS[0] }; sync(); },
    async joinFamily() { throw { code: "bad_code" }; },
    async switchFamily() { },
    async leaveFamily() { D.family = null; D.meds = []; D.reminders = []; D.logs = {}; sync(); },
    async savePatient(p) { D.family.patients[p.id] = { name: p.name, color: p.color }; sync(); },
    async removePatient(pid) { delete D.family.patients[pid]; D.meds = D.meds.filter(m => m.patientId !== pid); sync(); },
    async saveMed(m) { const i = D.meds.findIndex(x => x.id === m.id); if (i >= 0) D.meds[i] = m; else D.meds.push(m); sync(); },
    async deleteMed(id) { D.meds = D.meds.filter(m => m.id !== id); Object.values(D.logs).forEach(day => Object.keys(day).forEach(k => { if (k.startsWith(id + "_")) delete day[k]; })); sync(); },
    async take(date, key, med, entry) { (D.logs[date] = D.logs[date] || {})[key] = entry; const m = D.meds.find(x => x.id === med.id); if (m && m.stock && typeof m.stock.count === "number") m.stock.count = Math.max(0, m.stock.count - (m.units || 1)); sync(); },
    async untake(date, key, med) { if (D.logs[date]) delete D.logs[date][key]; const m = D.meds.find(x => x.id === med.id); if (m && m.stock && typeof m.stock.count === "number") m.stock.count += (m.units || 1); sync(); },
    async addStock(medId, n) { const m = D.meds.find(x => x.id === medId); if (m) { m.stock = m.stock || { threshold: 7 }; m.stock.count = (m.stock.count || 0) + n; } sync(); },
    async saveReminder(r) { const i = D.reminders.findIndex(x => x.id === r.id); if (i >= 0) D.reminders[i] = r; else D.reminders.push(r); sync(); },
    async deleteReminder(id) { D.reminders = D.reminders.filter(r => r.id !== id); sync(); }
  };
}
