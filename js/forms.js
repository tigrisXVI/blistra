// Dialogs with forms: medicine, reminder, person cared for, medicine sheet, lock.
// Each form keeps a draft object while open, so redrawing never loses what was typed.

import { L } from "./state.js";
import { esc, fmt, uid, ymd, addDays, clone } from "./util.js";
import { patients, patientById, currentPatientId, COLORS, PCOLORS } from "./domain.js";
import { modal, medVisual, pillSVG, icon, toast } from "./ui.js";
import { FARMACI } from "./data/farmaci.js";
import { schedaPer, AIFA_URL } from "./data/schede.js";

export const drafts = { med: null, rem: null };

const actions = (isNew, delAttr) => {
  const t = L();
  return '<div class="sheet-actions">' + (isNew ? "<span></span>" : '<button type="button" class="btn danger ghost" ' + delAttr + ">" + icon("trash", 16) + esc(t.del) + "</button>") +
    '<div class="btn-row"><button type="button" class="btn" data-close>' + esc(t.cancel) + '</button><button type="submit" class="btn primary">' + esc(t.save) + "</button></div></div>";
};
const sheetHead = title => '<div class="sheet-head"><h2 class="h-card">' + esc(title) + '</h2><button type="button" class="icon-btn" data-close aria-label="' + esc(L().close) + '">' + icon("close", 22) + "</button></div>";

// ---- medicine ---------------------------------------------------------------------

export function openMedForm(med) {
  const ps = patients();
  if (!ps.length) { toast(L().need_patient); return; }
  const d = med ? clone(med) : { id: uid(), patientId: currentPatientId() || ps[0].id, name: "", dose: "", units: 1, times: ["08:00"], deadlines: {}, alarm: true, days: [0, 1, 2, 3, 4, 5, 6], food: "any", color: COLORS[0], shape: "round", photo: "", look: "", note: "", stock: { count: null, box: null, threshold: 7 }, rx: { doctor: "", expires: "", note: "" } };
  d._new = !med; d.deadlines = d.deadlines || {}; d.stock = d.stock || { count: null, box: null, threshold: 7 }; d.rx = d.rx || { doctor: "", expires: "", note: "" };
  drafts.med = d;
  drawMedForm("");
}

export function drawMedForm(err) {
  const t = L(), d = drafts.med;
  const ps = patients().map(p => '<option value="' + esc(p.id) + '"' + (p.id === d.patientId ? " selected" : "") + ">" + esc(p.name) + "</option>").join("");
  const times = d.times.map((tm, i) => '<div class="time-row"><label class="f">' + esc(t.f_times) + " " + (i + 1) + '<input type="time" data-time="' + i + '" value="' + esc(tm) + '"></label>' +
    '<label class="f">' + esc(t.f_deadline) + '<input type="time" data-dl="' + i + '" value="' + esc(d.deadlines[tm] || "") + '"></label>' +
    (d.times.length > 1 ? '<button type="button" class="icon-btn" data-rm-time="' + i + '" aria-label="' + esc(t.del) + '">' + icon("close", 20) + "</button>" : "") + "</div>").join("");
  const days = t.days_short.map((n, i) => '<button type="button" class="chip" data-day="' + i + '" aria-pressed="' + d.days.includes(i) + '">' + esc(n) + "</button>").join("");
  const foods = ["any", "before", "with", "after"].map(k => '<button type="button" class="chip" data-food="' + k + '" aria-pressed="' + (d.food === k) + '">' + esc(t.f_food_opts[k]) + "</button>").join("");
  const sw = COLORS.map(c => '<button type="button" class="swatch" style="--c:' + c + '" data-color="' + c + '" aria-pressed="' + (d.color === c) + '" aria-label="' + c + '"></button>').join("");
  const shapes = ["round", "oval", "capsule"].map(s => '<button type="button" class="chip" data-shape="' + s + '" aria-pressed="' + (d.shape === s) + '">' + pillSVG(d.color, s, 24) + esc(t.f_shape[s]) + "</button>").join("");
  modal('<form class="stack" id="medform" novalidate>' + sheetHead(d._new ? t.f_new : t.f_edit) + (err ? '<p class="err" role="alert">' + esc(err) + "</p>" : "") +
    '<div class="grid2"><label class="f">' + esc(t.f_for) + '<select id="f-pat">' + ps + '</select></label><label class="f">' + esc(t.f_name) + '<input type="text" id="f-name" list="farmaci" value="' + esc(d.name) + '" placeholder="' + esc(t.f_name_ph) + '" maxlength="60" autocomplete="off"></label></div>' +
    '<datalist id="farmaci">' + FARMACI.map(n => '<option value="' + esc(n) + '">').join("") + "</datalist>" +
    '<div class="grid2"><label class="f">' + esc(t.f_dose) + '<input type="text" id="f-dose" value="' + esc(d.dose) + '" placeholder="' + esc(t.f_dose_ph) + '" maxlength="40"></label><label class="f">' + esc(t.f_units) + '<input type="number" id="f-units" min="0.25" max="20" step="0.25" value="' + (d.units || 1) + '"></label></div>' +
    "<fieldset><legend>" + esc(t.f_when) + "</legend>" + times + '<div><button type="button" class="btn ghost sm" data-add-time>' + icon("plus", 16) + esc(t.f_add_time.replace("+ ", "")) + "</button></div>" +
    '<label class="check"><input type="checkbox" id="f-alarm"' + (d.alarm ? " checked" : "") + "><span>" + esc(t.f_alarm) + "</span></label>" +
    '<div class="stack-sm"><b>' + esc(t.f_days) + '</b><div class="chips">' + days + '<button type="button" class="chip" data-all-days>' + esc(t.every_day) + "</button></div></div>" +
    '<div class="stack-sm"><b>' + esc(t.f_food) + '</b><div class="chips">' + foods + "</div></div></fieldset>" +
    "<fieldset><legend>" + esc(t.f_look) + '</legend><div class="photo"><div class="thumb lg">' + medVisual(d, 44) + '</div><label class="btn sm" for="f-photo">' + icon("image", 16) + esc(t.f_photo_btn) + '</label><input type="file" id="f-photo" accept="image/jpeg,image/png,image/webp,image/heic" capture="environment" class="sr">' +
    (d.photo ? '<button type="button" class="btn sm ghost" data-photo-rm>' + esc(t.f_photo_rm) + "</button>" : "") + '</div><p class="hint">' + esc(t.f_photo_hint) + "</p>" +
    '<div class="chips">' + sw + '</div><div class="chips">' + shapes + "</div>" +
    '<label class="f">' + esc(t.f_desc) + '<input type="text" id="f-look" value="' + esc(d.look) + '" placeholder="' + esc(t.f_desc_ph) + '" maxlength="120"></label>' +
    '<label class="f">' + esc(t.f_note) + '<input type="text" id="f-note" value="' + esc(d.note) + '" placeholder="' + esc(t.f_note_ph) + '" maxlength="100"></label></fieldset>' +
    "<fieldset><legend>" + esc(t.f_stock) + '</legend><div class="grid3"><label class="f">' + esc(t.f_count) + '<input type="number" id="f-count" min="0" max="9999" step="1" value="' + (d.stock.count == null ? "" : d.stock.count) + '"></label><label class="f">' + esc(t.f_box) + '<input type="number" id="f-box" min="1" max="999" step="1" value="' + (d.stock.box || "") + '"></label><label class="f">' + esc(t.f_thr) + '<input type="number" id="f-thr" min="1" max="90" step="1" value="' + (d.stock.threshold || 7) + '"></label></div></fieldset>' +
    "<fieldset><legend>" + esc(t.f_rx) + '</legend><div class="grid2"><label class="f">' + esc(t.f_doctor) + '<input type="text" id="f-doc" value="' + esc(d.rx.doctor) + '" maxlength="50"></label><label class="f">' + esc(t.f_expires) + '<input type="date" id="f-exp" value="' + esc(d.rx.expires) + '"></label></div><label class="f">' + esc(t.f_rx_note) + '<input type="text" id="f-rxn" value="' + esc(d.rx.note) + '" placeholder="' + esc(t.f_rx_note_ph) + '" maxlength="100"></label></fieldset>' +
    actions(d._new, 'data-del-med="' + esc(d.id) + '"') + "</form>", { wide: true });
}

export function syncMedDraft() {
  const d = drafts.med, g = id => document.getElementById(id);
  if (!d || !g("f-name")) return;
  d.patientId = g("f-pat").value; d.name = g("f-name").value; d.dose = g("f-dose").value;
  d.units = Math.min(20, Math.max(0.25, parseFloat(g("f-units").value) || 1));
  d.alarm = g("f-alarm").checked; d.look = g("f-look").value; d.note = g("f-note").value;
  const dl = {};
  document.querySelectorAll("[data-time]").forEach(el => { const i = +el.dataset.time; d.times[i] = el.value; const x = document.querySelector('[data-dl="' + i + '"]'); if (x && x.value && el.value) dl[el.value] = x.value; });
  d.deadlines = dl;
  const cnt = g("f-count").value;
  d.stock = { count: cnt === "" ? null : Math.max(0, Math.min(9999, parseFloat(cnt))), box: parseInt(g("f-box").value, 10) || null, threshold: parseInt(g("f-thr").value, 10) || 7 };
  d.rx = { doctor: g("f-doc").value, expires: g("f-exp").value, note: g("f-rxn").value };
}

// ---- reminder ------------------------------------------------------------------------

export function openRemForm(r) {
  drafts.rem = r ? clone(r) : { id: uid(), title: "", patientId: "", date: ymd(addDays(new Date(), 1)), time: "09:00", repeat: "none", alarm: true, note: "" };
  drafts.rem._new = !r;
  drawRemForm("");
}
export function drawRemForm(err) {
  const t = L(), r = drafts.rem;
  const ps = '<option value="">' + esc(t.rem_all) + "</option>" + patients().map(p => '<option value="' + esc(p.id) + '"' + (p.id === r.patientId ? " selected" : "") + ">" + esc(p.name) + "</option>").join("");
  modal('<form class="stack" id="remform" novalidate>' + sheetHead(r._new ? t.add_rem.replace("+ ", "") : t.edit) + (err ? '<p class="err" role="alert">' + esc(err) + "</p>" : "") +
    '<label class="f">' + esc(t.rem_title) + '<input type="text" id="r-title" value="' + esc(r.title) + '" placeholder="' + esc(t.rem_title_ph) + '" maxlength="80"></label>' +
    '<div class="grid3"><label class="f">' + esc(t.rem_date) + '<input type="date" id="r-date" value="' + esc(r.date) + '"></label><label class="f">' + esc(t.rem_time) + '<input type="time" id="r-time" value="' + esc(r.time) + '"></label><label class="f">' + esc(t.rem_repeat) + '<select id="r-rep">' +
    ["none", "daily", "weekly", "monthly"].map(k => '<option value="' + k + '"' + (r.repeat === k ? " selected" : "") + ">" + esc(t.repeat[k]) + "</option>").join("") + "</select></label></div>" +
    '<label class="f">' + esc(t.rem_for) + '<select id="r-pat">' + ps + "</select></label>" +
    '<label class="check"><input type="checkbox" id="r-alarm"' + (r.alarm ? " checked" : "") + "><span>" + esc(t.rem_alarm) + "</span></label>" +
    '<label class="f">' + esc(t.rem_note) + '<textarea id="r-note" maxlength="200">' + esc(r.note) + "</textarea></label>" +
    actions(r._new, 'data-del-rem="' + esc(r.id) + '"') + "</form>");
}

// ---- person cared for --------------------------------------------------------------

export function openPatientForm(p) {
  const t = L(), cur = p || { id: "p_" + uid(8), name: "", color: PCOLORS[patients().length % PCOLORS.length] };
  modal('<form class="stack" id="patform" data-pid="' + esc(cur.id) + '">' + sheetHead(p ? p.name : t.add_patient.replace("+ ", "")) +
    '<label class="f">' + esc(t.patient_name) + '<input type="text" id="p-name" value="' + esc(cur.name) + '" maxlength="30" required></label>' +
    '<div class="stack-sm"><b>' + esc(t.color) + '</b><div class="chips">' + PCOLORS.map(c => '<button type="button" class="swatch" style="--c:' + c + '" data-pcolor="' + c + '" aria-pressed="' + (c === cur.color) + '" aria-label="' + c + '"></button>').join("") +
    '</div><input type="hidden" id="p-color" value="' + esc(cur.color) + '"></div>' +
    actions(!p, 'data-rm-patient="' + esc(cur.id) + '"').replace(esc(t.del), esc(t.remove_patient)) + "</form>");
}

// ---- simplified medicine sheet ------------------------------------------------------

export function openSheet(m) {
  const t = L(), s = schedaPer(m.name);
  const body = s ? '<div class="stack"><span class="tag ok">' + esc(s.gruppo) + "</span>" +
    "<div><h3>" + esc(t.sheet_for) + "</h3><p>" + esc(s.per) + "</p></div><div><h3>" + esc(t.sheet_how) + "</h3><p>" + esc(s.come) + "</p></div>" +
    "<div><h3>" + esc(t.sheet_watch) + '</h3><ul class="bullets">' + s.attenzione.map(x => "<li>" + esc(x) + "</li>").join("") + "</ul></div>" +
    '<div class="alert critical">' + icon("alarm", 22) + "<div><b>" + esc(t.sheet_call) + "</b><span>" + esc(s.chiama) + "</span></div></div></div>" : '<p class="muted">' + esc(t.sheet_none) + "</p>";
  modal('<div class="stack">' + sheetHead(t.sheet_title) + '<div class="sheet-med"><div class="disc sm">' + medVisual(m, 52) + "</div><div><h2 class=\"medname sm\">" + esc(m.name) + "</h2>" + (m.look ? '<p class="muted">' + esc(m.look) + "</p>" : "") + "</div></div>" + body +
    '<div class="aifa"><a href="' + AIFA_URL + '" target="_blank" rel="noopener noreferrer">' + esc(t.sheet_aifa) + '</a><span class="muted">' + esc(fmt(t.sheet_aifa_hint, { n: m.name.split(" ")[0] })) + "</span></div>" +
    '<p class="hint">' + esc(t.sheet_disclaimer) + '</p><div class="sheet-actions"><button class="btn ghost sm" data-edit="' + esc(m.id) + '">' + icon("edit", 16) + esc(t.edit) + '</button><button class="btn" data-close>' + esc(t.close) + "</button></div></div>");
}

// ---- lock the phone to one person ---------------------------------------------------

export function openLockSetup(pid) {
  const t = L(), p = patientById(pid);
  modal('<form class="stack" id="lockform" data-pid="' + esc(pid) + '">' + sheetHead(fmt(t.lock_title, { p: p.name })) + '<p class="muted">' + esc(fmt(t.lock_desc, { p: p.name })) + "</p>" +
    '<label class="f">' + esc(t.lock_pin) + '<input type="password" id="l-pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off"></label>' +
    '<div class="sheet-actions"><span></span><div class="btn-row"><button type="button" class="btn" data-close>' + esc(t.cancel) + '</button><button class="btn primary" type="submit">' + esc(fmt(t.lock_on, { p: p.name })) + "</button></div></div></form>");
}

export function openPinForm() {
  const t = L();
  modal('<form class="stack" id="pinform">' + sheetHead(t.exit_lock) + '<label class="f">' + esc(t.pin_ask) + '<input type="password" id="pin-in" inputmode="numeric" maxlength="4" autocomplete="off"></label><p id="pin-err" class="err" role="alert"></p>' +
    '<div class="sheet-actions"><span></span><div class="btn-row"><button type="button" class="btn" data-close>' + esc(t.cancel) + '</button><button class="btn primary" type="submit">OK</button></div></div></form>');
}
