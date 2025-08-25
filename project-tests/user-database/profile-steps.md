
# Step operativi per gestione profili utente (frontend, localStorage)

Questo documento elenca passo-passo le attività da seguire per implementare la gestione dei profili utente usando solo il client e il `localStorage`.

1) Preparazione
- Creare file di test: `index.html`, `style.css` (opzionale), `myScript.js`.
- Includere `myScript.js` con `defer` per semplificare l'accesso al DOM.

2) Schema dati utente (minimo)
- id: string (es. `u_<timestamp>_<rand>`)
- username: string
- email: string
- passwordHash: string (usare Web Crypto per hash)
- favorites: array (id ricette)
- createdAt: ISO datetime
- profile: { fullName?, preferredCuisines? }
- settings: { rememberMe?: boolean }

3) Chiavi localStorage
- `pgrc_users` → array di user objects
- `pgrc_currentUser` → id dell'utente loggato o null
- (opzionale) `pgrc_recipes` → dataset ricette

4) Funzioni di storage (implementare come API locali)
- getUsers() : array — legge `pgrc_users`, gestire parse error
- saveUsers(users) : void — serializza e salva
- findUserByUsernameOrEmail(value) : user|null
- addUser(user) : { success, error }
- updateUser(id, updates) : { success, user }
- deleteUser(id) : { success, error }
- getCurrentUserId() / setCurrentUserId(id) / clearCurrentUserId()

5) Flusso: Registrazione
- Validazioni client: username non vuoto, email formato, password >=8, conferma password
- Controllare univocità username/email via `getUsers()`
- Hashare password (Web Crypto subtle.digest) e creare user object
- push su `pgrc_users`, impostare `pgrc_currentUser` per auto-login
- Mostrare messaggio di successo / errori specifici

6) Flusso: Login
- Input: username/email + password
- Recuperare utente e confrontare hash(passwordInserita) === passwordHash
- Se ok, setta `pgrc_currentUser` e opzionalmente save setting rememberMe
- Gestire errori: utente non trovato, password errata

7) Flusso: Logout
- Clear `pgrc_currentUser`
- Redirect / aggiornamento UI

8) Flusso: Modifica profilo
- Permettere edit di fullName, email (controllare univocità), preferiti, password
- Per cambiare password richiedere la password corrente
- Salvare modifiche con `updateUser()` e aggiornare UI

9) Flusso: Cancellazione account
- Richiedere conferma esplicita e password corrente
- Rimuovere utente da `pgrc_users` e clear `pgrc_currentUser`
- Eventuale cleanup di note locali o informazioni private

10) Validazioni e UX
- Messaggi chiari per ogni errore (username/email duplicati, password corta)
- Non mostrare dettagli tecnici di errori
- Conferme per operazioni distruttive

11) Sicurezza (limiti e note da documentare)
- Hash client-side è solo una mitigazione didattica: documentare limiti
- Non conservare password in chiaro
- Informare che la persistenza è locale (privacy/portabilità)

12) Test consigliati (manualmente)
- Registrazione/happy path: utente appare in `pgrc_users`, `pgrc_currentUser` impostato
- Duplicato username/email: registrazione rifiutata
- Login con credenziali errate: messaggio corretto
- Cambia password con password errata: rifiuto
- Cancellazione: utente rimosso, currentUser cleared
- Corrupted `pgrc_users`: gestire parse error e offrire reset

13) Strumenti utili per sviluppo
- Aprire DevTools → Application → Local Storage per ispezionare
- Per sviluppo locale: `npx http-server . -p 8000 -c-1` (o `npx live-server`)

14) Step successivi dopo implementazione
- Aggiungere export/import JSON per backup e migrazione
- Valutare IndexedDB se il dataset cresce
- Integrare UI per preferiti e note private

---

Se vuoi, ora posso:
- fornire pseudocodice delle funzioni di storage e autenticazione (senza modificare file), oppure
- preparare il codice JS effettivo e i file HTML/CSS (solo dopo tua autorizzazione).

## Registro lavori (change log)

Usare questa sezione per registrare, ad ogni aggiornamento implementato o decisione progettuale, le scelte effettuate, le criticità incontrate e gli artifact prodotti.

Template per ogni voce di registro:
- Data: YYYY-MM-DD
- Autore: (tuo nome o nickname)
- Area interessata: (es. registrazione, login, storage, UI)
- Sommario delle modifiche / esperimento:
- Scelte effettuate (breve):
- Problemi riscontrati:
- Soluzioni adottate / workaround:
- File/Artifacts prodotti (path nel repo):
- Impatto sulla progettazione generale (note):
- Prossimi passi:

Registro (iniziale):

- Data: 2025-08-20
- Autore: damia
- Area interessata: progettazione profili / storage client-side
- Sommario delle modifiche / esperimento:
	- Definito modello dati utente minimo (id, username, email, passwordHash, favorites, createdAt, profile, settings)
	- Scelte sulle chiavi localStorage (`pgrc_users`, `pgrc_currentUser`)
	- Aggiunta API locali di storage e autenticazione (elenco funzioni nel documento)
	- Creato questo documento `profile-steps.md` e aggiunta sezione "Registro lavori" per tracciare aggiornamenti
- Scelte effettuate (breve):
	- usare `localStorage` per prototipo; usare Web Crypto API (SHA-256) per hash client-side delle password;
	- centralizzare accesso a storage con funzioni pure (getUsers/saveUsers/etc.)
- Problemi riscontrati:
	- limiti di sicurezza (hash client-side non equiparabile a hashing server-side con salt);
	- persistenza solo locale: dati non sincronizzati tra dispositivi; possibile perdita se l'utente cancella i dati del browser.
- Soluzioni adottate / workaround:
	- documentare i limiti nella sezione sicurezza e prevedere export/import JSON per backup;
	- possibile migrazione futura a IndexedDB per dataset più grandi.
- File/Artifacts prodotti (path nel repo):
	- `project-tests/user-database/profile-steps.md`
- Impatto sulla progettazione generale (note):
	- il progetto rimane frontend-only ma è necessario chiarire nel report d'esame i limiti di sicurezza e le scelte fatte;
	- le API interne e l'export/import semplificano future migrazioni.
- Prossimi passi:
	- implementare pseudocodice delle funzioni di storage (su tua richiesta);
	- preparare mockup HTML/UI per registrazione/login (su tua richiesta).


---

- Data: 2025-08-20
- Autore: damia
- Area interessata: validazione form e presentazione codice
- Sommario delle modifiche / esperimento:
	- Implementate funzioni di validazione per username, email, password e conferma password nel file `myScript.js`.
	- Aggiunti commenti descrittivi sopra ogni funzione e sopra tutti gli event listener per migliorare la leggibilità e la presentazione.
	- Verificata la chiarezza del codice e la sua aderenza ai requisiti di progetto frontend.
- Scelte effettuate (breve):
	- Mantenere tutte le funzioni di validazione e gestione form in un unico file JS, ben organizzato e commentato.
	- Usare nomi chiari e commenti per facilitare la comprensione e la valutazione all'esame.
- Problemi riscontrati:
	- Ripetizione della logica di aggiunta/rimozione classi CSS (da centralizzare in futuro se necessario).
		- La gestione dei messaggi di errore testuali è affidata a Bootstrap tramite le classi e gli elementi di feedback (`is-invalid`, `.invalid-feedback`). Nessuna logica JS aggiuntiva necessaria.
- Soluzioni adottate / workaround:
	- Commenti dettagliati per ogni funzione e event listener.
	- Struttura ordinata e separazione logica per facilitare eventuale scalabilità.
- File/Artifacts prodotti (path nel repo):
	- `project-tests/user-database/myScript.js` (validazione form + commenti)
- Impatto sulla progettazione generale (note):
	- Il codice è ora più leggibile, presentabile e pronto per essere esteso o suddiviso in moduli se il progetto cresce.
- Prossimi passi:
	- Eventuale aggiunta di messaggi di errore testuali e centralizzazione della logica CSS.
	- Proseguire con la gestione del salvataggio profili e login.


- Data: 2025-08-21
- Autore: damia
- Area interessata: refactor validazione e gestione stato input
- Sommario delle modifiche / esperimento:
	- Refactor della logica di validazione: ogni campo input gestito come oggetto con riferimento DOM e stato.
	- Centralizzazione della validazione e dello stato per tutti i campi richiesti.
	- Aggiornamento della UI tramite funzione unica per le classi visive.
	- Eventi configurati per chiamare le funzioni di validazione e aggiornare lo stato/feedback in modo uniforme.
	- Testata la disabilitazione/abilitazione del submit in base alla validità globale.
	- Merge della branch di refactor nel main.
- Scelte effettuate (breve):
	- Gestione degli input come oggetti per scalabilità e leggibilità.
	- Validazione centralizzata e feedback visivo uniforme.
	- Eventi configurati con funzioni anonime per evitare chiamate premature.
- Problemi riscontrati:
	- Errori di sintassi e chiamata funzioni negli event listener corretti durante il refactor.
	- Attenzione alla sincronizzazione tra stato JS e DOM dopo reset o refresh.
- Soluzioni adottate / workaround:
	- Aggiornamento dello stato e della UI ad ogni input.
	- Test manuale di edge case e input errati.
- File/Artifacts prodotti (path nel repo):
	- `project-tests/user-database/myScript.js` (refactor oggetti input, validazione centralizzata)
- Impatto sulla progettazione generale (note):
	- Codice più scalabile, leggibile e pronto per estensioni future (es. login, modifica profilo).
	- Struttura pronta per essere suddivisa in moduli se necessario.
- Prossimi passi:
	- Integrare la logica di salvataggio profili e autenticazione.
	- Eventuale modularizzazione del codice JS per pagine/funzionalità.

---

- Data: 2025-08-21
- Autore: damia
- Area interessata: robustezza storage, commenti, modularità
- Sommario delle modifiche / esperimento:
	- Aggiunta gestione degli errori di accesso a localStorage (lettura/scrittura) con try/catch e messaggi all'utente.
	- Commentato il flusso generale del programma per facilitare la comprensione e la manutenzione.
	- Verificata la modularità tra validate.js e auth.js tramite export/import.
	- Testata la disabilitazione dei campi durante operazioni asincrone e la gestione dei duplicati.
- Scelte effettuate (breve):
	- Gestione errori localStorage per maggiore robustezza.
	- Commenti generali solo sul flusso, senza dettagli tecnici superflui.
	- Modularità tramite ES6 modules.
- Problemi riscontrati:
	- Nessun problema bloccante, solo attenzione alla sincronizzazione tra moduli e DOM.
- Soluzioni adottate / workaround:
	- Test manuale e revisione dei commenti.
- File/Artifacts prodotti (path nel repo):
	- `project-tests/user-database/auth.js` (gestione errori, commenti flusso)
- Impatto sulla progettazione generale (note):
	- Codice più robusto, leggibile e pronto per estensioni future.
- Prossimi passi:
	- Proseguire con la UI e la gestione login/modifica profilo.


- Data: 2025-08-22
- Autore: damia
- Area interessata: sincronizzazione moduli, gestione dati condivisi, refactor architetturale
- Sommario delle modifiche / esperimento:
    - Refactor della gestione dati condivisi: introdotte funzioni getter in `common.js` per recuperare sempre dati aggiornati da localStorage.
    - Eliminata la dipendenza da variabili condivise statiche tra moduli; ora tutti i moduli lavorano su dati “freschi”.
    - Spostata la gestione delle chiavi di storage e delle operazioni di aggiornamento database utenti esclusivamente in `common.js`.
    - Dichiarazione degli oggetti DOM localmente negli script di pagina, evitando riferimenti obsoleti o nulli.
    - Testata la robustezza della sincronizzazione tra moduli e la corretta gestione dello stato utente loggato.
- Scelte effettuate (breve):
    - Centralizzare la gestione delle chiavi di storage e delle operazioni su utenti in `common.js`.
    - Usare getter per dati condivisi tra moduli.
    - Dichiarare oggetti DOM solo dove necessari.
- Problemi riscontrati:
    - Difficoltà di sincronizzazione tra dati in memoria e storage con variabili condivise.
    - Rischio di riferimenti DOM non validi se centralizzati.
- Soluzioni adottate / workaround:
    - Refactor verso funzioni getter e dichiarazione locale degli oggetti DOM.
    - Test manuale su tutte le pagine per verificare la sincronizzazione.
- File/Artifacts prodotti (path nel repo):
    - `project-tests/user-database/common.js` (getter, gestione storage)
    - `project-tests/user-database/landing.js`, `login.js`, `singin.js` (dichiarazione locale DOM)
- Impatto sulla progettazione generale (note):
    - Codice più robusto, modulare e facilmente estendibile.
    - Sincronizzazione tra moduli garantita; ridotto rischio di refactor futuri forzati.
    - **Nota:** Ricordare di mantenere la gestione delle chiavi di storage esclusivamente in `common.js` per coerenza.
- Prossimi passi:
    - Proseguire con la gestione della UI e delle funzionalità di modifica profilo.
    - Aggiornare la documentazione e i commenti nei moduli JS.

---

## Note per implementazioni future

### Sicurezza e controlli utente
- **Controllo password per eliminazione account**: Attualmente l'eliminazione dell'account non richiede la conferma della password. Valutare l'implementazione di un controllo che richieda la password corrente prima di procedere con l'eliminazione definitiva.
- **Controlli più robusti sull'utente loggato**: Implementare verifiche aggiuntive per validare che l'utente sia effettivamente autorizzato ad accedere alle funzionalità riservate (es. controllo scadenza sessione, validazione ID utente, gestione logout automatico in caso di dati corrotti).