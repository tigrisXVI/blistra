// Sign in / create account, the consent step and the first circle.

import { A, prefs, L } from "../state.js";
import { esc } from "../util.js";
import { current } from "../site.js";
import { icon } from "../ui.js";
import { topbar, footer } from "./landing.js";

export const authUI = { mode: "login" };

const GOOGLE = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

function consentBoxes() {
  const t = L();
  return '<div class="consents"><label class="check"><input type="checkbox" id="a-health" required><span>' + esc(t.consent_health) + ' <a href="#privacy" target="_blank" rel="noopener">' + esc(t.privacy) + "</a></span></label>" +
    '<label class="check"><input type="checkbox" id="a-age" required><span>' + esc(t.consent_age) + "</span></label></div>";
}

export function viewAuth() {
  const t = L(), up = authUI.mode === "signup", s = current(), tx = s.texts[prefs.lang] || s.texts.it;
  return '<div class="pub">' + topbar("login") + '<main id="main" class="auth-wrap">' +
    '<aside class="auth-side"><h1 class="display sm">' + esc(tx.heroTitle) + '</h1><p>' + esc(tx.heroLead) + "</p>" +
    (s.look.hero3d ? '<div class="auth-stage"><div class="stage-slot" data-stage-slot role="img" aria-label="Blister 3D"></div></div>' : "") + "</aside>" +
    '<section class="auth-card" aria-labelledby="auth-h"><h2 id="auth-h" class="h-card">' + esc(up ? t.signup : t.login) + "</h2>" +
    '<div class="seg" role="tablist"><button role="tab" data-auth-mode="login" aria-selected="' + !up + '">' + esc(t.login) + '</button><button role="tab" data-auth-mode="signup" aria-selected="' + up + '">' + esc(t.signup) + "</button></div>" +
    '<button class="btn wide google" data-google>' + GOOGLE + esc(t.google) + "</button>" +
    '<div class="or"><span>' + (prefs.lang === "it" ? "oppure con email" : "or with email") + "</span></div>" +
    '<form id="authform" class="stack" novalidate>' +
    (up ? '<label class="f">' + esc(t.your_name) + '<input type="text" id="a-name" autocomplete="name" required maxlength="40"></label>' : "") +
    '<label class="f">' + esc(t.email) + '<input type="email" id="a-email" autocomplete="email" required maxlength="120" inputmode="email"></label>' +
    '<label class="f">' + esc(t.password) + '<span class="pw"><input type="password" id="a-pw" autocomplete="' + (up ? "new-password" : "current-password") + '" required minlength="' + (up ? 8 : 6) + '" maxlength="128">' +
    '<button type="button" class="pw-eye" data-pw-toggle aria-label="' + (prefs.lang === "it" ? "Mostra password" : "Show password") + '">' + icon("eye", 18) + "</button></span>" +
    (up ? '<small class="hint">' + esc(t.pw_hint) + "</small>" : "") + "</label>" +
    (up ? consentBoxes() : "") +
    '<p id="a-err" class="err" role="alert"></p>' +
    '<button class="btn primary wide lg" type="submit">' + esc(up ? t.signup : t.login) + "</button></form>" +
    (!up ? '<button class="linkish" data-forgot>' + esc(t.forgot) + "</button>" : "") +
    '<div class="demo-line"><span>' + (prefs.lang === "it" ? "Vuoi solo dare un'occhiata?" : "Just looking?") + '</span><button class="btn ghost" data-demo>' + esc(t.try_demo) + "</button></div>" +
    "</section></main>" + footer() + "</div>";
}

/** Shown after a Google sign-in, which skips the sign-up form and its consent boxes. */
export function viewConsent() {
  const t = L();
  return '<div class="app-narrow"><section class="panel stack"><h1 class="h-page">' + esc(prefs.lang === "it" ? "Prima di iniziare" : "Before you start") + "</h1>" +
    '<p class="muted">' + esc(prefs.lang === "it" ? "Blistra conserva dati sulle terapie, che la legge considera dati sanitari. Per questo ti chiediamo un consenso esplicito." : "Blistra stores therapy data, which the law treats as health data. That is why we ask for explicit consent.") + "</p>" +
    '<form id="consentform" class="stack">' + consentBoxes() + '<p id="cs-err" class="err" role="alert"></p><button class="btn primary lg" type="submit">' + esc(prefs.lang === "it" ? "Continua" : "Continue") + "</button></form>" +
    '<button class="linkish" data-signout>' + esc(t.signout) + "</button></section></div>";
}

export function viewOnboard(storeKind) {
  const t = L();
  return '<div class="app-narrow stack-lg"><div><h1 class="h-page">' + esc(t.onboard_title) + '</h1><p class="muted">' + esc(t.onboard_lead) + "</p></div>" +
    '<form id="createform" class="panel stack"><label class="f">' + esc(t.circle_name) + '<input type="text" id="c-name" placeholder="' + esc(t.circle_name_ph) + '" maxlength="40" required></label>' +
    '<label class="f">' + esc(t.first_patient) + '<input type="text" id="c-pat" placeholder="' + esc(t.first_patient_ph) + '" maxlength="30"></label><p id="c-err" class="err" role="alert"></p><button class="btn primary lg" type="submit">' + esc(t.create) + "</button></form>" +
    '<form id="joinform" class="panel stack"><h2 class="h-card">' + esc(t.or_join) + '</h2><label class="f">' + esc(t.invite_code) + '<input type="text" id="j-code" maxlength="9" autocomplete="off" autocapitalize="characters" class="code-in"></label><p id="j-err" class="err" role="alert"></p><button class="btn" type="submit">' + esc(t.join) + "</button></form>" +
    (storeKind === "cloud" ? '<button class="linkish" data-signout>' + esc(t.signout) + "</button>" : "") + "</div>";
}

