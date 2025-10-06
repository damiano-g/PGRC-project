# RELAZIONE TECNICA - PROGETTO PGRC
**Piattaforma per la Gestione di Ricette di Cucina**

---

**Corso:** Programmazione Web e Mobile  
**Anno Accademico:** 2025/2026  
**Candidato:** Damiano Ghibaudo  
**Data:** Ottobre 2025

---

## INDICE

1. [Introduzione e Obiettivi](#1-introduzione-e-obiettivi)
2. [Architettura e Design](#2-architettura-e-design)
3. [Implementazione Core](#3-implementazione-core)
4. [Gestione Dati e API](#4-gestione-dati-e-api)
5. [Interfaccia Utente e UX](#5-interfaccia-utente-e-ux)
6. [Testing e Validazione](#6-testing-e-validazione)
7. [Conclusioni](#7-conclusioni)

---

## 1. INTRODUZIONE E OBIETTIVI

### 1.1 Panoramica del Progetto

PGRC (Piattaforma per la Gestione di Ricette di Cucina) è un'applicazione web frontend-only sviluppata per soddisfare quattro macro-scenari funzionali:

1. **Gestione Profilo Utente:** Registrazione, autenticazione, modifica dati e cancellazione account
2. **Ricerca Ricette:** Integrazione con API TheMealDB per ricerca testuale e per categoria
3. **Ricettario Personale:** Sistema preferiti con note private personalizzabili
4. **Sistema Recensioni:** Rating duale (gusto/difficoltà) con aggregazione community

### 1.2 Vincoli Tecnici e Soluzioni Adottate

Il progetto rispetta rigorosamente i vincoli di consegna implementando le seguenti soluzioni:

- **Frontend Only:** HTML5, CSS3, JavaScript ES6+ senza dipendenze backend
- **Persistenza Locale:** Web Storage API (localStorage/sessionStorage) con architettura cache-first
- **Separazione Concerns:** Architettura modulare a tre layer (Presentation, Service, Data)
- **Responsive Design:** Mobile-first approach con CSS Grid e Flexbox

### 1.3 Valore Aggiunto Implementato

Oltre ai requisiti base, l'applicazione introduce:
- Session Service come orchestratore centrale con facade pattern
- Sistema di validazione dual-layer (UX + business logic)
- Error handling tipizzato con classi custom
- Cache intelligente con refresh automatico
- UI dinamica con event delegation pattern

---

## 2. ARCHITETTURA E DESIGN

### 2.1 Struttura Modulare a Tre Layer

```
┌─────────────────────────────────────┐
│        PRESENTATION LAYER           │
│   (Pages + UI Components + CSS)     │
├─────────────────────────────────────┤
│         SERVICE LAYER               │
│     (Session Orchestration)         │
├─────────────────────────────────────┤
│           DATA LAYER                │
│  (Storage + API + Data Models)      │
└─────────────────────────────────────┘
```

#### Presentation Layer
Le pagine HTML implementano struttura con separazione netta tra contenuto e presentazione. I componenti UI in `js/components/ui.js` gestiscono rendering dinamico e interazioni, mentre i page scripts in `js/pages/` orchestrano la logica specifica di ogni vista.

#### Service Layer 
Il `session-service.js` agisce come facade pattern esponendo namespace dedicati:
- `NewUser`: Operazioni utenti non autenticati (login, registrazione)
- `LoggedUser`: Gestione profilo e operazioni autenticate
- `Recipe`: Stato e operazioni su ricette
- `PreviewArray`: Generazione array per popolamento UI

#### Data Layer
Gestisce persistenza tramite `storage.js` (astrazione localStorage/sessionStorage), integrazione API con `recipes-service.js`, e modelli dati con `data-models.js` per entità business.

### 2.2 Design Pattern Strategici

#### Factory Pattern per Data Models
Il sistema utilizza factory pattern per la creazione consistente di entità business:
- **User Factory:** Genera istanze utente con ID univoci, array inizializzati per preferiti/note
- **Recipe Factory:** Normalizza dati API TheMealDB in formato interno consistente
- **Review Factory:** Crea recensioni con validazione parametri e timestamp automatici
- **ID Generation:** Sistema centralizzato per generazione identificatori univoci basati su timestamp e randomizzazione

#### Strategy Pattern per Error Handling
Sistema di gestione errori tipizzato con classi custom per scenari specifici:
- **NotFound (404):** Entità non trovate con dettagli campo/valore per debugging
- **Duplicated (409):** Violazioni unicità con identificazione campo duplicato
- **InvalidFormat (422):** Errori validazione formato con messaggio specifico
- **Unauthorized (401):** Tentativi accesso non autorizzati

Ogni classe mantiene codice HTTP, tipo entità e metadati per logging centralizzato.

#### Event Delegation Pattern
```javascript
// Da search.js - gestione eventi su card dinamiche
resultsContainer.addEventListener("click", (event) => {
    const card = event.target.closest(".card");
    const isFavBtn = event.target.matches(".fav-icon");
    
    if (card && !isFavBtn) {
        window.location.href = `recipe-details.html?id=${card.dataset.itemId}`;
    }
    
    if (isFavBtn) {
        try {
            LoggedUser.updateFavourites(card.dataset.itemId);
            favBtnDisplay(event.target, card.dataset.itemId);
        } catch (error) {
            showAlert("Error updating favourites", "danger");
        }
    }
});
```

### 2.3 Organizzazione File System

```
PGRC-project/
├── index.html                 # Homepage con carousel ricette popolari
├── style.css                  # Stili CSS principali responsive
├── favicon.ico                # Icona applicazione
├── specifiche-progetto.md     # Documentazione requisiti originali
│
├── pages/                     # Pagine HTML dell'applicazione
│   ├── favourites.html        # Ricettario personale con tab
│   ├── login.html             # Autenticazione utente
│   ├── recipe-details.html    # Dettaglio ricetta completo
│   ├── search.html            # Ricerca e risultati
│   ├── settings.html          # Gestione profilo utente
│   └── signIn.html            # Registrazione nuovo utente
│
├── js/                        # Moduli JavaScript
│   ├── core/                  # Moduli fondamentali
│   │   ├── data-models.js     # Factory per entità business (User, Recipe, Review, Note)
│   │   ├── errors.js          # Error classes tipizzate (NotFound, Duplicated, InvalidFormat)
│   │   └── storage.js         # Astrazione Web Storage unificata
│   │
│   ├── services/              # Business logic layer
│   │   ├── session-service.js # Orchestratore centrale con namespace (NewUser, LoggedUser, Recipe)
│   │   ├── users-service.js   # CRUD utenti + sicurezza + validazione
│   │   ├── recipes-service.js # API integration + cache TheMealDB
│   │   └── reviews-service.js # Sistema recensioni con aggregazione
│   │
│   ├── components/            # Componenti UI riutilizzabili
│   │   └── ui.js              # Factory card, rating display, popolamento container
│   │
│   └── pages/                 # Script specifici per pagina
│       ├── index.js           # Homepage con carousel e categorie
│       ├── login.js           # Autenticazione e gestione sessione
│       ├── signin.js          # Registrazione con validazione real-time
│       ├── search.js          # Ricerca ricette e gestione risultati
│       ├── recipe-details.js  # Dettaglio ricetta con recensioni e note
│       ├── favourites.js      # Ricettario personale con tab (preferiti/note)
│       └── settings.js        # Modifica profilo e cancellazione account
│
├── assets/                    # Risorse statiche
│   └── images/
│       ├── no_image.jpg       # Immagine fallback per ricette senza foto
│       └── Pot_logo.png       # Logo applicazione
│
├── bootstrap/                 # Framework CSS/JS
│   ├── css/                   # Stili Bootstrap 5
│   ├── js/                    # JavaScript Bootstrap 5
│   └── icons/                 # Bootstrap Icons
│
└── utils/                     # Utilità sviluppo
    └── create-user-db.js      # Script creazione database utenti test
```

---

## 3. IMPLEMENTAZIONE CORE

### 3.1 Session Service: Orchestrazione Centralizzata

Il Session Service implementa il pattern facade fornendo API uniforme per tutte le operazioni attraverso namespace dedicati:

**NewUser Namespace:**
- `startSession()`: Autenticazione utente con aggiornamento stato sessione
- `addToDB()`: Registrazione nuovo utente con validazione completa

**LoggedUser Namespace:**
- `getId()`, `isLogged()`: Gestione stato autenticazione
- `getProfile()`, `updateProfile()`: Operazioni profilo utente
- `updateFavourites()`, `getFavourites()`: Gestione ricette preferite
- `addNote()`, `getRecipeNotes()`: Sistema note personalizzate

**Recipe Namespace:**
- `getAll()`, `searchByName()`, `searchByCategory()`: Operazioni ricerca
- `isFavourite()`, `avgTasteRate()`, `avgDifficultyRate()`: Stati e aggregazioni

### 3.2 Cache-First Strategy per Performance

L'integrazione API implementa strategia cache intelligente:

**Strategia Cache-First:**
- `createRecipesDB()`: Caricamento completo database A-Z con iterazione alfabetica
- `refreshDatabase()`: Aggiornamento selettivo per tipo di dato (ricette/categorie)
- `getRecipes()`: Controllo validità cache con fallback API automatico

**Gestione Performance:**
- Cache localStorage con timestamp per controllo scadenza
- Normalizzazione dati API in formato interno ottimizzato
- Batch processing per riduzione chiamate API sequenziali
- Error handling con graceful degradation per connessioni instabili

### 3.3 Validazione Dual-Layer

#### Layer Presentation: UX Real-time
Validazione lato client con feedback immediato tramite:
- **Real-time Validation:** Controllo formato durante digitazione (username, email, password)
- **Bootstrap Integration:** Classi `is-valid`/`is-invalid` per feedback visivo
- **Duplication Check:** Verifica unicità username/email in tempo reale
- **Message Management:** Feedback contestuale con messaggi specifici per tipo errore

#### Layer Business: Sicurezza e Integrità
Validazione server-side simulata con controlli rigorosi:
- **Format Validation:** Regex per email, lunghezza username/password
- **Password Confirmation:** Verifica corrispondenza password
- **Uniqueness Control:** Controlli duplicazione su database utenti
- **Security Measures:** Hashing password con algoritmi sicuri
- **Error Management:** Lancio eccezioni tipizzate per gestione centralizzata

### 3.4 Sistema Recensioni con Rating Duale

Il sistema recensioni implementato in `reviews-service.js` gestisce rating duale (gusto/difficoltà) con aggregazione statistica:

**Funzioni Core:**
- `addNewReview()`: Creazione recensione con validazione business rules
- `updateReview()`: Modifica recensioni esistenti con controlli proprietà
- `deleteReview()`: Rimozione recensioni con cleanup automatico
- `getRecipeReviews()`: Recupero recensioni per ricetta specifica
- `calculateAverageRating()`: Aggregazione statistica per campo rating

**Caratteristiche Sistema:**
- **CRUD Completo:** `addNewReview()`, `updateReview()`, `deleteReview()`, `getRecipeReviews()`
- **Aggregazione:** `calculateAverageRating()` per media per campo (gusto/difficoltà)
- **Business Rules:** Unicità utente-ricetta, validazione range valori (1-5)
- **Persistenza:** Storage automatico in localStorage con error handling

### 3.5 Gestione Ricette e API Integration

Il modulo `recipes-service.js` implementa strategia cache-first per l'integrazione con TheMealDB API:

**Gestione Database:**
- `createRecipesDB()`: Caricamento alfabetico completo (A-Z) con normalizzazione dati
- `refreshDatabase()`: Aggiornamento selettivo con controllo timestamp
- `getRecipes()`: Accesso cache con fallback API automatico

**Search Engine:**
- `searchRecipesByName()`: Algoritmo scoring con rilevanza multi-parola
- `searchRecipesByCategory()`: Filtro categoriale con cache ottimizzata
- Sorting automatico per rilevanza con boost per match iniziali

**Funzioni Principali:**
- **Cache Management:** `getRecipes()`, `refreshDatabase()` con controllo validità temporale
- **Search Engine:** `searchRecipesByName()` con algoritmo scoring per rilevanza
- **Category Management:** `getCategories()`, `searchRecipesByCategory()`
- **Data Normalization:** Conversione automatica da formato TheMealDB a `FullRecipe`

---

## 4. GESTIONE DATI E API

### 4.1 Integrazione TheMealDB API

L'applicazione utilizza strategia cache-first con due endpoint strategici:
- **Categorie:** `https://www.themealdb.com/api/json/v1/1/categories.php`
- **Ricette per lettera:** `https://www.themealdb.com/api/json/v1/1/search.php?f={letter}`

La scelta del secondo endpoint consente caricamento completo del database (A-Z) implementando ricerca lato client con algoritmo di scoring per rilevanza (implementazione dettagliata in sezione 3.5).

### 4.2 Modelli Dati Normalizzati

#### Modello Recipe Esteso
La classe `FullRecipe` normalizza i dati API TheMealDB:
- **Mapping Campi:** Conversione automatica da formato API a struttura interna
- **Ingredients Parsing:** Estrazione ingredienti con misure da campi numerati (1-20)
- **Fallback Values:** Gestione campi mancanti con valori di default
- **Timestamp Creation:** Aggiunta automatica data creazione per cache management

### 4.3 Storage Strategy Unificata

Il sistema di storage unificato (`storage.js`) astrae localStorage/sessionStorage:

**Operazioni Core:**
- `get()`: Recupero dati con parsing automatico per tipo (array/string)
- `set()`: Salvataggio con serializzazione automatica JSON
- `remove()`: Cancellazione selettiva per chiave
- `clear()`: Reset completo storage per location

**Gestione Tipi:**
- Parsing automatico JSON per array con fallback vuoto
- Gestione string con fallback stringa vuota
- Error handling con logging per debugging
- Supporto sia localStorage che sessionStorage

---

## 5. INTERFACCIA UTENTE E UX

### 5.1 Responsive Design Mobile-First

L'approccio mobile-first è implementato tramite CSS Grid e media queries. Il file `style.css` definisce breakpoint ottimizzati per tutti i dispositivi:

- **Mobile (320px+):** Layout single-column con card verticali
- **Tablet (560px+):** Grid a 2 colonne con card orizzontali  
- **Desktop (720px+):** Grid ottimizzata con hover effects

La navbar utilizza Bootstrap 5 con design fixed-top e dropdown menu per la navigazione, mentre i container di ricette implementano CSS Grid responsive con `auto-fill` e `minmax()` per adattamento automatico.

### 5.2 Architettura Componenti UI

Il sistema di rendering è organizzato nel modulo `ui.js` che implementa factory pattern per componenti riutilizzabili:

#### Factory Functions Principali
- **Card Factory:** `createPreviewCard()` per ricette con gestione automatica icone preferiti  
- **Rating Display:** `cardRatingContent()` per visualizzazione valutazioni con icone Bootstrap
- **Carousel Items:** `createCarouselItem()` per slide Bootstrap con caption e preferiti
- **Note Cards:** `createNoteCard()` per card note utente con pulsante rimozione
- **Recipe Overview:** `createRecipeOverview()` per card complete con rating e recensioni

#### Implementazione Core Components

**Factory per Card Preview:**
Sistema di generazione card dinamiche con gestione automatica:
- Struttura base card Bootstrap con immagine e titolo
- Injection condizionale di elementi body (rating, note, preferiti)
- Gestione automatica icone preferiti con stato dinamico
- Dataset attribution per identificazione univoca elementi

**Strategie Display Specializzate:**
Pattern strategy per contenuto card con rendering condizionale:
- `withGlobalRating`: Visualizzazione rating community aggregati
- `withUserRating`: Rating personali utente con fallback zero
- `withNotes`: Lista note utente con troncamento automatico
- Error handling uniforme con fallback graceful per ogni strategia

**Gestione UI States:**
Sistema centralizzato per stati interfaccia:
- `favBtnDisplay()`: Toggle icone preferiti basato su stato utente/ricetta
- `showOverlay()`/`hideOverlay()`: Loading spinner per operazioni asincrone
- `formatInputField()`: Validazione real-time con classi Bootstrap e feedback specifico

#### Pattern Architetturali e Funzioni Aggiuntive

**Populacional Container Management:**
- `populatePreviewContainer()`: Popolazione sequenziale con matching 1:1 tra preview e body elements
- `populateCarousel()`: Gestione carousel Bootstrap con slide dinamiche
- `populateRecipeNotes()`: Container note con show/hide automatico basato su array length

**Navbar Dinamica:**
- `initializeNavbar()`: Configurazione link e event listeners basata su pagina corrente e stato utente
- Gestione automatica prefissi path per navigazione tra directory
- Collegamenti condizionali (home, personal, settings, login/logout)

**Form Validation UI:**
- `formatInputField()`: Validazione real-time con classi Bootstrap e feedback specifico per tipo errore
- Supporto per codici errore business (422 formato, 409 duplicato)
- Struttura HTML con `.invalid-feedback` per messaggi contestuali

**Loading States:**
- `showOverlay()`/`hideOverlay()`: Spinner overlay per operazioni asincrone lunghe
- Overlay con spinner Bootstrap e testo accessibile per screen reader

### 5.3 Gestione Stati UI e Navbar Dinamica

Il progetto implementa gestione stati tramite classi Bootstrap e funzioni dedicate. Gli stati di loading vengono gestiti con overlay CSS posizionati, mentre la validazione form utilizza le classi `is-valid`/`is-invalid` di Bootstrap per feedback real-time.

La navbar dinamica si aggiorna automaticamente basandosi sullo stato di autenticazione, mostrando menu contestuali per utenti loggati (dropdown con username, settings, logout) o guest (solo search e login) tramite il dropdown menu del logo.

---

## 6. TESTING E VALIDAZIONE

### 6.1 Test Scenari Critici

#### Scenario 1: Workflow Completo Utente
```
Registrazione → Login → Ricerca → Dettaglio → Preferiti → Recensione → Note
```

**Risultati verificati:**
- ✅ Validazione form real-time con feedback Bootstrap
- ✅ Persistenza dati localStorage attraverso refresh pagina
- ✅ Sincronizzazione stato UI con storage (preferiti, recensioni)
- ✅ Cache-first strategy riduce chiamate API duplicate

#### Scenario 2: Gestione Errori e Edge Cases
```
Dati incompleti API → Valori null/undefined → Connessione lenta → Form validation
```

**Risultati:**
- ✅ Fallback chain per dati API incompleti (campi vuoti invece di errori)
- ✅ Graceful degradation con console.error per debugging
- ✅ Validazione robusta input utente con feedback specifico
- ✅ Loading states per operazioni asincrone lunghe

### 6.2 Test Performance e Compatibilità

#### Metriche Performance
- **Page Load:** Rapido con cache (localStorage/sessionStorage)
- **API Response:** Dipendente da TheMealDB (variabile 200ms-2s)
- **Storage Access:** Sincrono e immediato (localStorage)
- **UI Interactions:** Responsivo con event delegation pattern

#### Browser Compatibility

**Requisiti per Piena Compatibilità:**
- **ES6+ Support:** Moduli JavaScript, async/await, destructuring, structuredClone
- **Web Storage API:** localStorage e sessionStorage per persistenza dati
- **Fetch API:** Per integrazione TheMealDB (con polyfill per browser legacy)
- **CSS Grid/Flexbox:** Layout responsive e componenti Bootstrap 5

**Browser Moderni Supportati:**
- Chrome, Firefox, Safari, Edge (versioni recenti con supporto ES6+ completo)
- Mobile browsers moderni con Web APIs standard

### 6.3 Test Responsive Design

#### Breakpoint Testing
- **Mobile (320-559px):** Layout single-column, card verticali con dimensione del body adattiva
- **Tablet (560-719px):** Grid 2-colonne, card orizzontali  
- **Desktop (720px+):** Grid ottimizzata, card orizzontali
---

## 7. CONCLUSIONI

### 7.1 Analisi Decisioni Architetturali

**Three-Layer Architecture:**
- *Vantaggi:* Separazione concerns, modularità, manutenibilità del codice
- *Svantaggi:* Overhead per progetti semplici, complessità iniziale setup
- *Trade-off:* Scalabilità futura vs. semplicità immediata

**Session Service Pattern:**
- *Vantaggi:* API unificata, single source of truth, consistenza, debugging semplificato
- *Svantaggi:* Single point of failure, accentramento responsabilità 
- *Trade-off:* Controllo centralizzato e modularità vs. distribuzione responsabilità

**Event Delegation Pattern:**
- *Vantaggi:* Performance con contenuto dinamico, memoria ottimizzata, gestione centralizzata
- *Svantaggi:* Debugging più complesso, controllo granulare limitato
- *Trade-off:* Efficienza vs. granularità controllo eventi

### 7.2 Conformità Requisiti Vincolanti

**Vincoli Frontend-Only:**
- *Implementazione:* HTML5/CSS3/JavaScript ES6+ puro senza backend
- *Implicazioni:* Validazione solo client-side, sicurezza limitata, nessuna elaborazione server

**Cache-First Strategy (Requisito):**
- *Implementazione:* localStorage per ricette, refresh giornaliero automatico
- *Implicazioni:* Riduzione chiamate API ma gestione manuale cache

**Web Storage API (Requisito):**
- *Implementazione:* localStorage/sessionStorage per persistenza completa
- *Implicazioni:* Storage limitato (~5MB), volatilità dati, nessuna concorrenza

### 7.3 Valutazione Scelte Tecnologiche

**JavaScript ES6+ Modules:**
- *Vantaggi:* Import/export nativi, tree-shaking, sviluppo modulare
- *Svantaggi:* Compatibilità browser limitata, nessun bundling/minification
- *Impatto:* Codice più pulito ma deployment meno ottimizzato

**Bootstrap 5:**
- *Vantaggi:* UI consistency, componenti ready-to-use, responsive integrato
- *Svantaggi:* Bundle size, personalizzazione limitata, dipendenza esterna
- *Impatto:* Velocità sviluppo vs. controllo granulare styling

### 7.4 Conformità Requisiti vs. Limitazioni

**Vincoli Rispettati:**
- Frontend-only: ✅ Nessuna dipendenza backend
- Web Storage: ✅ localStorage/sessionStorage per persistenza
- API Integration: ✅ TheMealDB con gestione asincrona
- Responsive: ✅ Mobile-first con breakpoint definiti

**Limitazioni Intrinseche:**
- Sicurezza: Validazione solo client-side, dati esposti
- Scalabilità: Storage quota browser, nessuna gestione concorrenza
- Affidabilità: Dipendenza API esterna
- Performance: latenza API variabile

### 7.5 Impatto Decisioni sul Prodotto Finale

L'architettura implementata risulta **appropriata per il contesto accademico** con requisiti frontend-only, fornendo equilibrio tra complessità implementativa e funzionalità complete. Le scelte tecnologiche sono state orientate verso **conformità ai vincoli** e **tentativo di predisposizione per scalabilità futura**.

Il sistema, pur operando nei limiti dei vincoli frontend-only, rappresenta un **tentativo di architettura predisposta per integrazione backend** con **struttura estendibile** che potrebbe facilitare evoluzioni verso soluzioni production-ready.

---

**Fine Relazione Tecnica**

*Documento rappresentativo del progetto PGRC - Programmazione Web e Mobile A.A. 2025/2026*