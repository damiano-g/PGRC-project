/**
 * @fileoverview Data models per ricette e categorie - costruttori e utilità per oggetti business
 * @description Fornisce classi unificate per gestire dati provenienti da TheMealDB API
 * con normalizzazione campi e pattern di fallback
 * @author damia
 * @version 1.0.0
 */

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
 * @param {string} [rawObj.idCategory] - ID categoria (se oggetto categoria)
 * @param {string} [rawObj.strMeal] - Nome ricetta (se oggetto ricetta)
 * @param {string} [rawObj.strCategory] - Nome categoria (se oggetto categoria)
 * @param {string} [rawObj.strMealThumb] - URL immagine ricetta (se oggetto ricetta)
 * @param {string} [rawObj.strCategoryThumb] - URL immagine categoria (se oggetto categoria)
 * 
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
export function ItemPreview(rawObj){
    this.id = rawObj.idMeal || rawObj.idCategory || "",
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