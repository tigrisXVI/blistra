// Principi attivi e nomi commerciali di uso comune in Italia, per completare il nome mentre si scrive.
// Solo nomi: l'aspetto della compressa dipende dal produttore e va inserito dalla famiglia (foto o descrizione dal foglietto).
export const FARMACI = [
  // Cuore e pressione
  "Acido acetilsalicilico", "Amiodarone", "Amlodipina", "Apixaban", "Atenololo", "Atorvastatina", "Bisoprololo", "Candesartan",
  "Canrenone", "Carvedilolo", "Clopidogrel", "Clortalidone", "Dabigatran", "Digossina", "Doxazosina", "Edoxaban", "Enalapril",
  "Ezetimibe", "Furosemide", "Idroclorotiazide", "Irbesartan", "Isosorbide mononitrato", "Ivabradina", "Lercanidipina", "Lisinopril",
  "Losartan", "Metoprololo", "Nebivololo", "Nifedipina", "Nitroglicerina", "Olmesartan", "Omega-3 esteri etilici", "Perindopril",
  "Pravastatina", "Ramipril", "Ranolazina", "Rivaroxaban", "Rosuvastatina", "Sacubitril/valsartan", "Simvastatina", "Spironolattone",
  "Telmisartan", "Ticagrelor", "Torasemide", "Valsartan", "Warfarin", "Zofenopril",
  // Diabete
  "Canagliflozin", "Dapagliflozin", "Dulaglutide", "Empagliflozin", "Gliclazide", "Glimepiride", "Insulina aspart", "Insulina degludec",
  "Insulina glargine", "Insulina lispro", "Linagliptin", "Liraglutide", "Metformina", "Pioglitazone", "Repaglinide", "Semaglutide",
  "Sitagliptin", "Vildagliptin",
  // Stomaco e intestino
  "Domperidone", "Esomeprazolo", "Lansoprazolo", "Lattulosio", "Loperamide", "Macrogol", "Mesalazina", "Metoclopramide",
  "Omeprazolo", "Pantoprazolo", "Rabeprazolo",
  // Tiroide
  "Levotiroxina", "Metimazolo",
  // Dolore e infiammazione
  "Diclofenac", "Gabapentin", "Ibuprofene", "Ketoprofene", "Morfina", "Naprossene", "Nimesulide", "Ossicodone", "Paracetamolo",
  "Paracetamolo/codeina", "Pregabalin", "Tapentadolo", "Tramadolo",
  // Respiro
  "Beclometasone", "Beclometasone/formoterolo", "Budesonide", "Budesonide/formoterolo", "Fluticasone", "Fluticasone/salmeterolo",
  "Montelukast", "Salbutamolo", "Tiotropio", "Umeclidinio/vilanterolo",
  // Sistema nervoso e umore
  "Alprazolam", "Aloperidolo", "Amitriptilina", "Aripiprazolo", "Bromazepam", "Carbamazepina", "Citalopram", "Delorazepam",
  "Diazepam", "Donepezil", "Duloxetina", "Escitalopram", "Fluoxetina", "Lamotrigina", "Levetiracetam", "Levodopa/benserazide",
  "Levodopa/carbidopa", "Lorazepam", "Memantina", "Mirtazapina", "Olanzapina", "Paroxetina", "Pramipexolo", "Quetiapina",
  "Rasagilina", "Risperidone", "Rivastigmina", "Ropinirolo", "Sertralina", "Topiramato", "Trazodone", "Acido valproico",
  "Venlafaxina", "Zolpidem",
  // Prostata e vescica
  "Alfuzosina", "Dutasteride", "Finasteride", "Mirabegron", "Silodosina", "Solifenacina", "Tamsulosina",
  // Ossa, vitamine e sali
  "Acido alendronico", "Acido folico", "Acido risedronico", "Calcifediolo", "Calcio carbonato", "Cianocobalamina", "Colecalciferolo",
  "Ferro solfato", "Magnesio", "Potassio cloruro",
  // Gotta
  "Allopurinolo", "Colchicina", "Febuxostat",
  // Cortisonici
  "Desametasone", "Metilprednisolone", "Prednisone",
  // Antibiotici
  "Amoxicillina", "Amoxicillina/acido clavulanico", "Azitromicina", "Cefixima", "Ciprofloxacina", "Claritromicina", "Fosfomicina",
  "Levofloxacina", "Nitrofurantoina",
  // Altro
  "Anastrozolo", "Betaistina", "Bilastina", "Cetirizina", "Desloratadina", "Enoxaparina", "Idrossiclorochina", "Latanoprost",
  "Letrozolo", "Loratadina", "Metotrexato", "Tamoxifene", "Timololo",
  // Altri principi attivi
  "Acarbosio", "Acenocumarolo", "Acetilcisteina", "Aciclovir", "Acido ursodesossicolico", "Baclofene", "Betametasone", "Brotizolam", "Bupropione",
  "Celecoxib", "Clomipramina", "Clonazepam", "Clonidina", "Deflazacort", "Denosumab", "Diltiazem", "Diosmina", "Doxiciclina", "Etoricoxib",
  "Fenobarbital", "Fenofibrato", "Fexofenadina", "Flecainide", "Fluconazolo", "Indapamide", "Ketorolac", "Lacosamide", "Levocetirizina",
  "Levosulpiride", "Litio carbonato", "Lormetazepam", "Melatonina", "Ondansetron", "Oxcarbazepina", "Prednisolone", "Promazina", "Propafenone",
  "Propranololo", "Rifaximina", "Rizatriptan", "Sildenafil", "Sotalolo", "Sulfametoxazolo/trimetoprim", "Sumatriptan", "Tadalafil", "Ticlopidina",
  "Tiocolchicoside", "Tizanidina", "Triazolam", "Valaciclovir", "Verapamil", "Vortioxetina",
  // Nomi commerciali comuni in Italia (tra parentesi il principio attivo). I marchi appartengono ai rispettivi titolari
  // e sono elencati solo per aiutare a riconoscere il farmaco.
  "Abilify (aripiprazolo)", "Actonel (acido risedronico)", "Adalat (nifedipina)", "Adenuric (febuxostat)", "Aerius (desloratadina)",
  "Aldactone (spironolattone)", "Almarytm (flecainide)", "Amaryl (glimepiride)", "Anafranil (clomipramina)", "Antra (omeprazolo)",
  "Aprovel (irbesartan)", "Arcoxia (etoricoxib)", "Aricept (donepezil)", "Arimidex (anastrozolo)", "Asacol (mesalazina)",
  "Aspirina (acido acetilsalicilico)", "Aspirinetta (acido acetilsalicilico)", "Augmentin (amoxicillina/acido clavulanico)", "Aulin (nimesulide)",
  "Avodart (dutasteride)", "Azilect (rasagilina)", "Bactrim (sulfametoxazolo/trimetoprim)", "Bassado (doxiciclina)", "Bentelan (betametasone)",
  "Betmiga (mirabegron)", "Blopress (candesartan)", "Brilique (ticagrelor)", "Brintellix (vortioxetina)", "Brufen (ibuprofene)",
  "Carbolithium (litio carbonato)", "Cardicor (bisoprololo)", "Cardioaspirin (acido acetilsalicilico)", "Cardura (doxazosina)",
  "Catapresan (clonidina)", "Cefixoral (cefixima)", "Celebrex (celecoxib)", "Cialis (tadalafil)", "Cipralex (escitalopram)",
  "Ciproxin (ciprofloxacina)", "Circadin (melatonina)", "Clarityn (loratadina)", "Clavulin (amoxicillina/acido clavulanico)",
  "Clenil (beclometasone)", "Clexane (enoxaparina)", "Co-Efferalgan (paracetamolo/codeina)", "Concor (bisoprololo)", "Congescor (bisoprololo)",
  "Contramal (tramadolo)", "Cordarone (amiodarone)", "Coumadin (warfarin)", "Coversyl (perindopril)", "Crestor (rosuvastatina)",
  "Cymbalta (duloxetina)", "Daparox (paroxetina)", "Decadron (desametasone)", "Deltacortene (prednisone)", "Depakin (acido valproico)",
  "Deursil (acido ursodesossicolico)", "Diamicron (gliclazide)", "Dibase (colecalciferolo)", "Didrogyl (calcifediolo)", "Diflucan (fluconazolo)",
  "Dilatrend (carvedilolo)", "Dobetin (cianocobalamina)", "Ebixa (memantina)", "Efexor (venlafaxina)", "Efferalgan (paracetamolo)",
  "Eliquis (apixaban)", "Elopram (citalopram)", "En (delorazepam)", "Enapren (enalapril)", "Entact (escitalopram)",
  "Entresto (sacubitril/valsartan)", "Esapent (omega-3 esteri etilici)", "Eskim (omega-3 esteri etilici)", "Eutirox (levotiroxina)",
  "Exelon (rivastigmina)", "Ezetrol (ezetimibe)", "Femara (letrozolo)", "Ferrograd (ferro solfato)", "Flantadin (deflazacort)",
  "Fluimucil (acetilcisteina)", "Folina (acido folico)", "Forxiga (dapagliflozin)", "Fosamax (acido alendronico)",
  "Foster (beclometasone/formoterolo)", "Gardenale (fenobarbital)", "Glucophage (metformina)", "Halcion (triazolam)", "Humalog (insulina lispro)",
  "Imigran (sumatriptan)", "Imodium (loperamide)", "Inderal (propranololo)", "Isoptin (verapamil)", "Januvia (sitagliptin)",
  "Jardiance (empagliflozin)", "Karvea (irbesartan)", "Keppra (levetiracetam)", "Klacid (claritromicina)", "Laevolac (lattulosio)",
  "Lamictal (lamotrigina)", "Lanoxin (digossina)", "Lansox (lansoprazolo)", "Lantus (insulina glargine)", "Laroxyl (amitriptilina)",
  "Lasix (furosemide)", "Lendormin (brotizolam)", "Levopraid (levosulpiride)", "Levoxacin (levofloxacina)", "Lexotan (bromazepam)",
  "Limpidex (lansoprazolo)", "Lixiana (edoxaban)", "Lobivon (nebivololo)", "Lopresor (metoprololo)", "Lortaan (losartan)", "Losec (omeprazolo)",
  "Lucen (esomeprazolo)", "Luvion (canrenone)", "Lyrica (pregabalin)", "Macladin (claritromicina)", "Madopar (levodopa/benserazide)",
  "Maxalt (rizatriptan)", "Medrol (metilprednisolone)", "Metforal (metformina)", "Micardis (telmisartan)", "Microser (betaistina)",
  "Minias (lormetazepam)", "Mirapexin (pramipexolo)", "Moment (ibuprofene)", "Momendol (naprossene)", "Monuril (fosfomicina)",
  "Motilium (domperidone)", "Movicol (macrogol)", "Muscoril (tiocolchicoside)", "Natrilix (indapamide)", "Nebilox (nebivololo)",
  "Neurontin (gabapentin)", "Nexium (esomeprazolo)", "Nolvadex (tamoxifene)", "Normix (rifaximina)", "Norvasc (amlodipina)",
  "Novorapid (insulina aspart)", "Nurofen (ibuprofene)", "Oki (ketoprofene)", "Olmetec (olmesartan)", "Olpress (olmesartan)", "Omnic (tamsulosina)",
  "Ozempic (semaglutide)", "Pantorc (pantoprazolo)", "Pariet (rabeprazolo)", "Pentasa (mesalazina)", "Peridon (domperidone)",
  "Plaquenil (idrossiclorochina)", "Plasil (metoclopramide)", "Plaunac (olmesartan)", "Plavix (clopidogrel)", "Pradaxa (dabigatran)",
  "Pradif (tamsulosina)", "Pritor (telmisartan)", "Procoralan (ivabradina)", "Prolia (denosumab)", "Proscar (finasteride)",
  "Provisacor (rosuvastatina)", "Prozac (fluoxetina)", "Ratacand (candesartan)", "Remeron (mirtazapina)", "Requip (ropinirolo)",
  "Risperdal (risperidone)", "Rivotril (clonazepam)", "Robilas (bilastina)", "Rybelsus (semaglutide)", "Rytmonorm (propafenone)",
  "Seloken (metoprololo)", "Serenase (aloperidolo)", "Sereupin (paroxetina)", "Seretide (fluticasone/salmeterolo)", "Seroquel (quetiapina)",
  "Sinemet (levodopa/carbidopa)", "Singulair (montelukast)", "Sintrom (acenocumarolo)", "Sirdalud (tizanidina)", "Sivastin (simvastatina)",
  "Spiriva (tiotropio)", "Stilnox (zolpidem)", "Symbicort (budesonide/formoterolo)", "Synflex (naprossene)", "Tachidol (paracetamolo/codeina)",
  "Tachipirina (paracetamolo)", "Talofen (promazina)", "Tapazole (metimazolo)", "Tareg (valsartan)", "Tavanic (levofloxacina)", "Tavor (lorazepam)",
  "Tegretol (carbamazepina)", "Telfast (fexofenadina)", "Tenormin (atenololo)", "Tiklid (ticlopidina)", "Tirosint (levotiroxina)",
  "Tolep (oxcarbazepina)", "Topamax (topiramato)", "Toradol (ketorolac)", "Torvast (atorvastatina)", "Totalip (atorvastatina)",
  "Toujeo (insulina glargine)", "Trajenta (linagliptin)", "Tresiba (insulina degludec)", "Triatec (ramipril)", "Trittico (trazodone)",
  "Trulicity (dulaglutide)", "Urorec (silodosina)", "Valium (diazepam)", "Velamox (amoxicillina)", "Ventolin (salbutamolo)",
  "Vertiserc (betaistina)", "Vesiker (solifenacina)", "Viagra (sildenafil)", "Victoza (liraglutide)", "Vimpat (lacosamide)", "Voltaren (diclofenac)",
  "Wellbutrin (bupropione)", "Xalatan (latanoprost)", "Xanax (alprazolam)", "Xarelto (rivaroxaban)", "Xatral (alfuzosina)", "Xyzal (levocetirizina)",
  "Zanedip (lercanidipina)", "Zelitrex (valaciclovir)", "Zestril (lisinopril)", "Zimox (amoxicillina)", "Zirtec (cetirizina)",
  "Zitromax (azitromicina)", "Zocor (simvastatina)", "Zofran (ondansetron)", "Zoloft (sertralina)", "Zovirax (aciclovir)", "Zyloric (allopurinolo)",
  "Zyprexa (olanzapina)"
];
