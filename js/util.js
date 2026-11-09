// Small helpers used everywhere. No dependencies, no side effects.

export const pad = n => String(n).padStart(2, "0");

/** "2026-11-09" for a Date, in local time. */
export const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
/** "08:30" for a Date. */
export const hm = d => pad(d.getHours()) + ":" + pad(d.getMinutes());
/** Day of the week with Monday = 0 … Sunday = 6. */
export const dow = d => (d.getDay() + 6) % 7;
/** "08:30" -> 510 minutes after midnight. */
export const toMin = t => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
/** 510 -> "08:30" (wraps around midnight). */
export const fromMin = m => pad(Math.floor((((m % 1440) + 1440) % 1440) / 60)) + ":" + pad(((m % 60) + 60) % 60);
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const daysBetween = (a, b) => Math.round((parseYmd(ymd(b)) - parseYmd(ymd(a))) / 86400000);
export const nowMinutes = (d = new Date()) => d.getHours() * 60 + d.getMinutes();

/**
 * Escapes text before it goes into HTML. Every value that comes from a user,
 * from the database or from Studio passes through here: this is what stops
 * someone from smuggling a <script> into a medicine name.
 */
export const esc = s => String(s == null ? "" : s).replace(/[&<>"'`]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" }[c]));

/** Fills {placeholders} in a translated string. Values are NOT escaped here. */
export const fmt = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] == null ? "" : o[k]));

/** Random id from the browser's cryptographic generator. */
export const uid = (n = 14) => {
  const a = "abcdefghijkmnpqrstuvwxyz23456789"; let s = "";
  crypto.getRandomValues(new Uint8Array(n)).forEach(x => { s += a[x % a.length]; });
  return s;
};

/** 8-character invite code without look-alike letters (no O/0, I/1, L). */
export const inviteCode = () => {
  const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let s = "";
  crypto.getRandomValues(new Uint8Array(8)).forEach(x => { s += a[x % a.length]; });
  return s;
};

export const entryKey = (medId, t) => medId + "_" + t.replace(":", "");
export const clone = o => JSON.parse(JSON.stringify(o));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Accepts only #RRGGBB colours: anything else is ignored before reaching CSS. */
export const isHex = c => typeof c === "string" && /^#[0-9a-fA-F]{6}$/.test(c);

/** Accepts only base64 images we produced ourselves (never SVG, which can carry script). */
export const isSafeImage = s => typeof s === "string" && /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(s);

/** WCAG relative luminance and contrast ratio, used to refuse unreadable colours. */
export function contrast(a, b) {
  const lum = hex => {
    const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** SHA-256 hex digest (used so the lock PIN is never stored in clear). */
export async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export const reducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Shrinks a photo in the browser before it is saved. Returns a data URL. */
export function compressImage(file, { max = 480, type = "image/jpeg", quality = 0.72, maxChars = Infinity } = {}) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.type || "image/jpeg")) { reject(new Error("bad_type")); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let side = max, q = quality, out = "";
      for (let i = 0; i < 6; i++) {
        const sc = Math.min(1, side / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * sc)); c.height = Math.max(1, Math.round(img.height * sc));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        out = c.toDataURL(type, q);
        if (!out.startsWith("data:" + type)) out = c.toDataURL("image/jpeg", q); // Safari has no WebP encoder
        if (out.length <= maxChars) break;
        side = Math.round(side * 0.8); q = Math.max(0.5, q - 0.07);
      }
      URL.revokeObjectURL(url);
      if (out.length > maxChars) reject(new Error("too_big")); else resolve({ src: out, w: img.width, h: img.height });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad_image")); };
    img.src = url;
  });
}

/** Triggers a download of text content. */
export function download(name, text, type = "application/json") {
  const blob = new Blob([text], { type }), url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
