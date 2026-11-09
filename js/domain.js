// What the app knows about medicines and time: which doses fall today,
// whether each one is due, late or taken, how many days of stock are left.
// Pure functions over the state in A, no drawing here.

import { A, prefs, L } from "./state.js";
import { ymd, dow, toMin, addDays, parseYmd, daysBetween, entryKey, fmt } from "./util.js";

export function patients() { const p = (A.family && A.family.patients) || {}; return Object.keys(p).map(id => Object.assign({ id }, p[id])).sort((a, b) => a.name.localeCompare(b.name)); }
export function patientById(id) { const p = (A.family && A.family.patients) || {}; return p[id] ? Object.assign({ id }, p[id]) : null; }
export function currentPatientId() {
  if (prefs.lock && patientById(prefs.lock.patientId)) return prefs.lock.patientId;
  const ps = patients();
  if (prefs.patientId && ps.some(p => p.id === prefs.patientId)) return prefs.patientId;
  return ps[0] ? ps[0].id : null;
}
export function logFor(date, key) { return (A.logs[date] || {})[key] || null; }
export function dosesFor(date, pid) {
  const day = dow(date), d = ymd(date), out = [];
  A.meds.forEach(m => { if ((!pid || m.patientId === pid) && (m.days || []).includes(day)) (m.times || []).forEach(t => out.push({ m, t, date: d, key: entryKey(m.id, t), deadline: (m.deadlines || {})[t] || "" })); });
  out.sort((a, b) => toMin(a.t) - toMin(b.t) || a.m.name.localeCompare(b.m.name));
  return out;
}
export function statusOf(dose, nowMin) {
  if (logFor(dose.date, dose.key)) return "taken";
  const t = toMin(dose.t), dl = dose.deadline ? toMin(dose.deadline) : null;
  if (nowMin < t - 30) return "later";
  const end = dl != null && dl > t ? dl : t + 90;
  if (nowMin <= end) return "due";
  return dl != null && dl > t ? "missed" : "late";
}
export function dailyUnits(m) { return (m.units || 1) * (m.times || []).length * (m.days || []).length / 7; }
export function daysLeft(m) { if (!m.stock || typeof m.stock.count !== "number") return null; const du = dailyUnits(m); if (!du) return null; return Math.floor(m.stock.count / du); }
export function stockLevel(m) { const d = daysLeft(m); if (d == null) return null; if (m.stock.count <= 0) return "critical"; if (d <= (m.stock.threshold || 7)) return "warn"; return "ok"; }
export function rxDays(m) { if (!m.rx || !m.rx.expires) return null; return daysBetween(new Date(), parseYmd(m.rx.expires)); }
export function alerts(pid) {
  const t = L(), out = [], now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  A.meds.filter(m => !pid || m.patientId === pid).forEach(m => {
    const p = patientById(m.patientId); if (!p) return;
    const lvl = stockLevel(m), d = daysLeft(m);
    if (lvl === "critical") out.push({ type: "stock", level: "critical", p, m, title: fmt(t.a_out, { m: m.name }), sub: t.a_low_sub });
    else if (lvl === "warn") out.push({ type: "stock", level: "warn", p, m, title: fmt(t.a_low, { m: m.name, d }), sub: t.a_low_sub });
    const r = rxDays(m);
    if (r != null && r < 0) out.push({ type: "rx", level: "critical", p, m, title: fmt(t.a_rx_exp, { m: m.name }), sub: t.a_rx_sub });
    else if (r != null && r <= 7) out.push({ type: "rx", level: "warn", p, m, title: fmt(t.a_rx_soon, { m: m.name, d: r }), sub: t.a_rx_sub });
  });
  patients().filter(p => !pid || p.id === pid).forEach(p => {
    dosesFor(now, p.id).forEach(d => {
      const st = statusOf(d, nowMin);
      if (st === "missed") out.push({ type: "dose", level: "critical", p, m: d.m, title: fmt(t.a_missed, { m: d.m.name, t: d.deadline }), sub: "" });
      else if (st === "late") out.push({ type: "dose", level: "warn", p, m: d.m, title: fmt(t.a_late, { m: d.m.name, t: d.t }), sub: "" });
    });
  });
  const rank = { critical: 0, warn: 1 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}
export function nextOccurrence(r, from) {
  if (!r.date || !r.time) return null;
  let d = parseYmd(r.date); const [h, mi] = r.time.split(":").map(Number); d.setHours(h, mi, 0, 0);
  const start = new Date(from); start.setSeconds(0, 0);
  if (r.repeat === "none" || !r.repeat) return d >= addDays(start, -1) ? d : null;
  let guard = 0;
  while (d < start && guard++ < 800) {
    if (r.repeat === "daily") d = addDays(d, 1);
    else if (r.repeat === "weekly") d = addDays(d, 7);
    else if (r.repeat === "monthly") { const x = new Date(d); x.setMonth(x.getMonth() + 1); d = x; }
  }
  return d;
}
export function remindersOn(date) {
  const day0 = parseYmd(ymd(date)), out = [];
  A.reminders.forEach(r => { const n = nextOccurrence(r, day0); if (n && ymd(n) === ymd(date)) out.push({ r, at: n }); });
  return out.sort((a, b) => a.at - b.at);
}

/** Patient colours offered in the form. */
export const PCOLORS = ["#C9772B", "#2C55D6", "#8A5CC2", "#C2416B", "#1E9E6E", "#7A6A2F"];
/** Pill colours offered in the form. */
export const COLORS = ["#FFFFFF", "#FFC93C", "#F59AB8", "#8FB8E8", "#F2A65A", "#A8D5A2"];
