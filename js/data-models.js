/**
 * @fileoverview Data models per ricette e categorie - costruttori e utilità per oggetti business
 * @description Fornisce classi unificate per gestire dati provenienti da TheMealDB API
 * con normalizzazione campi e pattern di fallback
 * @author damia
 * @version 1.0.0
 */

/**
 * @typedef {Object} User
 * @property {string} id - ID univoco generato automaticamente
 * @property {string} username - Nome utente
 * @property {string} email - Email utente
 * @property {string} password - Password hashata
 * @property {Array} favourites - Array ricette preferite
 * @property {string} creationDate - Data creazione ISO
 */

/**
 * Costruttore User per oggetti standardizzati
 * @param {string} validUsername - Username già validato
 * @param {string} validEmail - Email già validata
 * @param {string} hashPassword - Password già hashata
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

function generateItemId(itemType) {
    const timestamp = Date.now(); // Timestamp Unix in millisecondi
    const rnd = String(Math.floor(Math.random()*10000)).padStart(4, "0"); // Numero casuale 0000-9999
    return `${itemType}_${timestamp}_${rnd}`;
};

export function Note(recipeId, text){
    this.recipeId = recipeId,
    this.text = text
    this.date = new Date().toDateString(),
    this.id = generateItemId("note");
}

// ===============================
// MODELLO DATI UNIFICATO - PREVIEW
// ===============================

/**
 * Costruttore per oggetti preview unificati (ricette + categorie)
 * Gestisce polimorfismo per diversi tipi di oggetti API tramite fallback chain
 * 
 * @constructor
 * @function ItemPreview
 * @param {Object} rawObj - Oggetto raw da API TheMealDB (ricetta o categoria)
 * @param {string} [rawObj.idMeal] - ID ricetta (se oggetto ricetta)
 * @param {string} [rawObj.strCategory] - ID categoria (se oggetto categoria): NB-> TMDB usa nome categoria com ID per ricerche
 * @param {string} [rawObj.strMeal] - Nome ricetta (se oggetto ricetta)
 * @param {string} [rawObj.strCategory] - Nome categoria (se oggetto categoria)
 * @param {string} [rawObj.strMealThumb] - URL immagine ricetta (se oggetto ricetta)
 * @param {string} [rawObj.strCategoryThumb] - URL immagine categoria (se oggetto categoria)
 * 
 * @typedef {Object} ItemPreview
 * @property {string} id - ID univoco dell'elemento (ricetta o categoria)
 * @property {string} name - Nome display dell'elemento
 * @property {string} image - URL immagine thumbnail dell'elemento
 * 
 * @example
 * // Uso con oggetto ricetta da API
 * const recipePreview = new ItemPreview({
 *   idMeal: "52772",
 *   strMeal: "Teriyaki Chicken Casserole", 
 *   strMealThumb: "https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg"
 * });
 * 
 * @example
 * // Uso con oggetto categoria da API  
 * const categoryPreview = new ItemPreview({
 *   idCategory: "1",
 *   strCategory: "Beef",
 *   strCategoryThumb: "https://www.themealdb.com/images/category/beef.png"
 * });
 * 
 * @example
 * // Uso con dati incompleti (graceful degradation)
 * const partialPreview = new ItemPreview({
 *   strMeal: "Pizza"
 *   // id e image saranno stringhe vuote
 * });
 */
export function ItemPreview(rawObj, itemType){
    this.type = itemType,
    this.id = rawObj.idMeal || rawObj.strCategory || "",
    this.name = rawObj.strMeal || rawObj.strCategory || "",
    this.image = rawObj.strMealThumb || rawObj.strCategoryThumb || "../assets/images/no_image.jpg"
}

// ===============================
// MODELLO DATI COMPLETO - RICETTA  
// ===============================

/**
 * Costruttore per oggetti ricetta completi con tutti i dettagli
 * Include processamento degli ingredienti e metadata aggiuntive
 * 
 * @constructor
 * @function FullRecipe
 * @param {Object} rawRecipeObj - Oggetto ricetta completo da API TheMealDB
 * @param {string} rawRecipeObj.idMeal - ID univoco ricetta
 * @param {string} rawRecipeObj.strMeal - Nome completo ricetta
 * @param {string} rawRecipeObj.strMealThumb - URL immagine high-res ricetta
 * @param {string} rawRecipeObj.strInstructions - Istruzioni di preparazione complete
 * @param {string} [rawRecipeObj.strIngredient1-20] - Ingredienti (fino a 20 campi)
 * @param {string} [rawRecipeObj.strMeasure1-20] - Misure corrispondenti (fino a 20 campi)
 * 
 * @property {string} id - ID univoco ricetta
 * @property {string} name - Nome display ricetta  
 * @property {string} image - URL immagine ricetta
 * @property {string} instructions - Istruzioni preparazione complete
 * @property {string} dateAdded - ISO timestamp di quando l'oggetto è stato creato
 * @property {Array<{name: string, measure: string}>} ingredients - Array ingredienti processati
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
 * @see {@link FullRecipe.prototype.getIngredients} Per dettagli processamento ingredienti
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

// ===============================
// METODI PROTOTYPE CONDIVISI
// ===============================

/**
 * Metodo prototype per processare ingredienti raw da API in array strutturato
 * Gestisce la struttura peculiare di TheMealDB (strIngredient1..20 + strMeasure1..20)
 * Filtra automaticamente ingredienti vuoti e normalizza spacing
 * 
 * @method
 * @memberof FullRecipe.prototype
 * @param {Object} rawRecipeObj - Oggetto ricetta raw da API
 * @returns {Array<{name: string, measure: string}>} Array ingredienti normalizzati
 * 
 * @description
 * TheMealDB API restituisce ingredienti in 20 campi separati:
 * - strIngredient1, strIngredient2, ... strIngredient20
 * - strMeasure1, strMeasure2, ... strMeasure20
 * 
 * 1. Itera sui 20 possibili slot ingredienti
 * 2. Filtra slot vuoti o con solo whitespace
 * 3. Combina nome ingrediente + misura in oggetti strutturati
 * 4. Normalizza spacing con trim()
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
 * @note Ingredienti senza nome vengono automaticamente esclusi,
 *       ma misure senza nome ingrediente vengono mantenute come stringa vuota
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

/**
 * Crea un array di oggetti ItemPreview a partire da una risposta API TheMealDB
 * Estrae automaticamente l'array contenuto nell'oggetto response, indipendentemente dal nome della chiave
 * 
 * @function createPreviewArray
 * @param {Object} itemsObj - Oggetto risposta da API TheMealDB
 * @param {Array} [itemsObj.meals] - Array ricette (se risposta search/lookup)
 * @param {Array} [itemsObj.categories] - Array categorie (se risposta categories)
 * @param {Array} [itemsObj.drinks] - Array drink (se API cocktail)
 * @returns {Array<ItemPreview>} Array di oggetti ItemPreview normalizzati
 * 
 * @description
 * Funzione utility per convertire qualsiasi risposta API TheMealDB in array standardizzato.
 * Estrae automaticamente il primo array trovato nell'oggetto response, permettendo
 * di gestire uniformemente risposte con strutture diverse:
 * - {meals: [...]} da ricerche per nome/ID
 * - {categories: [...]} da lista categorie  
 * - Altri formati futuri senza modifiche al codice
 * 
 * @example
 * // Con risposta ricerca ricette
 * const searchResponse = {meals: [{idMeal: "123", strMeal: "Pasta"}, ...]};
 * const previews = createPreviewArray(searchResponse);
 * // → [ItemPreview{id: "123", name: "Pasta", image: "..."}, ...]
 * 
 * @example
 * // Con risposta lista categorie
 * const categoriesResponse = {categories: [{idCategory: "1", strCategory: "Beef"}, ...]};
 * const previews = createPreviewArray(categoriesResponse);
 * // → [ItemPreview{id: "Beef", name: "Beef", image: "..."}, ...]
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
 * @see {@link ItemPreview} Per dettagli sul costruttore degli oggetti preview

 * @note
 * La funzione assume che ci sia un solo array nell'oggetto response.
 * Se ci sono multiple chiavi array, viene processata solo la prima
 * secondo l'ordine restituito da Object.keys() (non garantito per oggetti).
 */
export function createPreviewArray(itemsObj, itemsType = null){
    
    /** @type {Array<ItemPreview>} Array accumulator per oggetti preview */
    const previewArray = [];
    
    /** @type {string} Nome della prima chiave nell'oggetto response (es. "meals", "categories") */
    const arrayType = Array.isArray(itemsObj) && itemsType ? itemsType : Object.keys(itemsObj)[0];
    const originalArray = Array.isArray(itemsObj) && itemsType ? itemsObj : itemsObj[arrayType];

    // Itera sull'array contenuto nella risposta API
    originalArray.forEach(element => {
        /** @type {ItemPreview} Oggetto preview normalizzato dall'elemento raw */
        const item = new ItemPreview(element, arrayType);
        previewArray.push(item);
    });

    return previewArray;
}


export function Review(recipeId, userId, tasteRate, difficultyRate){
    this.recipeId = recipeId;
    this.userId = userId;
    this.tasteRate = tasteRate;
    this.difficultyRate = difficultyRate;
    this.id = generateItemId("review");
    this.date = new Date().toDateString();
}


