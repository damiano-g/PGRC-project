/**
 * @fileoverview API wrapper per TheMealDB - gestisce tutte le chiamate alle API per ricette
 * @description Fornisce funzioni standardizzate per accedere ai diversi endpoint di TheMealDB
 * con pattern di fetch unificato
 * @version 1.0.0
 */

import { createPreviewArray, FullRecipe } from "./data-models.js";
import { StorageManagement } from "./storageManagement.js";

// ===============================
// CONFIGURAZIONE ENDPOINT API
// ===============================

/** @constant {string} URL per ottenere una ricetta casuale */
const rndFetchURL = 'https://www.themealdb.com/api/json/v1/1/random.php';

/** @constant {string} URL base per ricerca ricette per nome */
const fetchByNameURL = 'https://www.themealdb.com/api/json/v1/1/search.php?s=' ;

/** @constant {string} URL base per filtro ricette per categoria */
const fetchByCategoryURL = 'https://www.themealdb.com/api/json/v1/1/filter.php?c=';

/** @constant {string} URL base per ottenere dettagli ricetta tramite ID */
const fetchByIdURL = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';

// Metadata endpoints
/** @constant {string} URL per ottenere lista completa categorie disponibili */
const fetchAllCategoriesURL = 'https://www.themealdb.com/api/json/v1/1/categories.php';

const fetchByFirstLetterURL = 'https://www.themealdb.com/api/json/v1/1/search.php?f=';

/**
 * @constant {Object} Opzioni standard per tutte le richieste fetch
 * @property {string} method - Metodo HTTP (sempre GET per TheMealDB)
 * @property {string} redirect - Gestione redirect automatici
 */
const fetchOptions = {
    method: 'GET',
    redirect: 'follow',
}

const RECIPES_DB_KEY = "recipes";
const CATEGORIES_DB_KEY = "categories";

let storedRecipes = [];

// ===============================
// FUNZIONE CORE FETCH
// ===============================

/**
 * Funzione generica per eseguire chiamate all'API TheMealDB
 * Gestisce costruzione URL, fetch, parsing JSON e error handling
 * 
 * @async
 * @function fetchRecipes
 * @param {string} URL - URL base dell'endpoint API
 * @param {Object} options - Opzioni per la richiesta fetch
 * @param {string|null} [specifier=null] - Parametro aggiuntivo da appendere all'URL (es. nome ricetta, ID)
 * @returns {Promise<Object>} Oggetto JSON della risposta API
 * @throws {Error} Se la richiesta fetch fallisce
 * 
 * @example
 * // Ricerca ricetta per nome
 * const result = await fetchRecipes(fetchByNameURL, fetchOptions, "pasta");
 * 
 * @example  
 * // Ricetta casuale (senza specifier)
 * const result = await fetchRecipes(rndFetchURL, fetchOptions);
 */
async function fetchRecipes(URL, options, specifier = null){
    try {
        if(!specifier){
            specifier = "";
        }
        const completeURL = URL+specifier;
        const response = await fetch(completeURL, options);
        const JSONFile = await response.json();
        return JSONFile;
    } catch (error) {
        console.error(error);
        alert("Fetch error");
        // Nota: non rilancia l'errore per evitare crash app
        // TODO: considerare strategia di retry o fallback
    }
}

// ===============================
// WRAPPER FUNCTIONS PUBBLICHE
// ===============================

/**
 * Ottiene una ricetta casuale da TheMealDB
 * Restituisce tutti i dati inclusi ingredienti, misure, istruzioni
 * 
 * @async
 * @deprecated
 * @function rndFetch
 * @returns {Promise<Object>} Oggetto contenente array 'meals' con una ricetta casuale
 * @throws {Error} Se la richiesta API fallisce
 * 
 * @example
 * const randomRecipe = await rndFetch();
 * console.log(randomRecipe.meals[0].strMeal); // Nome della ricetta
 */
export async function rndFetch() {
    return fetchRecipes(rndFetchURL, fetchOptions);
}

/**
 * Cerca ricette per nome o parte del nome
 * Supporta ricerca parziale (es. "pas" trova "Pasta al Pomodoro")
 * Restituisce tutti i dati inclusi ingredienti, misure, istruzioni
 *  
 * @async
 * @deprecated
 * @function fetchByName  
 * @param {string} recipeName - Nome o parte del nome della ricetta da cercare
 * @returns {Promise<Object>} Oggetto contenente array 'meals' con risultati ricerca
 * @throws {Error} Se la richiesta API fallisce
 * 
 * @example
 * const results = await fetchByName("pasta");
 * results.meals.forEach(meal => console.log(meal.strMeal));
 */
export async function fetchByName(recipeName){
    return fetchRecipes(fetchByNameURL, fetchOptions, recipeName);
}

/**
 * Ottiene dettagli completi di una ricetta specifica tramite ID
 * Restituisce tutti i dati inclusi ingredienti, misure, istruzioni
 * 
 * @async
 * @deprecated
 * @function fetchById
 * @param {string|number} recipeId - ID univoco della ricetta su TheMealDB
 * @returns {Promise<Object>} Oggetto contenente array 'meals' con dettagli ricetta completi
 * @throws {Error} Se la richiesta API fallisce o ID non valido
 * 
 * @example
 * const recipeDetails = await fetchById("52772");
 * const fullRecipe = recipeDetails.meals[0];
 * console.log(fullRecipe.strInstructions); // Istruzioni complete
 */
export async function fetchById(recipeId){
    return fetchRecipes(fetchByIdURL, fetchOptions, recipeId);
}

/**
 * Filtra ricette per categoria specifica
 * Restituisce lista parziale (no ingredienti/istruzioni) per performance
 * 
 * @async
 * @deprecated
 * @function fetchByCategory
 * @param {string} categoryId - Nome della categoria (es. "Seafood", "Vegetarian")
 * @returns {Promise<Object>} Oggetto contenente array 'meals' con ricette della categoria
 * @throws {Error} Se la richiesta API fallisce o categoria non esiste
 * 
 * @example
 * const seafoodRecipes = await fetchByCategory("Seafood");
 */
export async function fetchByCategory(categoryId){
    console.log("Fectched by category: ", await fetchRecipes(fetchByCategoryURL, fetchOptions, categoryId))
    return fetchRecipes(fetchByCategoryURL, fetchOptions, categoryId);
}

/**
 * Ottiene lista completa di tutte le categorie disponibili su TheMealDB
 * Include nome, descrizione e immagine thumbnail per ogni categoria
 * 
 * @async
 * @function fetchAllCategories
 * @returns {Promise<Object>} Oggetto contenente array 'categories' con metadata categorie
 * @throws {Error} Se la richiesta API fallisce
 * 
 * @example
 * const categoriesData = await fetchAllCategories();
 * categoriesData.categories.forEach(cat => {
 *   console.log(`${cat.strCategory}: ${cat.strCategoryDescription}`);
 * });
 */
export async function fetchAllCategories(){
    return fetchRecipes(fetchAllCategoriesURL, fetchOptions);
}


export async function fetchByFirstLetter(letter){
    return fetchRecipes(fetchByFirstLetterURL, fetchOptions, letter);
}


export async function createLocalRecipesDB() {
    try {
        let accumulator = [];
    
        for(let i=97; i <= 122; i++){
            const fetchedOBJ = await fetchByFirstLetter(String.fromCharCode(i));
            if(fetchedOBJ.meals){
                fetchedOBJ.meals.forEach(meal => accumulator.push(new FullRecipe(meal)));
            }
        }
    
        StorageManagement.set(RECIPES_DB_KEY, accumulator, {storageLocation: "local", dataType: "array"});

        console.log(JSON.parse(localStorage.getItem(RECIPES_DB_KEY)));
    } catch (error) {
        console.error(error);
    }
}

export async function createLocalCategoriesDB() {
    try {
        const fetchedOBJ = await fetchAllCategories();
        const catArray = createPreviewArray(fetchedOBJ.meals, "categories");
        StorageManagement.set(CATEGORIES_DB_KEY, catArray, {storageLocation: "local", dataType: "array"});
    } catch (error) {
        console.error(error);
    }
}




// ===============================
// NOTE IMPLEMENTAZIONE
// ===============================

/**
 * LIMITAZIONI API:
 * - TheMealDB free: max 100 risultati per query
 * - Rate limiting: non documentato
 * - Alcuni campi possono essere null o vuoti
 * - Immagini sempre servite come HTTPS
 * 
 * FUTURE IMPROVEMENTS:
 * - Implementare retry logic per fallimenti temporanei  
 * - Error handling più granulare con user feedback migliorato
 * - Timeout per richieste che impiegano troppo tempo
 * - Batch requests per ricette multiple
 * 
 * PATTERN UTILIZZATI:
 * - Promise-based API con async/await
 * - Consistent interface per tutti gli endpoint
 * - ES6 modules per tree-shaking e modularity
 */