// Blistra 2.0 — family medication circle.
// Two data backends with the same API: a demo store (this device only) and a Firebase store (real accounts + family circles).
import { firebaseConfig } from "./firebase-config.js";
import { FARMACI } from "./farmaci.js";
import { schedaPer, AIFA_URL } from "./schede.js";

const VERSION = "2.0";
const CONTACT = "tigrisedicesimo@gmail.com";
const FIREBASE_VERSION = "10.12.2";

/* ================= helpers ================= */
const pad = n => String(n).padStart(2, "0");
const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const hm = d => pad(d.getHours()) + ":" + pad(d.getMinutes());
const dow = d => (d.getDay() + 6) % 7; // Monday = 0
const toMin = t => { if (!t) return null; const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const fromMin = m => pad(Math.floor(((m % 1440) + 1440) % 1440 / 60)) + ":" + pad(((m % 60) + 60) % 60);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const parseYmd = s => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const daysBetween = (a, b) => Math.round((parseYmd(ymd(b)) - parseYmd(ymd(a))) / 86400000);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (s, o) => String(s).replace(/\{(\w+)\}/g, (_, k) => (o[k] == null ? "" : o[k]));
const uid = (n = 14) => { const a = "abcdefghijkmnpqrstuvwxyz23456789"; let s = ""; const r = crypto.getRandomValues(new Uint8Array(n)); r.forEach(x => s += a[x % a.length]); return s; };
const inviteCode = () => { const a = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; let s = ""; crypto.getRandomValues(new Uint8Array(6)).forEach(x => s += a[x % a.length]); return s; };
const entryKey = (medId, t) => medId + "_" + t.replace(":", "");
const COLORS = ["#FFFFFF", "#F6D365", "#F4A7B9", "#8FB8E8", "#F2A65A", "#A8D5A2"];
const PCOLORS = ["#C9772B", "#2F7FC1", "#8A5CC2", "#C2416B", "#2E8B6E", "#7A6A2F"];
const clone = o => JSON.parse(JSON.stringify(o));

/* ================= i18n ================= */
const T = {
  it: {
    tabs: { today: "Oggi", circle: "Cerchia", meds: "Farmaci", reminders: "Promemoria", info: "Info" },
    tagline: "La cerchia di famiglia per le terapie di chi ami.",
    hero_lead: "Blistra aiuta famiglie e caregiver a seguire le prescrizioni, programmare promemoria e sveglie e ricevere un avviso quando un farmaco sta per finire.",
    login: "Accedi", signup: "Crea account", email: "Email", password: "Password", your_name: "Il tuo nome",
    google: "Continua con Google", forgot: "Password dimenticata?", reset_sent: "Ti abbiamo mandato un'email per reimpostare la password.",
    try_demo: "Prova la demo senza account", what_is: "Cos'è Blistra",
    no_cloud: "L'accesso con account non è ancora attivo su questa copia. Puoi provare tutto in modalità demo.",
    demo_bar: "Modalità demo: i dati restano su questo dispositivo.", demo_exit: "Esci dalla demo",
    onboard_title: "Crea la tua cerchia", onboard_lead: "Una cerchia è il gruppo di familiari che si prende cura di una o più persone.",
    circle_name: "Nome della cerchia", circle_name_ph: "es. Famiglia Rossi", first_patient: "Chi assistete?", first_patient_ph: "es. Nonna Maria",
    create: "Crea la cerchia", or_join: "Oppure entra in una cerchia esistente", invite_code: "Codice invito", join: "Entra",
    hello: ["Buonanotte", "Buongiorno", "Buon pomeriggio", "Buonasera"],
    now_due: "Da prendere adesso", now_late: "Non ancora presa", now_missed: "Non presa entro le {t}",
    late_hint: "Era prevista alle {t}. Se hai dubbi su cosa fare, chiedi al medico o al farmacista.",
    taken_btn: "Presa ✓", all_clear: "Nessun farmaco da prendere adesso", next_at: "Prossimo: {m} alle {t}", no_more: "Per oggi è tutto. Ottimo lavoro.",
    no_meds: "Nessun farmaco per {p}. Aggiungili dalla scheda Farmaci.", no_patients: "Nessuna persona assistita. Aggiungila nella Cerchia.",
    more_now: "+ altri {n} da prendere adesso", blister: "Il blister di oggi", tap_hint: "Tocca una casella illuminata quando prendi il farmaco.",
    ring_sub: "dosi prese", st: { taken: "✓ {t}", due: "Adesso", late: "In ritardo", missed: "Non presa", later: "Più tardi" },
    legend: ["Adesso", "In ritardo", "Più tardi", "Presa"], undo: "Annulla", recorded: "Registrata alle {t}", undone: "Annullato",
    food: { before: "Prima del pasto", with: "Durante il pasto", after: "Dopo il pasto", any: "" },
    today_reminders: "Promemoria di oggi", info_btn: "Informazioni sul farmaco",
    exit_lock: "Esci (familiare)", lock_title: "Telefono di {p}", lock_desc: "Questo telefono mostrerà solo la giornata di {p}, con pulsanti grandi e sveglie attive. Per uscire serve il PIN, se lo imposti.",
    lock_pin: "PIN per uscire (facoltativo, 4 cifre)", lock_on: "Usa questo telefono per {p}", pin_ask: "Inserisci il PIN", pin_wrong: "PIN errato.",
    // circle
    circle: "Cerchia", people: "Persone assistite", add_patient: "+ Aggiungi persona", patient_name: "Nome", color: "Colore",
    open_day: "Apri la giornata", today_progress: "{a} su {b} dosi oggi", alerts: "Avvisi", no_alerts: "Nessun avviso. Tutto in ordine.",
    activity: "Attività recente", no_activity: "Ancora nessuna dose registrata.", members: "Familiari nella cerchia",
    invite: "Invita un familiare", invite_desc: "Chi ha questo codice può entrare nella cerchia con il proprio account.", copy: "Copia", copied: "Copiato",
    invite_text: "Entra nella mia cerchia su Blistra con il codice {c}: {u}",
    device: "Questo dispositivo", alarms_on_device: "Sveglie su questo telefono", alarms_desc: "Il telefono suona all'ora del farmaco e di nuovo se la dose non viene segnata entro l'orario limite. Funziona mentre Blistra è aperta o in background; per sveglie anche a telefono bloccato aggiungi gli orari al calendario.",
    enable_alarms: "Attiva sveglie e notifiche", alarms_ok: "Sveglie attive", test_alarm: "Prova la sveglia",
    calendar: "Aggiungi al calendario del telefono", calendar_desc: "Scarica un file .ics con tutti gli orari: il calendario ti avviserà anche a telefono bloccato, con un secondo avviso all'orario limite.",
    calendar_fail: "Il download non è disponibile in questa anteprima. Apri Blistra dal suo indirizzo per scaricare il calendario.",
    language: "Lingua", leave: "Esci dalla cerchia", signout: "Esci dall'account", switch_circle: "Cambia cerchia", new_circle: "+ Nuova cerchia o codice",
    confirm_leave: "Uscire dalla cerchia {n}? Potrai rientrare solo con un nuovo codice.",
    remove_patient: "Rimuovi", confirm_remove_patient: "Rimuovere {p} e tutti i suoi farmaci?",
    by_device: "dal suo telefono",
    // alerts
    a_out: "{m}: finito", a_low: "{m}: restano circa {d} giorni", a_low_sub: "Compra o ritira una nuova confezione.",
    a_rx_exp: "Ricetta di {m} scaduta", a_rx_soon: "Ricetta di {m}: scade tra {d} giorni", a_rx_sub: "Chiedi il rinnovo al medico.",
    a_missed: "{m} non presa entro le {t}", a_late: "{m} delle {t} in ritardo", for_p: "per {p}",
    // meds
    meds: "Farmaci", add_med: "+ Aggiungi farmaco", edit: "Modifica", del: "Elimina", every_day: "Tutti i giorni",
    stock: "Scorte", stock_left: "{n} rimaste · circa {d} giorni", stock_none: "Scorte non tracciate", add_box: "+1 confezione",
    rx: "Ricetta", rx_until: "valida fino al {d}", rx_none: "Nessuna ricetta registrata", week_sheet: "Schema settimanale da stampare",
    alarm_tag: "Sveglia", recheck: "di nuovo alle {t} se non presa",
    // form
    f_new: "Nuovo farmaco", f_edit: "Modifica farmaco", f_for: "Per chi", f_name: "Nome del farmaco", f_name_ph: "es. Ramipril 5 mg",
    f_dose: "Quantità per dose", f_dose_ph: "es. 1 compressa", f_units: "Unità per dose (per le scorte)",
    f_when: "Quando", f_times: "Orari", f_add_time: "+ orario", f_deadline: "Risuona se non presa entro", f_alarm: "Suona come sveglia",
    f_days: "Giorni", f_food: "Rispetto ai pasti", f_food_opts: { any: "Indifferente", before: "Prima", with: "Durante", after: "Dopo" },
    f_look: "Come riconoscerla", f_photo: "Foto della pastiglia o della scatola", f_photo_btn: "Scatta o scegli foto", f_photo_rm: "Rimuovi foto",
    f_photo_hint: "La foto vera evita confusioni: lo stesso farmaco può avere un aspetto diverso a seconda del produttore.",
    f_shape: { round: "Rotonda", oval: "Ovale", capsule: "Capsula" }, f_desc: "Descrizione dal foglio illustrativo", f_desc_ph: "es. compressa rotonda bianca con incisione",
    f_note: "Nota per chi la prende", f_note_ph: "es. con un bicchiere d'acqua",
    f_stock: "Scorte", f_count: "Unità rimaste", f_box: "Unità per confezione", f_thr: "Avvisami quando restano (giorni)",
    f_rx: "Ricetta", f_doctor: "Medico", f_expires: "Valida fino al", f_rx_note: "Note sulla ricetta", f_rx_note_ph: "es. ricetta elettronica, 2 confezioni",
    save: "Salva", cancel: "Annulla", close: "Chiudi", confirm_del: "Eliminare {m}? Anche lo storico verrà cancellato.",
    need_name: "Scrivi il nome del farmaco.", need_time: "Aggiungi almeno un orario.", need_day: "Scegli almeno un giorno.", need_patient: "Prima aggiungi una persona assistita.",
    // reminders
    reminders: "Promemoria", add_rem: "+ Nuovo promemoria", rem_title: "Cosa ricordare", rem_title_ph: "es. Visita dal medico", rem_for: "Per chi", rem_all: "Tutta la cerchia",
    rem_date: "Data", rem_time: "Ora", rem_repeat: "Ripeti", repeat: { none: "Una volta", daily: "Ogni giorno", weekly: "Ogni settimana", monthly: "Ogni mese" },
    rem_alarm: "Suona come sveglia", rem_note: "Note", no_rem: "Nessun promemoria in programma.", upcoming: "In programma", rem_today: "oggi", rem_tomorrow: "domani",
    // info sheet
    sheet_title: "Scheda semplificata", sheet_for: "A cosa serve", sheet_how: "Come si prende", sheet_watch: "Attenzione", sheet_call: "Quando chiamare il medico",
    sheet_disclaimer: "Riassunto generale in parole semplici, scritto per Blistra. Le indicazioni del medico e il foglio illustrativo ufficiale vengono prima.",
    sheet_none: "Per questo farmaco non c'è ancora una scheda semplificata.", sheet_aifa: "Foglio illustrativo ufficiale su AIFA Medicinali", sheet_aifa_hint: "Apri il sito e cerca: {n}",
    // alarm overlay
    alarm_now: "È ora della medicina", alarm_again: "Non l'hai ancora presa", snooze: "Ricordamelo tra 10 minuti", alarm_rem: "Promemoria",
    week_title: "Schema della settimana", week_sub: "Da stampare e attaccare in cucina: si spunta la casella dopo ogni dose.", time: "Ora",
    days_short: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"], days_long: ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"],
    months: ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"],
    err: { generic: "Qualcosa è andato storto. Riprova.", "auth/invalid-credential": "Email o password non corretti.", "auth/email-already-in-use": "Esiste già un account con questa email.",
      "auth/weak-password": "La password deve avere almeno 6 caratteri.", "auth/invalid-email": "Email non valida.", "permission-denied": "Non hai i permessi per questa azione.",
      bad_code: "Codice invito non valido.", "auth/popup-closed-by-user": "Accesso con Google annullato.", offline: "Sei offline: le modifiche verranno salvate appena torni online." }
  },
  en: {
    tabs: { today: "Today", circle: "Circle", meds: "Medicines", reminders: "Reminders", info: "About" },
    tagline: "A family circle for the medicines of the people you care for.",
    hero_lead: "Blistra helps families and caregivers track prescriptions, schedule custom reminders and alarms, and receive low-stock alerts before running out of medication.",
    login: "Sign in", signup: "Create account", email: "Email", password: "Password", your_name: "Your name",
    google: "Continue with Google", forgot: "Forgot password?", reset_sent: "We sent you an email to reset your password.",
    try_demo: "Try the demo without an account", what_is: "What is Blistra",
    no_cloud: "Account sign-in is not set up on this copy yet. You can try everything in demo mode.",
    demo_bar: "Demo mode: data stays on this device.", demo_exit: "Leave demo",
    onboard_title: "Create your circle", onboard_lead: "A circle is the group of family members who look after one or more people.",
    circle_name: "Circle name", circle_name_ph: "e.g. The Rossi family", first_patient: "Who are you caring for?", first_patient_ph: "e.g. Grandma Maria",
    create: "Create the circle", or_join: "Or join an existing circle", invite_code: "Invite code", join: "Join",
    hello: ["Good night", "Good morning", "Good afternoon", "Good evening"],
    now_due: "Take now", now_late: "Not taken yet", now_missed: "Not taken by {t}",
    late_hint: "It was due at {t}. If you are unsure what to do, ask the doctor or pharmacist.",
    taken_btn: "Taken ✓", all_clear: "Nothing to take right now", next_at: "Next: {m} at {t}", no_more: "All done for today. Well done.",
    no_meds: "No medicines for {p} yet. Add them in Medicines.", no_patients: "Nobody to care for yet. Add a person in Circle.",
    more_now: "+ {n} more to take now", blister: "Today's blister", tap_hint: "Tap a glowing pocket when you take the medicine.",
    ring_sub: "doses taken", st: { taken: "✓ {t}", due: "Now", late: "Overdue", missed: "Missed", later: "Later" },
    legend: ["Now", "Overdue", "Later", "Taken"], undo: "Undo", recorded: "Recorded at {t}", undone: "Undone",
    food: { before: "Before the meal", with: "With the meal", after: "After the meal", any: "" },
    today_reminders: "Today's reminders", info_btn: "About this medicine",
    exit_lock: "Exit (family member)", lock_title: "{p}'s phone", lock_desc: "This phone will only show {p}'s day, with large buttons and alarms on. Leaving needs the PIN, if you set one.",
    lock_pin: "PIN to leave (optional, 4 digits)", lock_on: "Use this phone for {p}", pin_ask: "Enter the PIN", pin_wrong: "Wrong PIN.",
    circle: "Circle", people: "People cared for", add_patient: "+ Add person", patient_name: "Name", color: "Colour",
    open_day: "Open their day", today_progress: "{a} of {b} doses today", alerts: "Alerts", no_alerts: "No alerts. All good.",
    activity: "Recent activity", no_activity: "No doses recorded yet.", members: "Family members in the circle",
    invite: "Invite a family member", invite_desc: "Anyone with this code can join the circle with their own account.", copy: "Copy", copied: "Copied",
    invite_text: "Join my circle on Blistra with the code {c}: {u}",
    device: "This device", alarms_on_device: "Alarms on this phone", alarms_desc: "The phone rings at medicine time and again if the dose is not marked by the deadline. It works while Blistra is open or in the background; for alarms with the phone locked, add the times to your calendar.",
    enable_alarms: "Turn on alarms and notifications", alarms_ok: "Alarms on", test_alarm: "Test the alarm",
    calendar: "Add to the phone's calendar", calendar_desc: "Download an .ics file with every dose time: your calendar will alert you even with the phone locked, plus a second alert at the deadline.",
    calendar_fail: "Downloads are not available in this preview. Open Blistra from its own address to download the calendar.",
    language: "Language", leave: "Leave the circle", signout: "Sign out", switch_circle: "Switch circle", new_circle: "+ New circle or code",
    confirm_leave: "Leave the circle {n}? You can only rejoin with a new code.",
    remove_patient: "Remove", confirm_remove_patient: "Remove {p} and all their medicines?",
    by_device: "from their phone",
    a_out: "{m}: run out", a_low: "{m}: about {d} days left", a_low_sub: "Buy or pick up a new box.",
    a_rx_exp: "{m} prescription expired", a_rx_soon: "{m} prescription: expires in {d} days", a_rx_sub: "Ask the doctor to renew it.",
    a_missed: "{m} not taken by {t}", a_late: "{m} due at {t} is overdue", for_p: "for {p}",
    meds: "Medicines", add_med: "+ Add medicine", edit: "Edit", del: "Delete", every_day: "Every day",
    stock: "Stock", stock_left: "{n} left · about {d} days", stock_none: "Stock not tracked", add_box: "+1 box",
    rx: "Prescription", rx_until: "valid until {d}", rx_none: "No prescription recorded", week_sheet: "Printable weekly sheet",
    alarm_tag: "Alarm", recheck: "again at {t} if not taken",
    f_new: "New medicine", f_edit: "Edit medicine", f_for: "For", f_name: "Medicine name", f_name_ph: "e.g. Ramipril 5 mg",
    f_dose: "Amount per dose", f_dose_ph: "e.g. 1 tablet", f_units: "Units per dose (for stock)",
    f_when: "When", f_times: "Times", f_add_time: "+ time", f_deadline: "Ring again if not taken by", f_alarm: "Ring as an alarm",
    f_days: "Days", f_food: "With respect to meals", f_food_opts: { any: "Doesn't matter", before: "Before", with: "With", after: "After" },
    f_look: "How to recognise it", f_photo: "Photo of the pill or the box", f_photo_btn: "Take or choose photo", f_photo_rm: "Remove photo",
    f_photo_hint: "A real photo avoids mix-ups: the same medicine can look different depending on the manufacturer.",
    f_shape: { round: "Round", oval: "Oval", capsule: "Capsule" }, f_desc: "Description from the leaflet", f_desc_ph: "e.g. round white scored tablet",
    f_note: "Note for the person taking it", f_note_ph: "e.g. with a full glass of water",
    f_stock: "Stock", f_count: "Units left", f_box: "Units per box", f_thr: "Alert me when this many days are left",
    f_rx: "Prescription", f_doctor: "Doctor", f_expires: "Valid until", f_rx_note: "Prescription notes", f_rx_note_ph: "e.g. e-prescription, 2 boxes",
    save: "Save", cancel: "Cancel", close: "Close", confirm_del: "Delete {m}? Its history will be deleted too.",
    need_name: "Enter the medicine name.", need_time: "Add at least one time.", need_day: "Pick at least one day.", need_patient: "First add a person to care for.",
    reminders: "Reminders", add_rem: "+ New reminder", rem_title: "What to remember", rem_title_ph: "e.g. Doctor's appointment", rem_for: "For", rem_all: "The whole circle",
    rem_date: "Date", rem_time: "Time", rem_repeat: "Repeat", repeat: { none: "Once", daily: "Every day", weekly: "Every week", monthly: "Every month" },
    rem_alarm: "Ring as an alarm", rem_note: "Notes", no_rem: "No reminders scheduled.", upcoming: "Coming up", rem_today: "today", rem_tomorrow: "tomorrow",
    sheet_title: "Simplified sheet", sheet_for: "What it is for", sheet_how: "How to take it", sheet_watch: "Watch out", sheet_call: "When to call the doctor",
    sheet_disclaimer: "General plain-language summary written for Blistra, in Italian. The doctor's instructions and the official leaflet come first.",
    sheet_none: "There is no simplified sheet for this medicine yet.", sheet_aifa: "Official leaflet on AIFA Medicinali", sheet_aifa_hint: "Open the site and search: {n}",
    alarm_now: "Medicine time", alarm_again: "Not taken yet", snooze: "Remind me in 10 minutes", alarm_rem: "Reminder",
    week_title: "Weekly sheet", week_sub: "Print it and stick it on the fridge: tick the box after each dose.", time: "Time",
    days_short: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], days_long: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    err: { generic: "Something went wrong. Try again.", "auth/invalid-credential": "Wrong email or password.", "auth/email-already-in-use": "An account with this email already exists.",
      "auth/weak-password": "The password needs at least 6 characters.", "auth/invalid-email": "Invalid email.", "permission-denied": "You don't have permission for this.",
      bad_code: "Invalid invite code.", "auth/popup-closed-by-user": "Google sign-in cancelled.", offline: "You are offline: changes will be saved when you're back online." }
  }
};

/* ================= device preferences ================= */
const PREF_KEY = "blistra.prefs.v2";
function loadPrefs() { try { return JSON.parse(localStorage.getItem(PREF_KEY)) || {}; } catch (e) { return {}; } }
const prefs = Object.assign({ lang: (navigator.language || "it").toLowerCase().startsWith("it") ? "it" : "en", demo: false, lock: null, alarms: false, lastFamily: null, patientId: null }, loadPrefs());
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (e) { } }
function L() { return T[prefs.lang] || T.it; }

/* ================= app state ================= */
const A = { mode: null, loading: true, user: null, familyIds: [], familyNames: {}, family: null, meds: [], reminders: [], logs: {}, error: "" };
let store = null;
let renderQueued = false;
function emit() { if (renderQueued) return; renderQueued = true; requestAnimationFrame(() => { renderQueued = false; render(); }); }

/* ================= demo store ================= */
const DEMO_KEY = "blistra.demo.v2";
function demoSeed() {
  const now = new Date();
  const me = "demo-me", luca = "demo-luca";
  const p1 = "p_maria", p2 = "p_giorgio";
  const exp = n => ymd(addDays(now, n));
  const meds = [
    { id: "m1", patientId: p1, name: "Pantoprazolo 20 mg", dose: "1 compressa", units: 1, times: ["07:30"], deadlines: {}, alarm: true, days: [0,1,2,3,4,5,6], food: "before", color: "#F6D365", shape: "oval", photo: "", look: "compressa ovale gialla", note: "", stock: { count: 19, box: 28, threshold: 7 }, rx: { doctor: "Dott.ssa Bianchi", expires: exp(40), note: "" } },
    { id: "m2", patientId: p1, name: "Ramipril 5 mg", dose: "1 compressa", units: 1, times: ["08:00"], deadlines: { "08:00": "10:00" }, alarm: true, days: [0,1,2,3,4,5,6], food: "any", color: "#F4A7B9", shape: "round", photo: "", look: "compressa rotonda rosa divisibile", note: "", stock: { count: 4, box: 28, threshold: 7 }, rx: { doctor: "Dott.ssa Bianchi", expires: exp(20), note: "ricetta elettronica" } },
    { id: "m3", patientId: p1, name: "Metformina 500 mg", dose: "1 compressa", units: 1, times: ["08:00", "20:00"], deadlines: { "20:00": "21:00" }, alarm: true, days: [0,1,2,3,4,5,6], food: "with", color: "#FFFFFF", shape: "oval", photo: "", look: "", note: "Con un bicchiere d'acqua", stock: { count: 41, box: 60, threshold: 7 }, rx: { doctor: "Dott.ssa Bianchi", expires: exp(55), note: "" } },
    { id: "m4", patientId: p1, name: "Atorvastatina 20 mg", dose: "1 compressa", units: 1, times: ["21:00"], deadlines: { "21:00": "22:30" }, alarm: true, days: [0,1,2,3,4,5,6], food: "any", color: "#8FB8E8", shape: "round", photo: "", look: "", note: "", stock: { count: 23, box: 30, threshold: 7 }, rx: { doctor: "Dott.ssa Bianchi", expires: exp(3), note: "" } },
    { id: "m5", patientId: p1, name: "Colecalciferolo (vitamina D3)", dose: "1 capsula", units: 1, times: ["13:00"], deadlines: {}, alarm: false, days: [6], food: "after", color: "#F2A65A", shape: "capsule", photo: "", look: "", note: "Solo la domenica", stock: { count: 3, box: 4, threshold: 14 }, rx: { doctor: "", expires: "", note: "" } },
    { id: "m6", patientId: p2, name: "Levotiroxina 50 mcg", dose: "1 compressa", units: 1, times: ["07:00"], deadlines: { "07:00": "09:00" }, alarm: true, days: [0,1,2,3,4,5,6], food: "before", color: "#FFFFFF", shape: "round", photo: "", look: "", note: "30 minuti prima della colazione", stock: { count: 52, box: 50, threshold: 7 }, rx: { doctor: "Dott. Russo", expires: exp(70), note: "" } },
    { id: "m7", patientId: p2, name: "Tamsulosina 0,4 mg", dose: "1 capsula", units: 1, times: ["21:00"], deadlines: { "21:00": "22:00" }, alarm: true, days: [0,1,2,3,4,5,6], food: "after", color: "#F2A65A", shape: "capsule", photo: "", look: "", note: "Dopo cena", stock: { count: 11, box: 30, threshold: 7 }, rx: { doctor: "Dott. Russo", expires: exp(-2), note: "" } }
  ];
  const fam = { id: "demo", name: prefs.lang === "it" ? "Famiglia Rossi (demo)" : "The Rossi family (demo)", inviteCode: "DEMO42", memberIds: [me, luca],
    members: { [me]: { name: prefs.lang === "it" ? "Tu" : "You" }, [luca]: { name: "Luca" } },
    patients: { [p1]: { name: "Maria", color: PCOLORS[0] }, [p2]: { name: "Giorgio", color: PCOLORS[1] } }, createdBy: me };
  const logs = {};
  const nowMin = now.getHours() * 60 + now.getMinutes();
  for (let back = 6; back >= 0; back--) {
    const d = addDays(now, -back), key = ymd(d), day = dow(d);
    logs[key] = {};
    const doses = [];
    meds.forEach(m => { if (m.days.includes(day)) m.times.forEach(t => doses.push({ m, t })); });
    doses.sort((a, b) => toMin(a.t) - toMin(b.t));
    const pastToday = doses.filter(x => toMin(x.t) <= nowMin);
    const leaveOpen = pastToday.filter(x => x.m.patientId === p1).slice(-1)[0];
    doses.forEach((x, i) => {
      const k = entryKey(x.m.id, x.t), tm = toMin(x.t);
      let take;
      if (back === 0) take = tm <= nowMin && x !== leaveOpen;
      else take = (i * 7 + back * 3) % 11 !== 0;
      if (take) {
        const at = fromMin(tm + ((i * 5 + back) % 18));
        const byLuca = (i + back) % 3 === 0;
        logs[key][k] = { at, by: byLuca ? luca : "device", byName: byLuca ? "Luca" : fam.patients[x.m.patientId].name, ts: parseYmd(key).getTime() + toMin(at) * 60000 };
      }
    });
  }
  const reminders = [
    { id: "r1", title: prefs.lang === "it" ? "Visita dal medico di base" : "GP appointment", patientId: p1, date: exp(4), time: "10:30", repeat: "none", alarm: true, note: prefs.lang === "it" ? "Portare la lista dei farmaci" : "Bring the medicine list" },
    { id: "r2", title: prefs.lang === "it" ? "Rinnovare la ricetta della tamsulosina" : "Renew the tamsulosin prescription", patientId: p2, date: exp(1), time: "09:00", repeat: "none", alarm: false, note: "" },
    { id: "r3", title: prefs.lang === "it" ? "Misurare la pressione" : "Check blood pressure", patientId: p1, date: exp(0), time: "18:00", repeat: "daily", alarm: true, note: "" }
  ];
  return { user: { uid: me, name: fam.members[me].name, email: "demo@blistra.app" }, family: fam, meds, reminders, logs };
}
function demoStore() {
  let D;
  try { D = JSON.parse(localStorage.getItem(DEMO_KEY)); } catch (e) { D = null; }
  if (!D || !D.family) D = demoSeed();
  const persist = () => { try { localStorage.setItem(DEMO_KEY, JSON.stringify(D)); } catch (e) { } };
  const sync = () => {
    A.user = D.user; A.family = D.family; A.familyIds = D.family ? [D.family.id] : []; A.familyNames = D.family ? { [D.family.id]: D.family.name } : {};
    A.meds = D.meds; A.reminders = D.reminders; A.logs = D.logs; A.loading = false; persist(); emit();
  };
  return {
    kind: "demo",
    start() { sync(); },
    async signOut() { prefs.demo = false; savePrefs(); try { localStorage.removeItem(DEMO_KEY); } catch (e) { } location.reload(); },
    async createFamily(name, patientName) { D.family = { id: "demo", name, inviteCode: "DEMO42", memberIds: [D.user.uid], members: { [D.user.uid]: { name: D.user.name } }, patients: {}, createdBy: D.user.uid }; if (patientName) D.family.patients["p_" + uid(6)] = { name: patientName, color: PCOLORS[0] }; sync(); },
    async joinFamily() { throw { code: "bad_code" }; },
    async switchFamily() { },
    async leaveFamily() { D.family = null; D.meds = []; D.reminders = []; D.logs = {}; sync(); },
    async savePatient(p) { D.family.patients[p.id] = { name: p.name, color: p.color }; sync(); },
    async removePatient(pid) { delete D.family.patients[pid]; D.meds = D.meds.filter(m => m.patientId !== pid); sync(); },
    async saveMed(m) { const i = D.meds.findIndex(x => x.id === m.id); if (i >= 0) D.meds[i] = m; else D.meds.push(m); sync(); },
    async deleteMed(id) { D.meds = D.meds.filter(m => m.id !== id); Object.values(D.logs).forEach(day => Object.keys(day).forEach(k => { if (k.startsWith(id + "_")) delete day[k]; })); sync(); },
    async take(date, key, med, entry) { (D.logs[date] = D.logs[date] || {})[key] = entry; const m = D.meds.find(x => x.id === med.id); if (m && m.stock && typeof m.stock.count === "number") m.stock.count = Math.max(0, m.stock.count - (m.units || 1)); sync(); },
    async untake(date, key, med) { if (D.logs[date]) delete D.logs[date][key]; const m = D.meds.find(x => x.id === med.id); if (m && m.stock && typeof m.stock.count === "number") m.stock.count += (m.units || 1); sync(); },
    async addStock(medId, n) { const m = D.meds.find(x => x.id === medId); if (m) { m.stock = m.stock || { threshold: 7 }; m.stock.count = (m.stock.count || 0) + n; } sync(); },
    async saveReminder(r) { const i = D.reminders.findIndex(x => x.id === r.id); if (i >= 0) D.reminders[i] = r; else D.reminders.push(r); sync(); },
    async deleteReminder(id) { D.reminders = D.reminders.filter(r => r.id !== id); sync(); }
  };
}

/* ================= Firebase store ================= */
async function cloudStore() {
  const base = "https://www.gstatic.com/firebasejs/" + FIREBASE_VERSION + "/";
  const [appM, authM, fs] = await Promise.all([import(base + "firebase-app.js"), import(base + "firebase-auth.js"), import(base + "firebase-firestore.js")]);
  const app = appM.initializeApp(firebaseConfig);
  const auth = authM.getAuth(app);
  const db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) });
  const { doc, collection, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc, writeBatch, arrayUnion, arrayRemove, increment, deleteField, query, where, documentId, serverTimestamp } = fs;
  let famUnsubs = [], userUnsub = null, currentFid = undefined;
  const onErr = e => { A.error = e.code || e.message; emit(); };
  const clearFam = () => { famUnsubs.forEach(u => u()); famUnsubs = []; };

  function subscribeFamily(fid) {
    clearFam(); currentFid = fid; A.family = null; A.meds = []; A.reminders = []; A.logs = {}; A.familyLoading = !!fid;
    if (!fid) { emit(); return; }
    prefs.lastFamily = fid; savePrefs();
    famUnsubs.push(onSnapshot(doc(db, "families", fid), s => { A.familyLoading = false; A.family = s.exists() ? Object.assign({ id: s.id }, s.data()) : null; if (A.family) A.familyNames[fid] = A.family.name; emit(); }, onErr));
    famUnsubs.push(onSnapshot(collection(db, "families", fid, "meds"), qs => { A.meds = qs.docs.map(d => Object.assign({ id: d.id }, d.data())); emit(); }, onErr));
    famUnsubs.push(onSnapshot(collection(db, "families", fid, "reminders"), qs => { A.reminders = qs.docs.map(d => Object.assign({ id: d.id }, d.data())); emit(); }, onErr));
    const since = ymd(addDays(new Date(), -8));
    famUnsubs.push(onSnapshot(query(collection(db, "families", fid, "logs"), where(documentId(), ">=", since)), qs => { const out = {}; qs.docs.forEach(d => out[d.id] = (d.data().entries || {})); A.logs = out; emit(); }, onErr));
  }

  authM.onAuthStateChanged(auth, async u => {
    clearFam(); if (userUnsub) { userUnsub(); userUnsub = null; } currentFid = undefined;
    if (!u) { Object.assign(A, { user: null, family: null, familyIds: [], meds: [], reminders: [], logs: {}, loading: false }); emit(); return; }
    A.user = { uid: u.uid, name: u.displayName || (u.email || "").split("@")[0], email: u.email || "" };
    const uref = doc(db, "users", u.uid);
    try { const s = await getDoc(uref); if (!s.exists()) await setDoc(uref, { name: A.user.name, email: A.user.email, familyIds: [] }); } catch (e) { onErr(e); }
    userUnsub = onSnapshot(uref, async s => {
      const d = s.data() || {};
      A.familyIds = d.familyIds || [];
      if (d.name) A.user.name = d.name;
      const want = A.familyIds.includes(prefs.lastFamily) ? prefs.lastFamily : (A.familyIds[0] || null);
      if (want !== currentFid) subscribeFamily(want);
      A.loading = false; emit();
      for (const fid of A.familyIds) if (!A.familyNames[fid]) { try { const f = await getDoc(doc(db, "families", fid)); if (f.exists()) { A.familyNames[fid] = f.data().name; emit(); } } catch (e) { } }
    }, onErr);
  });

  const me = () => auth.currentUser.uid;
  const fid = () => A.family && A.family.id;
  const strip = o => { const c = clone(o); delete c.id; c.updatedAt = Date.now(); return c; };
  return {
    kind: "cloud",
    start() { },
    async signUp(name, email, pw) { const c = await authM.createUserWithEmailAndPassword(auth, email, pw); await authM.updateProfile(c.user, { displayName: name }); A.user && (A.user.name = name); await setDoc(doc(db, "users", c.user.uid), { name, email, familyIds: [] }, { merge: true }); },
    async signIn(email, pw) { await authM.signInWithEmailAndPassword(auth, email, pw); },
    async google() { await authM.signInWithPopup(auth, new authM.GoogleAuthProvider()); },
    async reset(email) { await authM.sendPasswordResetEmail(auth, email); },
    async signOut() { await authM.signOut(auth); },
    async createFamily(name, patientName) {
      const f = doc(collection(db, "families")); const code = inviteCode();
      const patients = {}; if (patientName) patients["p_" + uid(8)] = { name: patientName, color: PCOLORS[0] };
      const b = writeBatch(db);
      b.set(f, { name, inviteCode: code, memberIds: [me()], members: { [me()]: { name: A.user.name } }, patients, createdBy: me(), createdAt: serverTimestamp() });
      b.set(doc(db, "invites", code), { familyId: f.id, createdBy: me() });
      b.update(doc(db, "users", me()), { familyIds: arrayUnion(f.id) });
      prefs.lastFamily = f.id; savePrefs();
      await b.commit();
    },
    async joinFamily(code) {
      code = String(code || "").trim().toUpperCase();
      const inv = await getDoc(doc(db, "invites", code));
      if (!inv.exists()) throw { code: "bad_code" };
      const famId = inv.data().familyId;
      await updateDoc(doc(db, "families", famId), { memberIds: arrayUnion(me()), ["members." + me()]: { name: A.user.name }, joinCode: code });
      prefs.lastFamily = famId; savePrefs();
      await updateDoc(doc(db, "users", me()), { familyIds: arrayUnion(famId) });
    },
    async switchFamily(id) { prefs.lastFamily = id; savePrefs(); subscribeFamily(id); },
    async leaveFamily() { const f = fid(); await updateDoc(doc(db, "families", f), { memberIds: arrayRemove(me()), ["members." + me()]: deleteField() }); await updateDoc(doc(db, "users", me()), { familyIds: arrayRemove(f) }); prefs.lastFamily = null; savePrefs(); },
    async savePatient(p) { await updateDoc(doc(db, "families", fid()), { ["patients." + p.id]: { name: p.name, color: p.color } }); },
    async removePatient(pid) { const b = writeBatch(db); b.update(doc(db, "families", fid()), { ["patients." + pid]: deleteField() }); A.meds.filter(m => m.patientId === pid).forEach(m => b.delete(doc(db, "families", fid(), "meds", m.id))); await b.commit(); },
    async saveMed(m) { await setDoc(doc(db, "families", fid(), "meds", m.id), strip(m)); },
    async deleteMed(id) { await deleteDoc(doc(db, "families", fid(), "meds", id)); },
    async take(date, key, med, entry) {
      const b = writeBatch(db);
      b.set(doc(db, "families", fid(), "logs", date), { entries: { [key]: entry } }, { merge: true });
      if (med.stock && typeof med.stock.count === "number") b.update(doc(db, "families", fid(), "meds", med.id), { "stock.count": increment(-(med.units || 1)) });
      await b.commit();
    },
    async untake(date, key, med) {
      const b = writeBatch(db);
      b.update(doc(db, "families", fid(), "logs", date), { ["entries." + key]: deleteField() });
      if (med.stock && typeof med.stock.count === "number") b.update(doc(db, "families", fid(), "meds", med.id), { "stock.count": increment(med.units || 1) });
      await b.commit();
    },
    async addStock(medId, n) { await updateDoc(doc(db, "families", fid(), "meds", medId), { "stock.count": increment(n) }); },
    async saveReminder(r) { await setDoc(doc(db, "families", fid(), "reminders", r.id), strip(r)); },
    async deleteReminder(id) { await deleteDoc(doc(db, "families", fid(), "reminders", id)); }
  };
}

/* ================= domain logic ================= */
function patients() { const p = (A.family && A.family.patients) || {}; return Object.keys(p).map(id => Object.assign({ id }, p[id])).sort((a, b) => a.name.localeCompare(b.name)); }
function patientById(id) { const p = (A.family && A.family.patients) || {}; return p[id] ? Object.assign({ id }, p[id]) : null; }
function currentPatientId() {
  if (prefs.lock && patientById(prefs.lock.patientId)) return prefs.lock.patientId;
  const ps = patients();
  if (prefs.patientId && ps.some(p => p.id === prefs.patientId)) return prefs.patientId;
  return ps[0] ? ps[0].id : null;
}
function logFor(date, key) { return (A.logs[date] || {})[key] || null; }
function dosesFor(date, pid) {
  const day = dow(date), d = ymd(date), out = [];
  A.meds.forEach(m => { if ((!pid || m.patientId === pid) && (m.days || []).includes(day)) (m.times || []).forEach(t => out.push({ m, t, date: d, key: entryKey(m.id, t), deadline: (m.deadlines || {})[t] || "" })); });
  out.sort((a, b) => toMin(a.t) - toMin(b.t) || a.m.name.localeCompare(b.m.name));
  return out;
}
function statusOf(dose, nowMin) {
  if (logFor(dose.date, dose.key)) return "taken";
  const t = toMin(dose.t), dl = dose.deadline ? toMin(dose.deadline) : null;
  if (nowMin < t - 30) return "later";
  const end = dl != null && dl > t ? dl : t + 90;
  if (nowMin <= end) return "due";
  return dl != null && dl > t ? "missed" : "late";
}
function dailyUnits(m) { return (m.units || 1) * (m.times || []).length * (m.days || []).length / 7; }
function daysLeft(m) { if (!m.stock || typeof m.stock.count !== "number") return null; const du = dailyUnits(m); if (!du) return null; return Math.floor(m.stock.count / du); }
function stockLevel(m) { const d = daysLeft(m); if (d == null) return null; if (m.stock.count <= 0) return "critical"; if (d <= (m.stock.threshold || 7)) return "warn"; return "ok"; }
function rxDays(m) { if (!m.rx || !m.rx.expires) return null; return daysBetween(new Date(), parseYmd(m.rx.expires)); }
function alerts(pid) {
  const t = L(), out = [], now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
  A.meds.filter(m => !pid || m.patientId === pid).forEach(m => {
    const p = patientById(m.patientId); if (!p) return;
    const lvl = stockLevel(m), d = daysLeft(m);
    if (lvl === "critical") out.push({ type: "stock", level: "critical", p, m, title: fmt(t.a_out, { m: m.name }), sub: t.a_low_sub });
    else if (lvl === "warn") out.push({ type: "stock", level: "warn", p, m, title: fmt(t.a_low, { m: m.name, d }), sub: t.a_low_sub });
    const r = rxDays(m);
    if (r != null && r < 0) out.push({ type: "rx", level: "critical", p, m, title: fmt(t.a_rx_exp, { m: m.name }), sub: t.a_rx_sub });
    else if (r != null && r <= 7) out.push({ type: "rx", level: "warn", p, m, title: fmt(t.a_rx_soon, { m: m.name, d: r }), sub: t.a_rx_sub });
  });
  patients().filter(p => !pid || p.id === pid).forEach(p => {
    dosesFor(now, p.id).forEach(d => {
      const st = statusOf(d, nowMin);
      if (st === "missed") out.push({ type: "dose", level: "critical", p, m: d.m, title: fmt(t.a_missed, { m: d.m.name, t: d.deadline }), sub: "" });
      else if (st === "late") out.push({ type: "dose", level: "warn", p, m: d.m, title: fmt(t.a_late, { m: d.m.name, t: d.t }), sub: "" });
    });
  });
  const rank = { critical: 0, warn: 1 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}
function nextOccurrence(r, from) {
  if (!r.date || !r.time) return null;
  let d = parseYmd(r.date); const [h, mi] = r.time.split(":").map(Number); d.setHours(h, mi, 0, 0);
  const start = new Date(from); start.setSeconds(0, 0);
  if (r.repeat === "none" || !r.repeat) return d >= addDays(start, -1) ? d : null;
  let guard = 0;
  while (d < start && guard++ < 800) {
    if (r.repeat === "daily") d = addDays(d, 1);
    else if (r.repeat === "weekly") d = addDays(d, 7);
    else if (r.repeat === "monthly") { const x = new Date(d); x.setMonth(x.getMonth() + 1); d = x; }
  }
  return d;
}
function remindersOn(date) {
  const day0 = parseYmd(ymd(date)), out = [];
  A.reminders.forEach(r => { const n = nextOccurrence(r, day0); if (n && ymd(n) === ymd(date)) out.push({ r, at: n }); });
  return out.sort((a, b) => a.at - b.at);
}

/* ================= graphics ================= */
function pillSVG(color, shape, size) {
  size = size || 40; const s = "#5b6b66"; let body;
  if (shape === "capsule") body = '<rect x="4" y="13" width="32" height="14" rx="7" fill="' + color + '" stroke="' + s + '" stroke-width="1.5"/><path d="M20 13 V27" stroke="' + s + '" stroke-width="1.5"/><path d="M11 13 h9 v14 h-9 a7 7 0 0 1 0 -14z" fill="#ffffff" fill-opacity="0.45"/>';
  else if (shape === "oval") body = '<ellipse cx="20" cy="20" rx="16" ry="10" fill="' + color + '" stroke="' + s + '" stroke-width="1.5"/><path d="M8 20 H32" stroke="' + s + '" stroke-width="1.2" stroke-opacity="0.6"/>';
  else body = '<circle cx="20" cy="20" r="13" fill="' + color + '" stroke="' + s + '" stroke-width="1.5"/><path d="M20 9 V31" stroke="' + s + '" stroke-width="1.2" stroke-opacity="0.6"/>';
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 40 40" aria-hidden="true">' + body + '</svg>';
}
function medVisual(m, size, photoOk) { return photoOk !== false && m.photo ? '<img src="' + m.photo + '" alt="">' : pillSVG(m.color || "#FFFFFF", m.shape || "round", size); }
function brandMark(size) {
  size = size || 36;
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="5" width="34" height="30" rx="9" fill="#117A58"/>' +
    '<circle cx="13.5" cy="15" r="5.2" fill="#fff"/><circle cx="26.5" cy="15" r="5.2" fill="#fff"/><circle cx="13.5" cy="26" r="5.2" fill="#0B4D39"/><circle cx="26.5" cy="26" r="5.2" fill="#F2B134"/></svg>';
}
function emptyPocket(size) {
  size = size || 78; const pts = [];
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, r = i % 2 ? 31 : 36; pts.push((40 + r * Math.cos(a)).toFixed(1) + "," + (40 + r * Math.sin(a)).toFixed(1)); }
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 80 80" aria-hidden="true"><polygon points="' + pts.join(" ") + '" fill="var(--hole)" opacity=".55"/><circle cx="40" cy="40" r="25" fill="var(--hole)" opacity=".5"/><path d="M29 41l8 8 15-17" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}
function blisterArt() {
  const cells = [["#F6D365", "oval", 1], ["#F4A7B9", "round", 1], ["#FFFFFF", "oval", 1], ["#8FB8E8", "round", 0], ["#F2A65A", "capsule", 0], ["#A8D5A2", "round", 0], ["#F4A7B9", "round", 0], ["#FFFFFF", "oval", 0]];
  let g = "";
  cells.forEach((c, i) => {
    const x = 48 + (i % 4) * 88, y = 62 + Math.floor(i / 4) * 92;
    if (c[2]) { const pts = []; for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, r = k % 2 ? 27 : 32; pts.push((x + r * Math.cos(a)).toFixed(1) + "," + (y + r * Math.sin(a)).toFixed(1)); } g += '<polygon points="' + pts.join(" ") + '" fill="#6F7D78" opacity=".55"/><circle cx="' + x + '" cy="' + y + '" r="22" fill="#55625E" opacity=".6"/>'; }
    else g += '<circle cx="' + x + '" cy="' + y + '" r="33" fill="url(#dome)" stroke="#97A5A0" stroke-width="1.2"/><g transform="translate(' + (x - 22) + ' ' + (y - 22) + ') scale(1.1)">' + pillSVG(c[0], c[1], 40).replace(/<\/?svg[^>]*>/g, "") + '</g>' + (i === 3 ? '<circle cx="' + x + '" cy="' + y + '" r="37" fill="none" stroke="#F2B134" stroke-width="4"/>' : "");
  });
  return '<svg class="art" viewBox="0 0 400 250" role="img" aria-label="Blister"><defs><linearGradient id="foil" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7F9F8"/><stop offset=".45" stop-color="#DDE3E0"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset=".56" stop-color="#D3DAD7"/><stop offset="1" stop-color="#BAC4C0"/></linearGradient><radialGradient id="dome" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#EEF2F0" stop-opacity=".9"/><stop offset="1" stop-color="#B8C3BF"/></radialGradient></defs><g transform="rotate(-6 200 125)"><rect x="4" y="18" width="392" height="200" rx="22" fill="url(#foil)" stroke="#A9B5B0"/><path d="M4 116 H396" stroke="#A9B5B0" stroke-dasharray="3 5"/>' + g + '</g></svg>';
}
function avatar(name, color, cls) { return '<span class="av ' + (cls || "") + '" style="background:' + (color || "#56685F") + '">' + esc((name || "?").trim().charAt(0).toUpperCase()) + '</span>'; }
const ICON = {
  bell: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
  people: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M14 20c0-2.5 1.5-4 3-4s3 1.5 3 4"/></svg>',
  box: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg>',
  rx: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  info: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
  lock: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
};

/* ================= routing + shell ================= */
const ROUTES = ["today", "circle", "meds", "reminders", "info", "week"];
function route() { const h = (location.hash || "").slice(1); return ROUTES.includes(h) ? h : "today"; }
function header(showTabs) {
  const t = L(), r = route();
  const crit = A.family ? alerts().filter(a => a.level === "critical").length : 0;
  const tabs = ["today", "circle", "meds", "reminders", "info"].map(k => '<a href="#' + k + '"' + ((k === r || (r === "week" && k === "meds")) ? ' aria-current="page"' : "") + '>' + t.tabs[k] + (k === "circle" && crit ? '<span class="dot" aria-hidden="true"></span>' : "") + '</a>').join("");
  return '<header class="top"><a class="brand" href="#today">' + brandMark(36) + '<b>Blis<i>tra</i></b><small>' + VERSION + '</small></a>' +
    '<div class="lang" role="group" aria-label="Language"><button data-lang="it" aria-pressed="' + (prefs.lang === "it") + '">IT</button><button data-lang="en" aria-pressed="' + (prefs.lang === "en") + '">EN</button></div></header>' +
    (A.mode === "demo" && !prefs.lock ? '<div class="demo-bar"><span>' + t.demo_bar + '</span><button data-demo-exit>' + t.demo_exit + '</button></div>' : "") +
    (showTabs ? '<nav class="tabs">' + tabs + '</nav>' : "");
}
function render() {
  document.documentElement.lang = prefs.lang;
  const app = document.getElementById("app");
  const scrollY = window.scrollY;
  let html;
  if (A.loading) html = header(false) + '<div class="loading">…</div>';
  else if (!A.user) html = header(false) + (route() === "info" ? viewInfo(true) : viewAuth());
  else if (!A.family && A.familyLoading) html = header(false) + '<div class="loading">…</div>';
  else if (!A.family) html = header(false) + (route() === "info" ? viewInfo(true) : viewOnboard());
  else if (prefs.lock) html = header(false) + viewToday(true);
  else {
    const r = route();
    const body = r === "circle" ? viewCircle() : r === "meds" ? viewMeds() : r === "reminders" ? viewReminders() : r === "info" ? viewInfo(false) : r === "week" ? viewWeek() : viewToday(false);
    html = header(true) + body;
  }
  if (A.error) html += '<p class="err small" role="alert" style="margin-top:12px">' + esc(errText(A.error)) + '</p>';
  app.innerHTML = html;
  window.scrollTo(0, scrollY);
}
function errText(e) { const t = L(); const code = (e && e.code) || e; return t.err[code] || (typeof code === "string" && code.length < 140 ? code : t.err.generic); }

/* ================= views ================= */
function viewAuth() {
  const t = L(), cloud = !!firebaseConfig;
  return '<div class="stack" style="gap:18px">' +
    '<section class="hero"><div class="stack" style="gap:14px"><span class="eyebrow">Blistra ' + VERSION + '</span><h1>' + (prefs.lang === "it" ? "Ha preso le pastiglie <em>stamattina?</em>" : "Did she take her pills <em>this morning?</em>") + '</h1><p>' + t.hero_lead + '</p></div>' + blisterArt() + '</section>' +
    (cloud ? authForm() : '<div class="card"><p class="muted">' + t.no_cloud + '</p></div>') +
    '<div class="stack" style="gap:8px"><button class="btn ' + (cloud ? "" : "primary ") + 'wide" data-demo>' + t.try_demo + '</button><a class="btn ghost wide" href="#info">' + t.what_is + '</a></div></div>';
}
let authMode = "login";
function authForm() {
  const t = L(), up = authMode === "signup";
  return '<section class="card stack"><div class="seg" role="group"><button data-auth-mode="login" aria-pressed="' + !up + '">' + t.login + '</button><button data-auth-mode="signup" aria-pressed="' + up + '">' + t.signup + '</button></div>' +
    '<form id="authform" class="stack" novalidate>' +
    (up ? '<label class="f" for="a-name">' + t.your_name + '<input type="text" id="a-name" autocomplete="name" required maxlength="40"></label>' : "") +
    '<label class="f" for="a-email">' + t.email + '<input type="email" id="a-email" autocomplete="email" required></label>' +
    '<label class="f" for="a-pw">' + t.password + '<input type="password" id="a-pw" autocomplete="' + (up ? "new-password" : "current-password") + '" required minlength="6"></label>' +
    '<p id="a-err" class="err small" role="alert"></p>' +
    '<button class="btn primary wide" type="submit">' + (up ? t.signup : t.login) + '</button></form>' +
    '<button class="btn wide" data-google>' + '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>' + t.google + '</button>' +
    (!up ? '<button class="btn ghost sm" data-forgot style="align-self:center">' + t.forgot + '</button>' : "") + '</section>';
}
function viewOnboard() {
  const t = L();
  return '<div class="stack" style="gap:16px"><div><h1>' + t.onboard_title + '</h1><p class="muted" style="margin-top:6px">' + t.onboard_lead + '</p></div>' +
    '<form id="createform" class="card stack"><label class="f" for="c-name">' + t.circle_name + '<input type="text" id="c-name" placeholder="' + t.circle_name_ph + '" maxlength="40" required></label>' +
    '<label class="f" for="c-pat">' + t.first_patient + '<input type="text" id="c-pat" placeholder="' + t.first_patient_ph + '" maxlength="30"></label><p id="c-err" class="err small" role="alert"></p><button class="btn primary" type="submit">' + t.create + '</button></form>' +
    '<form id="joinform" class="card stack"><h2>' + t.or_join + '</h2><label class="f" for="j-code">' + t.invite_code + '<input type="text" id="j-code" maxlength="6" autocomplete="off" style="text-transform:uppercase;letter-spacing:.2em;font-weight:700"></label><p id="j-err" class="err small" role="alert"></p><button class="btn" type="submit">' + t.join + '</button></form>' +
    (store && store.kind === "cloud" ? '<button class="btn ghost" data-signout>' + t.signout + '</button>' : "") + '</div>';
}
function patientChips(sel) {
  const ps = patients(); if (ps.length < 2) return "";
  return '<div class="pchips" role="group">' + ps.map(p => '<button class="pchip" data-patient="' + p.id + '" aria-pressed="' + (p.id === sel) + '">' + avatar(p.name, p.color) + esc(p.name) + '</button>').join("") + '</div>';
}
function viewToday(locked) {
  const t = L(), now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), hr = now.getHours();
  const pid = currentPatientId(), p = patientById(pid);
  if (!p) return '<div class="card"><p>' + t.no_patients + '</p></div>';
  const hello = t.hello[hr < 5 ? 0 : hr < 13 ? 1 : hr < 18 ? 2 : 3];
  const dateStr = t.days_long[dow(now)] + " " + now.getDate() + " " + t.months[now.getMonth()];
  const doses = dosesFor(now, pid), takenN = doses.filter(d => logFor(d.date, d.key)).length;
  const C = 2 * Math.PI * 27, frac = doses.length ? takenN / doses.length : 0;
  const ring = doses.length ? '<div class="ring"><svg width="74" height="74" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="7"/><circle cx="32" cy="32" r="27" fill="none" stroke="#F2B134" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (C * frac).toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 32 32)"/><text x="32" y="38" text-anchor="middle" font-family="Archivo, sans-serif" font-weight="900" font-size="17" fill="#fff">' + takenN + '/' + doses.length + '</text></svg><small>' + t.ring_sub + '</small></div>' : "";
  const open = doses.filter(d => ["due", "late", "missed"].includes(statusOf(d, nowMin)));
  let nowCard;
  if (!doses.length) nowCard = '<div class="card now clear"><p class="dose">' + fmt(t.no_meds, { p: esc(p.name) }) + '</p></div>';
  else if (open.length) {
    const d = open[0], st = statusOf(d, nowMin), m = d.m, foodTxt = t.food[m.food] || "";
    const label = st === "due" ? t.now_due : st === "missed" ? fmt(t.now_missed, { t: d.deadline }) : t.now_late;
    nowCard = '<section class="card now ' + (st === "due" ? "due" : "late") + ' stack rise" aria-live="polite">' +
      '<span class="tag tag-' + (st === "due" ? "due" : "late") + '" style="align-self:flex-start">' + label + ' · <span class="num">' + d.t + '</span></span>' +
      '<div class="row" style="gap:16px"><div class="disc">' + medVisual(m, 70) + '</div><div><div class="medname">' + esc(m.name) + '</div><div class="dose">' + esc(m.dose) + '</div></div></div>' +
      (foodTxt ? '<div class="food">🍽 ' + foodTxt + '</div>' : "") + (m.note ? '<div class="muted">' + esc(m.note) + '</div>' : "") +
      (st !== "due" ? '<div class="small" style="color:var(--late)">' + fmt(t.late_hint, { t: d.t }) + '</div>' : "") +
      '<button class="btn primary big" data-take="' + d.key + '" data-med="' + m.id + '">' + t.taken_btn + '</button>' +
      '<div class="row between wrapx">' + (open.length > 1 ? '<span class="muted small">' + fmt(t.more_now, { n: open.length - 1 }) + '</span>' : "<span></span>") + '<button class="btn ghost sm" data-sheet="' + m.id + '">' + ICON.info.replace('width="26" height="26"', 'width="18" height="18"') + t.info_btn + '</button></div></section>';
  } else {
    const next = doses.find(d => statusOf(d, nowMin) === "later");
    nowCard = '<section class="card now clear stack rise"><div class="row" style="gap:14px"><div style="flex:none">' + emptyPocket(64) + '</div><div class="clearbig">' + t.all_clear + '</div></div><p class="dose">' + (next ? fmt(t.next_at, { m: esc(next.m.name), t: next.t }) : t.no_more) + '</p></section>';
  }
  const pockets = doses.map(d => {
    const st = statusOf(d, nowMin), lg = logFor(d.date, d.key);
    const label = st === "taken" ? fmt(t.st.taken, { t: lg.at }) : t.st[st];
    const cls = st === "missed" ? "late" : st;
    const inner = st === "taken" ? emptyPocket(78) : medVisual(d.m, 50);
    const act = st === "taken" ? ' data-pocket-info="' + d.key + '"' : (st === "later" ? ' data-sheet="' + d.m.id + '"' : ' data-take="' + d.key + '" data-med="' + d.m.id + '"');
    return '<button class="pocket ' + cls + '" data-pocket="' + d.key + '"' + act + ' aria-label="' + esc(d.t + " " + d.m.name + ", " + label) + '"><span class="t num">' + d.t + '</span><span class="dome">' + inner + '</span><span class="nm">' + esc(d.m.name) + '</span><span class="st">' + label + '</span></button>';
  }).join("");
  const rems = remindersOn(now).filter(x => !x.r.patientId || x.r.patientId === pid);
  const al = locked ? [] : alerts(pid).filter(a => a.type !== "dose");
  const lg = t.legend;
  return (locked ? "" : patientChips(pid)) +
    '<section class="band"><div class="clock num">' + hm(now) + '</div><h1>' + hello + ", " + esc(p.name) + '</h1><div class="date">' + dateStr + '</div>' + ring + '</section>' +
    '<div class="stack lift">' + nowCard +
    (al.length ? alertList(al.slice(0, 3), true) : "") +
    (doses.length ? '<section><div class="blister-head"><h2>' + t.blister + '</h2><span class="small muted">' + t.tap_hint + '</span></div><div class="foil"><div class="pockets">' + pockets + '</div></div>' +
      '<div class="legend"><span><i style="background:var(--glow)"></i>' + lg[0] + '</span><span><i style="background:var(--late)"></i>' + lg[1] + '</span><span><i style="border:1px solid var(--muted)"></i>' + lg[2] + '</span><span><i style="background:var(--accent)"></i>' + lg[3] + '</span></div></section>' : "") +
    (rems.length ? '<section class="card stack" style="gap:8px"><h2>' + t.today_reminders + '</h2>' + rems.map(x => '<div class="row between"><span><b class="num">' + hm(x.at) + '</b> · ' + esc(x.r.title) + '</span>' + (x.r.alarm ? '<span class="tag tag-ok">' + t.alarm_tag + '</span>' : "") + '</div>').join("") + '</section>' : "") +
    '</div>' + (locked ? '<div class="exit-lock"><button data-unlock>' + t.exit_lock + '</button></div>' : "");
}
function alertList(list, compact) {
  const t = L();
  if (!list.length) return '<p class="muted">' + t.no_alerts + '</p>';
  return '<div class="alerts">' + list.map(a => '<div class="alert ' + a.level + '"><span class="bar"></span><div><b>' + esc(a.title) + '</b><span class="small muted">' + (patients().length > 1 ? fmt(t.for_p, { p: esc(a.p.name) }) + (a.sub ? " · " : "") : "") + esc(a.sub) + '</span></div>' +
    (a.m ? '<button class="btn ghost sm" data-edit="' + a.m.id + '">' + (compact ? "›" : t.edit) + '</button>' : "") + '</div>').join("") + '</div>';
}
function viewCircle() {
  const t = L(), now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes(), f = A.family;
  const pcards = patients().map(p => {
    const doses = dosesFor(now, p.id), tk = doses.filter(d => logFor(d.date, d.key)).length;
    const bad = doses.filter(d => ["missed", "late"].includes(statusOf(d, nowMin))).length;
    const pct = doses.length ? Math.round(tk / doses.length * 100) : 0;
    return '<div class="card pcard">' + avatar(p.name, p.color, "lg") + '<div class="stack" style="gap:8px"><div class="row between wrapx"><h2>' + esc(p.name) + '</h2>' + (bad ? '<span class="tag tag-late">' + bad + ' ' + t.st.late.toLowerCase() + '</span>' : (doses.length && tk === doses.length ? '<span class="tag tag-ok">✓</span>' : "")) + '</div>' +
      '<div class="small muted">' + fmt(t.today_progress, { a: tk, b: doses.length }) + '</div><div class="progress"><span style="width:' + pct + '%"></span></div>' +
      '<div class="row wrapx" style="gap:8px"><button class="btn sm primary" data-open-patient="' + p.id + '">' + t.open_day + '</button><button class="btn sm" data-lock-setup="' + p.id + '">' + ICON.lock.replace('width="26" height="26"', 'width="16" height="16"') + fmt(t.lock_on, { p: esc(p.name) }) + '</button><button class="btn sm ghost" data-edit-patient="' + p.id + '">' + t.edit + '</button></div></div></div>';
  }).join("");
  const feed = [];
  [ymd(now), ymd(addDays(now, -1))].forEach(dk => Object.entries(A.logs[dk] || {}).forEach(([k, e]) => { const m = A.meds.find(x => k.startsWith(x.id + "_")); if (m) feed.push({ e, m, dk }); }));
  feed.sort((a, b) => (b.e.ts || 0) - (a.e.ts || 0));
  const feedHtml = feed.slice(0, 8).map(x => { const p = patientById(x.m.patientId) || { name: "?" }; const self = x.e.by === "device"; return '<li>' + avatar(x.e.byName, self ? p.color : "#56685F") + '<div><b>' + esc(x.e.byName) + '</b>' + (self ? ' <span class="muted small">(' + t.by_device + ')</span>' : "") + '<div class="small muted">' + esc(x.m.name) + (self ? "" : " · " + esc(p.name)) + '</div></div><span class="small muted num">' + (x.dk === ymd(now) ? "" : (prefs.lang === "it" ? "ieri " : "yday ")) + esc(x.e.at) + '</span></li>'; }).join("");
  const members = Object.entries(f.members || {}).map(([id, m]) => '<li>' + avatar(m.name, "#0B4D39") + '<div><b>' + esc(m.name) + '</b>' + (id === A.user.uid ? ' <span class="muted small">(' + (prefs.lang === "it" ? "tu" : "you") + ')</span>' : "") + '</div><span></span></li>').join("");
  const others = A.familyIds.filter(id => id !== f.id);
  const notifOk = prefs.alarms && "Notification" in window && Notification.permission === "granted";
  const shareUrl = location.origin + location.pathname;
  return '<div class="stack" style="gap:18px"><div class="row between wrapx"><div><span class="eyebrow">' + t.circle + '</span><h1>' + esc(f.name) + '</h1></div></div>' +
    '<section class="stack" style="gap:10px"><div class="row between"><h2>' + t.people + '</h2><button class="btn sm" data-add-patient>' + t.add_patient + '</button></div>' + (pcards || '<p class="muted">' + t.no_patients + '</p>') + '</section>' +
    '<section class="stack" style="gap:10px"><h2>' + t.alerts + '</h2>' + alertList(alerts(), false) + '</section>' +
    '<section class="card"><h2>' + t.activity + '</h2>' + (feedHtml ? '<ul class="feed list">' + feedHtml + '</ul>' : '<p class="muted" style="margin-top:8px">' + t.no_activity + '</p>') + '</section>' +
    '<section class="card stack"><h2>' + t.members + '</h2><ul class="feed list">' + members + '</ul><div class="stack" style="gap:8px"><h3>' + t.invite + '</h3><p class="small muted">' + t.invite_desc + '</p><div class="code num">' + esc(f.inviteCode || "—") + '</div>' +
      '<button class="btn" data-copy="' + esc(fmt(t.invite_text, { c: f.inviteCode, u: shareUrl })) + '">' + t.copy + '</button></div></section>' +
    '<section class="card stack"><h2>' + t.device + '</h2>' +
      '<div class="stack" style="gap:6px"><h3>' + t.alarms_on_device + '</h3><p class="small muted">' + t.alarms_desc + '</p><div class="row wrapx" style="gap:8px">' + (notifOk ? '<span class="tag tag-ok">' + t.alarms_ok + '</span>' : '<button class="btn primary sm" data-enable-alarms>' + t.enable_alarms + '</button>') + '<button class="btn sm" data-test-alarm>' + t.test_alarm + '</button></div></div>' +
      '<div class="stack" style="gap:6px"><h3>' + t.calendar + '</h3><p class="small muted">' + t.calendar_desc + '</p><div><button class="btn sm" data-ics>' + t.calendar + ' (.ics)</button></div></div>' +
      (others.length ? '<div class="stack" style="gap:6px"><h3>' + t.switch_circle + '</h3><div class="chips">' + others.map(id => '<button class="chip" data-switch="' + id + '">' + esc(A.familyNames[id] || id) + '</button>').join("") + '</div></div>' : "") +
      '<div class="row wrapx" style="gap:8px">' + (store.kind === "cloud" ? '<button class="btn sm" data-new-circle>' + t.new_circle + '</button>' : "") + '<button class="btn sm danger ghost" data-leave>' + t.leave + '</button>' + (store.kind === "cloud" ? '<button class="btn sm ghost" data-signout>' + t.signout + '</button>' : "") + '</div></section></div>';
}
function viewMeds() {
  const t = L(), ps = patients();
  const groups = ps.map(p => {
    const meds = A.meds.filter(m => m.patientId === p.id).sort((a, b) => a.name.localeCompare(b.name));
    const rows = meds.map(m => {
      const lvl = stockLevel(m), dl = daysLeft(m), r = rxDays(m), cap = m.stock && m.stock.box ? Math.max(m.stock.box, m.stock.count) : (m.stock && m.stock.count) || 1;
      const daysTxt = (m.days || []).length === 7 ? t.every_day : (m.days || []).map(i => t.days_short[i]).join(", ");
      const times = (m.times || []).map(x => x + ((m.deadlines || {})[x] ? " → " + m.deadlines[x] : "")).join(", ");
      return '<div class="item"><button class="thumb" data-sheet="' + m.id + '" aria-label="' + esc(t.info_btn + ": " + m.name) + '" style="padding:0">' + medVisual(m, 40) + '</button><div><div class="row wrapx" style="gap:8px"><b>' + esc(m.name) + '</b>' + (m.alarm ? '<span class="tag tag-ok">⏰ ' + t.alarm_tag + '</span>' : "") + '</div>' +
        '<div class="meta">' + esc(m.dose) + ' · <span class="num">' + times + '</span> · ' + daysTxt + (t.food[m.food] ? " · " + t.food[m.food] : "") + '</div>' +
        (lvl ? '<div class="meta"><span class="tag tag-' + lvl + '">' + t.stock + '</span> ' + fmt(t.stock_left, { n: m.stock.count, d: dl }) + '</div><div class="stockbar"><span class="' + lvl + '" style="width:' + Math.min(100, Math.round(m.stock.count / cap * 100)) + '%"></span></div>' : '<div class="meta">' + t.stock_none + '</div>') +
        (m.rx && m.rx.expires ? '<div class="meta"><span class="tag tag-' + (r < 0 ? "critical" : r <= 7 ? "warn" : "ok") + '">' + t.rx + '</span> ' + fmt(t.rx_until, { d: fmtDate(m.rx.expires) }) + (m.rx.doctor ? " · " + esc(m.rx.doctor) : "") + '</div>' : "") +
        '</div><div class="stack" style="gap:6px;align-items:flex-end"><button class="btn sm" data-edit="' + m.id + '">' + t.edit + '</button>' + (m.stock && m.stock.box ? '<button class="btn sm ghost" data-add-box="' + m.id + '">' + t.add_box + '</button>' : "") + '</div></div>';
    }).join("");
    return '<section class="card"><div class="row" style="gap:10px;margin-bottom:4px">' + avatar(p.name, p.color) + '<h2>' + esc(p.name) + '</h2></div><div class="list">' + (rows || '<p class="muted" style="padding:10px 0">' + fmt(t.no_meds, { p: esc(p.name) }) + '</p>') + '</div></section>';
  }).join("");
  return '<div class="stack" style="gap:16px"><div class="row between wrapx"><h1>' + t.meds + '</h1><button class="btn primary" data-add-med>' + t.add_med + '</button></div>' + (groups || '<p class="muted">' + t.no_patients + '</p>') +
    '<a class="btn ghost" href="#week">' + t.week_sheet + ' →</a></div>';
}
function fmtDate(s) { if (!s) return ""; const d = parseYmd(s); return d.getDate() + " " + L().months[d.getMonth()].slice(0, 3) + " " + d.getFullYear(); }
function viewReminders() {
  const t = L(), now = new Date();
  const today0 = parseYmd(ymd(now));
  const list = A.reminders.map(r => ({ r, at: nextOccurrence(r, today0) })).filter(x => x.at && x.at >= today0).sort((a, b) => a.at - b.at);
  const rows = list.map(x => {
    const p = patientById(x.r.patientId), dd = daysBetween(now, x.at);
    const when = dd === 0 ? t.rem_today : dd === 1 ? t.rem_tomorrow : t.days_long[dow(x.at)] + " " + x.at.getDate() + " " + t.months[x.at.getMonth()].slice(0, 3);
    return '<div class="item" style="grid-template-columns:52px 1fr auto"><div class="thumb" style="flex-direction:column;line-height:1"><b class="num" style="font-size:1rem">' + x.at.getDate() + '</b><span class="tiny muted">' + t.months[x.at.getMonth()].slice(0, 3) + '</span></div><div><b>' + esc(x.r.title) + '</b><div class="meta">' + when + ' · <span class="num">' + hm(x.at) + '</span>' + (x.r.repeat && x.r.repeat !== "none" ? " · " + t.repeat[x.r.repeat] : "") + (p ? " · " + esc(p.name) : "") + '</div>' + (x.r.note ? '<div class="meta">' + esc(x.r.note) + '</div>' : "") + (x.r.alarm ? '<span class="tag tag-ok">⏰ ' + t.alarm_tag + '</span>' : "") + '</div><button class="btn sm" data-edit-rem="' + x.r.id + '">' + t.edit + '</button></div>';
  }).join("");
  return '<div class="stack" style="gap:16px"><div class="row between wrapx"><h1>' + t.reminders + '</h1><button class="btn primary" data-add-rem>' + t.add_rem + '</button></div>' +
    '<section class="card"><h2>' + t.upcoming + '</h2><div class="list">' + (rows || '<p class="muted" style="padding:10px 0">' + t.no_rem + '</p>') + '</div></section>' +
    '<section class="card stack" style="gap:8px"><h3>' + t.calendar + '</h3><p class="small muted">' + t.calendar_desc + '</p><div><button class="btn sm" data-ics>' + t.calendar + ' (.ics)</button></div></section></div>';
}
function viewWeek() {
  const t = L(), pid = currentPatientId(), p = patientById(pid);
  if (!p) return '<p class="muted">' + t.no_patients + '</p>';
  const meds = A.meds.filter(m => m.patientId === pid);
  const times = [...new Set(meds.flatMap(m => m.times || []))].sort((a, b) => toMin(a) - toMin(b));
  const rows = times.map(tm => '<tr><td class="time num">' + tm + '</td>' + [0, 1, 2, 3, 4, 5, 6].map(day => '<td>' + meds.filter(m => (m.times || []).includes(tm) && (m.days || []).includes(day)).map(m => '<div class="cellmed"><span class="box"></span>' + pillSVG(m.color, m.shape, 22) + '<span>' + esc(m.name) + '</span></div>').join("") + '</td>').join("") + '</tr>').join("");
  return '<div class="stack">' + patientChips(pid) + '<div><h1>' + t.week_title + ' · ' + esc(p.name) + '</h1><p class="muted noprint" style="margin-top:6px">' + t.week_sub + '</p></div>' +
    (times.length ? '<div class="tablewrap"><table class="week"><thead><tr><th>' + t.time + '</th>' + t.days_short.map(d => '<th>' + d + '</th>').join("") + '</tr></thead><tbody>' + rows + '</tbody></table></div>' : '<p class="muted">' + fmt(t.no_meds, { p: esc(p.name) }) + '</p>') + '</div>';
}
function viewInfo(publicView) {
  const it = prefs.lang === "it";
  const c = it ? {
    eyebrow: "Il progetto · versione " + VERSION, h1: "Ha preso le pastiglie <em>stamattina?</em>",
    lead: "Blistra è un'app web gratuita pensata per famiglie e caregiver: aiuta a seguire le prescrizioni, programmare promemoria e sveglie e ricevere un avviso prima di restare senza farmaci.",
    try: "Prova Blistra →", stats: [["68,1%", "degli over 65 in Italia ha ricevuto nel 2024 prescrizioni di almeno 5 principi attivi diversi."], ["28,3%", "ne ha ricevuti 10 o più."], ["~50%", "è l'aderenza media alle terapie croniche nei Paesi sviluppati, secondo l'OMS."]],
    src: "Fonti: AIFA, Rapporto OsMed 2024 (riportato da AGI, novembre 2025); OMS, <i>Adherence to long-term therapies: evidence for action</i> (2003).",
    whyH: "Il problema", why: ["Molte persone anziane prendono più farmaci al giorno, spesso vivendo da sole e lontano dai figli. Le domande sono sempre le stesse: l'ha presa? L'ha presa due volte? La scatola sta finendo? La ricetta è ancora valida?", "Blistra divide il lavoro: i familiari si organizzano insieme in una cerchia, e chi prende i farmaci vede soltanto una schermata grande e chiara."],
    howH: "Cosa fa", feats: [["people", "Cerchia di famiglia", "Ogni familiare entra con il proprio account e un codice invito. Tutti vedono in tempo reale chi ha preso cosa e quando."],
      ["bell", "Promemoria e sveglie", "Sveglia all'ora del farmaco e di nuovo se la dose non è segnata entro l'orario limite (per esempio le 21). Promemoria personalizzati per visite ed esami."],
      ["box", "Avviso scorte basse", "Ogni dose presa scala le scorte: Blistra avvisa quando restano pochi giorni, prima di restare senza."],
      ["rx", "Ricette", "Medico e scadenza di ogni ricetta, con un avviso quando sta per scadere."],
      ["info", "Schede semplificate", "Toccando un farmaco si apre una scheda in parole semplici e il link al foglio illustrativo ufficiale su AIFA Medicinali."],
      ["lock", "Telefono dell'assistito", "Il telefono della persona anziana può mostrare solo la sua giornata, come un blister: una casella si buca quando la dose è presa."]],
    desH: "Scelte di progetto", des: ["Il testo usa Atkinson Hyperlegible, un carattere progettato dal Braille Institute per chi vede poco.", "La foto vera della pastiglia o della scatola sostituisce le immagini generiche: lo stesso principio attivo cambia aspetto da un produttore all'altro.", "Se una dose viene saltata, Blistra non dice mai di \"recuperarla\": invita a chiedere al medico o al farmacista.", "Account e dati sono protetti da regole di sicurezza: solo i membri della cerchia possono leggerli."],
    roadH: "Versioni e prossimi passi", road: [["v0.1 · prototipo locale", "Novembre 2026 · una persona, un dispositivo"], ["v" + VERSION + " · cerchie di famiglia", "Account, gruppi con codice invito, scorte, ricette, promemoria, sveglie, schede semplificate"], ["Revisione di un farmacista", "Controllo delle schede semplificate e dei messaggi"], ["Prova con famiglie reali", "Osservare l'uso vero e correggere ciò che confonde"], ["App nativa", "Sveglie anche a telefono bloccato e notifiche push ai familiari quando una dose viene saltata"]],
    limH: "Limiti", lim: "Blistra è un progetto studentesco, non un dispositivo medico. Non controlla interazioni né dosaggi e non sostituisce medico o farmacista. Le schede semplificate sono riassunti generali, da far verificare a un farmacista.",
    contactH: "Contatti"
  } : {
    eyebrow: "The project · version " + VERSION, h1: "Did she take her pills <em>this morning?</em>",
    lead: "Blistra is a free web app designed to help families and caregivers track prescriptions, schedule custom reminders and alarms, and receive low-stock alerts before running out of medication.",
    try: "Try Blistra →", stats: [["68.1%", "of Italians over 65 were prescribed 5 or more different active substances in 2024."], ["28.3%", "were prescribed 10 or more."], ["~50%", "is the average adherence to long-term therapies in high-income countries, according to the WHO."]],
    src: "Sources: AIFA, OsMed Report 2024 (as reported by AGI, Nov 2025); WHO, <i>Adherence to long-term therapies: evidence for action</i> (2003).",
    whyH: "The problem", why: ["Many older people take several medicines a day, often living alone and far from their children. The questions never change: did she take it? Did she take it twice? Is the box running out? Is the prescription still valid?", "Blistra splits the job: family members organise together in a circle, and the person taking the medicines only sees one large, clear screen."],
    howH: "What it does", feats: [["people", "Family circle", "Each family member joins with their own account and an invite code. Everyone sees in real time who took what, and when."],
      ["bell", "Reminders and alarms", "An alarm at medicine time and again if the dose is not marked by a deadline (say 9 pm). Custom reminders for appointments and tests."],
      ["box", "Low-stock alerts", "Every dose taken counts down the stock, and Blistra warns you a few days before it runs out."],
      ["rx", "Prescriptions", "Doctor and expiry date for each prescription, with an alert before it expires."],
      ["info", "Simplified sheets", "Tap a medicine for a plain-language sheet and a link to the official leaflet on AIFA Medicinali."],
      ["lock", "The patient's phone", "An older person's phone can show only their day, as a blister pack: a pocket pops when the dose is taken."]],
    desH: "Design choices", des: ["Body text uses Atkinson Hyperlegible, a typeface designed by the Braille Institute for readers with low vision.", "A real photo of the pill or box replaces generic images: the same active ingredient looks different from one manufacturer to another.", "A missed dose never triggers advice to \"double up\": Blistra says to ask a doctor or pharmacist.", "Accounts and data are protected by security rules: only members of a circle can read it."],
    roadH: "Versions and next steps", road: [["v0.1 · local prototype", "November 2026 · one person, one device"], ["v" + VERSION + " · family circles", "Accounts, invite-code groups, stock, prescriptions, reminders, alarms, simplified sheets"], ["Review by a pharmacist", "Check the simplified sheets and messages"], ["Testing with real families", "Watch real use and fix what confuses people"], ["Native app", "Alarms with the phone locked and push notifications to family when a dose is missed"]],
    limH: "Limits", lim: "Blistra is a student project, not a medical device. It does not check interactions or doses and does not replace a doctor or pharmacist. The simplified sheets are general summaries, to be checked by a pharmacist.",
    contactH: "Contact"
  };
  return '<article class="stack" style="gap:26px">' +
    '<section class="hero"><div class="stack" style="gap:14px"><span class="eyebrow">' + c.eyebrow + '</span><h1>' + c.h1 + '</h1><p>' + c.lead + '</p><div class="row wrapx" style="gap:10px"><a class="btn primary" href="#today">' + c.try + '</a></div></div>' + blisterArt() + '</section>' +
    '<div class="stat">' + c.stats.map(x => '<div class="card"><b class="num">' + x[0] + '</b>' + x[1] + '</div>').join("") + '</div><p class="small muted" style="margin-top:-14px">' + c.src + '</p>' +
    '<section class="prose stack" style="gap:10px"><h2>' + c.whyH + '</h2>' + c.why.map(x => '<p>' + x + '</p>').join("") + '</section>' +
    '<section class="stack" style="gap:12px"><h2>' + c.howH + '</h2><div class="feat">' + c.feats.map(f => '<div class="card"><div class="ico">' + ICON[f[0]] + '</div><div><h3>' + f[1] + '</h3><p class="small muted">' + f[2] + '</p></div></div>').join("") + '</div></section>' +
    '<section class="prose stack" style="gap:10px"><h2>' + c.desH + '</h2><ul>' + c.des.map(x => '<li>' + x + '</li>').join("") + '</ul></section>' +
    '<section class="card stack" style="gap:10px"><h2>' + c.roadH + '</h2><ol class="roadmap">' + c.road.map((x, i) => '<li><span class="d' + (i <= 1 ? " on" : "") + '"></span><div><b>' + x[0] + '</b><div class="muted small">' + x[1] + '</div></div></li>').join("") + '</ol></section>' +
    '<section class="stack" style="gap:8px"><h3>' + c.limH + '</h3><p class="small muted prose">' + c.lim + '</p></section>' +
    '<section class="row" style="gap:14px;border-top:1px solid var(--line);padding-top:18px">' + brandMark(44) + '<div><span class="eyebrow">' + c.contactH + '</span><p><a href="mailto:' + CONTACT + '">' + CONTACT + '</a></p></div></section></article>';
}

/* ================= modals ================= */
function modal(html) { document.getElementById("layer").innerHTML = '<div class="modal-bg" data-close-bg><div class="modal" role="dialog" aria-modal="true">' + html + '</div></div>'; const f = document.querySelector(".modal input:not([type=hidden]), .modal button"); if (f) f.focus(); }
function closeModal() { document.getElementById("layer").innerHTML = ""; draft = null; remDraft = null; }
let toastTimer = null;
function toast(msg, undo) {
  clearTimeout(toastTimer); const old = document.querySelector(".toast"); if (old) old.remove();
  const el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status");
  el.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button data-untake="' + esc(undo.key) + '" data-med="' + esc(undo.med) + '" data-date="' + esc(undo.date) + '">' + L().undo + '</button>' : "");
  document.body.appendChild(el); toastTimer = setTimeout(() => el.remove(), 5000);
}

let draft = null, remDraft = null;
function openMedForm(med) {
  const ps = patients(); if (!ps.length) { toast(L().need_patient); return; }
  draft = med ? clone(med) : { id: uid(), patientId: currentPatientId() || ps[0].id, name: "", dose: "", units: 1, times: ["08:00"], deadlines: {}, alarm: true, days: [0, 1, 2, 3, 4, 5, 6], food: "any", color: COLORS[0], shape: "round", photo: "", look: "", note: "", stock: { count: null, box: null, threshold: 7 }, rx: { doctor: "", expires: "", note: "" } };
  draft._new = !med; draft.deadlines = draft.deadlines || {}; draft.stock = draft.stock || { count: null, box: null, threshold: 7 }; draft.rx = draft.rx || { doctor: "", expires: "", note: "" };
  drawMedForm("");
}
function drawMedForm(err) {
  const t = L(), d = draft;
  const ps = patients().map(p => '<option value="' + p.id + '"' + (p.id === d.patientId ? " selected" : "") + '>' + esc(p.name) + '</option>').join("");
  const times = d.times.map((tm, i) => '<div class="grid2" style="align-items:end"><label class="f" for="f-time-' + i + '">' + t.f_times + ' ' + (i + 1) + '<input type="time" id="f-time-' + i + '" data-time="' + i + '" value="' + tm + '"></label>' +
    '<div class="row" style="gap:6px;align-items:end"><label class="f" for="f-dl-' + i + '" style="flex:1">' + t.f_deadline + '<input type="time" id="f-dl-' + i + '" data-dl="' + i + '" value="' + esc(d.deadlines[tm] || "") + '"></label>' + (d.times.length > 1 ? '<button type="button" class="btn ghost" data-rm-time="' + i + '" aria-label="remove">✕</button>' : "") + '</div></div>').join("");
  const days = t.days_short.map((n, i) => '<button type="button" class="chip" data-day="' + i + '" aria-pressed="' + d.days.includes(i) + '">' + n + '</button>').join("");
  const foods = ["any", "before", "with", "after"].map(k => '<button type="button" class="chip" data-food="' + k + '" aria-pressed="' + (d.food === k) + '">' + t.f_food_opts[k] + '</button>').join("");
  const sw = COLORS.map(c => '<button type="button" class="swatch" style="background:' + c + '" data-color="' + c + '" aria-pressed="' + (d.color === c) + '" aria-label="' + c + '"></button>').join("");
  const shapes = ["round", "oval", "capsule"].map(s => '<button type="button" class="chip row" style="gap:6px" data-shape="' + s + '" aria-pressed="' + (d.shape === s) + '">' + pillSVG(d.color, s, 24) + t.f_shape[s] + '</button>').join("");
  modal('<form class="stack" id="medform" novalidate><h2>' + (d._new ? t.f_new : t.f_edit) + '</h2>' + (err ? '<p class="err" role="alert">' + err + '</p>' : "") +
    '<div class="grid2"><label class="f" for="f-pat">' + t.f_for + '<select id="f-pat">' + ps + '</select></label><label class="f" for="f-name">' + t.f_name + '<input type="text" id="f-name" list="farmaci" value="' + esc(d.name) + '" placeholder="' + t.f_name_ph + '" maxlength="60" autocomplete="off"></label></div>' +
    '<datalist id="farmaci">' + FARMACI.map(n => '<option value="' + esc(n) + '">').join("") + '</datalist>' +
    '<div class="grid2"><label class="f" for="f-dose">' + t.f_dose + '<input type="text" id="f-dose" value="' + esc(d.dose) + '" placeholder="' + t.f_dose_ph + '" maxlength="40"></label><label class="f" for="f-units">' + t.f_units + '<input type="number" id="f-units" min="0.25" step="0.25" value="' + (d.units || 1) + '"></label></div>' +
    '<fieldset><legend>' + t.f_when + '</legend>' + times + '<div><button type="button" class="btn ghost sm" data-add-time>' + t.f_add_time + '</button></div>' +
      '<label class="row" for="f-alarm" style="gap:10px;font-weight:700"><input type="checkbox" id="f-alarm"' + (d.alarm ? " checked" : "") + ' style="width:22px;height:22px">⏰ ' + t.f_alarm + '</label>' +
      '<div class="stack" style="gap:6px"><b class="small">' + t.f_days + '</b><div class="chips">' + days + '<button type="button" class="chip" data-all-days>' + t.every_day + '</button></div></div>' +
      '<div class="stack" style="gap:6px"><b class="small">' + t.f_food + '</b><div class="chips">' + foods + '</div></div></fieldset>' +
    '<fieldset><legend>' + t.f_look + '</legend><div class="stack" style="gap:6px"><b class="small">' + t.f_photo + '</b><div class="photo"><div class="thumb">' + medVisual(d, 44) + '</div><label class="btn sm" for="f-photo">' + t.f_photo_btn + '</label><input type="file" id="f-photo" accept="image/*" capture="environment" class="sr">' + (d.photo ? '<button type="button" class="btn sm ghost" data-photo-rm>' + t.f_photo_rm + '</button>' : "") + '</div><p class="tiny muted">' + t.f_photo_hint + '</p></div>' +
      '<div class="chips">' + sw + '</div><div class="chips">' + shapes + '</div>' +
      '<label class="f" for="f-look">' + t.f_desc + '<input type="text" id="f-look" value="' + esc(d.look) + '" placeholder="' + t.f_desc_ph + '" maxlength="120"></label>' +
      '<label class="f" for="f-note">' + t.f_note + '<input type="text" id="f-note" value="' + esc(d.note) + '" placeholder="' + t.f_note_ph + '" maxlength="100"></label></fieldset>' +
    '<fieldset><legend>' + t.f_stock + '</legend><div class="grid3"><label class="f" for="f-count">' + t.f_count + '<input type="number" id="f-count" min="0" step="1" value="' + (d.stock.count == null ? "" : d.stock.count) + '"></label><label class="f" for="f-box">' + t.f_box + '<input type="number" id="f-box" min="1" step="1" value="' + (d.stock.box || "") + '"></label><label class="f" for="f-thr">' + t.f_thr + '<input type="number" id="f-thr" min="1" step="1" value="' + (d.stock.threshold || 7) + '"></label></div></fieldset>' +
    '<fieldset><legend>' + t.f_rx + '</legend><div class="grid2"><label class="f" for="f-doc">' + t.f_doctor + '<input type="text" id="f-doc" value="' + esc(d.rx.doctor) + '" maxlength="50"></label><label class="f" for="f-exp">' + t.f_expires + '<input type="date" id="f-exp" value="' + esc(d.rx.expires) + '"></label></div><label class="f" for="f-rxn">' + t.f_rx_note + '<input type="text" id="f-rxn" value="' + esc(d.rx.note) + '" placeholder="' + t.f_rx_note_ph + '" maxlength="100"></label></fieldset>' +
    '<div class="row between wrapx">' + (d._new ? '<span></span>' : '<button type="button" class="btn danger ghost" data-del-med="' + d.id + '">' + t.del + '</button>') + '<div class="row" style="gap:8px"><button type="button" class="btn" data-close>' + t.cancel + '</button><button type="submit" class="btn primary">' + t.save + '</button></div></div></form>');
}
function syncDraft() {
  if (!draft) return; const g = id => document.getElementById(id); if (!g("f-name")) return;
  draft.patientId = g("f-pat").value; draft.name = g("f-name").value; draft.dose = g("f-dose").value; draft.units = parseFloat(g("f-units").value) || 1;
  draft.alarm = g("f-alarm").checked; draft.look = g("f-look").value; draft.note = g("f-note").value;
  const newDl = {};
  document.querySelectorAll("[data-time]").forEach(el => { const i = +el.dataset.time; draft.times[i] = el.value; const dl = document.querySelector('[data-dl="' + i + '"]'); if (dl && dl.value && el.value) newDl[el.value] = dl.value; });
  draft.deadlines = newDl;
  const cnt = g("f-count").value; draft.stock = { count: cnt === "" ? null : Math.max(0, parseFloat(cnt)), box: parseInt(g("f-box").value, 10) || null, threshold: parseInt(g("f-thr").value, 10) || 7 };
  draft.rx = { doctor: g("f-doc").value, expires: g("f-exp").value, note: g("f-rxn").value };
}
function openRemForm(r) {
  const now = new Date();
  remDraft = r ? clone(r) : { id: uid(), title: "", patientId: "", date: ymd(addDays(now, 1)), time: "09:00", repeat: "none", alarm: true, note: "" };
  remDraft._new = !r; drawRemForm("");
}
function drawRemForm(err) {
  const t = L(), r = remDraft;
  const ps = '<option value="">' + t.rem_all + '</option>' + patients().map(p => '<option value="' + p.id + '"' + (p.id === r.patientId ? " selected" : "") + '>' + esc(p.name) + '</option>').join("");
  modal('<form class="stack" id="remform" novalidate><h2>' + (r._new ? t.add_rem.replace("+ ", "") : t.edit) + '</h2>' + (err ? '<p class="err" role="alert">' + err + '</p>' : "") +
    '<label class="f" for="r-title">' + t.rem_title + '<input type="text" id="r-title" value="' + esc(r.title) + '" placeholder="' + t.rem_title_ph + '" maxlength="80"></label>' +
    '<div class="grid3"><label class="f" for="r-date">' + t.rem_date + '<input type="date" id="r-date" value="' + esc(r.date) + '"></label><label class="f" for="r-time">' + t.rem_time + '<input type="time" id="r-time" value="' + esc(r.time) + '"></label><label class="f" for="r-rep">' + t.rem_repeat + '<select id="r-rep">' + ["none", "daily", "weekly", "monthly"].map(k => '<option value="' + k + '"' + (r.repeat === k ? " selected" : "") + '>' + t.repeat[k] + '</option>').join("") + '</select></label></div>' +
    '<label class="f" for="r-pat">' + t.rem_for + '<select id="r-pat">' + ps + '</select></label>' +
    '<label class="row" for="r-alarm" style="gap:10px;font-weight:700"><input type="checkbox" id="r-alarm"' + (r.alarm ? " checked" : "") + ' style="width:22px;height:22px">⏰ ' + t.rem_alarm + '</label>' +
    '<label class="f" for="r-note">' + t.rem_note + '<textarea id="r-note" maxlength="200">' + esc(r.note) + '</textarea></label>' +
    '<div class="row between wrapx">' + (r._new ? '<span></span>' : '<button type="button" class="btn danger ghost" data-del-rem="' + r.id + '">' + t.del + '</button>') + '<div class="row" style="gap:8px"><button type="button" class="btn" data-close>' + t.cancel + '</button><button type="submit" class="btn primary">' + t.save + '</button></div></div></form>');
}
function openSheet(m) {
  const t = L(), s = schedaPer(m.name);
  const body = s ? '<div class="stack" style="gap:12px"><span class="tag tag-ok" style="align-self:flex-start">' + esc(s.gruppo) + '</span>' +
    '<div><h3>' + t.sheet_for + '</h3><p>' + esc(s.per) + '</p></div><div><h3>' + t.sheet_how + '</h3><p>' + esc(s.come) + '</p></div>' +
    '<div><h3>' + t.sheet_watch + '</h3><ul style="margin:4px 0 0;padding-left:20px">' + s.attenzione.map(x => '<li>' + esc(x) + '</li>').join("") + '</ul></div>' +
    '<div class="alert critical" style="grid-template-columns:6px 1fr"><span class="bar"></span><div><b>' + t.sheet_call + '</b><span>' + esc(s.chiama) + '</span></div></div></div>' : '<p class="muted">' + t.sheet_none + '</p>';
  modal('<div class="stack"><div class="row" style="gap:14px"><div class="disc" style="width:72px;height:72px;box-shadow:none">' + medVisual(m, 52) + '</div><div><span class="eyebrow">' + t.sheet_title + '</span><h2>' + esc(m.name) + '</h2>' + (m.look ? '<div class="small muted">' + esc(m.look) + '</div>' : "") + '</div></div>' + body +
    '<div class="card stack" style="gap:6px;background:var(--paper)"><a href="' + AIFA_URL + '" target="_blank" rel="noopener"><b>' + t.sheet_aifa + ' ↗</b></a><span class="small muted">' + fmt(t.sheet_aifa_hint, { n: esc(m.name.split(" ")[0]) }) + ' · ' + AIFA_URL + '</span></div>' +
    '<p class="tiny muted">' + t.sheet_disclaimer + '</p><div class="row between"><button class="btn ghost sm" data-edit="' + m.id + '">' + t.edit + '</button><button class="btn" data-close>' + t.close + '</button></div></div>');
}
function openLockSetup(pid) {
  const t = L(), p = patientById(pid);
  modal('<form class="stack" id="lockform" data-pid="' + pid + '"><h2>' + fmt(t.lock_title, { p: esc(p.name) }) + '</h2><p class="muted">' + fmt(t.lock_desc, { p: esc(p.name) }) + '</p><label class="f" for="l-pin">' + t.lock_pin + '<input type="password" id="l-pin" inputmode="numeric" maxlength="4" autocomplete="off"></label><div class="row" style="justify-content:flex-end;gap:8px"><button type="button" class="btn" data-close>' + t.cancel + '</button><button class="btn primary" type="submit">' + fmt(t.lock_on, { p: esc(p.name) }) + '</button></div></form>');
}
function openPatientForm(p) {
  const t = L(), cur = p || { id: "p_" + uid(8), name: "", color: PCOLORS[patients().length % PCOLORS.length] };
  modal('<form class="stack" id="patform" data-pid="' + cur.id + '"><h2>' + (p ? esc(p.name) : t.add_patient.replace("+ ", "")) + '</h2><label class="f" for="p-name">' + t.patient_name + '<input type="text" id="p-name" value="' + esc(cur.name) + '" maxlength="30"></label>' +
    '<div class="stack" style="gap:6px"><b class="small">' + t.color + '</b><div class="chips">' + PCOLORS.map(c => '<button type="button" class="swatch" style="background:' + c + '" data-pcolor="' + c + '" aria-pressed="' + (c === cur.color) + '" aria-label="' + c + '"></button>').join("") + '</div><input type="hidden" id="p-color" value="' + cur.color + '"></div>' +
    '<div class="row between wrapx">' + (p ? '<button type="button" class="btn danger ghost" data-rm-patient="' + p.id + '">' + t.remove_patient + '</button>' : '<span></span>') + '<div class="row" style="gap:8px"><button type="button" class="btn" data-close>' + t.cancel + '</button><button class="btn primary" type="submit">' + t.save + '</button></div></div></form>');
}

/* ================= alarms ================= */
let audioCtx = null, ringTimer = null;
const RUNG_KEY = "blistra.rung";
function rungGet() { try { const r = JSON.parse(localStorage.getItem(RUNG_KEY)) || {}; if (r.d !== ymd(new Date())) return { d: ymd(new Date()), k: {} }; return r; } catch (e) { return { d: ymd(new Date()), k: {} }; } }
function rungSet(k) { const r = rungGet(); r.k[k] = 1; try { localStorage.setItem(RUNG_KEY, JSON.stringify(r)); } catch (e) { } }
function unlockAudio() { try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); } catch (e) { } }
function beepLoop() {
  stopBeep(); if (!audioCtx) return; let n = 0;
  const once = () => { try { [0, 0.25, 0.5].forEach(off => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = "sine"; o.frequency.value = off === 0.25 ? 988 : 784; g.gain.setValueAtTime(0.0001, audioCtx.currentTime + off); g.gain.exponentialRampToValueAtTime(0.4, audioCtx.currentTime + off + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + off + 0.22); o.connect(g).connect(audioCtx.destination); o.start(audioCtx.currentTime + off); o.stop(audioCtx.currentTime + off + 0.25); }); } catch (e) { } if (++n > 40) stopBeep(); };
  once(); ringTimer = setInterval(once, 1500);
}
function stopBeep() { if (ringTimer) { clearInterval(ringTimer); ringTimer = null; } }
function vibrate() { try { navigator.vibrate && navigator.vibrate([400, 200, 400, 200, 400]); } catch (e) { } }
function notify(title, body) { try { if ("Notification" in window && Notification.permission === "granted" && document.hidden) new Notification(title, { body, icon: "icon.svg", tag: "blistra-" + title, requireInteraction: true }); } catch (e) { } }
let snoozes = {};
function ring(kind, payload) {
  const t = L();
  beepLoop(); vibrate();
  if (kind === "rem") {
    notify(t.alarm_rem, payload.r.title);
    document.getElementById("layer").dataset.alarm = "1";
    modal('<div class="stack" style="text-align:center;align-items:center"><span class="eyebrow">⏰ ' + t.alarm_rem + '</span><div class="clearbig">' + esc(payload.r.title) + '</div>' + (payload.r.note ? '<p class="muted">' + esc(payload.r.note) + '</p>' : "") + '<button class="btn primary big" data-alarm-ok>OK</button><button class="btn ghost" data-snooze="rem:' + payload.r.id + '">' + t.snooze + '</button></div>');
    return;
  }
  const d = payload.dose, p = patientById(d.m.patientId) || { name: "" }, again = kind === "again";
  const title = again ? t.alarm_again : t.alarm_now;
  notify(title + " · " + p.name, d.m.name + " · " + d.m.dose);
  document.getElementById("layer").dataset.alarm = "1";
  modal('<div class="stack" style="text-align:center;align-items:center"><span class="tag tag-' + (again ? "late" : "due") + '">⏰ ' + title + ' · ' + esc(p.name) + '</span><div class="disc">' + medVisual(d.m, 70) + '</div><div class="clearbig">' + esc(d.m.name) + '</div><div class="dose">' + esc(d.m.dose) + (t.food[d.m.food] ? " · " + t.food[d.m.food] : "") + '</div>' +
    '<button class="btn primary big" data-take="' + d.key + '" data-med="' + d.m.id + '" data-alarm-ok>' + t.taken_btn + '</button><button class="btn ghost" data-snooze="dose:' + d.key + '">' + t.snooze + '</button></div>');
}
function alarmPatients() { if (prefs.lock) return [prefs.lock.patientId]; return prefs.alarms ? patients().map(p => p.id) : []; }
function checkAlarms() {
  if (!A.family || (!prefs.alarms && !prefs.lock)) return;
  if (document.querySelector(".modal")) return;
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
function dismissAlarm() { stopBeep(); delete document.getElementById("layer").dataset.alarm; closeModal(); }

/* ================= calendar export ================= */
function icsEscape(s) { return String(s || "").replace(/[\\;,]/g, m => "\\" + m).replace(/\n/g, "\\n"); }
function icsDate(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00"; }
function buildICS() {
  const t = L(), now = new Date(), lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Blistra//" + VERSION + "//IT", "CALSCALE:GREGORIAN", "X-WR-CALNAME:Blistra"];
  const BY = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  A.meds.forEach(m => (m.times || []).forEach(tm => {
    const p = patientById(m.patientId); if (!p || !(m.days || []).length) return;
    let start = parseYmd(ymd(now)); const [h, mi] = tm.split(":").map(Number); start.setHours(h, mi, 0, 0);
    let g = 0; while (!m.days.includes(dow(start)) && g++ < 7) start = addDays(start, 1);
    const dl = (m.deadlines || {})[tm];
    lines.push("BEGIN:VEVENT", "UID:" + m.id + "-" + tm.replace(":", "") + "@blistra", "DTSTAMP:" + icsDate(now), "DTSTART:" + icsDate(start), "DURATION:PT15M",
      "RRULE:FREQ=WEEKLY;BYDAY=" + m.days.map(i => BY[i]).join(","), "SUMMARY:" + icsEscape("💊 " + m.name + " · " + p.name), "DESCRIPTION:" + icsEscape(m.dose + (t.food[m.food] ? " · " + t.food[m.food] : "") + (m.note ? " · " + m.note : "")),
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
function downloadICS() {
  try {
    const blob = new Blob([buildICS()], { type: "text/calendar" }), url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "blistra.ics"; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    if (window.self !== window.top) toast(L().calendar_fail);
  } catch (e) { toast(L().calendar_fail); }
}

/* ================= photo ================= */
function readPhoto(file) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => { const img = new Image(); img.onload = () => { const max = 480, sc = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", 0.72)); }; img.onerror = rej; img.src = fr.result; };
    fr.onerror = rej; fr.readAsDataURL(file);
  });
}

/* ================= actions ================= */
async function act(fn) { try { A.error = ""; await fn(); } catch (e) { console.error(e); toast(errText(e)); } }
function takeDose(key, medId) {
  const m = A.meds.find(x => x.id === medId); if (!m) return;
  const now = new Date(), date = ymd(now), p = patientById(m.patientId);
  const entry = { at: hm(now), by: prefs.lock ? "device" : A.user.uid, byName: prefs.lock ? (p ? p.name : "") : A.user.name, ts: Date.now() };
  const go = () => act(async () => { await store.take(date, key, m, entry); toast(fmt(L().recorded, { t: entry.at }), { key, med: m.id, date }); });
  const pocket = document.querySelector('[data-pocket="' + key + '"]');
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (pocket && !reduce) { pocket.classList.add("pop"); setTimeout(go, 450); } else go();
}

document.addEventListener("click", e => {
  unlockAudio();
  const b = e.target.closest("button, [data-close-bg]"); if (!b) return;
  const ds = b.dataset, t = L();
  if (ds.closeBg !== undefined) { if (e.target === b && !document.getElementById("layer").dataset.alarm) closeModal(); return; }
  if (ds.lang) { if (draft) syncDraft(); prefs.lang = ds.lang; savePrefs(); render(); if (draft) drawMedForm(""); return; }
  if (ds.demo !== undefined) { prefs.demo = true; savePrefs(); startDemo(); return; }
  if (ds.demoExit !== undefined) { store.signOut(); return; }
  if (ds.authMode) { authMode = ds.authMode; render(); return; }
  if (ds.google !== undefined) { act(() => store.google()); return; }
  if (ds.forgot !== undefined) { const em = (document.getElementById("a-email") || {}).value; if (!em) { document.getElementById("a-err").textContent = t.err["auth/invalid-email"]; return; } act(async () => { await store.reset(em); toast(t.reset_sent); }); return; }
  if (ds.signout !== undefined) { prefs.lock = null; savePrefs(); act(() => store.signOut()); return; }
  if (ds.alarmOk !== undefined && !ds.take) { dismissAlarm(); return; }
  if (ds.take) { const wasAlarm = ds.alarmOk !== undefined; if (wasAlarm) dismissAlarm(); takeDose(ds.take, ds.med); return; }
  if (ds.untake) { const m = A.meds.find(x => x.id === ds.med); if (m) act(async () => { await store.untake(ds.date || ymd(new Date()), ds.untake, m); toast(t.undone); }); return; }
  if (ds.pocketInfo) { const lg = logFor(ymd(new Date()), ds.pocketInfo); const m = A.meds.find(x => ds.pocketInfo.startsWith(x.id + "_")); if (lg && m) toast(fmt(t.recorded, { t: lg.at }) + " · " + lg.byName, { key: ds.pocketInfo, med: m.id, date: ymd(new Date()) }); return; }
  if (ds.snooze) { snoozes[ds.snooze] = Date.now() + 10 * 60000; dismissAlarm(); return; }
  if (ds.patient) { prefs.patientId = ds.patient; savePrefs(); render(); return; }
  if (ds.openPatient) { prefs.patientId = ds.openPatient; savePrefs(); location.hash = "today"; return; }
  if (ds.lockSetup) { openLockSetup(ds.lockSetup); return; }
  if (ds.unlock !== undefined) {
    if (prefs.lock && prefs.lock.pin) { modal('<form class="stack" id="pinform"><h2>' + t.exit_lock + '</h2><label class="f" for="pin-in">' + t.pin_ask + '<input type="password" id="pin-in" inputmode="numeric" maxlength="4" autocomplete="off"></label><p id="pin-err" class="err" role="alert"></p><div class="row" style="justify-content:flex-end;gap:8px"><button type="button" class="btn" data-close>' + t.cancel + '</button><button class="btn primary" type="submit">OK</button></div></form>'); }
    else { prefs.lock = null; savePrefs(); location.hash = "circle"; render(); }
    return;
  }
  if (ds.close !== undefined) { closeModal(); return; }
  if (ds.addPatient !== undefined) { openPatientForm(null); return; }
  if (ds.editPatient) { openPatientForm(patientById(ds.editPatient)); return; }
  if (ds.pcolor) { document.getElementById("p-color").value = ds.pcolor; document.querySelectorAll("[data-pcolor]").forEach(x => x.setAttribute("aria-pressed", String(x.dataset.pcolor === ds.pcolor))); return; }
  if (ds.rmPatient) { const p = patientById(ds.rmPatient); if (b.dataset.armed) { act(() => store.removePatient(ds.rmPatient)); closeModal(); } else { b.dataset.armed = "1"; b.textContent = fmt(t.confirm_remove_patient, { p: p.name }); b.style.whiteSpace = "normal"; } return; }
  if (ds.addMed !== undefined) { openMedForm(null); return; }
  if (ds.edit) { const m = A.meds.find(x => x.id === ds.edit); if (m) openMedForm(m); return; }
  if (ds.sheet) { const m = A.meds.find(x => x.id === ds.sheet); if (m) openSheet(m); return; }
  if (ds.addBox) { const m = A.meds.find(x => x.id === ds.addBox); if (m && m.stock && m.stock.box) act(async () => { await store.addStock(m.id, m.stock.box); toast("+" + m.stock.box + " · " + m.name); }); return; }
  if (ds.addTime !== undefined) { syncDraft(); draft.times.push("12:00"); drawMedForm(""); return; }
  if (ds.rmTime) { syncDraft(); const tm = draft.times[+ds.rmTime]; draft.times.splice(+ds.rmTime, 1); delete draft.deadlines[tm]; drawMedForm(""); return; }
  if (ds.day) { syncDraft(); const i = +ds.day; draft.days = draft.days.includes(i) ? draft.days.filter(x => x !== i) : [...draft.days, i].sort(); drawMedForm(""); return; }
  if (ds.allDays !== undefined) { syncDraft(); draft.days = [0, 1, 2, 3, 4, 5, 6]; drawMedForm(""); return; }
  if (ds.food) { syncDraft(); draft.food = ds.food; drawMedForm(""); return; }
  if (ds.color) { syncDraft(); draft.color = ds.color; drawMedForm(""); return; }
  if (ds.shape) { syncDraft(); draft.shape = ds.shape; drawMedForm(""); return; }
  if (ds.photoRm !== undefined) { syncDraft(); draft.photo = ""; drawMedForm(""); return; }
  if (ds.delMed) { const m = A.meds.find(x => x.id === ds.delMed); if (b.dataset.armed) { act(() => store.deleteMed(ds.delMed)); closeModal(); } else { b.dataset.armed = "1"; b.textContent = fmt(t.confirm_del, { m: m ? m.name : "" }); b.style.whiteSpace = "normal"; b.style.textAlign = "left"; } return; }
  if (ds.addRem !== undefined) { openRemForm(null); return; }
  if (ds.editRem) { openRemForm(A.reminders.find(r => r.id === ds.editRem)); return; }
  if (ds.delRem) { if (b.dataset.armed) { act(() => store.deleteReminder(ds.delRem)); closeModal(); } else { b.dataset.armed = "1"; b.textContent = t.del + "?"; } return; }
  if (ds.copy) { const txt = ds.copy; (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => toast(t.copied), () => toast(txt)); return; }
  if (ds.enableAlarms !== undefined) {
    prefs.alarms = true; savePrefs(); unlockAudio();
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().then(() => render()).catch(() => render()); else render();
    return;
  }
  if (ds.testAlarm !== undefined) { unlockAudio(); const pid = currentPatientId(); const d = dosesFor(new Date(), pid)[0]; if (d) ring("now", { dose: d }); return; }
  if (ds.ics !== undefined) { downloadICS(); return; }
  if (ds.switch) { act(() => store.switchFamily(ds.switch)); return; }
  if (ds.newCircle !== undefined) { A.family = null; render(); return; }
  if (ds.leave !== undefined) { if (b.dataset.armed) { prefs.lock = null; savePrefs(); act(() => store.leaveFamily()); } else { b.dataset.armed = "1"; b.textContent = fmt(t.confirm_leave, { n: A.family.name }); b.style.whiteSpace = "normal"; } return; }
});
document.addEventListener("change", async e => {
  if (e.target.id === "f-photo" && e.target.files && e.target.files[0]) { syncDraft(); try { draft.photo = await readPhoto(e.target.files[0]); } catch (err) { toast(L().err.generic); } drawMedForm(""); }
});
document.addEventListener("submit", e => {
  e.preventDefault(); const t = L(), id = e.target.id, g = x => document.getElementById(x);
  if (id === "authform") {
    const em = g("a-email").value.trim(), pw = g("a-pw").value, nm = g("a-name") ? g("a-name").value.trim() : "";
    act(async () => { try { if (authMode === "signup") await store.signUp(nm || em.split("@")[0], em, pw); else await store.signIn(em, pw); } catch (err) { g("a-err").textContent = errText(err); } });
    return;
  }
  if (id === "createform") { const n = g("c-name").value.trim(); if (!n) { g("c-err").textContent = t.circle_name; return; } act(() => store.createFamily(n, g("c-pat").value.trim())); return; }
  if (id === "joinform") { const c = g("j-code").value.trim(); act(async () => { try { await store.joinFamily(c); } catch (err) { g("j-err").textContent = errText(err); } }); return; }
  if (id === "medform") {
    syncDraft(); const d = draft;
    d.name = d.name.trim(); d.dose = d.dose.trim();
    d.times = [...new Set(d.times.filter(Boolean))].sort((a, b) => toMin(a) - toMin(b));
    Object.keys(d.deadlines).forEach(k => { if (!d.times.includes(k) || toMin(d.deadlines[k]) <= toMin(k)) delete d.deadlines[k]; });
    if (!d.name) return drawMedForm(t.need_name);
    if (!d.times.length) { d.times = ["08:00"]; return drawMedForm(t.need_time); }
    if (!d.days.length) return drawMedForm(t.need_day);
    delete d._new; const m = clone(d); closeModal(); act(() => store.saveMed(m)); return;
  }
  if (id === "remform") {
    const r = remDraft; r.title = g("r-title").value.trim(); r.date = g("r-date").value; r.time = g("r-time").value; r.repeat = g("r-rep").value; r.patientId = g("r-pat").value; r.alarm = g("r-alarm").checked; r.note = g("r-note").value.trim();
    if (!r.title) return drawRemForm(t.rem_title); if (!r.date || !r.time) return drawRemForm(t.rem_date + " / " + t.rem_time);
    delete r._new; const x = clone(r); closeModal(); act(() => store.saveReminder(x)); return;
  }
  if (id === "patform") { const n = g("p-name").value.trim(); if (!n) return; const p = { id: e.target.dataset.pid, name: n, color: g("p-color").value }; closeModal(); act(() => store.savePatient(p)); return; }
  if (id === "lockform") { const pin = g("l-pin").value.replace(/\D/g, ""); prefs.lock = { patientId: e.target.dataset.pid, pin: pin.length === 4 ? pin : "" }; prefs.alarms = true; savePrefs(); unlockAudio(); closeModal(); location.hash = "today"; render(); if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => { }); return; }
  if (id === "pinform") { if (g("pin-in").value === (prefs.lock && prefs.lock.pin)) { prefs.lock = null; savePrefs(); closeModal(); location.hash = "circle"; render(); } else { g("pin-err").textContent = t.pin_wrong; g("pin-in").value = ""; } }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.querySelector(".modal") && !document.getElementById("layer").dataset.alarm) closeModal(); });
window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });
window.addEventListener("online", () => { A.error = ""; emit(); });

/* ================= boot ================= */
function startDemo() { A.mode = "demo"; if (!prefs.patientId) { prefs.patientId = "p_maria"; savePrefs(); } store = demoStore(); store.start(); }
async function boot() {
  if (prefs.demo) { startDemo(); }
  else if (firebaseConfig) {
    A.mode = "cloud";
    try { store = await cloudStore(); } catch (e) { console.error(e); A.loading = false; A.error = "Firebase non raggiungibile: " + (e.message || e); prefs.demo = false; render(); return; }
  } else { A.loading = false; render(); }
  setInterval(() => { if (!document.querySelector(".modal") && route() === "today") render(); checkAlarms(); }, 20000);
  setTimeout(checkAlarms, 1500);
  if ("serviceWorker" in navigator && location.protocol === "https:" && window.self === window.top) { navigator.serviceWorker.register("sw.js").catch(() => { }); }
}
boot();
