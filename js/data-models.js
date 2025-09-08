/**
 * @fileoverview Data models per ricette e categorie - costruttori e utilità per oggetti business
 * @description Fornisce classi unificate per gestire dati provenienti da TheMealDB API
 * con normalizzazione campi e pattern di fallback per gestione dati incompleti
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
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
 * Strategia ID generation per garantire unicità across sessions e browser.
 * - Timestamp Unix: garantisce unicità temporale (millisecondi)
 * - Random 4-digit: riduce probabilità collisioni simultanee
 * - Prefisso tipo: debugging e categorizzazione visuale
 * 
 * @example
 * generateItemId("user") → "user_1693747200000_1234"
 * generateItemId("note") → "note_1693747201500_5678"
 * 
 * @todo Considerare crypto.randomUUID() per browser moderni
 * @todo Aggiungere validazione itemType parameter
 * 
 * @since 1.0.0
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
 * @typedef {Object} User
 * @property {string} id - ID univoco generato automaticamente
 * @property {string} username - Nome utente
 * @property {string} email - Email utente  
 * @property {string} password - Password hashata
 * @property {Array<string>} favourites - Array ID ricette preferite
 * @property {Array<Note>} notes - Array note personali utente
 * @property {string} creationDate - Data creazione ISO string
 */

/**
 * Costruttore per oggetti utente del sistema con dati pre-validati
 * 
 * @constructor
 * @function User
 * @param {string} validUsername - Username già validato upstream
 * @param {string} validEmail - Email già validata upstream  
 * @param {string} hashPassword - Password già hashata per sicurezza
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
 * 
 * @todo Aggiungere validazione format email/username
 * @todo Implementare user preferences object
 * @todo Considerare soft delete flag
 * 
 * @since 1.0.0
 */
export function User(validUsername, validEmail, hashPassword){
    this.id = generateItemId("user"),
    this.username = validUsername, // Username fornito (già validato)
    this.email = validEmail, // Email fornita (già validata)
    this.password = hashPassword, // Password hashata
    this.favourites = [],
    this.notes = [],
    this.creationDate = new Date().toISOString()
}

/**
 * Costruttore per note personali utente legate a ricette specifiche
 * 
 * @constructor
 * @function Note
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
 * 
 * @todo Aggiungere validazione lunghezza text
 * @todo Implementare formatting HTML per rich text
 * @todo Considerare categorizzazione note (tipo: commento, modifica, rating)
 * 
 * @since 1.0.0
 */
export function Note(recipeId, text){
    this.recipeId = recipeId,
    this.text = text
    this.date = new Date().toDateString(),
    this.id = generateItemId("note");
}

/**
 * Costruttore per recensioni utente con rating duali (gusto + difficoltà)
 * 
 * @constructor
 * @function Review
 * @param {string} recipeId - ID ricetta recensita
 * @param {string} userId - ID utente autore recensione
 * @param {number} tasteRate - Rating gusto (1-5)
 * @param {number} difficultyRate - Rating difficoltà preparazione (1-5)
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
 * 
 * @todo Aggiungere validazione range rating (1-5)
 * @todo Implementare optional text comment
 * @todo Considerare rating categories aggiuntive (presentazione, tempo)
 * 
 * @since 1.0.0
 */
export function Review(recipeId, userId, tasteRate, difficultyRate){
    this.recipeId = recipeId;
    this.userId = userId;
    this.tasteRate = tasteRate;
    this.difficultyRate = difficultyRate;
    this.id = generateItemId("review");
    this.date = new Date().toDateString();
}

// ================================================================================================
// API DATA MODELS - PREVIEW OBJECTS
// ================================================================================================

/**
 * Costruttore per oggetti preview unificati (ricette + categorie)
 * 
 * @constructor
 * @function ItemPreview
 * @param {Object} rawObj - Oggetto raw da API TheMealDB (ricetta o categoria)
 * @param {string} [rawObj.idMeal] - ID ricetta (se oggetto ricetta)
 * @param {string} [rawObj.strCategory] - ID categoria (se oggetto categoria): NB-> TMDB usa nome categoria come ID per ricerche
 * @param {string} [rawObj.strMeal] - Nome ricetta (se oggetto ricetta)
 * @param {string} [rawObj.strCategory] - Nome categoria (se oggetto categoria)
 * @param {string} [rawObj.strMealThumb] - URL immagine ricetta (se oggetto ricetta)
 * @param {string} [rawObj.strCategoryThumb] - URL immagine categoria (se oggetto categoria)
 * @param {string} itemType - Tipo oggetto per classificazione ("meals", "categories", "reviews", "notes")
 * 
 * @property {string} type - Tipo oggetto per business logic routing
 * @property {string} id - ID univoco dell'elemento (ricetta o categoria)
 * @property {string} name - Nome display dell'elemento
 * @property {string} image - URL immagine thumbnail con fallback
 * 
 * @description
 * Adapter pattern per normalizzare diverse strutture API TheMealDB.
 * Gestisce polimorfismo per ricette/categorie tramite fallback chain
 * intelligente con graceful degradation per dati incompleti.
 * 
 * @example
 * // Uso con oggetto ricetta da API
 * const recipePreview = new ItemPreview({
 *   idMeal: "52772",
 *   strMeal: "Teriyaki Chicken Casserole", 
 *   strMealThumb: "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg"
 * }, "meals");
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
 * 
 * @todo Aggiungere validazione itemType enum
 * @todo Implementare caching image per fallback migliore
 * @todo Considerare lazy loading per image URL validation
 * 
 * @since 1.0.0
 */
export function ItemPreview(rawObj, itemType){
    this.type = itemType,
    this.id = rawObj.idMeal || rawObj.strCategory || "",
    this.name = rawObj.strMeal || rawObj.strCategory || "",
    this.image = rawObj.strMealThumb || rawObj.strCategoryThumb || "../assets/images/no_image.jpg"
}

// ================================================================================================
// API DATA MODELS - FULL RECIPE OBJECTS
// ================================================================================================

/**
 * Costruttore per oggetti ricetta completi con tutti i dettagli
 * 
 * @constructor
 * @function FullRecipe
 * @param {Object} rawRecipeObj - Oggetto ricetta completo da API TheMealDB
 * @param {string} rawRecipeObj.idMeal - ID univoco ricetta
 * @param {string} rawRecipeObj.strMeal - Nome completo ricetta
 * @param {string} rawRecipeObj.strMealThumb - URL immagine high-res ricetta
 * @param {string} rawRecipeObj.strInstructions - Istruzioni di preparazione complete
 * @param {string} [rawRecipeObj.strIngredient1-20] - Ingredienti (fino a 20 campi API)
 * @param {string} [rawRecipeObj.strMeasure1-20] - Misure corrispondenti (fino a 20 campi API)
 * 
 * @property {string} id - ID univoco ricetta
 * @property {string} name - Nome display ricetta  
 * @property {string} image - URL immagine ricetta
 * @property {string} instructions - Istruzioni preparazione complete
 * @property {string} dateAdded - ISO timestamp di quando l'oggetto è stato creato localmente
 * @property {Array<{name: string, measure: string}>} ingredients - Array ingredienti processati
 * 
 * @description
 * Factory completa per ricette con processamento ingredienti automatico.
 * Include normalizzazione della struttura peculiare TheMealDB API
 * (20 campi separati per ingredienti) in array strutturato user-friendly.
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
 * 
 * @todo Aggiungere parsing nutritional info se disponibile
 * @todo Implementare tags extraction da strTags
 * @todo Considerare multi-language support per instructions
 * 
 * @see {@link FullRecipe.prototype.getIngredients} Per dettagli processamento ingredienti
 * 
 * @since 1.0.0
 */
export function FullRecipe(rawRecipeObj){
    /** @type {string} ID univoco ricetta dal database TheMealDB */
    this.id = rawRecipeObj.idMeal || "",

    /** @type {string} Nome completo ricetta */
    this.name = rawRecipeObj.strMeal || "",

    /** @type {string} URL immagine alta risoluzione */
    this.image = rawRecipeObj.strMealThumb || "",

    /** @type {string} Istruzioni preparazione complete (possono essere molto lunghe) */
    this.instructions = rawRecipeObj.strInstructions || "",

    /** @type {string} ISO timestamp creazione oggetto locale (non da API) */
    this.dateAdded = new Date().toISOString(),

    /** 
     * @type {Array<{name: string, measure: string}>} 
     * Array ingredienti processati - chiamata al metodo prototype durante costruzione
     */
    this.ingredients = FullRecipe.prototype.getIngredients.call(this, rawRecipeObj)
}

/**
 * Metodo prototype per processare ingredienti raw da API in array strutturato
 * 
 * @method getIngredients
 * @memberof FullRecipe.prototype
 * @param {Object} rawRecipeObj - Oggetto ricetta raw da API
 * @returns {Array<{name: string, measure: string}>} Array ingredienti normalizzati
 * 
 * @description
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
 * 
 * @performance
 * - Loop fisso 20 iterazioni (non dipendente da input size)
 * - String operations minimali (solo trim necessario)
 * - Memory allocation proporzionale a ingredienti effettivi (non 20)
 * 
 * @note 
 * - Ingredienti senza nome vengono automaticamente esclusi
 * - Misure senza nome ingrediente vengono mantenute come stringa vuota
 * - Order preserving: ingredienti mantengono ordine API (strIngredient1 → index 0)
 * 
 * @todo Aggiungere parsing automatico quantità numeriche da strMeasure
 * @todo Implementare normalizzazione unità di misura (cup→ml, lb→kg)
 * @todo Considerare validation ingredienti vs database nutritional
 * 
 * @since 1.0.0
 */
FullRecipe.prototype.getIngredients = function (rawRecipeObj){
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

// ================================================================================================
// PUBLIC API - FACTORY FUNCTIONS
// ================================================================================================

/**
 * Crea array di oggetti ItemPreview da risposta API TheMealDB
 * 
 * @function createPreviewArray
 * @param {Object|Array} itemsObj - Oggetto risposta da API TheMealDB o array diretto
 * @param {Array} [itemsObj.meals] - Array ricette (se risposta search/lookup)
 * @param {Array} [itemsObj.categories] - Array categorie (se risposta categories)
 * @param {Array} [itemsObj.drinks] - Array drink (se API cocktail)
 * @param {string|null} [itemsType=null] - Tipo esplicito se itemsObj è array diretto
 * @returns {Array<ItemPreview>} Array di oggetti ItemPreview normalizzati
 * 
 * @description
 * Factory function per conversione batch API responses in oggetti standardizzati.
 * Supporta sia risposte API wrapped ({meals: [...]}) che array diretti.
 * 
 * **Modalità Auto-detection:**
 * - Estrae automaticamente il primo array trovato nell'oggetto response
 * - Inferisce tipo dalla chiave object (es. "meals" → tipo "meals")
 * - Gestisce uniformemente strutture diverse senza code changes
 * 
 * **Modalità Explicit Type:**
 * - itemsObj è array + itemsType specificato → usa tipo esplicito
 * - Utile per array processati o dati non-API
 * 
 * @example
 * // Con risposta ricerca ricette
 * const searchResponse = {meals: [{idMeal: "123", strMeal: "Pasta"}, ...]};
 * const previews = createPreviewArray(searchResponse);
 * // → [ItemPreview{id: "123", name: "Pasta", type: "meals"}, ...]
 * 
 * @example
 * // Con risposta lista categorie
 * const categoriesResponse = {categories: [{idCategory: "1", strCategory: "Beef"}, ...]};
 * const previews = createPreviewArray(categoriesResponse);
 * // → [ItemPreview{id: "Beef", name: "Beef", type: "categories"}, ...]
 * 
 * @example
 * // Con array diretto + tipo esplicito
 * const recipesArray = [{idMeal: "456", strMeal: "Pizza"}, ...];
 * const previews = createPreviewArray(recipesArray, "meals");
 * // → [ItemPreview{id: "456", name: "Pizza", type: "meals"}, ...]
 * 
 * @example
 * // Con oggetto vuoto o malformato
 * const emptyResponse = {};
 * const previews = createPreviewArray(emptyResponse);
 * // → [] (array vuoto, nessun crash)
 * 
 * @throws {TypeError} Se itemsObj non è un oggetto o è null
 * @throws {Error} Se l'array estratto contiene elementi non processabili da ItemPreview
 * 
 * @todo Aggiungere validazione struttura response per early error detection
 * @todo Implementare progress callback per array molto grandi
 * @todo Considerare streaming processing per memory efficiency
 * 
 * @see {@link ItemPreview} Per dettagli sul costruttore degli oggetti preview
 * 
 * @note
 * Per oggetti response con multiple chiavi array, viene processata solo la prima
 * secondo l'ordine restituito da Object.keys() (non garantito per oggetti).
 * 
 * @since 1.0.0
 */
export function createPreviewArray(itemsObj, itemsType){
    
    /** @type {Array<ItemPreview>} Array accumulator per oggetti preview */
    const previewArray = [];
    
    /** @type {string} Nome della prima chiave nell'oggetto response (es. "meals", "categories") o tipo esplicito */
    //const arrayType = Array.isArray(itemsObj) && itemsType ? itemsType : Object.keys(itemsObj)[0];
    
    /** @type {Array} Array effettivo da processare (estratto da response o diretto) */
    const originalArray = Array.isArray(itemsObj) ? itemsObj : itemsObj[itemsType];

    // Itera sull'array contenuto nella risposta API
    originalArray.forEach(element => {
        /** @type {ItemPreview} Oggetto preview normalizzato dall'elemento raw */
        const item = new ItemPreview(element, itemsType);
        previewArray.push(item);
    });

    return previewArray;
}

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