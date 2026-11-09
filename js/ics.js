// Calendar file (.ics) with every dose and reminder, so the phone's own calendar
// can ring even when Blistra is closed and the screen is locked.

import { A, L } from "./state.js";
import { pad, ymd, dow, toMin, addDays, parseYmd } from "./util.js";
import { patientById } from "./domain.js";
import { toast } from "./ui.js";
import { VERSION } from "./config.js";

/* ================= calendar export ================= */
function icsEscape(s) { return String(s || "").replace(/[\\;,]/g, m => "\\" + m).replace(/\n/g, "\\n"); }
function icsDate(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00"; }
export function buildICS() {
  const t = L(), now = new Date(), lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Blistra//" + VERSION + "//IT", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Blistra"];
  const BY = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  A.meds.forEach(m => (m.times || []).forEach(tm => {
    const p = patientById(m.patientId); if (!p || !(m.days || []).length) return;
    let start = parseYmd(ymd(now)); const [h, mi] = tm.split(":").map(Number); start.setHours(h, mi, 0, 0);
    let g = 0; while (!m.days.includes(dow(start)) && g++ < 7) start = addDays(start, 1);
    const dl = (m.deadlines || {})[tm];
    lines.push("BEGIN:VEVENT", "UID:" + m.id + "-" + tm.replace(":", "") + "@blistra", "DTSTAMP:" + icsDate(now), "DTSTART:" + icsDate(start), "DURATION:PT15M",
      "RRULE:FREQ=WEEKLY;BYDAY=" + m.days.map(i => BY[i]).join(","), "SUMMARY:" + icsEscape(m.name + ", " + p.name), "DESCRIPTION:" + icsEscape(m.dose + (t.food[m.food] ? ". " + t.food[m.food] : "") + (m.note ? ". " + m.note : "")),
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(t.alarm_now + ": " + m.name), "TRIGGER:PT0M", "END:VALARM");
    if (dl && toMin(dl) > toMin(tm)) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(t.alarm_again + ": " + m.name), "TRIGGER:PT" + (toMin(dl) - toMin(tm)) + "M", "END:VALARM");
    lines.push("END:VEVENT");
  }));
  A.reminders.forEach(r => {
    if (!r.date || !r.time) return; const s = parseYmd(r.date); const [h, mi] = r.time.split(":").map(Number); s.setHours(h, mi, 0, 0);
    lines.push("BEGIN:VEVENT", "UID:rem-" + r.id + "@blistra", "DTSTAMP:" + icsDate(now), "DTSTART:" + icsDate(s), "DURATION:PT30M", "SUMMARY:" + icsEscape(r.title), "DESCRIPTION:" + icsEscape(r.note));
    if (r.repeat && r.repeat !== "none") lines.push("RRULE:FREQ=" + { daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY" }[r.repeat]);
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:" + icsEscape(r.title), "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
export function downloadICS() {
  try {
    const blob = new Blob([buildICS()], { type: "text/calendar" }), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "blistra.ics"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    if (window.self !== window.top) toast(L().calendar_fail);
  } catch (e) { toast(L().calendar_fail); }
}
