# 📚 SSRI-PWM - Documentazione Flussi di Lavoro e Struttura Progetto

---

## 📁 Struttura delle Cartelle e File Principali

```
ssri-pwm/
│
├── index.html                  # Homepage con carousel ricette random e categorie
├── recipeStyle.css             # Stili per card, carousel, griglie ricette
├── usersStyle.css              # Stili per feedback validazione utente
│
├── pages/                      # Pagine principali del sito
│   ├── favourites.html         # Pagina personale utente (preferiti, recensioni, note)
│   ├── landing.html            # Pagina categorie ricette
│   ├── login.html              # Login utente
│   ├── modifUser.html          # Modifica profilo utente
│   ├── recipe-details.html     # Dettagli ricetta, recensioni, note
│   ├── search.html             # Ricerca ricette per nome
│   └── signIn.html             # Registrazione nuovo utente
│
├── js/                         # Logica applicativa e moduli business
│   ├── data-models.js          # Modelli dati: User, Note, Review, Recipe, Preview
│   ├── errorsManagement.js     # Gestione errori tipizzati
│   ├── recipesAPI.js           # Interfaccia TheMealDB API
│   ├── reviewsManagement.js    # Sistema recensioni e rating
│   ├── storageManagement.js    # Persistenza localStorage
│   ├── UI.js                   # Componenti rendering card/carousel
│   ├── usersManagement.js      # CRUD utenti + autenticazione
│   ├── validate.js             # Validazione form real-time
│   └── pages-scripts/          # Script specifici per pagina
│       ├── favourites.js
│       ├── index.js
│       ├── landing.js
│       ├── login.js
│       ├── modif.js
│       ├── recipe-details.js
│       ├── search.js
│       └── singin.js
```

---

## 🗂️ Modelli Dati Principali

- **User**: id, username, email, password, favourites (array di id ricette), notes (array di Note)
- **Note**: id, recipeId, text, date
- **Review**: id, recipeId, userId, tasteRate, difficultyRate, date
- **ItemPreview**: id, name, image, type (meals/categories/reviews/notes)
- **FullRecipe**: id, name, image, instructions, dateAdded, ingredients (array)

---

## 🔄 Flussi di Lavoro Utente

### 1. **Accesso e Registrazione**
- **login.html**: L’utente inserisce credenziali → validazione → accesso → redirect area personale.
- **signIn.html**: Registrazione nuovo utente → validazione dati → creazione User → accesso automatico.

### 2. **Homepage (`index.html`)**
- Visualizza carousel ricette random (fetch da API).
- Mostra categorie ricette (fetch da API).
- Barra di ricerca per ricette → redirect a search.html.

### 3. **Ricerca Ricette (`search.html`)**
- Input ricerca → fetch ricette da API → visualizzazione risultati in card.
- Clic su card → redirect a recipe-details.html con id ricetta.

### 4. **Dettaglio Ricetta (`recipe-details.html`)**
- Visualizza dettagli ricetta (ingredienti, istruzioni).
- Se utente loggato:
  - Può aggiungere/rimuovere dai preferiti.
  - Può aggiungere/rimuovere recensione (taste/difficulty).
  - Può aggiungere/rimuovere nota personale.

### 5. **Area Personale (`favourites.html`)**
- Sezioni:
  - **Preferiti**: Ricette salvate dall’utente.
  - **Recensioni**: Ricette recensite dall’utente (con rating personale).
  - **Note**: Ricette annotate dall’utente.
- Visualizzazione card con rating globale/utente e note.
- Event delegation per navigazione verso dettagli ricetta.

### 6. **Modifica Profilo (`modifUser.html`)**
- Modifica username, email, password.
- Validazione real-time su tutti i campi.
- Password modificabile solo previa autorizzazione (verifica password corrente).
- Aggiornamenti selettivi: solo le sezioni abilitate vengono modificate.
- Reset pagina dopo modifica per coerenza dati.

---

## ⚙️ Flusso Tecnico Principale

### **Gestione Utenti**
- **usersManagement.js**: CRUD utenti, autenticazione, ricerca per id.
- **validate.js**: Validazione form (username, email, password).
- **modif.js**: Gestione stato form, abilitazione sezioni, submit selettivo.

### **Gestione Ricette**
- **recipesAPI.js**: Fetch ricette/categorie da TheMealDB.
- **data-models.js**: Normalizzazione dati API in oggetti business.

### **Gestione Recensioni**
- **reviewsManagement.js**: Aggiunta/rimozione recensioni, calcolo rating medio globale/utente, verifica esistenza recensione.
- **UI.js**: Rendering card con rating, progress bar, note.

### **Gestione Preferiti e Note**
- **favourites.js**: Caricamento e rendering ricette preferite, recensite, annotate.
- **UI.js**: Visualizzazione card con rating/note.

---

## 🛠️ Flusso di Interazione tra Moduli

1. **User effettua login** → usersManagement.js verifica credenziali → se ok, salva id utente loggato.
2. **User cerca ricetta** → recipesAPI.js fetch ricette → UI.js visualizza card.
3. **User aggiunge recensione** → reviewsManagement.js aggiorna storage → UI.js aggiorna rating.
4. **User aggiunge nota** → usersManagement.js aggiorna array notes → UI.js aggiorna card.
5. **User modifica profilo** → modif.js gestisce form → usersManagement.js aggiorna dati → reload pagina.

---

## 🧩 Relazioni tra Dati

- **User** → può avere molti **favourites** (id ricette), molte **notes** (collegate a ricette), molte **reviews** (una per ricetta).
- **Recipe** → può avere molte **reviews** (da utenti diversi), molte **notes** (da utenti diversi).
- **Review** → collegata a una ricetta e a un utente.
- **Note** → collegata a una ricetta e a un utente.

---

## 📝 Note Architetturali e Miglioramenti Semplici

- **Validazione input** sempre presente nei form.
- **Event delegation** per click su card e gestione container.
- **Sezioni form disabilitate di default**: abilitazione selettiva per sicurezza.
- **Gestione errori centralizzata** tramite errorsManagement.js.
- **Rating e note** visualizzati tramite progress bar e card dedicate.
- **Performance**: accettabile per MVP, nessuna ottimizzazione avanzata richiesta.
- **Documentazione JSDoc** presente nei file JS principali per facilitare comprensione.

---

## 📈 Flusso Utente Sintetico

1. **Homepage** → ricerca o navigazione categorie.
2. **Ricerca** → selezione ricetta → dettagli.
3. **Dettagli ricetta** → aggiunta/rimozione preferiti, recensione, nota.
4. **Area personale** → visualizza e gestisce preferiti, recensioni, note.
5. **Modifica profilo** → aggiorna dati utente.

---

## 📌 Suggerimenti Architetturali (senza refactoring)

- **Mantenere separazione tra logica di business e UI** (già implementato).
- **Centralizzare gestione errori** per feedback utente uniforme.
- **Utilizzare costruttori e factory per oggetti dati** (già presente).
- **Documentare chiaramente le funzioni e i flussi** (JSDoc + questa guida).
- **Evitare duplicazione codice** nei moduli di rendering e validazione.
- **Gestire lo stato utente e autenticazione in modo centralizzato**.

---

## 📚 Come Consultare la Documentazione

- **Per capire la logica di una pagina**: consulta lo script corrispondente in `js/pages-scripts/`.
- **Per vedere come sono strutturati i dati**: consulta `js/data-models.js`.
- **Per la gestione utenti**: consulta `js/usersManagement.js` e `js/validate.js`.
- **Per la gestione recensioni**: consulta `js/reviewsManagement.js`.
- **Per la gestione UI**: consulta `js/UI.js`.
- **Per la gestione errori**: consulta `js/errorsManagement.js`.

---

**Questa guida riassume i flussi di lavoro, la struttura e le relazioni tra i moduli del progetto SSRI-PWM.**