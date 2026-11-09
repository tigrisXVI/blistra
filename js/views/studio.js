// Studio: where the administrator changes the public page without touching code.
//
// Changes are made on a draft (site.draft) and shown live in the preview.
// Nothing reaches visitors until "Pubblica" is pressed. Images are the exception:
// each one is saved as soon as it is uploaded, because it is its own document.
//
// Studio is visible only to accounts with an admins/{uid} document, and the
// database rules refuse writes to site/ and media/ from anyone else, so hiding
// the page is a convenience, not the protection.

import { esc, clone, isHex, contrast, compressImage, download } from "../util.js";
import { site, current, applyLook, sanitizeSite, DEFAULT_SITE } from "../site.js";
import { icon, toast } from "../ui.js";
import { heroBlock } from "./landing.js";
import { ADMIN_NAME, LIMITS } from "../config.js";

export const studio = { tab: "texts", lang: "it", users: null, usersErr: "", filter: "", busy: false, armedReset: false };

const PRESETS = [
  { name: "Notte e sole", accent: "#2C55D6", hero: "#13294B", sun: "#FFC93C" },
  { name: "Farmacia", accent: "#0E7A57", hero: "#0B3B2E", sun: "#FFD25A" },
  { name: "Lavanda", accent: "#5B3FC4", hero: "#24194F", sun: "#FFB86B" },
  { name: "Oceano", accent: "#0B6E99", hero: "#0A2F44", sun: "#FFD166" },
  { name: "Inchiostro", accent: "#B4235A", hero: "#1D1B2F", sun: "#7FE3C0" }
];

export function openStudio() {
  if (!site.draft) { site.draft = clone(site.data); studio.armedReset = false; }
}
export function closeStudio() { site.draft = null; applyLook(); }

export const dirty = () => site.draft && JSON.stringify(stripMeta(site.draft)) !== JSON.stringify(stripMeta(site.data));
const stripMeta = s => { const c = clone(s); delete c.updatedBy; delete c.updatedAt; return c; };

// ---- reading and writing draft fields by path ("texts.it.features.0.t") --------------------

export function getPath(obj, path) { return path.split(".").reduce((o, k) => (o == null ? o : o[k]), obj); }
export function setPath(obj, path, val) {
  const ks = path.split("."), last = ks.pop();
  const target = ks.reduce((o, k) => o[k], obj);
  target[last] = val;
}

/** Problems that block publishing, in plain words. */
export function checkDraft(s) {
  const out = [], lk = s.look;
  if (!isHex(lk.accent) || contrast(lk.accent, "#FFFFFF") < 4.5) out.push("Il colore dei pulsanti è troppo chiaro: il testo bianco sopra non si legge bene. Scegline uno più scuro.");
  if (!isHex(lk.hero) || contrast(lk.hero, "#FFFFFF") < 7) out.push("Lo sfondo in alto è troppo chiaro per il testo bianco. Scegline uno più scuro.");
  if (!isHex(lk.sun) || contrast(lk.sun, lk.hero) < 3) out.push("Il colore di evidenza si confonde con lo sfondo in alto. Scegline uno più luminoso.");
  for (const lang of ["it", "en"]) if (!s.texts[lang].heroTitle.trim()) out.push("Manca il titolo principale (" + lang.toUpperCase() + ").");
  if (!lk.hero3d && lk.heroImage && !site.media.some(m => m.id === lk.heroImage)) out.push("L'immagine scelta per la parte alta non esiste più.");
  return out;
}

// ---- form pieces ----------------------------------------------------------------------------

const field = (label, path, { long = false, max = 200, hint = "" } = {}) => {
  const v = getPath(site.draft, path) || "";
  return '<label class="f">' + esc(label) + (long
    ? '<textarea data-k="' + path + '" maxlength="' + max + '" rows="' + Math.min(10, Math.max(3, Math.ceil(v.length / 60))) + '">' + esc(v) + "</textarea>"
    : '<input type="text" data-k="' + path + '" maxlength="' + max + '" value="' + esc(v) + '">') + (hint ? '<small class="hint">' + esc(hint) + "</small>" : "") + "</label>";
};
const toggle = (label, path, hint = "") => '<label class="switch"><input type="checkbox" data-k="' + path + '"' + (getPath(site.draft, path) ? " checked" : "") + '><span class="track" aria-hidden="true"></span><span>' + esc(label) + (hint ? '<small class="hint">' + esc(hint) + "</small>" : "") + "</span></label>";
const color = (label, path) => {
  const v = getPath(site.draft, path);
  return '<label class="color-f"><input type="color" data-k="' + path + '" value="' + esc(v) + '"><span>' + esc(label) + '<small class="num">' + esc(v.toUpperCase()) + "</small></span></label>";
};
const group = (title, body, ico) => '<section class="st-group"><h3>' + (ico ? icon(ico, 20) : "") + esc(title) + "</h3>" + body + "</section>";
const listTools = (list, i, n) => '<div class="list-tools">' +
  '<button type="button" class="icon-btn" data-list-move="' + list + '" data-i="' + i + '" data-dir="-1" aria-label="Sposta su"' + (i === 0 ? " disabled" : "") + ">" + icon("chevron", 18, "up") + "</button>" +
  '<button type="button" class="icon-btn" data-list-move="' + list + '" data-i="' + i + '" data-dir="1" aria-label="Sposta giù"' + (i === n - 1 ? " disabled" : "") + ">" + icon("chevron", 18, "down") + "</button>" +
  '<button type="button" class="icon-btn danger" data-list-del="' + list + '" data-i="' + i + '" aria-label="Elimina">' + icon("trash", 18) + "</button></div>";

function tabTexts() {
  const L = studio.lang, p = k => "texts." + L + "." + k, tx = site.draft.texts[L];
  return '<div class="seg small" role="group" aria-label="Lingua dei testi"><button data-st-lang="it" aria-pressed="' + (L === "it") + '">Italiano</button><button data-st-lang="en" aria-pressed="' + (L === "en") + '">English</button></div>' +
    group("Parte alta", field("Titolo", p("heroTitle"), { max: 90 }) + field("Sottotitolo", p("heroLead"), { long: true, max: 520 }) +
      '<div class="grid2">' + field("Pulsante principale", p("ctaApp"), { max: 40 }) + field("Pulsante demo", p("ctaDemo"), { max: 40 }) + "</div>" + field("Invito sotto il blister 3D", p("heroHint"), { max: 90 }), "text") +
    group("Avviso in cima alla pagina", toggle("Mostra l'avviso", "sections.banner") + field("Testo dell'avviso", p("bannerText"), { max: 260, hint: "Per esempio: «Cerchiamo famiglie per provare Blistra a dicembre»." }) +
      '<div class="seg small" role="group" aria-label="Tipo di avviso"><button data-banner-tone="info" aria-pressed="' + (site.draft.banner.tone === "info") + '">Informazione</button><button data-banner-tone="warn" aria-pressed="' + (site.draft.banner.tone === "warn") + '">Importante</button></div>', "info") +
    group("Il problema", field("Titolo", p("problemTitle"), { max: 90 }) + field("Testo", p("problemText"), { long: true, max: 1600, hint: "Lascia una riga vuota per andare a capo con un nuovo paragrafo." }), "text") +
    group("Numeri", tx.stats.map((s, i) => '<div class="list-item">' + '<div class="grid-n">' + field("Numero", p("stats." + i + ".n"), { max: 20 }) + field("Spiegazione", p("stats." + i + ".t"), { max: 260 }) + "</div>" + listTools("stats", i, tx.stats.length) + "</div>").join("") +
      (tx.stats.length < 4 ? '<button type="button" class="btn sm ghost" data-list-add="stats">' + icon("plus", 16) + "Aggiungi un numero</button>" : "") + field("Fonti", p("statsSource"), { long: true, max: 260 }), "layers") +
    group("Cosa fa", field("Titolo", p("featuresTitle"), { max: 90 }) + tx.features.map((f, i) => '<div class="list-item">' + field("Funzione " + (i + 1), p("features." + i + ".t"), { max: 90 }) + field("Descrizione", p("features." + i + ".d"), { long: true, max: 260 }) + listTools("features", i, tx.features.length) + "</div>").join("") +
      (tx.features.length < 8 ? '<button type="button" class="btn sm ghost" data-list-add="features">' + icon("plus", 16) + "Aggiungi una funzione</button>" : ""), "layers") +
    group("Galleria", field("Titolo", p("galleryTitle"), { max: 90 }) + field("Testo sopra le immagini (facoltativo)", p("galleryText"), { long: true, max: 260 }), "image") +
    group("Versioni e prossimi passi", field("Titolo", p("roadTitle"), { max: 90 }) + tx.road.map((r, i) => '<div class="list-item">' + field("Tappa " + (i + 1), p("road." + i + ".t"), { max: 90 }) + field("Descrizione", p("road." + i + ".d"), { long: true, max: 260 }) + toggle("Completata", p("road." + i + ".done")) + listTools("road", i, tx.road.length) + "</div>").join("") +
      (tx.road.length < 10 ? '<button type="button" class="btn sm ghost" data-list-add="road">' + icon("plus", 16) + "Aggiungi una tappa</button>" : ""), "calendar") +
    group("Limiti e contatti", field("Titolo dei limiti", p("limitsTitle"), { max: 90 }) + field("Testo dei limiti", p("limitsText"), { long: true, max: 1600 }) + field("Titolo dei contatti", p("contactTitle"), { max: 40 }), "shield");
}

function tabLook() {
  const lk = site.draft.look, imgs = site.media;
  const presets = '<div class="presets">' + PRESETS.map((x, i) => '<button type="button" class="preset" data-preset="' + i + '" aria-pressed="' + (lk.accent === x.accent && lk.hero === x.hero && lk.sun === x.sun) + '"><span class="sw3"><i style="--c:' + x.hero + '"></i><i style="--c:' + x.accent + '"></i><i style="--c:' + x.sun + '"></i></span>' + esc(x.name) + "</button>").join("") + "</div>";
  const problems = checkDraft(site.draft).filter(x => !x.startsWith("Manca"));
  return group("Colori", presets + '<div class="colors">' + color("Pulsanti e link", "look.accent") + color("Sfondo in alto", "look.hero") + color("Evidenza (ora di prendere)", "look.sun") + "</div>" +
      (problems.length ? '<ul class="st-warn">' + problems.map(x => "<li>" + icon("alarm", 18) + esc(x) + "</li>").join("") + "</ul>" : '<p class="ok-line">' + icon("check", 18) + "Contrasto leggibile anche per chi vede poco.</p>"), "palette") +
    group("Immagine in alto", toggle("Blister in 3D interattivo", "look.hero3d", "Se lo spegni, in alto compare l'immagine scelta qui sotto oppure il disegno del blister.") +
      (lk.hero3d ? '<label class="f">Velocità del movimento<input type="range" min="0" max="2" step="0.25" data-k="look.spin" value="' + lk.spin + '"><small class="hint">A sinistra il blister resta fermo.</small></label>' +
        '<div class="colors">' + lk.pills.map((c, i) => color("Pillola " + (i + 1), "look.pills." + i)).join("") + "</div>"
        : '<label class="f">Immagine da mostrare<select data-k="look.heroImage"><option value="">Disegno del blister</option>' + imgs.map(m => '<option value="' + esc(m.id) + '"' + (lk.heroImage === m.id ? " selected" : "") + ">" + esc(m.alt || m.caption || m.id) + "</option>").join("") + "</select>" +
          (imgs.length ? "" : '<small class="hint">Carica prima un\'immagine nella scheda Immagini.</small>') + "</label>"), "cube") +
    group("Movimento", toggle("Animazioni decorative", "look.motion", "Chi ha attivato «riduci movimento» sul telefono non le vede comunque."), "layers") +
    group("Sezioni visibili", toggle("Numeri", "sections.stats") + toggle("Cosa fa", "sections.features") + toggle("Galleria di immagini", "sections.gallery") + toggle("Versioni e prossimi passi", "sections.roadmap"), "layers");
}

function tabImages() {
  const imgs = site.media, lk = site.draft.look;
  return '<p class="muted">Le immagini si salvano subito, anche senza premere Pubblica. Vengono ridotte e compresse nel browser prima di partire. Massimo ' + LIMITS.siteImages + ".</p>" +
    (imgs.length < LIMITS.siteImages ? '<label class="drop" for="st-upload">' + icon("image", 34) + '<b>Carica immagini</b><span class="muted">JPG, PNG o WebP. Trascinale qui o tocca per sceglierle.</span><input type="file" id="st-upload" accept="image/jpeg,image/png,image/webp" multiple class="sr"></label>' : "") +
    (studio.busy ? '<p class="muted" role="status">Caricamento in corso…</p>' : "") +
    '<ul class="media-list">' + imgs.map((m, i) => '<li class="media"><img src="' + m.src + '" alt="">' +
      '<div class="media-body"><label class="f">Descrizione per chi non vede l\'immagine<input type="text" data-media="' + esc(m.id) + '" data-mk="alt" value="' + esc(m.alt) + '" maxlength="160" placeholder="Per esempio: la schermata Oggi su un telefono">' + (m.alt ? "" : '<small class="err">Aggiungila: senza descrizione chi usa un lettore di schermo non sa cosa c\'è.</small>') + "</label>" +
      '<label class="f">Didascalia (facoltativa)<input type="text" data-media="' + esc(m.id) + '" data-mk="caption" value="' + esc(m.caption) + '" maxlength="200"></label>' +
      '<div class="btn-row"><label class="switch"><input type="checkbox" data-media="' + esc(m.id) + '" data-mk="inGallery"' + (m.inGallery ? " checked" : "") + '><span class="track" aria-hidden="true"></span><span>Nella galleria</span></label>' +
      '<button type="button" class="btn sm' + (!lk.hero3d && lk.heroImage === m.id ? " primary" : "") + '" data-hero-image="' + esc(m.id) + '">' + (!lk.hero3d && lk.heroImage === m.id ? "In alto (bozza)" : "Usa in alto") + "</button>" +
      '<button type="button" class="icon-btn" data-media-move="' + esc(m.id) + '" data-dir="-1" aria-label="Sposta prima"' + (i === 0 ? " disabled" : "") + ">" + icon("chevron", 18, "up") + "</button>" +
      '<button type="button" class="icon-btn" data-media-move="' + esc(m.id) + '" data-dir="1" aria-label="Sposta dopo"' + (i === imgs.length - 1 ? " disabled" : "") + ">" + icon("chevron", 18, "down") + "</button>" +
      '<button type="button" class="icon-btn danger" data-media-del="' + esc(m.id) + '" aria-label="Elimina immagine">' + icon("trash", 18) + "</button></div></div></li>").join("") + "</ul>";
}

function tabUsers() {
  if (studio.usersErr) return '<p class="err">' + esc(studio.usersErr) + "</p>";
  if (!studio.users) return '<p class="muted" role="status">Caricamento iscritti…</p>';
  const q = studio.filter.trim().toLowerCase();
  const list = studio.users.filter(u => !q || (u.name + " " + u.email).toLowerCase().includes(q)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const week = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const active = studio.users.filter(u => u.lastSeen && u.lastSeen >= week).length;
  const d = x => (x ? x.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" }) : "");
  return '<div class="kpis"><p><b class="num">' + studio.users.length + "</b> iscritti</p><p><b class=\"num\">" + active + "</b> attivi negli ultimi 7 giorni</p><p><b class=\"num\">" + studio.users.filter(u => u.circles > 0).length + "</b> in almeno una cerchia</p></div>" +
    '<p class="muted">' + icon("shield", 16) + "Vedi solo nome, email e date. Farmaci, dosi e promemoria delle famiglie restano privati anche per te: lo impongono le regole del database.</p>" +
    '<div class="row-between"><label class="f grow">Cerca<input type="search" id="st-filter" value="' + esc(studio.filter) + '" placeholder="Nome o email"></label><button class="btn sm" data-users-csv>' + icon("download", 16) + "Scarica CSV</button></div>" +
    '<div class="tablewrap"><table class="users"><thead><tr><th>Nome</th><th>Email</th><th>Iscritto</th><th>Ultimo accesso</th><th>Cerchie</th></tr></thead><tbody>' +
    list.map(u => "<tr><td>" + esc(u.name) + "</td><td>" + esc(u.email) + '</td><td class="num">' + esc(d(u.createdAt)) + '</td><td class="num">' + esc(u.lastSeen) + '</td><td class="num">' + u.circles + "</td></tr>").join("") + "</tbody></table></div>";
}

export function previewHTML() {
  const s = site.draft, tx = s.texts[studio.lang];
  const banner = s.sections.banner && tx.bannerText ? '<div class="banner ' + (s.banner.tone === "warn" ? "warn" : "") + '">' + icon(s.banner.tone === "warn" ? "alarm" : "info", 20) + "<span>" + esc(tx.bannerText) + "</span></div>" : "";
  return banner + heroBlock(s, tx, { preview: true });
}

export function viewStudio() {
  const tabs = [["texts", "Testi", "text"], ["look", "Aspetto e 3D", "palette"], ["images", "Immagini", "image"], ["users", "Iscritti", "users"]];
  const isDirty = dirty(), problems = checkDraft(site.draft);
  const body = studio.tab === "look" ? tabLook() : studio.tab === "images" ? tabImages() : studio.tab === "users" ? tabUsers() : tabTexts();
  const showPreview = studio.tab === "texts" || studio.tab === "look" || studio.tab === "images";
  return '<div class="studio">' +
    '<header class="st-head"><div><h1 class="h-page">Studio</h1><p class="muted">Ciao ' + esc(ADMIN_NAME) + ". Qui cambi la pagina pubblica di Blistra." + (site.data.updatedBy ? " Ultima pubblicazione: " + esc(site.data.updatedBy) + "." : "") + "</p></div>" +
    '<div class="st-actions"><span class="st-state ' + (isDirty ? "dirty" : "") + '" role="status">' + (isDirty ? "Modifiche non pubblicate" : "Tutto pubblicato") + "</span>" +
    '<button class="btn sm ghost" data-st-discard' + (isDirty ? "" : " disabled") + ">Annulla modifiche</button>" +
    '<a class="btn sm" href="#about" data-st-fullpreview>' + icon("eye", 16) + "Anteprima intera</a>" +
    '<button class="btn primary" data-st-publish' + (isDirty && !problems.length ? "" : " disabled") + ">Pubblica</button></div></header>" +
    (isDirty && problems.length ? '<ul class="st-warn">' + problems.map(x => "<li>" + icon("alarm", 18) + esc(x) + "</li>").join("") + "</ul>" : "") +
    '<nav class="st-tabs" role="tablist">' + tabs.map(([k, n, ic]) => '<button role="tab" data-st-tab="' + k + '" aria-selected="' + (studio.tab === k) + '">' + icon(ic, 18) + esc(n) + "</button>").join("") + "</nav>" +
    '<div class="st-body' + (showPreview ? "" : " single") + '"><div class="st-editor">' + body +
    (studio.tab !== "users" ? '<div class="st-reset"><button class="linkish danger" data-st-reset>' + (studio.armedReset ? "Tocca di nuovo per tornare ai testi e colori originali (poi Pubblica)" : "Ripristina testi e colori originali") + "</button></div>" : "") + "</div>" +
    (showPreview ? '<aside class="st-preview" aria-label="Anteprima"><p class="st-preview-l">Anteprima della parte alta (' + (studio.lang === "it" ? "italiano" : "inglese") + ')</p><div class="preview-frame pub" data-preview>' + previewHTML() + "</div></aside>" : "") +
    "</div></div>";
}

// ---- actions called from main.js -----------------------------------------------------------

export function onStudioInput(el) {
  const path = el.dataset.k;
  let v = el.type === "checkbox" ? el.checked : el.type === "range" ? parseFloat(el.value) : el.value;
  if (el.type === "color") { v = v.toUpperCase(); const lab = el.parentElement.querySelector("small"); if (lab) lab.textContent = v; }
  setPath(site.draft, path, v);
  site.draft = sanitizeSite(site.draft);
  return { look: path.startsWith("look."), structural: el.type === "checkbox" || el.tagName === "SELECT" };
}

export function listAction(kind, list, i, dir) {
  const arr = site.draft.texts[studio.lang][list];
  if (kind === "add") arr.push(list === "stats" ? { n: "", t: "" } : list === "road" ? { t: "", d: "", done: false } : { t: "", d: "" });
  if (kind === "del") arr.splice(i, 1);
  if (kind === "move") { const j = i + dir; if (j >= 0 && j < arr.length) [arr[i], arr[j]] = [arr[j], arr[i]]; }
}

export function applyPreset(i) { const x = PRESETS[i]; Object.assign(site.draft.look, { accent: x.accent, hero: x.hero, sun: x.sun }); }

export async function publish(store) {
  const problems = checkDraft(site.draft);
  if (problems.length) { toast(problems[0]); return false; }
  const data = clone(site.draft); data.updatedBy = ADMIN_NAME;
  await store.saveSite(data);
  site.data = sanitizeSite(data);
  site.draft = clone(site.data);
  toast("Pubblicato. La pagina è aggiornata per tutti.");
  return true;
}

export function discard() { site.draft = clone(site.data); applyLook(site.draft.look); }
export function resetDefaults() { site.draft = clone(DEFAULT_SITE); applyLook(site.draft.look); }

export async function loadUsers(store) {
  studio.usersErr = ""; studio.users = null;
  try { studio.users = await store.listUsers(); }
  catch (e) { studio.usersErr = e.code === "permission-denied" ? "Il database non ti riconosce come amministratore: controlla il documento admins/ nella console Firebase e le regole pubblicate." : "Non riesco a caricare gli iscritti: " + (e.code || e.message); }
}

export function usersCSV() {
  const rows = [["Nome", "Email", "Iscritto", "Ultimo accesso", "Cerchie"]].concat((studio.users || []).map(u => [u.name, u.email, u.createdAt ? u.createdAt.toISOString().slice(0, 10) : "", u.lastSeen, u.circles]));
  // Cells starting with = + - @ are prefixed so spreadsheet apps never run them as formulas.
  const cell = v => { let s = String(v == null ? "" : v); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
  download("blistra-iscritti.csv", "﻿" + rows.map(r => r.map(cell).join(";")).join("\r\n"), "text/csv");
}

export async function uploadImages(store, files) {
  const room = LIMITS.siteImages - site.media.length;
  const list = [...files].slice(0, Math.max(0, room));
  if (!list.length) { toast("Hai raggiunto il massimo di " + LIMITS.siteImages + " immagini."); return; }
  let order = site.media.reduce((m, x) => Math.max(m, x.order), 0);
  for (const f of list) {
    try {
      const img = await compressImage(f, { max: 1600, type: "image/webp", quality: 0.82, maxChars: LIMITS.siteImageChars });
      await store.addMedia({ src: img.src, w: img.w, h: img.h, alt: "", caption: "", inGallery: true, order: ++order });
    } catch (e) {
      toast(e.message === "too_big" ? f.name + ": troppo pesante anche dopo la compressione." : e.message === "bad_type" || e.message === "bad_image" ? f.name + ": non è un'immagine valida." : "Caricamento non riuscito: " + (e.code || e.message));
    }
  }
}

export async function moveMedia(store, id, dir) {
  const arr = site.media, i = arr.findIndex(m => m.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= arr.length) return;
  await Promise.all([store.updateMedia(arr[i].id, { order: arr[j].order }), store.updateMedia(arr[j].id, { order: arr[i].order === arr[j].order ? arr[i].order + dir : arr[i].order })]);
}
