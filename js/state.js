// The single source of truth for what is on screen.
//
// `A` holds the live data (who is signed in, the current circle, its medicines…).
// `prefs` holds choices that belong to this device only (language, lock mode…).
// Any module that changes A calls emit(); the screen is redrawn once per frame.

import { T } from "./i18n.js";

const PREF_KEY = "blistra.prefs.v3";
const OLD_PREF_KEY = "blistra.prefs.v2";

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY)) || JSON.parse(localStorage.getItem(OLD_PREF_KEY)) || {}; }
  catch (e) { return {}; }
}

export const prefs = Object.assign({
  lang: (navigator.language || "it").toLowerCase().startsWith("it") ? "it" : "en",
  demo: false,
  lock: null,          // { patientId, pinHash, salt } when this phone belongs to the person cared for
  alarms: false,
  lastFamily: null,
  patientId: null
}, loadPrefs());

// A PIN saved in clear by version 2 is dropped: the lock stays, without PIN.
if (prefs.lock && prefs.lock.pin !== undefined) { delete prefs.lock.pin; }

export function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { /* private mode */ } }

/** Current language pack. */
export const L = () => T[prefs.lang] || T.it;

export const A = {
  mode: null,          // "demo" | "cloud"
  loading: true,
  user: null,          // { uid, name, email, verified }
  isAdmin: false,
  familyIds: [],
  familyNames: {},
  family: null,
  familyLoading: false,
  meds: [],
  reminders: [],
  devices: [],         // pill boxes (Scatoletta Blistra) linked to the circle
  logs: {},
  error: ""
};

let queued = false;
let renderer = () => {};
export function onRender(fn) { renderer = fn; }
export function emit() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; renderer(); });
}
