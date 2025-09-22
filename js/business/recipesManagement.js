/**
 * @fileoverview API wrapper per TheMealDB - gestisce tutte le chiamate alle API per ricette
 * @description Fornisce funzioni standardizzate per accedere ai diversi endpoint di TheMealDB
 * con pattern di fetch unificato
 * @version 1.0.0
 */

import { Category, FullRecipe } from "../data-models.js";
import { StorageManagement } from "../storageManagement.js";

// ===============================
// CONFIGURAZIONE ENDPOINT API
// ===============================

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
async function fetchAllCategories(){
    return fetchRecipes(fetchAllCategoriesURL, fetchOptions);
}


async function fetchByFirstLetter(letter){
    return fetchRecipes(fetchByFirstLetterURL, fetchOptions, letter);
}


async function createLocalRecipesDB() {
    try {
        let accumulator = [];
    
        for(let i=97; i <= 122; i++){
            const fetchedOBJ = await fetchByFirstLetter(String.fromCharCode(i));
            if(fetchedOBJ.meals){
                fetchedOBJ.meals.forEach(meal => accumulator.push(new FullRecipe(meal)));
            }
        }
    
        StorageManagement.set(RECIPES_DB_KEY, accumulator, {storageLocation: "local", dataType: "array"});

        return accumulator;

    } catch (error) {
        console.error(error);
        return [];
    }
}

async function createLocalCategoriesDB() {
    try {
        const fetchedOBJ = await fetchAllCategories();
        console.log(fetchedOBJ);
        const catArray = [];
        fetchedOBJ.categories.forEach(item => catArray.push(new Category(item)));
        StorageManagement.set(CATEGORIES_DB_KEY, catArray, {storageLocation: "local", dataType: "array"});
        return catArray;
    } catch (error) {
        console.error(error);
        return [];
    }
}


async function getData(storageKey) {
    try {
        let dataArray = StorageManagement.get(storageKey, {storageLocation: "local", dataType: "array"});
        // console.log(dataArray);
        if(dataArray.length < 1){
            switch(storageKey){
                case "recipes": 
                    dataArray = await createLocalRecipesDB();
                    break;
                case "categories":
                    dataArray = await createLocalCategoriesDB();
                    break;
                default: throw new Error("Unsupported data type");
            }
        }
        return structuredClone(dataArray);
    } catch (error) {
        console.error(error);
    }
}


export async function getAllRecipes() {
    return await getData(RECIPES_DB_KEY);
}

export async function getAllCategories() {
    return await getData(CATEGORIES_DB_KEY);
}

export async function searchRecipeById(recipeId) {
    try {
        const allRecipes = await getAllRecipes();
        const index = allRecipes.findIndex(recipe => recipe.id === recipeId);
        if(index >= 0){
            return structuredClone(allRecipes[index]);
        }else{
            throw new Error("Recipe not found");
        }
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function searchRecipesByName(query) {
    try {
        const normalizedQuery = query.toLowerCase().trim();
        const searchTerms = normalizedQuery.split(/\s+/);

        const allRecipes = await getAllRecipes();
        const searchResults = [];

        allRecipes.forEach(recipe => {
            let score = 0;

            const normalizedName = recipe.name.toLowerCase();
            const nameTerms = normalizedName.split(/\s+/);
            
            let matchedTerms = 0;

            searchTerms.forEach(searchTerm => {
                let fullMatch = false;
                let partialMatch = false;
                let divider = 1;

                nameTerms.forEach(nameTerm => {
                    if(!fullMatch && !partialMatch){ // Previene conteggi multipli
                        if(nameTerm === searchTerm){
                            score += 20/divider;
                            matchedTerms++;
                        }else{
                            if(nameTerm.startsWith(searchTerm)){
                                score += 10/divider;
                            }
                        }
                    }
                    divider++;
                });
            });

            if(matchedTerms === searchTerms.length){
                score += score;
            }
            
            if(score > 0){
                searchResults.push({recipe, score});
            }
        });

        searchResults.sort((a, b) => b.score - a.score);

        return searchResults.map(result => result.recipe);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function rndSearch(quantity){
    try {
        const allRecipes = await getAllRecipes();
        const accumulator = [];
        const picked = [];

        for(let i=0; i <= quantity; i++){
            let rndIndex;

            do {
                rndIndex = Math.floor(Math.random() * ((allRecipes.length -1)+ 1));
            } while (picked.includes(rndIndex));
            
            accumulator.push(allRecipes[rndIndex]);
        }

        return accumulator;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export async function searchRecipesByCategory(category){
    try {
        const allRecipes = await getAllRecipes();
        return allRecipes.filter(recipe => recipe.category === category);    
    } catch (error) {
        console.error(error);
        throw error;
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