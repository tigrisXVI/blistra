// The public project page: what Blistra is, why it exists, where it is going.
// Every text and colour here comes from site.js, so Studio can change it.

import { A, prefs, L } from "../state.js";
import { esc } from "../util.js";
import { current, site, mediaById } from "../site.js";
import { icon, brandMark, blisterFlat } from "../ui.js";
import { CONTACT, VERSION } from "../config.js";

const FEATURE_ICONS = ["circle", "alarm", "box", "rx", "info", "lock", "shield", "calendar"];
const paras = s => String(s || "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => "<p>" + esc(p) + "</p>").join("");

export function topbar(where) {
  const t = L(), signedIn = !!A.user;
  return '<header class="pub-top"><a class="brand" href="#about" aria-label="Blistra">' + brandMark(34) + "<b>Blistra</b></a>" +
    '<nav class="pub-nav" aria-label="' + esc(t.menu) + '">' +
    (where !== "about" ? '<a href="#about">' + esc(t.nav_project) + "</a>" : "") +
    (signedIn ? '<a class="btn sm primary" href="#today">' + esc(t.open_app) + "</a>" : (where !== "login" ? '<a class="btn sm primary" href="#login">' + esc(t.signin_cta) + "</a>" : "")) +
    langSwitch() + "</nav></header>";
}

export function langSwitch() {
  return '<div class="lang" role="group" aria-label="Lingua / Language"><button data-lang="it" aria-pressed="' + (prefs.lang === "it") + '">IT</button><button data-lang="en" aria-pressed="' + (prefs.lang === "en") + '">EN</button></div>';
}

/** The visual on the right of the hero: 3D slot, uploaded image, or flat drawing. */
export function heroVisual(s, hintText) {
  const img = !s.look.hero3d && s.look.heroImage ? mediaById(s.look.heroImage) : null;
  if (img) return '<figure class="hero-img"><img src="' + img.src + '" alt="' + esc(img.alt) + '"></figure>';
  if (!s.look.hero3d) return '<div class="hero-flat">' + blisterFlat(s.look.pills) + "</div>";
  return '<div class="hero-stage"><div class="stage-slot" data-stage-slot role="img" aria-label="' + esc(prefs.lang === "it" ? "Blister di pastiglie in 3D" : "3D blister pack of pills") + '"></div>' +
    '<button class="pop-hint" data-pop-one>' + icon("meds", 18) + esc(hintText) + "</button></div>";
}

export function heroBlock(s, tx, { preview = false } = {}) {
  const t = L();
  const primary = A.user ? '<a class="btn big-cta" href="#today">' + esc(t.open_app) + "</a>" : '<a class="btn big-cta" href="#login">' + esc(tx.ctaApp) + "</a>";
  const demo = A.user ? "" : '<button class="btn ghost-light" data-demo>' + esc(tx.ctaDemo) + "</button>";
  return '<section class="hero' + (preview ? " preview" : "") + '"><div class="hero-in">' +
    '<div class="hero-copy"><h1 class="display">' + esc(tx.heroTitle) + '</h1><p class="lead">' + esc(tx.heroLead) + "</p>" +
    '<div class="cta-row">' + (preview ? '<span class="btn big-cta">' + esc(tx.ctaApp) + '</span><span class="btn ghost-light">' + esc(tx.ctaDemo) + "</span>" : primary + demo) + "</div></div>" +
    heroVisual(s, tx.heroHint) + "</div></section>";
}

export function viewLanding() {
  const s = current(), tx = s.texts[prefs.lang] || s.texts.it, sec = s.sections;
  const gallery = site.media.filter(m => m.inGallery);
  const banner = sec.banner && tx.bannerText ? '<div class="banner ' + (s.banner.tone === "warn" ? "warn" : "") + '" role="note">' + icon(s.banner.tone === "warn" ? "alarm" : "info", 20) + "<span>" + esc(tx.bannerText) + "</span></div>" : "";
  const it = prefs.lang === "it";

  return '<div class="pub">' + topbar("about") + banner + '<main id="main">' + heroBlock(s, tx) +

    '<section class="band-problem wrap-pub"><h2 class="h-sec">' + esc(tx.problemTitle) + '</h2><div class="prose">' + paras(tx.problemText) + "</div></section>" +

    (sec.stats && tx.stats.length ? '<section class="wrap-pub stats" aria-label="' + (it ? "Alcuni numeri" : "Some figures") + '"><ul class="stat-list">' +
      tx.stats.map(x => '<li><strong class="stat-n">' + esc(x.n) + "</strong><span>" + esc(x.t) + "</span></li>").join("") +
      '</ul><p class="source">' + esc(tx.statsSource) + "</p></section>" : "") +

    (sec.features && tx.features.length ? '<section class="wrap-pub"><h2 class="h-sec">' + esc(tx.featuresTitle) + '</h2><ul class="features">' +
      tx.features.map((f, i) => '<li><span class="f-ico">' + icon(FEATURE_ICONS[i % FEATURE_ICONS.length], 26) + "</span><div><h3>" + esc(f.t) + "</h3><p>" + esc(f.d) + "</p></div></li>").join("") +
      "</ul></section>" : "") +

    (sec.gallery && gallery.length ? '<section class="wrap-pub"><h2 class="h-sec">' + esc(tx.galleryTitle) + "</h2>" + (tx.galleryText ? '<p class="lead-dark">' + esc(tx.galleryText) + "</p>" : "") +
      '<div class="gallery">' + gallery.map(m => '<figure><img src="' + m.src + '" alt="' + esc(m.alt) + '" loading="lazy" decoding="async"' + (m.w && m.h ? ' width="' + m.w + '" height="' + m.h + '"' : "") + ">" + (m.caption ? "<figcaption>" + esc(m.caption) + "</figcaption>" : "") + "</figure>").join("") + "</div></section>" : "") +

    (sec.roadmap && tx.road.length ? '<section class="wrap-pub"><h2 class="h-sec">' + esc(tx.roadTitle) + '</h2><ol class="road">' +
      tx.road.map((r, i) => '<li class="' + (r.done ? "done" : "") + '"><span class="road-n" aria-hidden="true">' + (r.done ? icon("check", 18) : i + 1) + "</span><div><h3>" + esc(r.t) + "</h3><p>" + esc(r.d) + "</p></div></li>").join("") +
      "</ol></section>" : "") +

    '<section class="wrap-pub limits"><h2 class="h-sec small">' + esc(tx.limitsTitle) + "</h2><p>" + esc(tx.limitsText) + "</p></section>" +
    "</main>" + footer(tx) + "</div>";
}

export function footer(tx) {
  const t = L(), s = current();
  tx = tx || s.texts[prefs.lang] || s.texts.it;
  return '<footer class="pub-foot"><div class="wrap-pub foot-in"><div class="foot-brand">' + brandMark(40) + "<div><b>Blistra</b><span>" + esc(prefs.lang === "it" ? "Versione " : "Version ") + VERSION + "</span></div></div>" +
    '<div><h2 class="foot-h">' + esc(tx.contactTitle) + '</h2><a href="mailto:' + CONTACT + '">' + CONTACT + "</a></div>" +
    '<nav class="foot-links" aria-label="Legal"><a href="#privacy">' + esc(t.privacy) + '</a><a href="#terms">' + esc(t.terms) + "</a></nav></div></footer>";
}
