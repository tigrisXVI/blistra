// Shared drawing pieces: icons, pills, avatars, the dialog layer and toasts.

import { esc, isHex, isSafeImage } from "./util.js";
import { L } from "./state.js";

const svg = (body, size = 24, cls = "") =>
  '<svg class="i ' + cls + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + "</svg>";

const PATHS = {
  today: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/><circle cx="12" cy="15" r="1.6" fill="currentColor" stroke="none"/>',
  circle: '<circle cx="9" cy="8.5" r="3.2"/><circle cx="17" cy="9.5" r="2.4"/><path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5M15.5 14.6c2.6-.3 4.7 1.2 5.3 4.4"/>',
  meds: '<rect x="2.8" y="8.2" width="18.4" height="7.6" rx="3.8" transform="rotate(-35 12 12)"/><path d="M9.6 8.6l4.8 6.8"/>',
  reminders: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l1.6 2H4.4z"/><path d="M10 21h4"/>',
  account: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1-3.8 4-5.6 7.5-5.6s6.5 1.8 7.5 5.6"/>',
  box: '<path d="M3.5 7.5L12 3.5l8.5 4v9L12 20.5l-8.5-4z"/><path d="M3.5 7.5L12 11.5l8.5-4M12 11.5v9"/>',
  rx: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.4"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
  alarm: '<circle cx="12" cy="13" r="7"/><path d="M12 9.5V13l2.4 1.6M4.5 5.5l3-2.2M19.5 5.5l-3-2.2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 13h9l1-13M9.5 7V4h5v3"/>',
  edit: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  studio: '<path d="M12 3l2.3 5.4 5.7.5-4.3 3.8 1.3 5.7L12 15.4 7 18.4l1.3-5.7L4 8.9l5.7-.5z"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5L6 19.5"/>',
  palette: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.6-2.2-.5-1.4.4-2.8 1.9-2.8H18a3 3 0 0 0 3-3c0-5-4-9-9-9z"/><circle cx="7.5" cy="11" r="1.1" fill="currentColor"/><circle cx="10.5" cy="7.5" r="1.1" fill="currentColor"/><circle cx="15" cy="7.8" r="1.1" fill="currentColor"/>',
  text: '<path d="M5 6.5V5h14v1.5M12 5v14M9 19h6"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5"/><path d="M16 5.5a3 3 0 0 1 0 6M18.5 14.5c1.4.7 2.3 2.4 2.5 5"/>',
  logout: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.6 3.4 5.4 3.4 8.5s-1 5.9-3.4 8.5c-2.4-2.6-3.4-5.4-3.4-8.5s1-5.9 3.4-8.5z"/>',
  layers: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8z"/><path d="M3.5 12l8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5"/>',
  shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/><path d="M8.8 12l2.2 2.2 4.3-4.4"/>',
  food: '<path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1.5-3 4-3 7h3v11"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/>'
};

export const icon = (name, size = 24, cls = "") => svg(PATHS[name] || PATHS.info, size, cls);

/** Flat drawing of a pill, used when no photo was taken. */
export function pillSVG(color, shape, size = 40) {
  const c = isHex(color) ? color : "#FFFFFF", s = "#3D4B5C";
  let body;
  if (shape === "capsule") body = '<rect x="4" y="13" width="32" height="14" rx="7" fill="' + c + '" stroke="' + s + '" stroke-width="1.5"/><path d="M20 13V27" stroke="' + s + '" stroke-width="1.5"/><path d="M11 13h9v14h-9a7 7 0 0 1 0-14z" fill="#fff" fill-opacity=".5"/>';
  else if (shape === "oval") body = '<ellipse cx="20" cy="20" rx="16" ry="10" fill="' + c + '" stroke="' + s + '" stroke-width="1.5"/><path d="M8 20H32" stroke="' + s + '" stroke-width="1.2" stroke-opacity=".5"/><ellipse cx="15" cy="16" rx="6" ry="2.4" fill="#fff" fill-opacity=".55"/>';
  else body = '<circle cx="20" cy="20" r="13" fill="' + c + '" stroke="' + s + '" stroke-width="1.5"/><path d="M20 9V31" stroke="' + s + '" stroke-width="1.2" stroke-opacity=".5"/><ellipse cx="15.5" cy="14.5" rx="4.5" ry="2.6" fill="#fff" fill-opacity=".6"/>';
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 40 40" aria-hidden="true">' + body + "</svg>";
}

/** The real photo when there is one (and it is a safe image), otherwise the drawing. */
export const medVisual = (m, size) =>
  isSafeImage(m.photo) ? '<img src="' + m.photo + '" alt="" loading="lazy" decoding="async">' : pillSVG(m.color, m.shape, size);

export function avatar(name, color, cls = "") {
  const c = isHex(color) ? color : "#4A5A70";
  return '<span class="av ' + cls + '" style="--c:' + c + '">' + esc((name || "?").trim().charAt(0).toUpperCase()) + "</span>";
}

/** The Blistra mark: a small blister with one pill already taken. */
export function brandMark(size = 34) {
  return '<svg class="mark" width="' + size + '" height="' + size + '" viewBox="0 0 40 40" aria-hidden="true">' +
    '<rect x="2.5" y="5" width="35" height="30" rx="9" fill="#CBD3DC"/><rect x="2.5" y="5" width="35" height="30" rx="9" fill="none" stroke="#8C98A6" stroke-opacity=".5"/>' +
    '<circle cx="13.5" cy="15" r="5.4" fill="#fff" stroke="#8C98A6" stroke-opacity=".6"/><circle cx="26.5" cy="15" r="5.4" fill="#fff" stroke="#8C98A6" stroke-opacity=".6"/>' +
    '<circle cx="13.5" cy="26" r="5.4" fill="var(--sun)" stroke="#8C98A6" stroke-opacity=".6"/><circle cx="26.5" cy="26" r="4.4" fill="#5E6B7A"/></svg>';
}

/** Drawing of an empty pocket (pill taken). */
export function emptyPocket(size = 72) {
  const pts = [];
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2, r = i % 2 ? 30 : 35; pts.push((40 + r * Math.cos(a)).toFixed(1) + "," + (40 + r * Math.sin(a)).toFixed(1)); }
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 80 80" aria-hidden="true"><polygon points="' + pts.join(" ") + '" fill="var(--hole)"/><circle cx="40" cy="40" r="24" fill="var(--hole-deep)"/><path d="M29 41l8 8 15-17" fill="none" stroke="var(--ok)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

/** Flat blister drawing shown when the device cannot do 3D. */
export function blisterFlat(pills) {
  const shapes = ["round", "capsule", "oval"];
  let g = "";
  for (let i = 0; i < 8; i++) {
    const x = 60 + (i % 4) * 92, y = 70 + Math.floor(i / 4) * 96;
    if (i === 3) {
      const pts = []; for (let k = 0; k < 20; k++) { const a = (k / 20) * Math.PI * 2, r = k % 2 ? 27 : 33; pts.push((x + r * Math.cos(a)).toFixed(1) + "," + (y + r * Math.sin(a)).toFixed(1)); }
      g += '<polygon points="' + pts.join(" ") + '" fill="#2A3140"/>';
    } else {
      g += '<circle cx="' + x + '" cy="' + y + '" r="35" fill="url(#bf-dome)" stroke="#AEB8C4"/><g transform="translate(' + (x - 24) + " " + (y - 24) + ') scale(1.2)">' + pillSVG(pills[i % pills.length], shapes[i % 3], 40).replace(/<\/?svg[^>]*>/g, "") + "</g>";
    }
  }
  return '<svg class="flat" viewBox="0 0 420 260" role="img" aria-label="Blister"><defs><linearGradient id="bf-foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F6F8"/><stop offset=".48" stop-color="#D3D9E0"/><stop offset=".52" stop-color="#FFFFFF"/><stop offset="1" stop-color="#B7C0CB"/></linearGradient><radialGradient id="bf-dome" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#EEF1F5" stop-opacity=".85"/><stop offset="1" stop-color="#B9C2CD"/></radialGradient></defs>' +
    '<g transform="rotate(-6 210 130)"><rect x="8" y="20" width="404" height="214" rx="24" fill="url(#bf-foil)" stroke="#A3AEBA"/><path d="M8 118H412" stroke="#A3AEBA" stroke-dasharray="3 5"/>' + g + "</g></svg>";
}

// ---- dialog layer ----------------------------------------------------------------

let lastFocus = null;
export function modal(html, { wide = false, label = "", keep = false } = {}) {
  const layer = document.getElementById("layer");
  if (!layer.firstChild) lastFocus = document.activeElement;
  // keep: the same dialog is being redrawn after a tap, so it must stay where the person was looking.
  const old = keep && layer.querySelector(".sheet");
  const top = old ? old.scrollTop : 0;
  layer.innerHTML = '<div class="scrim" data-close-bg><div class="sheet' + (wide ? " wide" : "") + '"' + (old ? ' style="animation:none"' : "") + ' role="dialog" aria-modal="true"' + (label ? ' aria-label="' + esc(label) + '"' : "") + ">" + html + "</div></div>";
  if (old) { layer.querySelector(".sheet").scrollTop = top; return; }
  const f = layer.querySelector("[autofocus], .sheet input:not([type=hidden]):not(.sr), .sheet select, .sheet button");
  if (f) f.focus({ preventScroll: true });
}
export function closeModal() {
  const layer = document.getElementById("layer");
  layer.innerHTML = "";
  delete layer.dataset.alarm;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  lastFocus = null;
}
export const modalOpen = () => !!document.querySelector("#layer .sheet");

/** Keeps Tab inside an open dialog. */
document.addEventListener("keydown", e => {
  if (e.key !== "Tab" || !modalOpen()) return;
  const items = [...document.querySelectorAll("#layer .sheet :is(a[href], button, input, select, textarea, [tabindex]):not([disabled]):not(.sr)")];
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); }
  else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
});

let toastTimer = null;
export function toast(msg, undo) {
  clearTimeout(toastTimer);
  const old = document.querySelector(".toast"); if (old) old.remove();
  const el = document.createElement("div");
  el.className = "toast"; el.setAttribute("role", "status");
  el.innerHTML = "<span>" + esc(msg) + "</span>" + (undo ? '<button data-untake="' + esc(undo.key) + '" data-med="' + esc(undo.med) + '" data-date="' + esc(undo.date) + '">' + esc(L().undo) + "</button>" : "");
  document.body.appendChild(el);
  toastTimer = setTimeout(() => el.remove(), 5500);
}
