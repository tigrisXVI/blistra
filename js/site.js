// Content and look of the public project page.
//
// The defaults below are what the page shows out of the box. The administrator
// can change any of them from Studio: the changes are saved in site/public and
// media/{id}, which everyone can read and only the administrator can write.
//
// Whatever comes from the database is treated as untrusted: sanitizeSite()
// keeps only known fields, cuts long texts and accepts only #RRGGBB colours,
// and every text is escaped again when it is drawn.

import { firebase } from "./firebase.js";
import { emit } from "./state.js";
import { isHex, isSafeImage, contrast, clone } from "./util.js";

const IT = {
  heroTitle: "Ha preso le pastiglie stamattina?",
  heroLead: "Blistra è un'app gratuita per le famiglie che seguono le terapie di una persona anziana. Chi ha preso cosa, quando ricomprare, quando rinnovare la ricetta: lo vedete tutti, in tempo reale.",
  ctaApp: "Inizia gratis",
  ctaDemo: "Prova la demo",
  heroHint: "Tocca una pillola nel blister.",
  bannerText: "",
  problemTitle: "Il problema",
  problemText: "Molte persone anziane prendono più farmaci al giorno, spesso vivendo da sole e lontano dai figli. Le domande sono sempre le stesse: l'ha presa? L'ha presa due volte? La scatola sta finendo? La ricetta è ancora valida?\n\nBlistra divide il lavoro. I familiari si organizzano insieme in una cerchia; chi prende i farmaci vede soltanto una schermata grande e chiara, con un pulsante.",
  stats: [
    { n: "68,1%", t: "degli over 65 in Italia ha ricevuto nel 2024 prescrizioni di almeno 5 principi attivi diversi." },
    { n: "28,3%", t: "ne ha ricevuti 10 o più." },
    { n: "1 su 2", t: "pazienti con una terapia cronica la segue come prescritto nei Paesi ad alto reddito: l'aderenza media, secondo l'OMS, è intorno al 50%." }
  ],
  statsSource: "Fonti: AIFA, Rapporto OsMed 2024 (ripreso da AGI, novembre 2025); OMS, Adherence to long-term therapies: evidence for action (2003).",
  featuresTitle: "Cosa fa",
  features: [
    { t: "Cerchia di famiglia", d: "Ogni familiare entra con il proprio account e un codice invito. Tutti vedono chi ha preso cosa, e quando." },
    { t: "Sveglie che insistono", d: "Suona all'ora del farmaco e suona di nuovo se la dose non è segnata entro l'orario limite." },
    { t: "Scorte sotto controllo", d: "Ogni dose presa scala la scatola: Blistra avvisa qualche giorno prima che finisca." },
    { t: "Ricette", d: "Medico e scadenza di ogni ricetta, con un avviso prima che scada." },
    { t: "Schede in parole semplici", d: "A cosa serve, come si prende, quando chiamare il medico. Con il link al foglio illustrativo ufficiale AIFA." },
    { t: "Il telefono del nonno", d: "Il telefono della persona assistita può mostrare solo la sua giornata: un blister, un pulsante grande, nient'altro." }
  ],
  galleryTitle: "Dal progetto",
  galleryText: "",
  roadTitle: "Versioni e prossimi passi",
  road: [
    { t: "Prototipo", d: "Una persona, un dispositivo.", done: true },
    { t: "Cerchie di famiglia", d: "Account, codici invito, scorte, ricette, promemoria e sveglie.", done: true },
    { t: "Versione 3", d: "Nuova interfaccia, pagina del progetto gestibile, sicurezza rinforzata e privacy a norma GDPR.", done: true },
    { t: "Revisione di un farmacista", d: "Controllo delle schede semplificate e dei messaggi.", done: false },
    { t: "Prova con famiglie vere", d: "Osservare l'uso reale e correggere quello che confonde.", done: false },
    { t: "Il braccialetto", d: "Un braccialetto collegato all'app che vibra al polso quando è ora della medicina.", done: false }
  ],
  limitsTitle: "Limiti",
  limitsText: "Blistra è un progetto studentesco, non un dispositivo medico. Non controlla interazioni né dosaggi e non sostituisce medico o farmacista. Le schede semplificate sono riassunti generali, da far verificare a un farmacista.",
  contactTitle: "Contatti"
};

const EN = {
  heroTitle: "Did she take her pills this morning?",
  heroLead: "Blistra is a free app for families who look after an older person's medicines. Who took what, when to buy more, when to renew the prescription: everyone sees it, in real time.",
  ctaApp: "Start for free",
  ctaDemo: "Try the demo",
  heroHint: "Tap a pill in the blister pack.",
  bannerText: "",
  problemTitle: "The problem",
  problemText: "Many older people take several medicines a day, often living alone and far from their children. The questions never change: did she take it? Did she take it twice? Is the box running out? Is the prescription still valid?\n\nBlistra splits the job. Family members organise together in a circle; the person taking the medicines only sees one large, clear screen with one button.",
  stats: [
    { n: "68.1%", t: "of Italians over 65 were prescribed 5 or more different active substances in 2024." },
    { n: "28.3%", t: "were prescribed 10 or more." },
    { n: "1 in 2", t: "patients on a long-term therapy follow it as prescribed in high-income countries: average adherence, according to the WHO, is around 50%." }
  ],
  statsSource: "Sources: AIFA, OsMed Report 2024 (as reported by AGI, November 2025); WHO, Adherence to long-term therapies: evidence for action (2003).",
  featuresTitle: "What it does",
  features: [
    { t: "Family circle", d: "Each family member joins with their own account and an invite code. Everyone sees who took what, and when." },
    { t: "Alarms that insist", d: "Rings at medicine time, and rings again if the dose is not marked by the deadline." },
    { t: "Stock under control", d: "Every dose taken counts down the box: Blistra warns you a few days before it runs out." },
    { t: "Prescriptions", d: "Doctor and expiry date of each prescription, with a warning before it expires." },
    { t: "Plain-language sheets", d: "What it is for, how to take it, when to call the doctor. With a link to the official AIFA leaflet." },
    { t: "Grandpa's phone", d: "The phone of the person cared for can show only their day: a blister pack, one big button, nothing else." }
  ],
  galleryTitle: "From the project",
  galleryText: "",
  roadTitle: "Versions and next steps",
  road: [
    { t: "Prototype", d: "One person, one device.", done: true },
    { t: "Family circles", d: "Accounts, invite codes, stock, prescriptions, reminders and alarms.", done: true },
    { t: "Version 3", d: "New interface, editable project page, stronger security and GDPR-compliant privacy.", done: true },
    { t: "Pharmacist review", d: "Checking the simplified sheets and messages.", done: false },
    { t: "Testing with real families", d: "Watching real use and fixing what confuses people.", done: false },
    { t: "The bracelet", d: "A bracelet linked to the app that vibrates on the wrist when it is medicine time.", done: false }
  ],
  limitsTitle: "Limits",
  limitsText: "Blistra is a student project, not a medical device. It does not check interactions or doses and does not replace a doctor or pharmacist. The simplified sheets are general summaries, to be checked by a pharmacist.",
  contactTitle: "Contact"
};

export const DEFAULT_SITE = {
  v: 1,
  look: {
    accent: "#2C55D6",      // buttons and links
    hero: "#13294B",        // background of the top band
    sun: "#FFC93C",         // "take it now" highlight
    pills: ["#FFC93C", "#F59AB8", "#FFFFFF", "#5ED3A6"],
    spin: 1,                // speed of the 3D scene, 0 = still
    hero3d: true,           // false = show heroImage (or the flat drawing) instead of the 3D blister
    heroImage: "",          // id of an image in media/
    motion: true            // false = no decorative animation anywhere
  },
  sections: { banner: false, stats: true, features: true, gallery: true, roadmap: true },
  banner: { tone: "info" }, // info | warn
  texts: { it: IT, en: EN },
  updatedBy: ""
};

const LIMIT = { short: 90, mid: 260, long: 1600 };
const FIELD_LIMIT = {
  heroTitle: LIMIT.short, heroLead: LIMIT.mid * 2, ctaApp: 40, ctaDemo: 40, heroHint: LIMIT.short, bannerText: LIMIT.mid,
  problemTitle: LIMIT.short, problemText: LIMIT.long, statsSource: LIMIT.mid, featuresTitle: LIMIT.short,
  galleryTitle: LIMIT.short, galleryText: LIMIT.mid, roadTitle: LIMIT.short, limitsTitle: LIMIT.short, limitsText: LIMIT.long, contactTitle: 40
};

const str = (v, max, fallback) => (typeof v === "string" ? v.slice(0, max) : fallback);

/** Keeps only known fields, with the right types and lengths. Never throws. */
export function sanitizeSite(raw) {
  const out = clone(DEFAULT_SITE);
  if (!raw || typeof raw !== "object") return out;
  const lk = raw.look || {};
  for (const k of ["accent", "hero", "sun"]) if (isHex(lk[k])) out.look[k] = lk[k];
  if (Array.isArray(lk.pills)) out.look.pills = out.look.pills.map((c, i) => (isHex(lk.pills[i]) ? lk.pills[i] : c));
  if (typeof lk.spin === "number" && lk.spin >= 0 && lk.spin <= 3) out.look.spin = lk.spin;
  for (const k of ["hero3d", "motion"]) if (typeof lk[k] === "boolean") out.look[k] = lk[k];
  out.look.heroImage = str(lk.heroImage, 40, "");
  const sec = raw.sections || {};
  for (const k of Object.keys(out.sections)) if (typeof sec[k] === "boolean") out.sections[k] = sec[k];
  if (raw.banner && ["info", "warn"].includes(raw.banner.tone)) out.banner.tone = raw.banner.tone;
  for (const lang of ["it", "en"]) {
    const src = (raw.texts || {})[lang] || {}, dst = out.texts[lang];
    for (const k of Object.keys(FIELD_LIMIT)) dst[k] = str(src[k], FIELD_LIMIT[k], dst[k]);
    if (Array.isArray(src.stats)) dst.stats = src.stats.slice(0, 4).map(s => ({ n: str(s && s.n, 20, ""), t: str(s && s.t, LIMIT.mid, "") }));
    if (Array.isArray(src.features)) dst.features = src.features.slice(0, 8).map(s => ({ t: str(s && s.t, LIMIT.short, ""), d: str(s && s.d, LIMIT.mid, "") }));
    if (Array.isArray(src.road)) dst.road = src.road.slice(0, 10).map(s => ({ t: str(s && s.t, LIMIT.short, ""), d: str(s && s.d, LIMIT.mid, ""), done: !!(s && s.done) }));
  }
  out.updatedBy = str(raw.updatedBy, 40, "");
  return out;
}

export function sanitizeMedia(id, raw) {
  if (!raw || !isSafeImage(raw.src)) return null;
  return { id, src: raw.src, alt: str(raw.alt, 160, ""), caption: str(raw.caption, 200, ""), order: typeof raw.order === "number" ? raw.order : 0,
    w: typeof raw.w === "number" ? raw.w : 0, h: typeof raw.h === "number" ? raw.h : 0, inGallery: raw.inGallery !== false };
}

/** Live site content. `site.data` is what the page shows; Studio may set a draft. */
export const site = { data: clone(DEFAULT_SITE), media: [], loaded: false, draft: null };

/** What to draw right now: the Studio draft if one is open, otherwise the published content. */
export const current = () => site.draft || site.data;

/** Applies colours and the motion switch to the whole page. */
export function applyLook(look = current().look) {
  const r = document.documentElement.style;
  r.setProperty("--accent", look.accent);
  r.setProperty("--accent-ink", contrast(look.accent, "#FFFFFF") >= 4.5 ? "#FFFFFF" : "#13294B");
  r.setProperty("--hero", look.hero);
  r.setProperty("--sun", look.sun);
  document.documentElement.dataset.motion = look.motion ? "on" : "off";
}

let started = false;
/** Starts listening to site/public and media/. Falls back silently to the defaults. */
export async function loadSite() {
  if (started) return; started = true;
  applyLook();
  try {
    const { db, fs } = await firebase();
    fs.onSnapshot(fs.doc(db, "site", "public"), s => {
      site.data = sanitizeSite(s.exists() ? s.data() : null);
      site.loaded = true;
      if (!site.draft) applyLook();
      emit();
    }, e => { console.warn("site", e.code || e); site.loaded = true; emit(); });
    fs.onSnapshot(fs.collection(db, "media"), qs => {
      site.media = qs.docs.map(d => sanitizeMedia(d.id, d.data())).filter(Boolean).sort((a, b) => a.order - b.order);
      emit();
    }, e => console.warn("media", e.code || e));
  } catch (e) {
    console.warn("site offline", e);
    site.loaded = true; emit();
  }
}

export const mediaById = id => site.media.find(m => m.id === id) || null;
