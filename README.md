# Blistra

Blistra è un'app web gratuita che aiuta le famiglie e i caregiver a gestire le terapie delle persone anziane.

**Prova l'app:** https://tigrisxvi.github.io/blistra/

## Cosa fa

- **Cerchia di famiglia:** più familiari seguono la stessa persona e vedono in tempo reale se una dose è stata presa.
- **Promemoria e sveglie:** l'avviso risuona se la dose non viene segnata come presa entro un certo orario.
- **Ricette:** tiene traccia delle prescrizioni e delle scadenze.
- **Scorte:** avvisa quando un farmaco sta per finire.
- **Schede dei farmaci:** informazioni essenziali spiegate in modo semplice, a partire dai dati AIFA.
- **Il telefono dell'assistito:** mostra solo la sua giornata, come un blister, con un pulsante grande.

L'app funziona anche in modalità demo, senza creare un account.

## Versione 3

- Interfaccia e grafica completamente nuove, con un blister in 3D interattivo (three.js) nella pagina del progetto.
- **Studio**: dall'account amministratore si cambiano testi (italiano e inglese), colori, scena 3D, immagini e sezioni della pagina pubblica, con anteprima dal vivo, senza toccare il codice.
- Sicurezza rinforzata e privacy secondo il GDPR (vedi sotto).

## Sicurezza

- **Regole del database** (`firestore.rules`): controllate dai server di Google per ogni lettura e scrittura. I dati di una cerchia li vedono solo i suoi membri, nemmeno l'amministratore. Ogni documento ha campi e dimensioni fissati; i codici invito non si possono elencare.
- **Content Security Policy**: la pagina esegue solo i propri script; librerie (Firebase, three.js) e font sono serviti dal sito stesso, senza CDN esterni.
- **Testo sempre "neutralizzato"**: tutto quello che arriva da utenti o dal database viene mostrato come testo, mai come codice.
- **Protezione dal clickjacking**: Blistra rifiuta di aprirsi dentro pagine di altri siti.
- **PIN del telefono dell'assistito** salvato solo come impronta SHA-256, mai in chiaro.
- **Privacy**: consenso esplicito per i dati sanitari, età minima 14 anni, "Scarica i miei dati" ed "Elimina il mio account".

### Come si diventa amministratore

Nel codice non c'è nessun nome né email di amministratore. Un account è amministratore se nel database esiste il documento `admins/{uid dell'account}` con `{ name: "Vasco" }`. Quel documento si crea solo dalla console Firebase (Firestore → collezione `admins` → ID documento = UID preso da Authentication). Le regole impediscono di crearlo dall'app.

## Il futuro: il braccialetto Blistra

In futuro vorremmo creare un **braccialetto** per aiutare gli anziani a **ricordarsi di prendere le medicine**.

Il braccialetto si indossa al polso ed è collegato all'app: quando è ora di prendere una medicina, **vibra**. Così l'anziano riceve il promemoria direttamente su di sé, anche se non usa lo smartphone, non sente la sveglia o ha lasciato il telefono in un'altra stanza.

## Tecnologie

HTML, CSS e JavaScript (moduli ES, nessuna fase di build), Firebase Authentication e Cloud Firestore, three.js per il 3D, pubblicato con GitHub Pages.

```
index.html            pagina e Content Security Policy
css/blistra.css       tutta la grafica
js/main.js            schermate, navigazione, azioni
js/views/             pagina del progetto, accesso, Oggi, Cerchia, Farmaci, Studio…
js/stores/            dati in demo (sul dispositivo) e nel cloud (Firebase)
js/site.js            testi e colori della pagina pubblica, modificabili da Studio
js/hero3d.js          il blister 3D
firestore.rules       regole di sicurezza del database
vendor/               Firebase e three.js serviti in locale
```

## Avvertenza

Blistra è un aiuto per organizzarsi e non sostituisce le indicazioni del medico o del farmacista.

Contatti: tigrisedicesimo@gmail.com

## Scatoletta Blistra

Blistra si collega a un portapillole motorizzato open source, da stampare in 3D: fino a 4 dosi al giorno per una settimana, con conferma dal peso. Progetto, modello 3D e firmware: https://github.com/tigrisXVI/scatoletta-blistra
