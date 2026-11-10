// The family members' screens: circle, medicines, reminders, weekly sheet, account.

import { A, prefs, L } from "../state.js";
import { esc, fmt, ymd, addDays, dow, hm, toMin, parseYmd, daysBetween, nowMinutes } from "../util.js";
import { patients, patientById, currentPatientId, dosesFor, statusOf, logFor, alerts, stockLevel, daysLeft, rxDays, nextOccurrence } from "../domain.js";
import { icon, medVisual, avatar, pillSVG } from "../ui.js";
import { alertList, patientChips } from "./today.js";
import { langSwitch } from "./landing.js";
import { ADMIN_NAME } from "../config.js";

const fmtDate = s => { if (!s) return ""; const d = parseYmd(s); return d.getDate() + " " + L().months[d.getMonth()].slice(0, 3) + " " + d.getFullYear(); };
const pageHead = (title, action) => '<div class="page-head"><h1 class="h-page">' + esc(title) + "</h1>" + (action || "") + "</div>";

export function viewCircle(storeKind) {
  const t = L(), now = new Date(), nowMin = nowMinutes(now), f = A.family;
  const pcards = patients().map(p => {
    const doses = dosesFor(now, p.id), tk = doses.filter(d => logFor(d.date, d.key)).length;
    const bad = doses.filter(d => ["missed", "late"].includes(statusOf(d, nowMin))).length;
    const pct = doses.length ? Math.round((tk / doses.length) * 100) : 0;
    return '<li class="person">' + avatar(p.name, p.color, "lg") + '<div class="person-body"><div class="row-between"><h3>' + esc(p.name) + "</h3>" +
      (bad ? '<span class="tag late">' + bad + " " + esc(t.st.late.toLowerCase()) + "</span>" : doses.length && tk === doses.length ? '<span class="tag ok">' + icon("check", 14) + "</span>" : "") + "</div>" +
      '<p class="muted">' + esc(fmt(t.today_progress, { a: tk, b: doses.length })) + '</p><div class="bar"><span style="width:' + pct + '%"></span></div>' +
      '<div class="btn-row"><button class="btn sm primary" data-open-patient="' + esc(p.id) + '">' + esc(t.open_day) + '</button><button class="btn sm" data-lock-setup="' + esc(p.id) + '">' + icon("lock", 16) + esc(fmt(t.lock_on, { p: p.name })) + '</button><button class="btn sm ghost" data-edit-patient="' + esc(p.id) + '">' + esc(t.edit) + "</button></div></div></li>";
  }).join("");

  const feed = [];
  [ymd(now), ymd(addDays(now, -1))].forEach(dk => Object.entries(A.logs[dk] || {}).forEach(([k, e]) => { const m = A.meds.find(x => k.startsWith(x.id + "_")); if (m) feed.push({ e, m, dk }); }));
  feed.sort((a, b) => (b.e.ts || 0) - (a.e.ts || 0));
  const feedHtml = feed.slice(0, 8).map(x => {
    const p = patientById(x.m.patientId) || { name: "?" }, self = x.e.by === "device", box = x.e.by === "box";
    return "<li>" + avatar(x.e.byName, self ? p.color : box ? "#13294B" : "#4A5A70") + "<div><b>" + esc(x.e.byName) + "</b>" + (self ? ' <span class="muted">(' + esc(t.by_device) + ")</span>" : box ? ' <span class="muted">(' + esc(t.box.by) + ")</span>" : "") +
      '<span class="muted">' + esc(x.m.name) + (self ? "" : ", " + esc(p.name)) + '</span></div><span class="muted num">' + (x.dk === ymd(now) ? "" : (prefs.lang === "it" ? "ieri " : "yday ")) + esc(x.e.at) + "</span></li>";
  }).join("");
  const members = Object.entries(f.members || {}).map(([id, m]) => "<li>" + avatar(m.name, "#13294B") + "<div><b>" + esc(m.name) + "</b>" + (id === A.user.uid ? ' <span class="muted">(' + (prefs.lang === "it" ? "tu" : "you") + ")</span>" : "") + "</div><span></span></li>").join("");
  const shareUrl = location.origin + location.pathname;

  return '<div class="stack-lg">' + pageHead(f.name) +
    '<section class="stack"><div class="row-between"><h2 class="h-card">' + esc(t.people) + '</h2><button class="btn sm" data-add-patient>' + icon("plus", 16) + esc(t.add_patient.replace("+ ", "")) + "</button></div>" +
    (pcards ? '<ul class="people">' + pcards + "</ul>" : '<p class="muted">' + esc(t.no_patients) + "</p>") + "</section>" +
    '<section class="stack"><h2 class="h-card">' + esc(t.alerts) + "</h2>" + alertList(alerts(), false) + "</section>" +
    '<div class="two-col"><section class="panel"><h2 class="h-card">' + esc(t.activity) + "</h2>" + (feedHtml ? '<ul class="feed">' + feedHtml + "</ul>" : '<p class="muted">' + esc(t.no_activity) + "</p>") + "</section>" +
    '<section class="panel stack"><h2 class="h-card">' + esc(t.members) + '</h2><ul class="feed">' + members + "</ul>" +
    "<h3>" + esc(t.invite) + '</h3><p class="muted">' + esc(t.invite_desc) + '</p><p class="code num">' + esc(f.inviteCode || "—") + "</p>" +
    '<button class="btn" data-copy="' + esc(fmt(t.invite_text, { c: f.inviteCode, u: shareUrl })) + '">' + esc(t.copy) + "</button></section></div>" +
    boxPanel() +
    (storeKind === "cloud" || A.familyIds.length > 1 ? circleSwitch(storeKind) : "") + "</div>";
}

/** How long ago, in words ("5 min", "3 ore"). */
function ago(ms) {
  const b = L().box, min = Math.max(1, Math.round((Date.now() - ms) / 60000));
  return min < 60 ? fmt(b.ago_min, { n: min }) : min < 2880 ? fmt(b.ago_h, { n: Math.round(min / 60) }) : fmt(b.ago_d, { n: Math.round(min / 1440) });
}

/** The pill boxes linked to this circle, with their live status. */
function boxPanel() {
  const t = L(), b = t.box;
  const rows = A.devices.map(d => {
    const p = patientById(d.patientId), st = d.status || {}, seen = Number(st.lastSeen) || 0;
    const online = seen && Date.now() - seen < 4 * 60000;
    return '<li class="box-row"><span class="f-ico">' + icon("cube", 26) + "</span><div><div class=\"row-wrap\"><h3>" + esc(d.name) + "</h3>" +
      '<span class="tag ' + (online ? "ok" : seen ? "due" : "") + '">' + esc(online ? b.online : seen ? fmt(b.offline, { t: ago(seen) }) : b.never) + "</span></div>" +
      '<p class="meta">' + esc(fmt(b.summary, { p: p ? p.name : "?", m: d.morning, e: d.evening })) + "</p>" +
      (online && b.state[st.state] ? '<p class="meta">' + esc(b.state[st.state]) + "</p>" : "") +
      '</div><button class="btn sm" data-edit-box="' + esc(d.id) + '">' + esc(b.setup) + "</button></li>";
  }).join("");
  return '<section class="panel stack"><div class="row-between"><h2 class="h-card">' + esc(b.title) + '</h2><button class="btn sm" data-add-box-device>' + icon("plus", 16) + esc(b.add) + "</button></div>" +
    '<p class="muted">' + esc(b.lead) + "</p>" + (rows ? '<ul class="boxes">' + rows + "</ul>" : '<p class="muted">' + esc(b.none) + "</p>") + "</section>";
}

function circleSwitch(storeKind) {
  const t = L(), others = A.familyIds.filter(id => id !== A.family.id);
  return '<section class="panel stack"><h2 class="h-card">' + esc(t.circle_settings) + "</h2>" +
    (others.length ? '<div class="chips">' + others.map(id => '<button class="chip" data-switch="' + esc(id) + '">' + esc(A.familyNames[id] || id) + "</button>").join("") + "</div>" : "") +
    '<div class="btn-row">' + (storeKind === "cloud" ? '<button class="btn sm" data-new-circle>' + esc(t.new_circle.replace("+ ", "")) + "</button>" : "") +
    '<button class="btn sm danger" data-leave>' + esc(t.leave) + "</button></div></section>";
}

export function viewMeds() {
  const t = L(), ps = patients();
  const groups = ps.map(p => {
    const meds = A.meds.filter(m => m.patientId === p.id).sort((a, b) => a.name.localeCompare(b.name));
    const rows = meds.map(m => {
      const lvl = stockLevel(m), dl = daysLeft(m), r = rxDays(m);
      const cap = m.stock && m.stock.box ? Math.max(m.stock.box, m.stock.count) : (m.stock && m.stock.count) || 1;
      const daysTxt = (m.days || []).length === 7 ? t.every_day : (m.days || []).map(i => t.days_short[i]).join(", ");
      const times = (m.times || []).map(x => x + ((m.deadlines || {})[x] ? " (" + fmt(t.recheck, { t: m.deadlines[x] }) + ")" : "")).join(", ");
      return '<li class="med"><button class="thumb" data-sheet="' + esc(m.id) + '" aria-label="' + esc(t.info_btn + ": " + m.name) + '">' + medVisual(m, 40) + "</button>" +
        '<div class="med-body"><div class="row-wrap"><h3>' + esc(m.name) + "</h3>" + (m.alarm ? '<span class="tag ok">' + icon("alarm", 14) + esc(t.alarm_tag) + "</span>" : "") + "</div>" +
        '<p class="meta">' + esc(m.dose) + '. <span class="num">' + esc(times) + "</span>. " + esc(daysTxt) + (t.food[m.food] ? ". " + esc(t.food[m.food]) : "") + "</p>" +
        (lvl ? '<p class="meta">' + esc(fmt(t.stock_left, { n: m.stock.count, d: dl }).replace(" · ", ", ")) + '</p><div class="bar ' + lvl + '"><span style="width:' + Math.min(100, Math.round((m.stock.count / cap) * 100)) + '%"></span></div>' : '<p class="meta">' + esc(t.stock_none) + "</p>") +
        (m.rx && m.rx.expires ? '<p class="meta"><span class="tag ' + (r < 0 ? "late" : r <= 7 ? "due" : "ok") + '">' + esc(t.rx) + "</span> " + esc(fmt(t.rx_until, { d: fmtDate(m.rx.expires) })) + (m.rx.doctor ? ", " + esc(m.rx.doctor) : "") + "</p>" : "") +
        '</div><div class="med-act"><button class="btn sm" data-edit="' + esc(m.id) + '">' + icon("edit", 16) + esc(t.edit) + "</button>" + (m.stock && m.stock.box ? '<button class="btn sm ghost" data-add-box="' + esc(m.id) + '">' + esc(t.add_box) + "</button>" : "") + "</div></li>";
    }).join("");
    return '<section class="panel"><div class="group-head">' + avatar(p.name, p.color) + '<h2 class="h-card">' + esc(p.name) + "</h2></div>" +
      (rows ? '<ul class="meds">' + rows + "</ul>" : '<p class="muted">' + esc(fmt(t.no_meds, { p: p.name })) + "</p>") + "</section>";
  }).join("");
  return '<div class="stack-lg">' + pageHead(t.meds, '<button class="btn primary" data-add-med>' + icon("plus", 18) + esc(t.add_med.replace("+ ", "")) + "</button>") +
    (groups || '<p class="muted">' + esc(t.no_patients) + "</p>") +
    '<a class="btn ghost" href="#week">' + icon("calendar", 18) + esc(t.week_sheet) + "</a></div>";
}

export function viewReminders() {
  const t = L(), now = new Date(), today0 = parseYmd(ymd(now));
  const list = A.reminders.map(r => ({ r, at: nextOccurrence(r, today0) })).filter(x => x.at && x.at >= today0).sort((a, b) => a.at - b.at);
  const rows = list.map(x => {
    const p = patientById(x.r.patientId), dd = daysBetween(now, x.at);
    const when = dd === 0 ? t.rem_today : dd === 1 ? t.rem_tomorrow : t.days_long[dow(x.at)] + " " + x.at.getDate() + " " + t.months[x.at.getMonth()].slice(0, 3);
    return '<li class="rem"><div class="date-chip"><b class="num">' + x.at.getDate() + "</b><span>" + esc(t.months[x.at.getMonth()].slice(0, 3)) + "</span></div>" +
      "<div><h3>" + esc(x.r.title) + '</h3><p class="meta">' + esc(when) + ', <span class="num">' + hm(x.at) + "</span>" + (x.r.repeat && x.r.repeat !== "none" ? ". " + esc(t.repeat[x.r.repeat]) : "") + (p ? ". " + esc(p.name) : "") + "</p>" +
      (x.r.note ? '<p class="meta">' + esc(x.r.note) + "</p>" : "") + (x.r.alarm ? '<span class="tag ok">' + icon("alarm", 14) + esc(t.alarm_tag) + "</span>" : "") + "</div>" +
      '<button class="btn sm" data-edit-rem="' + esc(x.r.id) + '">' + esc(t.edit) + "</button></li>";
  }).join("");
  return '<div class="stack-lg">' + pageHead(t.reminders, '<button class="btn primary" data-add-rem>' + icon("plus", 18) + esc(t.add_rem.replace("+ ", "")) + "</button>") +
    '<section class="panel"><h2 class="h-card">' + esc(t.upcoming) + "</h2>" + (rows ? '<ul class="rems">' + rows + "</ul>" : '<p class="muted">' + esc(t.no_rem) + "</p>") + "</section>" +
    '<section class="panel stack"><h2 class="h-card">' + esc(t.calendar) + '</h2><p class="muted">' + esc(t.calendar_desc) + '</p><div><button class="btn sm" data-ics>' + icon("download", 16) + esc(t.calendar) + "</button></div></section></div>";
}

export function viewWeek() {
  const t = L(), pid = currentPatientId(), p = patientById(pid);
  if (!p) return '<p class="muted">' + esc(t.no_patients) + "</p>";
  const meds = A.meds.filter(m => m.patientId === pid);
  const times = [...new Set(meds.flatMap(m => m.times || []))].sort((a, b) => toMin(a) - toMin(b));
  const rows = times.map(tm => '<tr><th scope="row" class="num">' + esc(tm) + "</th>" + [0, 1, 2, 3, 4, 5, 6].map(day => "<td>" +
    meds.filter(m => (m.times || []).includes(tm) && (m.days || []).includes(day)).map(m => '<div class="cellmed"><span class="box"></span>' + pillSVG(m.color, m.shape, 22) + "<span>" + esc(m.name) + "</span></div>").join("") + "</td>").join("") + "</tr>").join("");
  return '<div class="stack">' + patientChips(pid) + '<div class="page-head"><div><h1 class="h-page">' + esc(t.week_title) + ", " + esc(p.name) + '</h1><p class="muted noprint">' + esc(t.week_sub) + '</p></div><button class="btn noprint" data-print>' + (prefs.lang === "it" ? "Stampa" : "Print") + "</button></div>" +
    (times.length ? '<div class="tablewrap"><table class="week"><thead><tr><th>' + esc(t.time) + "</th>" + t.days_short.map(d => "<th>" + esc(d) + "</th>").join("") + "</tr></thead><tbody>" + rows + "</tbody></table></div>" : '<p class="muted">' + esc(fmt(t.no_meds, { p: p.name })) + "</p>") + "</div>";
}

export function viewAccount(storeKind) {
  const t = L(), notifOk = prefs.alarms && "Notification" in window && Notification.permission === "granted";
  return '<div class="stack-lg">' + pageHead(t.account) +
    (A.isAdmin ? '<section class="panel studio-card"><div class="studio-card-in">' + icon("studio", 30) + '<div><h2 class="h-card">' + esc(t.admin_badge) + ": " + esc(ADMIN_NAME) + "</h2><p>" + esc(t.studio_desc) + '</p></div></div><a class="btn primary" href="#studio">' + esc(t.studio) + "</a></section>" : "") +
    '<section class="panel stack"><div class="who">' + avatar(A.user.name, "#13294B", "lg") + "<div><h2 class=\"h-card\">" + esc(A.user.name) + '</h2><p class="muted">' + esc(storeKind === "demo" ? t.demo_title : fmt(t.signed_as, { e: A.user.email })) + "</p></div></div>" +
    '<div class="row-between"><span>' + esc(t.language) + "</span>" + langSwitch() + "</div></section>" +
    '<section class="panel stack"><h2 class="h-card">' + esc(t.alarms_title) + "</h2><h3>" + esc(t.alarms_on_device) + '</h3><p class="muted">' + esc(t.alarms_desc) + "</p>" +
    '<div class="btn-row">' + (notifOk ? '<span class="tag ok">' + icon("check", 14) + esc(t.alarms_ok) + "</span>" : '<button class="btn primary sm" data-enable-alarms>' + esc(t.enable_alarms) + "</button>") + '<button class="btn sm" data-test-alarm>' + esc(t.test_alarm) + "</button></div>" +
    "<h3>" + esc(t.calendar) + '</h3><p class="muted">' + esc(t.calendar_desc) + '</p><div><button class="btn sm" data-ics>' + icon("download", 16) + esc(t.calendar) + "</button></div></section>" +
    '<section class="panel stack"><h2 class="h-card">' + esc(t.your_data) + '</h2><p class="muted">' + esc(t.export_desc) + '</p><div><button class="btn sm" data-export>' + icon("download", 16) + esc(t.export) + "</button></div>" +
    '<p class="muted">' + esc(t.delete_desc) + '</p><div><button class="btn sm danger" data-delete-account>' + icon("trash", 16) + esc(t.delete_account) + "</button></div>" +
    '<p class="links"><a href="#privacy">' + esc(t.privacy) + '</a> <a href="#terms">' + esc(t.terms) + '</a> <a href="#about">' + esc(t.nav_project) + "</a></p></section>" +
    '<button class="btn ghost" data-signout>' + icon("logout", 18) + esc(storeKind === "demo" ? t.demo_exit : t.signout) + "</button></div>";
}
