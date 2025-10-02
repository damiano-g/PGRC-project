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
function generateItemId(itemType) {
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
 * - Timestamp ISO per audit trail
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
    /** @type {string} */ creationDate;

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
 * - Date string locale per display user-friendly
 * - Associazione diretta recipeId per lookup rapido
 * 
 * @example
 * const userNote = new Note("52772", "Ricetta facile, aggiungere più sale");
 */
export class Note {

    /** @type {string} */ id;
    /** @type {string} */ recipeId;
    /** @type {string} */ text;
    /** @type {string} */ date;

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
 * - Date string per chronological sorting
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
    /** @type {string} */ dateAdded;
    
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
    /** @type {string} */ dateAdded;

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
 * @property {string} id - ID univoco ricetta
 * @property {string} name - Nome display ricetta  
 * @property {string} image - URL immagine ricetta
 * @property {string} instructions - Istruzioni preparazione complete
 * @property {string} creationDate - ISO timestamp di quando l'oggetto è stato creato localmente
 * @property {Array<{name: string, measure: string}>} ingredients - Array ingredienti processati
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
    /** @type {string} ISO timestamp creazione oggetto locale (non da API) */ dateAdded;
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

// ================================================================================================
// ARCHITECTURE NOTES
// ================================================================================================

/*
DESIGN PATTERNS IMPLEMENTATI:

1. **Factory Pattern**:
   - Tutti i constructors sono factory per oggetti business specifici
   - Input validation e normalization centralizzata
   - Consistent object structure indipendentemente da input quality

2. **Adapter Pattern**:
   - ItemPreview adatta diverse API structures (meals vs categories)
   - FullRecipe adatta struttura peculiare TheMealDB (20 ingredient fields)
   - Fallback chains per graceful degradation con dati incompleti

3. **Builder Pattern (partial)**:
   - FullRecipe.getIngredients() processa complex ingredients structure
   - createPreviewArray() builds collections con tipo detection
   - Separation tra data extraction e object construction

4. **Prototype Pattern**:
   - FullRecipe.prototype.getIngredients condiviso tra istanze
   - Evita function duplication per ogni recipe object
   - Consistent processing logic across objects

DATA NORMALIZATION STRATEGY:

- **Fallback Chains**: obj.field1 || obj.field2 || defaultValue
- **Graceful Degradation**: Empty strings invece di undefined/null
- **Type Coercion**: Automatic String() conversion per consistency
- **Null Safety**: Optional chaining e truthy checks preventivi

BUSINESS RULES IMPLEMENTATE:

- **Unique IDs**: Timestamp + random per collision avoidance
- **Date Consistency**: ISO strings per storage, locale strings per display
- **Image Fallbacks**: Default image path per missing thumbnails
- **Ingredient Filtering**: Empty slots automatically excluded

PERFORMANCE CONSIDERATIONS:

- **Fixed Loops**: 20 iterations max per ingredients (non input-dependent)
- **Minimal String Ops**: Solo trim() necessario, no regex/complex parsing
- **Memory Efficient**: Arrays sized to actual content, no pre-allocation
- **Prototype Sharing**: Methods shared across instances, no duplication
*/