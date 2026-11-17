// Cosa entra nella Scatoletta Blistra (v0.9 e v1.0: due ruote da 15 scomparti) e cosa va preso a mano.
// Le misure vengono dal modello 3D (cad/scatoletta_v10.py) e dal rapporto R&D del progetto:
// https://github.com/tigrisXVI/scatoletta-blistra (cartella rd/).

// ---- misure della scatoletta (mm) -------------------------------------------------------
const R_O = 47, N = 15, L_TASCA = 24, PROF = 13, LARG_MAX = 14.8;
const USCITA = [13, 14];                 // la pillola deve passare dall'uscita in basso
const RICARICA_ALTO = [6.3, 12, 16.7];   // v1.0: vaschetta stretta, misure ordinate (spessore, larghezza, lunghezza) in mm
export const SCOMPARTO_MM3 = 4260;
const RIEMPIMENTO = 0.45;                // pillole alla rinfusa: occupano circa il 45-60% del volume; si usa il caso peggiore

// ---- farmaci che non vanno messi nella scatoletta (I-13) ---------------------------------
// Solo quelli con una fonte. Un farmacista deve comunque confermare ogni farmaco prima del carico.
export const ESCLUSI = {
  "Dabigatran": { it: "Le capsule assorbono umidità fuori dalla confezione originale: in uno studio sono rimaste buone 28 giorni solo in frigorifero.",
                  en: "The capsules take up moisture outside the original pack: in a study they stayed within quality for 28 days only when refrigerated.",
                  fonte: "https://pubmed.ncbi.nlm.nih.gov/31157076/" },
};
export const ATTENZIONE = {   // si possono caricare, ma per non piu' di 7 giorni e solo con il gel nuovo
  "Atenololo": "https://researchonline.jcu.edu.au/76452/1/76452.pdf",
  "Acido valproico": "https://researchonline.jcu.edu.au/76452/1/76452.pdf",
  "Warfarin": "https://researchonline.jcu.edu.au/76452/1/76452.pdf",
  "Telmisartan": "https://researchonline.jcu.edu.au/76452/1/76452.pdf",
};
export const GIORNI_MAX = 7;

const nome = s => String(s || "").trim().toLowerCase();
export function esclusoPer(m) { const k = Object.keys(ESCLUSI).find(x => nome(m.name).startsWith(nome(x))); return k ? ESCLUSI[k] : null; }
export function delicato(m) { return Object.keys(ATTENZIONE).some(x => nome(m.name).startsWith(nome(x))); }

// ---- misure della pillola ---------------------------------------------------------------
/** m.size = { l, w, t } in mm (lunghezza, larghezza, spessore), dal foglietto o misurate con un calibro. */
export function misure(m) {
  const s = m && m.size; if (!s) return null;
  const l = +s.l, w = +s.w || +s.l, t = +s.t;
  return l > 0 && w > 0 && t > 0 ? { l: Math.max(l, w), w: Math.min(l, w), t } : null;
}
export function volumeMm3(m) {
  const s = misure(m); if (!s) return null;
  if (m.shape === "capsule") { const r = s.w / 2; return Math.PI * r * r * (s.l - 2 * r) + 4 / 3 * Math.PI * r ** 3; }
  return Math.PI / 4 * s.l * s.w * s.t * 0.85;
}
const passa = (s, A, B) => { const [a, b] = [A, B].sort((x, y) => x - y), d = [s.l, s.w, s.t].sort((x, y) => x - y); return d[0] <= a && d[1] <= b; };
function stanzaInScomparto(s) {
  for (const [a, b, c] of [[s.l, s.w, s.t], [s.l, s.t, s.w], [s.w, s.l, s.t], [s.w, s.t, s.l], [s.t, s.l, s.w], [s.t, s.w, s.l]]) {
    if (a > L_TASCA || c > PROF) continue;
    if (b <= Math.min(2 * Math.PI * (R_O - a) / N - 1, LARG_MAX)) return true;
  }
  return false;
}
/** { ok, scomparto, uscita, alto } oppure null se mancano le misure. */
export function controllaPillola(m) {
  const s = misure(m); if (!s) return null;
  const scomparto = stanzaInScomparto(s), uscita = passa(s, ...USCITA);
  const d = [s.l, s.w, s.t].sort((x, y) => x - y);
  const alto = d.every((x, i) => x <= RICARICA_ALTO[i]);
  return { ok: scomparto && uscita, scomparto, uscita, alto };
}
/** Una pillola va presa a mano se e' esclusa o se non entra / non esce. */
export function aMano(m) { const c = controllaPillola(m); return !!esclusoPer(m) || (c ? !c.ok : false); }
/** Quanto di uno scomparto occupa una dose: frazione (1 = pieno); null se mancano misure. */
export function riempimento(items) {
  let v = 0;
  for (const x of items) { const u = volumeMm3(x.m); if (u == null) return null; v += u * x.n; }
  return v / (SCOMPARTO_MM3 * RIEMPIMENTO);
}
