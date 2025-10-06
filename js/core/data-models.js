/**
 * @fileoverview Data models per ricette e categorie - costruttori e utilità per oggetti business
 * @description Fornisce classi unificate per gestire dati provenienti da TheMealDB API
 * con normalizzazione campi e pattern di fallback per gestione dati incompleti

 * @requires Nessuna dipendenza esterna - modulo self-contained
 */

// ================================================================================================
// UTILITY FUNCTIONS
// ================================================================================================

/**
 * Genera ID univoci per entità del sistema con timestamp e componente random
 * 
 * @function generateItemId
 * @private
 * @param {string} itemType - Prefisso tipo oggetto ("user", "note", "review")
 * @returns {string} ID univoco formato: "tipo_timestamp_random4digit"
 * 
 * @description
 * Strategia di generazione ID standardizzata per garantire unicità.
 * - Timestamp Unix: garantisce unicità temporale (millisecondi)
 * - Random 4-digit: riduce probabilità collisioni simultanee
 * - Prefisso tipo: tipo di dato
 * 
 * @example
 * generateItemId("user") → "user_1693747200000_1234"
 * generateItemId("note") → "note_1693747201500_5678"
 * 
 */
export function generateItemId(itemType) {
    const timestamp = Date.now(); // Timestamp Unix in millisecondi
    const rnd = String(Math.floor(Math.random()*10000)).padStart(4, "0"); // Numero casuale 0000-9999
    return `${itemType}_${timestamp}_${rnd}`;
};

// ================================================================================================
// USER MANAGEMENT MODELS
// ================================================================================================

/**
 * Classe per oggetti utente del sistema con dati pre-validati
 *  
 * @class
 * @param {string} validUsername - Username già validato upstream
 * @param {string} validEmail - Email già validata upstream
 * @param {string} hashedPassword - Password già hashata per sicurezza
 *
 * @description
 * Factory per utenti con validazione delegata a layer superiore.
 * - ID auto-generato per unicità garantita
 * - Arrays vuoti per favourites/notes (populate on-demand)
 * - Oggetto date per tracciamento creazione oggetto
 * - Password management delegato a auth layer
 *
 * @example
 * const hashedPwd = await hashPassword("mypassword");
 * const newUser = new User("john_doe", "john@example.com", hashedPwd);
 */
export class User {

    /** @type {string} */ id;
    /** @type {string} */ username;
    /** @type {string} */ email;
    /** @type {string} */ password;
    /** @type {Array<string>} */ favourites;
    /** @type {Array<Note>} */ notes;
    /** @type {Date} */ creationDate;

    constructor(validUsername, validEmail, hashedPassword) {
        this.id = generateItemId("user");
        this.username = validUsername; // Username fornito (già validato)
        this.email = validEmail; // Email fornita (già validata)
        this.password = hashedPassword; // Password hashata
        this.favourites = [];
        this.notes = [];
        this.creationDate = new Date();
    }
};

/**
 * Classe per note personali utente legate a ricette specifiche
 * 
 * @class
 * @param {string} recipeId - ID ricetta a cui è associata la nota
 * @param {string} text - Contenuto testuale della nota
 * 
 * @description
 * Factory per annotazioni utente con metadata automatici.
 * - ID auto-generato per riferimenti univoci
 * - Oggetto date per tracciamento creazione oggetto
 * - Associazione diretta recipeId per lookup rapido
 * 
 * @example
 * const userNote = new Note("52772", "Ricetta facile, aggiungere più sale");
 */
export class Note {

    /** @type {string} */ id;
    /** @type {string} */ recipeId;
    /** @type {string} */ text;
    /** @type {Date} */ creationDate;

    constructor(recipeId, text){
        this.id = generateItemId("note");
        this.recipeId = recipeId;
        this.text = text;
        this.creationDate = new Date();
    }
};

/**
 * Classe per recensioni utente con rating duali (gusto + difficoltà)
 * 
 * @class
 * @param {string} recipeId - ID ricetta recensita
 * @param {string} userId - ID utente autore recensione
 * @param {number} tasteRate - Rating gusto
 * @param {number} difficultyRate - Rating difficoltà preparazione
 * 
 * @description
 * Factory per recensioni con business rule validation.
 * - Dual rating system per categorizzazione multi-dimensionale
 * - User-recipe uniqueness gestita a livello storage
 * - Oggetto date per tracciamento creazione oggetto
 * 
 * @example
 * const review = new Review("52772", "user123", 4, 3);
 * // Rating gusto 4/5, difficoltà 3/5
 */
export class Review {
    
    /** @type {string} */ id;
    /** @type {string} */ recipeId;
    /** @type {string} */ userId;
    /** @type {number} */ tasteRate;
    /** @type {number} */ difficultyRate;
    /** @type {Date} */ creationDate;
    
    constructor(recipeId, userId, tasteRate, difficultyRate){
        this.id = generateItemId("review");
        this.recipeId = recipeId;
        this.userId = userId;
        this.tasteRate = tasteRate;
        this.difficultyRate = difficultyRate;
        this.creationDate = new Date();
    }
};

// ================================================================================================
// API DATA MODELS - PREVIEW OBJECTS
// ================================================================================================

/**
 * Classe per oggetti categoria
 * 
 * @class
 * @param {Object} rawObj - Oggetto categoria raw da API TheMealDB
 * @param {string} [rawObj.strCategory] - ID categoria NB -> id categoria utile esclusivamente per consistenza struttura dati
 * @param {string} [rawObj.strCategory] - Nome categoria
 * @param {string} [rawObj.strCategoryThumb] - URL immagine categoria
 * 
 * @description
 * Normalizzazione della struttura peculiare TheMealDB API per oggetto categoria.
 * Gestisce dati incompleti tramite fallback chain
 * 
 * @example
 * // Uso con oggetto categoria da API  
 * const categoryPreview = new ItemPreview({
 *   idCategory: "1",
 *   strCategory: "Beef",
 *   strCategoryThumb: "https://www.themealdb.com/images/category/beef.png"
 * }, "categories");
 * 
 * @example
 * // Uso con dati incompleti (graceful degradation)
 * const partialPreview = new ItemPreview({
 *   strMeal: "Pizza"
 *   // id e image saranno stringhe vuote e fallback image
 * }, "meals");
 */
export class Category {

    /** @type {string} */ id;
    /** @type {string} */ name;
    /** @type {string} */ image;
    /** @type {Date} */ creationDate;

    constructor(rawCategoryObj){
        this.id = rawCategoryObj.strCategory || "";
        this.name = rawCategoryObj.strCategory || "";
        this.image = rawCategoryObj.strCategoryThumb || "../assets/images/no_image.jpg";
        this.creationDate = new Date();
    }
};

// ================================================================================================
// API DATA MODELS - FULL RECIPE OBJECTS
// ================================================================================================

/**
 * Classe per oggetti ricetta
 * 
 * @class
 * @function FullRecipe
 * @param {Object} rawRecipeObj - Oggetto ricetta completo da API TheMealDB
 * @param {string} rawRecipeObj.idMeal - ID univoco ricetta
 * @param {string} rawRecipeObj.strMeal - Nome completo ricetta
 * @param {string} rawRecipeObj.strMealThumb - URL immagine high-res ricetta
 * @param {string} rawRecipeObj.strInstructions - Istruzioni di preparazione complete
 * @param {string} [rawRecipeObj.strIngredient1-20] - Ingredienti (fino a 20 campi API)
 * @param {string} [rawRecipeObj.strMeasure1-20] - Misure corrispondenti (fino a 20 campi API)
 * 
 * @see {@link FullRecipe.getIngredients} Per dettagli processamento ingredienti
 * 
 * @description
 * Normalizzazione della struttura peculiare TheMealDB API per oggetto ricetta.
 * Gestisce dati incompleti tramite fallback chain
 * 
 * @example
 * // Creazione da risposta API lookup
 * const apiResponse = await fetchById("52772");
 * const fullRecipe = new FullRecipe(apiResponse.meals[0]);
 * 
 * console.log(fullRecipe.name); // "Teriyaki Chicken Casserole"
 * console.log(fullRecipe.ingredients); 
 * // [
 * //   {name: "soy sauce", measure: "3/4 cup"},
 * //   {name: "water", measure: "1/2 cup"},
 * //   ...
 * // ]
 */
export class FullRecipe {
    
    /** @type {string} ID univoco ricetta dal database TheMealDB */ id;
    /** @type {string} Nome completo ricetta */ name;
    /** @type {string} Categoria di appartenenza */ category;
    /** @type {string} URL immagine */ image; 
    /** @type {string} Istruzioni preparazione complete */ instructions;
    /** @type {Date} oggetto Date di creazione oggetto locale */ creationDate;
    /** 
     * @type {Array<{name: string, measure: string}>} 
     * Array ingredienti processati - chiamata al metodo prototype durante costruzione
     */ ingredients;

    constructor(rawRecipeObj){
        this.id = rawRecipeObj.idMeal || "";
        this.name = rawRecipeObj.strMeal || "";
        this.category = rawRecipeObj.strCategory || "";
        this.image = rawRecipeObj.strMealThumb || "";
        this.instructions = rawRecipeObj.strInstructions || "";
        this.creationDate = new Date();
        this.ingredients = this.getIngredients(rawRecipeObj);
    };

    /**
     * Metodo di processamento ingredienti raw da API in array strutturato
     * @method
     * @param {Object} rawRecipeObj - Oggetto ricetta raw da API
     * @returns {Array<{name: string, measure: string}>} Array ingredienti normalizzati
     * 
     * * @description
     * Gestisce la struttura peculiare di TheMealDB API che usa 20 campi separati:
     * - strIngredient1, strIngredient2, ... strIngredient20  
     * - strMeasure1, strMeasure2, ... strMeasure20
     * 
     * Workflow processamento:
     * 1. Itera sui 20 possibili slot ingredienti (loop fisso)
     * 2. Filtra slot vuoti o con solo whitespace (trim + truthy check)
     * 3. Combina nome ingrediente + misura in oggetti strutturati
     * 4. Normalizza spacing con trim() su entrambi i campi
     * 
     * * @note 
     * - Ingredienti senza nome vengono automaticamente esclusi
     * - Misure senza nome ingrediente vengono mantenute come stringa vuota
     * - Ingredienti mantengono ordine API (strIngredient1 → index 0)
     * 
     * @example
     * // Uso interno durante costruzione FullRecipe
     * const ingredients = FullRecipe.prototype.getIngredients.call(this, rawData);
     * 
     * // Risultato tipico:
     * // [
     * //   {name: "chicken breast", measure: "1 lb"},
     * //   {name: "soy sauce", measure: "1/4 cup"},
     * //   {name: "honey", measure: "2 tbsp"}
     * // ]
     */
    getIngredients(rawRecipeObj){
        /** @type {Array<{name: string, measure: string}>} Array accumulator per ingredienti validi */
        const array = [];

        for(let i=1; i<=20; i++){
            const name = (rawRecipeObj["strIngredient"+i] || "").trim();
            if(name){
                const measure = (rawRecipeObj["strMeasure"+i] || "").trim();
                array.push({name, measure}); //js costruisce l'oggetto con key->nome variabile value->valore variabile
            }
        }
        return array;
    }
};


// ============================================================================
// ANALISI E DESCRIZIONE DEL FILE
// ============================================================================

/**
 * @description Analisi e descrizione del file data-models.js
 * 
 * **Scopo e ruolo nel progetto:**
 * Modulo core per la definizione e gestione dei modelli dati del progetto PGRC.
 * Fornisce classi unificate per rappresentare entità (utenti, note, recensioni, categorie, ricette)
 * provenienti da API esterne (TheMealDB) o generate localmente. Garantisce normalizzazione,
 * validazione strutturale e pattern di fallback per dati incompleti, facilitando l'integrazione
 * con storage e moduli business.
 * 
 * **Architettura e struttura:**
 * - **Utility functions:** Funzioni helper per generazione ID univoci (generateItemId).
 * - **User management models:** Classi per entità utente (User, Note, Review).
 * - **API data models:** Classi per dati da API (Category, FullRecipe).
 * - **Dipendenze:** Nessuna dipendenza esterna - modulo self-contained.
 * 
 * **Interazioni con altri moduli:**
 * - **Storage (storage.js):** Classi istanziate vengono serializzate/deserializzate per persistenza.
 * - **Business (usersManagement.js, recipesManagement.js):** Utilizzate per creazione e manipolazione oggetti.
 * - **UI (ui.js):** Oggetti popolano componenti di rendering (card, preview).
 * - **Session (session-service.js):** Integrazione con logica autenticazione e stato utente.
 * 
 * **Flusso di esecuzione documentato:**
 * 
 * 1. **Import e setup:**
 *    - Nessun import esterno - modulo autonomo.
 * 
 * 2. **Utility functions:**
 *    - generateItemId: Genera ID univoci con timestamp + random per tutte le entità.
 * 
 * 3. **User management models:**
 *    - User: Costruttore per nuovi utenti con dati pre-validati (username, email, password hashata).
 *    - Note: Costruttore per note utente legate a ricette, con metadata automatici.
 *    - Review: Costruttore per recensioni con rating duali (gusto + difficoltà).
 * 
 * 4. **API data models - Preview objects:**
 *    - Category: Normalizzazione dati categoria da TheMealDB API, con fallback per campi mancanti.
 * 
 * 5. **API data models - Full recipe objects:**
 *    - FullRecipe: Costruttore per ricette complete, con processamento ingredienti via prototype method.
 *    - getIngredients: Metodo per trasformare 20 campi API separati in array strutturato.
 * 
 * **Note tecniche:**
 * - **Normalizzazione API:** Gestisce strutture peculiari TheMealDB (20 campi ingredienti separati) con processamento robusto.
 * - **Fallback chain:** Uso di `|| ""` per campi mancanti, previene errori runtime.
 * - **ID generation:** Strategia timestamp + random riduce collisioni, prefisso tipo per categorizzazione.
 * - **Validazione:** Delegata upstream (es. password hashata in User), focus su struttura dati.
 * - **Scalabilità:** Facile aggiunta nuove classi seguendo pattern esistente.
 * - **Limitazioni:** Nessuna validazione interna (delegata), dipendenza da struttura API esterna.
 * 
 * @note Questo modulo è fondamentale per data integrity: errori qui impattano storage e rendering.
 * @note Compatibilità: Indipendente da framework, usa solo JavaScript vanilla.
 */
