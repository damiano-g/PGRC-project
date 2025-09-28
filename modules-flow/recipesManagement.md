================================================================================
                          FLOW CHIAMATE INTERNE - recipesManagement.js
================================================================================

API PUBBLICA (Punti di Ingresso Esterni)
├── getAllRecipes()
│   ├── getData("recipes") → [EXT] StorageOperations.get() → Se vuoto: createLocalRecipesDB()
│   ├── [EXT] structuredClone() → Deep copy sicura
│   └── Returns: Promise<Array<FullRecipe>>
├── getAllCategories()
│   ├── getData("categories") → [EXT] StorageOperations.get() → Se vuoto: createLocalCategoriesDB()
│   ├── [EXT] structuredClone() → Deep copy sicura
│   └── Returns: Promise<Array<Category>>
├── searchRecipeById(recipeId)
│   ├── getAllRecipes()
│   ├── [EXT] structuredClone() → Deep copy ricetta trovata
│   └── Returns: Promise<FullRecipe>
├── searchRecipesByName(query)
│   ├── getAllRecipes()
│   ├── Algoritmo scoring multi-termine (sincrono)
│   └── Returns: Promise<Array<FullRecipe>>
├── rndSearch(quantity)
│   ├── getAllRecipes()
│   ├── Estrazione casuale unica (sincrono)
│   └── Returns: Promise<Array<FullRecipe>>
└── searchRecipesByCategory(category)
    ├── getAllRecipes()
    ├── Filtro per categoria (sincrono)
    └── Returns: Promise<Array<FullRecipe>>

FUNZIONI PRIVATE (Utility Interne)
├── fetchRecipes(URL, options, specifier)
│   ├── [EXT] fetch() → Chiamata HTTP a TheMealDB
│   ├── [EXT] response.json() → Parsing risposta
│   └── Returns: Promise<Object|null>
├── fetchAllCategories()
│   ├── fetchRecipes(fetchAllCategoriesURL, fetchOptions)
│   └── Returns: Promise<Object|null>
├── fetchByFirstLetter(letter)
│   ├── fetchRecipes(fetchByFirstLetterURL, fetchOptions, letter)
│   └── Returns: Promise<Object|null>
├── createLocalRecipesDB()
│   ├── Itera alfabeto (a-z) → fetchByFirstLetter() per ogni lettera
│   ├── [EXT] new FullRecipe() → Conversione dati API
│   ├── [EXT] StorageOperations.set() → Salvataggio in localStorage
│   └── Returns: Promise<Array<FullRecipe>>
├── createLocalCategoriesDB()
│   ├── fetchAllCategories()
│   ├── [EXT] new Category() → Conversione dati API
│   ├── [EXT] StorageOperations.set() → Salvataggio in localStorage
│   └── Returns: Promise<Array<Category>>
└── getData(storageKey)
    ├── [EXT] StorageOperations.get() → Controllo cache locale
    ├── Se cache vuota: createLocalRecipesDB() o createLocalCategoriesDB()
    ├── [EXT] structuredClone() → Deep copy
    └── Returns: Promise<Array>

================================================================================
NOTE ARCHITETTURALI E LIMITI
================================================================================

ARCHITETTURA E PATTERN:
- Repository Pattern: getData() come data access layer con cache locale e fallback API
- API Client Pattern: fetchRecipes() per astrazione chiamate HTTP a TheMealDB
- Factory Pattern: createLocalRecipesDB() e createLocalCategoriesDB() per costruzione DB locali
- Lazy Loading: Cache popolata on-demand alla prima richiesta
- Immutability: structuredClone() previene mutazioni accidentali dati
- Atomic Operations: Lettura-modifica-scrittura per consistency storage

BUSINESS RULES:
- Cache Locale: Dati API salvati in localStorage per ridurre chiamate esterne
- Fallback API: Se cache vuota, fetch automatico da TheMealDB
- Ricerca Case-Insensitive: Algoritmo scoring per matching flessibile
- Estrazione Casuale Unica: rndSearch() garantisce no duplicati
- Filtro Categorie: Matching esatto per categorizzazione precisa
- Validazione Input: Controllo presenza parametri prima elaborazione

DIPENDENZE:
- data-models.js: Classi Category/FullRecipe per costruzione oggetti
- storageManagement.js: StorageOperations per persistenza localStorage
- Web APIs: fetch() per HTTP, structuredClone() per deep copy, Math.random() per casualità
- TheMealDB API: Endpoint esterni per dati ricette/categorie

PERFORMANCE:
- Cache Locale: Riduce drasticamente chiamate API esterne (trade-off storage vs network)
- Lazy Population: DB creato solo alla prima richiesta (startup veloce)
- Ricerca Sincrona: Algoritmi locali dopo caricamento iniziale
- Deep Copy Overhead: structuredClone() computazionalmente costoso per array grandi
- HTTP Parallel: fetchByFirstLetter() itera alfabeto sequenzialmente (no concorrenza)
- Storage I/O: Letture/scritture localStorage bloccanti

LIMITAZIONI:
- Dipendenza API Esterna: Offline completamente inutilizzabile
- Rate Limiting API: TheMealDB ha limiti chiamate (gestiti da cache)
- Dati Statali: No aggiornamenti automatici ricette (solo cache locale)
- Lingua Inglese: API fornisce solo contenuti in inglese
- No Paginazione: Caricamento completo dataset (non scalabile per DB grandi)
- No Filtri Avanzati: Solo ricerca base per nome/categoria/ID

SICUREZZA:
- Input Sanitization: Trim e validazione stringhe da API esterna
- No SQL Injection: Uso fetch() sicuro, no query dirette DB
- Data Validation: Controllo struttura risposta API prima processamento
- Error Handling: Catch errori HTTP e parsing JSON
- No Sensitive Data: API pubblica, no dati utente esposti

================================================================================
DIPENDENZE ESTERNE EVIDENZIATE [EXT]
================================================================================
- data-models.js:
  ├── Category → Classe per oggetti categoria
  └── FullRecipe → Classe per oggetti ricetta completa

- storageManagement.js:
  ├── StorageOperations.get() → Lettura da localStorage
  └── StorageOperations.set() → Salvataggio in localStorage

- Web APIs native:
  ├── fetch() → Chiamate HTTP a TheMealDB
  ├── structuredClone() → Deep copy oggetti/array
  └── Math.random() → Generazione numeri casuali

- TheMealDB API:
  ├── /categories.php → Lista categorie
  └── /search.php?f= → Ricerca per lettera

================================================================================
LEGEND:
- API PUBBLICA: Funzioni esportate, chiamate da altri moduli
- FUNZIONI PRIVATE: Utility interne, non esportate
- [EXT]: Dipendenza esterna evidenziata con descrizione
- → : Chiamata diretta
- Returns: Tipo/valore di ritorno (Promise per async)
================================================================================