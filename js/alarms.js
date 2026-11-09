// Alarms while Blistra is open: a tone, vibration and a full-screen card at
// medicine time, and again at the deadline if the dose is still not marked.

import { A, prefs, L } from "./state.js";
import { esc, ymd, hm, toMin } from "./util.js";
import { patients, patientById, dosesFor, logFor, remindersOn } from "./domain.js";
import { modal, closeModal, medVisual, icon } from "./ui.js";

/* ================= alarms ================= */
let audioCtx = null, ringTimer = null;
const RUNG_KEY = "blistra.rung";
function rungGet() { try { const r = JSON.parse(localStorage.getItem(RUNG_KEY)) || {}; if (r.d !== ymd(new Date())) return { d: ymd(new Date()), k: {} }; return r; } catch (e) { return { d: ymd(new Date()), k: {} }; } }
function rungSet(k) { const r = rungGet(); r.k[k] = 1; try { localStorage.setItem(RUNG_KEY, JSON.stringify(r)); } catch (e) { } }
export function unlockAudio() { try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); } catch (e) { } }
function beepLoop() {
  stopBeep(); if (!audioCtx) return; let n = 0;
  const once = () => { try { [0, 0.25, 0.5].forEach(off => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = "sine"; o.frequency.value = off === 0.25 ? 988 : 784; g.gain.setValueAtTime(0.0001, audioCtx.currentTime + off); g.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + off + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + off + 0.22); o.connect(g).connect(audioCtx.destination); o.start(audioCtx.currentTime + off); o.stop(audioCtx.currentTime + off + 0.25); }); } catch (e) { } if (++n > 40) stopBeep(); };
  once(); ringTimer = setInterval(once, 1500);
}
function stopBeep() { if (ringTimer) { clearInterval(ringTimer); ringTimer = null; } }
function vibrate() { try { navigator.vibrate && navigator.vibrate([400, 200, 400, 200, 400]); } catch (e) { } }
function notify(title, body) { try { if ("Notification" in window && Notification.permission === "granted" && document.hidden) new Notification(title, { body, icon: "img/icon-192.png", tag: "blistra-" + title, requireInteraction: true }); } catch (e) { } }
export const snoozes = {};
export function ring(kind, payload) {
  const t = L();
  beepLoop(); vibrate();
  if (kind === "rem") {
    notify(t.alarm_rem, payload.r.title);
    document.getElementById("layer").dataset.alarm = "1";
    modal('<div class="alarm-card">' + icon("alarm", 44) + '<p class="now-tag">' + esc(t.alarm_rem) + '</p><h2 class="clearbig">' + esc(payload.r.title) + '</h2>' + (payload.r.note ? '<p class="muted">' + esc(payload.r.note) + '</p>' : "") + '<button class="btn take" data-alarm-ok>OK</button><button class="btn ghost" data-snooze="rem:' + esc(payload.r.id) + '">' + esc(t.snooze) + '</button></div>', { label: t.alarm_rem });
    return;
  }
  const d = payload.dose, p = patientById(d.m.patientId) || { name: "" }, again = kind === "again";
  const title = again ? t.alarm_again : t.alarm_now;
  notify(title + " · " + p.name, d.m.name + " · " + d.m.dose);
  document.getElementById("layer").dataset.alarm = "1";
  modal('<div class="alarm-card ' + (again ? "late" : "due") + '"><p class="now-tag"><span class="dot"></span>' + esc(title + ", " + p.name) + '</p><div class="disc">' + medVisual(d.m, 74) + '</div><h2 class="clearbig">' + esc(d.m.name) + '</h2><p class="dose">' + esc(d.m.dose) + (t.food[d.m.food] ? ", " + esc(t.food[d.m.food].toLowerCase()) : "") + '</p>' +
    '<button class="btn take" data-take="' + esc(d.key) + '" data-med="' + esc(d.m.id) + '" data-alarm-ok>' + icon("check", 30) + '<span>' + esc(t.taken_btn.replace(" ✓", "")) + '</span></button><button class="btn ghost" data-snooze="dose:' + esc(d.key) + '">' + esc(t.snooze) + '</button></div>', { label: title });
}
function alarmPatients() { if (prefs.lock) return [prefs.lock.patientId]; return prefs.alarms ? patients().map(p => p.id) : []; }
export function checkAlarms() {
  if (!A.family || (!prefs.alarms && !prefs.lock)) return;
  if (document.querySelector("#layer .sheet")) return;
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), rung = rungGet().k;
  for (const pid of alarmPatients()) {
    for (const d of dosesFor(now, pid)) {
      if (!d.m.alarm || logFor(d.date, d.key)) continue;
      const t = toMin(d.t), dl = d.deadline ? toMin(d.deadline) : null, sz = snoozes["dose:" + d.key];
      if (sz && Date.now() >= sz) { delete snoozes["dose:" + d.key]; ring("now", { dose: d }); return; }
      if (sz) continue;
      if (nowMin >= t && nowMin < t + 30 && !rung[d.key + "#1"]) { rungSet(d.key + "#1"); ring("now", { dose: d }); return; }
      if (dl != null && nowMin >= dl && nowMin < dl + 30 && !rung[d.key + "#2"]) { rungSet(d.key + "#2"); ring("again", { dose: d }); return; }
    }
  }
  for (const x of remindersOn(now)) {
    if (!x.r.alarm) continue; const k = "rem_" + x.r.id + "_" + hm(x.at), m = x.at.getHours() * 60 + x.at.getMinutes(), sz = snoozes["rem:" + x.r.id];
    if (sz && Date.now() >= sz) { delete snoozes["rem:" + x.r.id]; ring("rem", x); return; }
    if (!sz && nowMin >= m && nowMin < m + 30 && !rung[k]) { rungSet(k); ring("rem", x); return; }
  }
}
export function dismissAlarm() { stopBeep(); closeModal(); }
