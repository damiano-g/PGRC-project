# Tracciamento fase preliminare — Progetto web app (senza backend)

Data creazione: 2025-08-20

Scopo: registrare esperimenti, esercizi e decisioni prese nella fase preliminare. Useremo questo documento per guidare la progettazione finale della web app che recupera dati da API esterne e funziona senza backend.

Come usare il file
- Aggiungere una sezione per ogni esercizio/test con la struttura 'Esercizio: <titolo>' e i campi sotto.
- Aggiornare il campo Risultato con 'Successo'/'Fallito' e una breve descrizione.
- Allegare file/artifacts e link ai file del repo quando opportuno.

Template per ogni esercizio
- Data:
- Esercizio (titolo):
- Obiettivo:
- API usata (url / tipo / shape dati):
- Tecnologie/strumenti provati:
- Passi eseguiti (breve):
- Risultato (accettazione):
- Problemi riscontrati / soluzioni adottate:
- File/Artifacts prodotti (path):
- Note/decisioni per progettazione:
- Prossimi passi:

Esercizi proposti (priorità iniziale)
1) Fetch base e CORS
- Obiettivo: verificare fetch da un'API pubblica (es. JSONPlaceholder), gestire CORS e errori.
- Acceptance: riesco a scaricare e mostrare JSON in console/browser.

2) Parsing e shape dei dati
- Obiettivo: definire la shape minima che serve alla UI; trasformare dati grezzi.
- Acceptance: mappa dati grezzi a modello locale.

3) Storage client-side (localStorage / IndexedDB)
- Obiettivo: provare salvataggio temporaneo e persistente sul client.
- Acceptance: dati rimangono dopo refresh (localStorage) e query base (IndexedDB).

4) Caching e offline (Service Worker)
- Obiettivo: provare service worker minimo per cache delle risorse e fallback offline.
- Acceptance: app serve contenuti statici offline.

5) UI minima + routing (SPA)
- Obiettivo: testare componente lista/dettaglio e routing client-side (hash-router o History API).
- Acceptance: navigazione tra lista e dettaglio senza reload.

6) Autenticazione/permessi (solo client)
- Obiettivo: se necessario, simulare login con token in localStorage; gestire permessi.
- Acceptance: token salvato e usato nelle chiamate API.

7) Deploy su hosting statico
- Obiettivo: pubblicare versione statica (GitHub Pages, Netlify, Vercel) e verificare CORS/proxy.
- Acceptance: app raggiungibile via URL pubblico.

Contratto minimo (per ogni API usata)
- Input: endpoint, parametri di query, header (eventuale token)
- Output: JSON con schema (documentare i campi usati)
- Errori: timeout, 4xx/5xx, risposta vuota

Prossimi passi consigliati
- Scegliere il primo esercizio da eseguire (consiglio iniziale: 1) Fetch base e CORS).
- Riportare qui i risultati ad ogni test: io terrò traccia e poi ti aiuterò nella progettazione finale.

---

Registro esercizi (vuoto):

<!-- Aggiungere qui le sezioni per ogni esperimento -->

## Requisiti progetto (sintesi)

Il progetto chiede di realizzare la web app "Piattaforma per la Gestione di Ricette di Cucina (PGRC)" che:
- recupera ricette da TheMealDB (API REST pubblica) e mostra ingredienti, immagini e procedimento;
- permette registrazione/login dell'utente e la creazione automatica di un ricettario personale;
- consente ricerca delle ricette (ricerca sequenziale, per parola chiave, per ingrediente o lettera iniziale);
- permette di aggiungere/rimuovere ricette dal ricettario personale e salvare note private per ogni ricetta;
- gestisce recensioni (data preparazione, voto difficoltÃ 1-5, voto gusto 1-5);
- non prevede backend: tutti i dati necessari devono essere scaricati all'avvio, memorizzati nel web storage (JSON o XML) e gestiti lato client;
- le pagine devono usare HTML5/CSS3/JS e rispettare separazione struttura/stile.

## Mappa requisiti -> esercizi preliminari

- Registrazione/login, profilo utente -> Esercizio 6 (Autenticazione/permessi, token in localStorage).
- Download iniziale e popolamento web storage -> Esercizio 1 (fetch base e CORS) + Esercizio 3 (storage client-side).
- Ricerca ricette (parola chiave, ingredienti, lettera) -> Esercizio 2 (parsing/shape dati) + Esercizio 5 (UI minima + routing).
- Scheda ricetta con ingredienti, immagini, procedimento -> Esercizio 2 + Esercizio 5.
- Ricettario personale + note private -> Esercizio 3 (localStorage/IndexedDB) + Esercizio 5.
- Recensioni (date, voti) -> Esercizio 2 (model dati) + Esercizio 3 (persistenza client-side).
- Deploy statico (GitHub Pages/Netlify/Vercel) -> Esercizio 7.
- Offline e caching risorse -> Esercizio 4 (Service Worker).

## Vincoli tecnici importanti

- Tutti i dati necessari devono essere disponibili all'avvio e memorizzati in web storage in formato JSON (preferibile);
- Gestire CORS possibili dalle API esterne; se necessario usare proxy di sviluppo solo per testing locale;
- Privacy: le note delle ricette sono private e memorizzate solo nel web storage dell'utente.

## Registro esercizi (inizio)

- Data: 2025-08-20
- Esercizio (titolo): Fetch TheMealDB e test CORS (esercizio 1 - adattato)
- Obiettivo: verificare di poter scaricare dati da TheMealDB, confermare schema JSON usato dall'app (liste ricette, dettagli), gestire possibili errori CORS e 4xx/5xx.
- API usata (url / tipo / shape dati): example endpoint per ricerca per nome e per id:
	- https://www.themealdb.com/api/json/v1/1/search.php?s=Arrabiata
	- https://www.themealdb.com/api/json/v1/1/lookup.php?i=52772
	Shape attesa: oggetto JSON con campo "meals": array di oggetti { idMeal, strMeal, strInstructions, strMealThumb, strIngredient1..n, strMeasure1..n, ... }
- Tecnologie/strumenti provati: fetch API (browser), Postman/Insomnia per test, eventuale CORS proxy per debug.
- Passi eseguiti (breve):
	1. chiamata GET a endpoint search.php?s=<term>
	2. analisi risposta, log in console e estrazione primo elemento
	3. verifica presenza campi ingredienti e immagini
- Risultato (accettazione):
	- Acceptance: risposta JSON ricevuta e parsata correttamente in console; individuato schema per mappatura nella UI.
- Problemi riscontrati / soluzioni adottate:
 - Problemi riscontrati / soluzioni adottate:
 	- Durante i test lo script aggiornato non veniva sempre ricaricato dal browser a causa della cache del server di sviluppo; era necessario fermare e riavviare `http-server` per forzare il refresh.
 	- Soluzione: avviare `http-server` con cache disabilitata (es. `npx http-server . -p 8000 -c-1`) oppure usare DevTools → Disable cache durante i test; entrambe le soluzioni hanno permesso di vedere immediatamente le modifiche allo script.
 - File/Artifacts prodotti (path):
 	- `project-tests/fetch-themealdb/index.html` (pagina di test)
 	- `project-tests/fetch-themealdb/myScript.js` (script di fetch e logging)
 	- Server di sviluppo avviato con: `npx http-server . -p 8000 -c-1`
 - Note/decisioni per progettazione:
 	- Usare JSON come formato principale e mappare gli ingredienti dinamicamente (ingredienti numerati nel JSON).
 - Prossimi passi:
 	- Procedere con il parsing della shape dei dati (estrarre `idMeal`, `strMeal`, `strInstructions`, `strMealThumb`, `strIngredient1..n`, `strMeasure1..n`).
 	- Salvare il JSON iniziale in `localStorage` e testare la persistenza dopo refresh.

