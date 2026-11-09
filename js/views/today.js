// "Today": the day of one person, drawn as a blister pack.
// This is the screen the person cared for sees on their own phone, so it is
// built to be read at arm's length: one big card, one big button.

import { A, prefs, L } from "../state.js";
import { esc, fmt, hm, dow, nowMinutes } from "../util.js";
import { patients, patientById, currentPatientId, dosesFor, statusOf, logFor, alerts, remindersOn } from "../domain.js";
import { icon, medVisual, avatar, emptyPocket } from "../ui.js";

export function patientChips(sel) {
  const ps = patients(); if (ps.length < 2) return "";
  return '<div class="pchips" role="group" aria-label="' + esc(L().people) + '">' + ps.map(p => '<button class="pchip" data-patient="' + esc(p.id) + '" aria-pressed="' + (p.id === sel) + '">' + avatar(p.name, p.color) + esc(p.name) + "</button>").join("") + "</div>";
}

export function alertList(list, compact) {
  const t = L();
  if (!list.length) return '<p class="muted">' + esc(t.no_alerts) + "</p>";
  return '<ul class="alerts">' + list.map(a => '<li class="alert ' + a.level + '">' + icon(a.type === "stock" ? "box" : a.type === "rx" ? "rx" : "alarm", 22) +
    "<div><b>" + esc(a.title) + "</b><span>" + (patients().length > 1 ? esc(fmt(t.for_p, { p: a.p.name })) + (a.sub ? ". " : "") : "") + esc(a.sub) + "</span></div>" +
    (a.m ? '<button class="btn sm ghost" data-edit="' + esc(a.m.id) + '" aria-label="' + esc(t.edit + ": " + a.m.name) + '">' + (compact ? icon("chevron", 18) : esc(t.edit)) + "</button>" : "") + "</li>").join("") + "</ul>";
}

function ring(taken, total) {
  const C = 2 * Math.PI * 27, frac = total ? taken / total : 0;
  return '<div class="ring" role="img" aria-label="' + esc(fmt(L().taken_count, { a: taken, b: total }) + " " + L().ring_sub) + '"><svg width="84" height="84" viewBox="0 0 64 64" aria-hidden="true">' +
    '<circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="7"/>' +
    '<circle class="ring-arc" cx="32" cy="32" r="27" fill="none" stroke="var(--sun)" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (C * frac).toFixed(1) + " " + C.toFixed(1) + '" transform="rotate(-90 32 32)"/></svg>' +
    '<span class="ring-n">' + taken + "<small>/" + total + "</small></span><span class=\"ring-l\">" + esc(L().ring_sub) + "</span></div>";
}

export function viewToday(locked) {
  const t = L(), now = new Date(), nowMin = nowMinutes(now), hr = now.getHours();
  const pid = currentPatientId(), p = patientById(pid);
  if (!p) return '<section class="panel empty">' + icon("circle", 40) + "<p>" + esc(t.no_patient_today) + '</p><a class="btn primary" href="#circle">' + esc(t.add_patient.replace("+ ", "")) + "</a></section>";

  const hello = t.hello[hr < 5 ? 0 : hr < 13 ? 1 : hr < 18 ? 2 : 3];
  const dateStr = t.days_long[dow(now)] + " " + now.getDate() + " " + t.months[now.getMonth()];
  const doses = dosesFor(now, pid), takenN = doses.filter(d => logFor(d.date, d.key)).length;
  const open = doses.filter(d => ["due", "late", "missed"].includes(statusOf(d, nowMin)));

  let nowCard;
  if (!doses.length) {
    nowCard = '<section class="now clear"><p class="now-msg">' + esc(fmt(t.no_meds, { p: p.name })) + "</p>" + (locked ? "" : '<a class="btn primary" href="#meds">' + esc(t.add_med.replace("+ ", "")) + "</a>") + "</section>";
  } else if (open.length) {
    const d = open[0], st = statusOf(d, nowMin), m = d.m, food = t.food[m.food] || "";
    const label = st === "due" ? t.now_due : st === "missed" ? fmt(t.now_missed, { t: d.deadline }) : t.now_late;
    nowCard = '<section class="now ' + (st === "due" ? "due" : "late") + '" aria-live="polite">' +
      '<p class="now-tag"><span class="dot"></span>' + esc(label) + ' <span class="num">' + esc(d.t) + "</span></p>" +
      '<div class="now-main"><div class="disc">' + medVisual(m, 74) + '</div><div><h2 class="medname">' + esc(m.name) + '</h2><p class="dose">' + esc(m.dose) + "</p></div></div>" +
      (food ? '<p class="food">' + icon("food", 20) + esc(food) + "</p>" : "") + (m.note ? '<p class="note">' + esc(m.note) + "</p>" : "") +
      (st !== "due" ? '<p class="late-hint">' + esc(fmt(t.late_hint, { t: d.t })) + "</p>" : "") +
      '<button class="btn take" data-take="' + esc(d.key) + '" data-med="' + esc(m.id) + '">' + icon("check", 30) + "<span>" + esc(t.taken_btn.replace(" ✓", "")) + "</span></button>" +
      '<div class="now-foot">' + (open.length > 1 ? '<span class="muted">' + esc(fmt(t.more_now, { n: open.length - 1 })) + "</span>" : "<span></span>") +
      '<button class="btn sm ghost" data-sheet="' + esc(m.id) + '">' + icon("info", 18) + esc(t.info_btn) + "</button></div></section>";
  } else {
    const next = doses.find(d => statusOf(d, nowMin) === "later");
    nowCard = '<section class="now clear"><div class="now-main">' + emptyPocket(64) + '<h2 class="clearbig">' + esc(t.all_clear) + '</h2></div><p class="dose">' +
      esc(next ? fmt(t.next_at, { m: next.m.name, t: next.t }) : t.no_more) + "</p></section>";
  }

  const pockets = doses.map(d => {
    const st = statusOf(d, nowMin), lg = logFor(d.date, d.key);
    const label = st === "taken" ? fmt(t.st.taken, { t: lg.at }) : t.st[st];
    const cls = st === "missed" ? "late" : st;
    const inner = st === "taken" ? emptyPocket(76) : medVisual(d.m, 50);
    const act = st === "taken" ? ' data-pocket-info="' + esc(d.key) + '"' : st === "later" ? ' data-sheet="' + esc(d.m.id) + '"' : ' data-take="' + esc(d.key) + '" data-med="' + esc(d.m.id) + '"';
    return '<li><button class="pocket ' + cls + '" data-pocket="' + esc(d.key) + '"' + act + ' aria-label="' + esc(d.t + ", " + d.m.name + ", " + label) + '">' +
      '<span class="p-time num">' + esc(d.t) + '</span><span class="dome">' + inner + '</span><span class="p-name">' + esc(d.m.name) + '</span><span class="p-st">' + esc(label) + "</span></button></li>";
  }).join("");

  const rems = remindersOn(now).filter(x => !x.r.patientId || x.r.patientId === pid);
  const al = locked ? [] : alerts(pid).filter(a => a.type !== "dose");
  const lg = t.legend;

  return (locked ? "" : patientChips(pid)) +
    '<section class="day-band"><div><p class="clock num" aria-label="' + esc(fmt(t.now_time, { t: hm(now) })) + '">' + hm(now) + '</p><h1 class="hello">' + esc(hello) + ", " + esc(p.name) + '</h1><p class="date">' + esc(dateStr) + "</p></div>" + (doses.length ? ring(takenN, doses.length) : "") + "</section>" +
    '<div class="day-body">' + nowCard +
    (al.length ? '<section aria-label="' + esc(t.alerts) + '">' + alertList(al.slice(0, 3), true) + "</section>" : "") +
    (doses.length ? '<section class="blister-sec"><div class="sec-head"><h2 class="h-card">' + esc(t.blister) + '</h2><p class="muted">' + esc(t.tap_hint) + "</p></div>" +
      '<div class="foil" data-tilt><ul class="pockets">' + pockets + "</ul></div>" +
      '<ul class="legend"><li><i class="k-due"></i>' + esc(lg[0]) + '</li><li><i class="k-late"></i>' + esc(lg[1]) + '</li><li><i class="k-later"></i>' + esc(lg[2]) + '</li><li><i class="k-taken"></i>' + esc(lg[3]) + "</li></ul></section>" : "") +
    (rems.length ? '<section class="panel"><h2 class="h-card">' + esc(t.today_reminders) + '</h2><ul class="rem-today">' + rems.map(x => '<li><b class="num">' + hm(x.at) + "</b><span>" + esc(x.r.title) + "</span>" + (x.r.alarm ? icon("alarm", 18, "muted") : "") + "</li>").join("") + "</ul></section>" : "") +
    "</div>" + (locked ? '<div class="exit-lock"><button class="linkish" data-unlock>' + esc(t.exit_lock) + "</button></div>" : "");
}
