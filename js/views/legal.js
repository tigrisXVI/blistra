// Privacy notice (GDPR art. 13) and terms of use, in plain language.

import { prefs } from "../state.js";
import { CONTACT, VERSION } from "../config.js";
import { esc } from "../util.js";
import { topbar, footer } from "./landing.js";

const PRIVACY = {
  it: { title: "Informativa privacy", updated: "Aggiornata il 9 novembre 2026, versione " + VERSION, blocks: [
    ["Chi tratta i dati", "Il titolare del trattamento è il gestore del progetto Blistra, un progetto studentesco senza scopo di lucro. Per qualunque domanda o richiesta scrivi a " + CONTACT + "."],
    ["Quali dati", "Dati dell'account: nome, email, data di iscrizione e ultimo accesso. Dati delle cerchie: nomi delle persone assistite, farmaci, orari, dosi segnate come prese, scorte, ricette, promemoria ed eventuali foto di pastiglie o scatole. Questi ultimi sono dati relativi alla salute (art. 9 GDPR)."],
    ["Perché e su quale base", "Solo per far funzionare Blistra: mostrare la giornata, mandare promemoria, condividere i dati con i familiari della stessa cerchia. La base giuridica è il tuo consenso esplicito (art. 6.1.a e 9.2.a GDPR), che dai al momento dell'iscrizione. Chi inserisce i dati di un'altra persona deve averne il permesso."],
    ["Chi li vede", "Solo i membri della cerchia in cui i dati sono inseriti. L'amministratore del progetto può vedere l'elenco degli iscritti (nome, email, date) ma non può leggere farmaci, dosi o promemoria: lo impediscono le regole di sicurezza del database. Non vendiamo né cediamo dati a nessuno e non usiamo pubblicità o statistiche di terze parti."],
    ["Dove sono conservati", "Su Google Firebase (Google Cloud), che agisce come responsabile del trattamento. Google può trattare dati anche fuori dall'Unione Europea, con le garanzie previste (Clausole contrattuali standard ed EU-US Data Privacy Framework). Sul tuo dispositivo restano solo le preferenze (lingua, sveglie) e una copia per l'uso offline."],
    ["Per quanto tempo", "Finché tieni l'account. Quando lo elimini, il profilo viene cancellato subito, insieme alle cerchie in cui eri l'unico membro."],
    ["I tuoi diritti", "Puoi vedere, correggere e scaricare i tuoi dati (pulsante Scarica i miei dati), revocare il consenso ed eliminare l'account (pulsante Elimina il mio account) quando vuoi, dalla pagina Account. Puoi anche presentare reclamo al Garante per la protezione dei dati personali (garanteprivacy.it)."],
    ["Età minima", "Per iscriversi servono almeno 14 anni, come previsto in Italia per i servizi online."],
    ["Sicurezza", "Connessione cifrata (HTTPS), password gestite da Firebase Authentication e mai visibili al progetto, regole di accesso verificate sui server di Google per ogni lettura e scrittura, nessuno script di terze parti nella pagina."]
  ] },
  en: { title: "Privacy notice", updated: "Updated 9 November 2026, version " + VERSION, blocks: [
    ["Who handles the data", "The controller is the operator of the Blistra project, a non-profit student project. For any question or request write to " + CONTACT + "."],
    ["Which data", "Account data: name, email, sign-up date and last visit. Circle data: names of the people cared for, medicines, times, doses marked as taken, stock, prescriptions, reminders and any photos of pills or boxes. The latter are health data (GDPR art. 9)."],
    ["Why, and on what basis", "Only to make Blistra work: show the day, send reminders, share the data with family members of the same circle. The legal basis is your explicit consent (GDPR art. 6.1.a and 9.2.a), given when you sign up. Whoever enters another person's data must have their permission."],
    ["Who sees it", "Only the members of the circle where the data is entered. The project administrator can see the list of sign-ups (name, email, dates) but cannot read medicines, doses or reminders: the database security rules prevent it. We do not sell or share data and use no third-party advertising or analytics."],
    ["Where it is kept", "On Google Firebase (Google Cloud), acting as processor. Google may process data outside the European Union with the required safeguards (Standard Contractual Clauses and the EU-US Data Privacy Framework). Your device keeps only preferences (language, alarms) and an offline copy."],
    ["For how long", "As long as you keep the account. When you delete it, the profile is removed at once, together with circles where you were the only member."],
    ["Your rights", "You can see, correct and download your data (Download my data), withdraw consent and delete the account (Delete my account) at any time from the Account page. You can also complain to the Italian Data Protection Authority (garanteprivacy.it)."],
    ["Minimum age", "You must be at least 14 to sign up, as Italian law requires for online services."],
    ["Security", "Encrypted connection (HTTPS), passwords handled by Firebase Authentication and never visible to the project, access rules checked on Google's servers for every read and write, no third-party scripts on the page."]
  ] }
};

const TERMS = {
  it: { title: "Condizioni d'uso", updated: "Aggiornate il 9 novembre 2026", blocks: [
    ["Cos'è Blistra", "Un aiuto gratuito per organizzare le terapie in famiglia. È un progetto studentesco, non un dispositivo medico."],
    ["Cosa non fa", "Non controlla dosaggi né interazioni e non sostituisce medico o farmacista. Le schede dei farmaci sono riassunti generali: il foglio illustrativo e le indicazioni del medico vengono sempre prima. Se una dose viene saltata, chiedi al medico o al farmacista cosa fare."],
    ["Sveglie", "Le sveglie funzionano finché la pagina è aperta o in background e il telefono lo consente. Per avvisi anche a telefono bloccato aggiungi gli orari al calendario. Non affidarti solo a Blistra per farmaci salvavita."],
    ["Uso corretto", "Inserisci solo dati che hai il diritto di condividere e non usare Blistra per scopi illeciti o per tentare di accedere a dati altrui. Gli account usati in modo scorretto possono essere disattivati."],
    ["Disponibilità", "Il servizio è offerto così com'è, senza garanzie di disponibilità continua. Può cambiare o essere sospeso."],
    ["Contatti", CONTACT]
  ] },
  en: { title: "Terms of use", updated: "Updated 9 November 2026", blocks: [
    ["What Blistra is", "A free aid to organise therapies within a family. It is a student project, not a medical device."],
    ["What it does not do", "It does not check doses or interactions and does not replace a doctor or pharmacist. Medicine sheets are general summaries: the leaflet and the doctor's instructions always come first. If a dose is missed, ask a doctor or pharmacist what to do."],
    ["Alarms", "Alarms work while the page is open or in the background and the phone allows it. For alerts with the phone locked, add the times to your calendar. Do not rely on Blistra alone for life-saving medicines."],
    ["Fair use", "Only enter data you have the right to share, and do not use Blistra for unlawful purposes or to try to access other people's data. Accounts misused may be disabled."],
    ["Availability", "The service is offered as is, with no guarantee of continuous availability. It may change or be suspended."],
    ["Contact", CONTACT]
  ] }
};

function page(doc) {
  return '<div class="pub">' + topbar("legal") + '<main id="main" class="wrap-pub legal"><h1 class="h-page">' + esc(doc.title) + '</h1><p class="muted">' + esc(doc.updated) + "</p>" +
    doc.blocks.map(b => "<section><h2>" + esc(b[0]) + "</h2><p>" + esc(b[1]) + "</p></section>").join("") + "</main>" + footer() + "</div>";
}

export const viewPrivacy = () => page(PRIVACY[prefs.lang] || PRIVACY.it);
export const viewTerms = () => page(TERMS[prefs.lang] || TERMS.it);
