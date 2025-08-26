# Architettura Progetto - Gestione Ricette e Utenti

## Panoramica del progetto
- **Tipologia**: Applicazione web frontend-only per gestione ricette
- **Contesto**: Progetto universitario, primo approccio alla programmazione web
- **Tecnologie**: HTML, CSS, JavaScript ES6, Bootstrap, localStorage/sessionStorage
- **Backend**: Nessuno - simulazione API per ricette, gestione utenti locale

---

## Struttura file e cartelle

```
project-root/
├── index.html                     # Homepage/Login principale
├── pages/
│   ├── signin.html                # Registrazione nuovo utente
│   ├── dashboard.html             # Dashboard utente loggato
│   ├── search.html                # Ricerca e filtri ricette
│   ├── recipe-detail.html         # Dettaglio singola ricetta
│   └── profile.html               # Gestione profilo utente
├── js/
│   ├── common.js                  # Core: storage, utilities, inizializzazione
│   ├── auth.js                    # Autenticazione e gestione utenti
│   ├── validate.js                # Validazione input e form
│   ├── recipes.js                 # Gestione ricette e API
│   ├── notes.js                   # Gestione note private
│   ├── reviews.js                 # Gestione recensioni pubbliche
│   └── page-scripts/
│       ├── signin.js              # Script specifico registrazione
│       ├── login.js               # Script specifico login
│       ├── dashboard.js           # Script specifico dashboard
│       ├── search.js              # Script specifico ricerca
│       ├── recipe-detail.js       # Script specifico dettaglio ricetta
│       └── profile.js             # Script specifico profilo
├── css/
│   └── styles.css                 # Stili personalizzati + Bootstrap
└── assets/
    └── images/                    # Immagini statiche
```

## Struttura effettiva user-database (refactorizzato):

```
project-tests/
└── user-database/
    ├── index.html                # Pagina principale login
    ├── myStyle.css               # Stili personalizzati
    ├── favicon.ico               # Icona del sito
    ├── js/                       # Moduli JavaScript core
    │   ├── usersManagement.js    # Business logic utenti (CRUD, validazione, auth)
    │   ├── validate.js           # Validazione input con feedback visivo
    │   ├── errorsManagement.js   # Sistema gestione errori centralizzato
    │   └── pages-scripts/        # Script specifici per ogni pagina
    │       ├── login.js          # Logic login e autenticazione
    │       ├── singin.js         # Logic registrazione nuovo utente
    │       ├── landing.js        # Logic dashboard utente loggato
    │       └── modif.js          # Logic modifica profilo utente
    └── pages/                    # Pagine HTML dell'applicazione
        ├── signIn.html           # Interfaccia registrazione
        ├── landing.html          # Dashboard post-login
        └── modifUser.html        # Interfaccia modifica profilo
```

---

## Architettura dati e storage

### Database locali (localStorage/sessionStorage)

#### Chiavi storage principali:
- `"users"` (localStorage) - Array utenti registrati
- `"recipes"` (localStorage) - Cache ricette da API  
- `"notes"` (localStorage) - Note private utente-ricetta
- `"reviews"` (localStorage) - Recensioni pubbliche
- `"userPreferences"` (localStorage) - Preferenze e ricette salvate
- `"loggedUser"` (sessionStorage) - ID utente correntemente loggato

#### Struttura oggetto utente:
```
{
    id: "user_<timestamp>_<random>",
    username: string,
    email: string,
    passwordHash: string (SHA-256),
    favorites: array[recipeId],
    creationDate: ISO string,
    profile: {
        fullName?: string,
        preferredCuisines?: array
    }
}
```

#### Struttura oggetto nota:
```
{
    id: "note_<timestamp>_<random>",
    userId: string,
    recipeId: string,
    content: string,
    createdAt: ISO string,
    isPrivate: boolean
}
```

#### Struttura oggetto recensione:
```
{
    id: "review_<timestamp>_<random>",
    userId: string,
    recipeId: string,
    rating: number (1-5),
    comment: string,
    createdAt: ISO string
}
```

---

## Strategia di gestione dati

### Inizializzazione distribuita
- **Ogni pagina** carica solo i dati che le servono
- **Cache intelligente** per evitare caricamenti multipli
- **Lazy loading** per ricette da API
- **Funzioni getter** per dati sempre aggiornati

### Operazioni atomiche vs cache
#### Operazioni atomiche (critiche):
- Registrazione nuovo utente
- Eliminazione account
- Modifica dati profilo
- Aggiornamento sessione login

#### Operazioni con cache (non critiche):
- Validazione username/email in tempo reale
- Ricerca utenti esistenti
- Visualizzazione dati profilo

### Pre-caricamento ricette
- **All'avvio dell'app**: caricamento completo ricette da API
- **Storage locale**: cache per ricerca veloce offline
- **Sync periodico**: aggiornamento dati su richiesta

---

## Flusso applicazione

### 1. Accesso iniziale (index.html)
- Controllo stato login esistente
- Redirect automatico a dashboard se già loggato
- Form login per utenti registrati
- Link a registrazione per nuovi utenti

### 2. Registrazione (signin.html)
- Validazione input in tempo reale
- Controllo duplicati username/email
- Creazione account con password hashata
- Redirect automatico a dashboard post-registrazione

### 3. Dashboard utente (dashboard.html)
- Verifica autenticazione all'accesso
- Panoramica ricette preferite
- Accesso rapido a ricerca e profilo
- Visualizzazione ultime attività (note/recensioni)

### 4. Ricerca ricette (search.html)
- Pre-caricamento dati ricette
- Ricerca in tempo reale su cache locale
- Filtri per ingredienti, difficoltà, tempo
- Paginazione risultati

### 5. Dettaglio ricetta (recipe-detail.html)
- Visualizzazione completa ricetta
- Gestione note private (CRUD)
- Gestione recensioni pubbliche (lettura/scrittura)
- Azioni: aggiungi/rimuovi dai preferiti

### 6. Gestione profilo (profile.html)
- Modifica dati personali (operazione atomica)
- Visualizzazione cronologia note/recensioni
- Gestione preferenze applicazione
- Eliminazione account (con conferma)

---

## Architettura moduli JavaScript

### common.js - Core dell'applicazione
**Responsabilità:**
- Gestione chiavi storage e accesso dati
- Funzioni di inizializzazione per ogni pagina
- Utilities generali (hash, date, validazioni base)
- Getter/setter per tutti i database locali
- Cache intelligente per ottimizzazioni

**Funzioni principali:**
- `initializePage(requiredData)` - Inizializzazione modulare
- `getRegisteredUsers()` - Getter con cache per utenti
- `atomicAddUser()` - Aggiunta utente atomica
- `atomicDeleteUser()` - Eliminazione utente atomica
- `atomicUpdateUser()` - Modifica utente atomica

### auth.js - Gestione autenticazione
**Responsabilità:**
- Validazione credenziali e creazione utenti
- Hashing password e confronto sicuro
- Gestione stato sessione utente

**Funzioni principali:**
- `validateUserEntry()` - Controllo duplicati
- `createUserObject()` - Creazione oggetto utente completo
- `searchUserbyName()` - Ricerca utente per username
- `admitUser()` - Verifica credenziali login

### recipes.js - Gestione ricette
**Responsabilità:**
- Caricamento ricette da API esterna
- Cache locale e gestione offline
- Funzioni di ricerca e filtro
- Gestione preferiti utente

**Funzioni principali:**
- `loadRecipesFromAPI()` - Caricamento iniziale
- `getRecipes()` - Getter con lazy loading
- `searchRecipes()` - Ricerca locale sui dati
- `toggleFavorite()` - Gestione preferiti

### notes.js - Gestione note private
**Responsabilità:**
- CRUD note personali per ricetta
- Associazione nota-utente-ricetta
- Ricerca nelle proprie note

### reviews.js - Gestione recensioni pubbliche
**Responsabilità:**
- CRUD recensioni pubbliche
- Sistema di rating
- Aggregazione recensioni per ricetta

### validate.js - Validazione input
**Responsabilità:**
- Validazione campi form in tempo reale
- Formattazione UI con classi Bootstrap
- Gestione stato pulsanti submit

---

## Strategie di resilienza

### Gestione errori storage
- Try/catch per operazioni localStorage/sessionStorage
- Fallback per storage non disponibile
- Messaggi utente informativi per errori

### Gestione navigazione durante operazioni asincrone
- Feedback visivo durante operazioni critiche
- Disabilitazione temporanea controlli UI
- Operazioni rapide per minimizzare finestra di rischio

### Gestione accesso diretto alle pagine
- Inizializzazione distribuita per ogni pagina
- Controllo prerequisiti e redirect automatici
- Caricamento lazy dei dati richiesti

---

## Considerazioni per implementazione

### Sicurezza (limitazioni documentate)
- Hash client-side solo per dimostrazione didattica
- Persistenza locale: privacy e portabilità limitate
- Documentazione chiara dei limiti di sicurezza

### Performance
- Pre-caricamento completo ricette per UX fluida
- Cache intelligente per operazioni frequenti
- Operazioni atomiche solo dove critico

### Scalabilità futura
- Struttura modulare facilmente estendibile
- Possibile migrazione a IndexedDB per dataset grandi
- Architettura pronta per integrazioni backend

### UX e accessibilità
- Feedback immediato per tutte le operazioni
- Messaggi di errore chiari e specifici
- Stato di caricamento visibile per operazioni lunghe

---

## Prossimi passi implementativi

### Fase 1: Completamento sistema utenti
- Finalizzazione funzioni atomiche critiche
- Test robustezza gestione errori
- Implementazione feedback visivo operazioni

### Fase 2: Integrazione gestione ricette
- Creazione modulo recipes.js
- Implementazione pre-caricamento API
- Sviluppo ricerca e filtri locali

### Fase 3: Funzionalità avanzate
- Sistema note private
- Sistema recensioni pubbliche
- Dashboard completa e gestione profilo

### Fase 4: Ottimizzazioni e refinement
- Performance tuning
- Miglioramenti UX
- Documentazione finale e testing
