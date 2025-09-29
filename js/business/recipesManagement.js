/**
 * @fileoverview Gestore dati ricette - modulo per gestione unificata di dati locali e API
 * @description Fornisce interfaccia per accesso a ricette e categorie con strategia cache-first.
 * @requires data-models.js - Classi Category e FullRecipe
 * @requires storageManagement.js - Modulo gestione webstorage
 */

import { Category, FullRecipe } from "../data-models.js";
import { StorageOperations } from "../storageManagement.js";
import * as ErrorsManagement from "../errorsManagement.js"

// ===============================
// CONFIGURAZIONE ENDPOINT API
// ===============================

/**
 * URL endpoint TheMealDB per recupero categorie complete
 * @constant {string}
 */
const fetchAllCategoriesURL = 'https://www.themealdb.com/api/json/v1/1/categories.php';

/**
 * URL endpoint TheMealDB per ricerca ricette per lettera iniziale
 * @constant {string}
 */
const fetchByFirstLetterURL = 'https://www.themealdb.com/api/json/v1/1/search.php?f=';

/**
 * Opzioni standard per richieste HTTP a TheMealDB
 * @constant {Object}
 * @property {string} method - Metodo HTTP utilizzato (sempre GET)
 * @property {string} redirect - Gestione automatica redirect
 */
const fetchOptions = {
    method: 'GET',
    redirect: 'follow',
}

/**
 * Chiave localStorage per database ricette
 * @constant {string}
 */
const RECIPES_DB_KEY = "recipes";

/**
 * Chiave localStorage per database categorie
 * @constant {string}
 */
const CATEGORIES_DB_KEY = "categories";

/**
 * Opzioni di storage DB ricette o categorie
 * @constant {Object}
 * @see {@link StorageOperations}
 */
const RECIPES_STORAGE_OPTS = {storageLocation: "local", dataType: "array"};

// ===============================
// FUNZIONI CORE API
// ===============================

/**
 * Wrapper generico per chiamate API TheMealDB
 * Costruisce URL completo, esegue fetch e gestisce errori base
 * 
 * @private
 * @async
 * @param {string} URL - URL base dell'endpoint API
 * @param {Object} options - Opzioni fetch (metodo, headers, ecc.)
 * @param {string|null} [specifier=null] - Parametro aggiuntivo da concatenare all'URL
 * @returns {Promise<Object|null>} Oggetto JSON risposta API o null se errore
 * @throws {Error} Rilancia errori critici (non gestiti internamente)
 * 
 * @example
 * const categories = await fetchRecipes(fetchAllCategoriesURL, fetchOptions);
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
        throw error;
    }
}

// ===============================
// GESTIONE DATABASE LOCALE
// ===============================

/**
 * Crea database locale ricette scaricando tutto il corpus da TheMealDB
 * Itera alfabeto per copertura completa, converte dati in oggetti FullRecipe
 * Salva in localStorage tramite StorageManagement
 * 
 * @private
 * @async
 * @returns {Promise<Array<FullRecipe>>} Array ricette salvate localmente
 * @see {@link fetchRecipes}
 * @see {@link StorageOperations}
 * @throws {Error} Rilancia errori critici ed errori di storage
 * 
 * @example
 * const recipes = await createLocalRecipesDB(); // ~500+ ricette
 */
async function createLocalRecipesDB() {
    try {
        let accumulator = [];
        
        // Itera alfabeto per scaricare tutte le ricette
        for(let i=97; i <= 122; i++){
            const fetchedOBJ = await fetchRecipes(fetchByFirstLetterURL, fetchOptions, String.fromCharCode(i));
            if(fetchedOBJ.meals){
                fetchedOBJ.meals.forEach(meal => accumulator.push(new FullRecipe(meal)));
            }
        }
    
        StorageOperations.set(RECIPES_DB_KEY, accumulator, RECIPES_STORAGE_OPTS);

        return accumulator;
    } catch (error) {
        throw error;
    }
}

/**
 * Crea database locale categorie scaricando da TheMealDB
 * Converte dati API in oggetti Category e salva in localStorage tramite StorageManagement
 * 
 * @private
 * @async
 * @returns {Promise<Array<Category>>} Array categorie salvate localmente
 * @see {@link fetchRecipes} Fetch ricette da TMDB API
 * @see {@link StorageOperations} Gestione web storage
 * @throws {Error} Rilancia errori critici e di storage
 * 
 * @example
 * const categories = await createLocalCategoriesDB(); // ~14 categorie
 */
async function createLocalCategoriesDB() {
    try {
        const fetchedOBJ = await fetchRecipes(fetchAllCategoriesURL, fetchOptions);
        console.log(fetchedOBJ);
        const catArray = [];
        fetchedOBJ.categories.forEach(item => catArray.push(new Category(item)));
        StorageOperations.set(CATEGORIES_DB_KEY, catArray, RECIPES_STORAGE_OPTS);
        return catArray;
    } catch (error) {
        throw error;
    }
}

// ===============================
// API PUBBLICA
// ===============================

/**
 * Orchestratore principale per accesso dati con strategia cache-first
 * Prima controlla localStorage tramite StorageManagement, se vuoto inizializza DB da API
 * Ritorna copia profonda per evitare mutazioni accidentali
 * 
 * @private
 * @async
 * @param {"categories"|"recipes"} dataType - Chiave localStorage
 * @returns {Promise<Array<Category>>|Promise<Array<FullRecipe>>} Array dati (ricette o categorie)
 * @see {@link createLocalCategoriesDB} Creazione DB categorie in web storage
 * @see {@link createLocalRecipesDB} Creazione DB ricette in web storage
 * @see {@link StorageOperations} Lettura dati da web storage
 * @throws {Error} Se chiave non supportata
 * @throws {Error} Rilancia errori critici e di storage
 * 
 * @example
 * const recipes = await getData("recipes"); // Carica da cache o API
 */
export async function getData(dataType) {
    try {
        let dataArray = StorageOperations.get(dataType, RECIPES_STORAGE_OPTS);
        
        // Se cache vuota, inizializza da API
        if(dataArray.length < 1){
            switch(dataType){
                case "recipes": 
                    dataArray = await createLocalRecipesDB();
                    break;
                case "categories":
                    dataArray = await createLocalCategoriesDB();
                    break;
                default: 
                    const dataError = new Error(`${dataType}: unsupported data type`);
                    console.error(dataError);
                    throw dataError;
            }
        }
        return structuredClone(dataArray);
    } catch (error) {
        throw error;
    }
}

/**
 * Ricerca ricetta per ID univoco
 * Scansiona array ricette per match esatto su id
 * 
 * @public
 * @async
 * @param {string|number} recipeId - ID ricetta da cercare
 * @returns {Promise<FullRecipe>} Oggetto ricetta trovato
 * @see {@link getData} Per recupero DB ricette
 * @throws {ErrorsManagement.NotFound} Se ricetta non trovata
 * @throws {Error} Se errori critici, errori di storage o data type non supportato
 * 
 * @example
 * const recipe = await searchRecipeById(52772);
 */
export async function searchRecipeById(recipeId) {
    try {
        const allRecipes = await getData("recipes");
        const index = allRecipes.findIndex(recipe => recipe.id === recipeId);
        if(index >= 0){
            return structuredClone(allRecipes[index]);
        }else{
            throw new ErrorsManagement.NotFound("Recipe", "id", recipeId);
        }
    } catch (error) {
        throw error;
    }
}

/**
 * Ricerca ricette per nome con algoritmo scoring multi-termine
 * Suddivide query in parole, assegna punteggi per match completi/parziali
 * Ordina risultati per rilevanza decrescente
 * 
 * @public
 * @async
 * @param {string} query - Termine/i ricerca (supporta multi-parola)
 * @returns {Promise<Array<FullRecipe>>} Array ricette filtrate e ordinate per score
 * @see {@link getData} Per recupero DB ricette
 * @throws {Error} Se errori critici, errori di storage o data type non supportato 
 * 
 * @example
 * const results = await searchRecipesByName("chicken curry");
 */
export async function searchRecipesByName(query) {
    try {
        const normalizedQuery = query.toLowerCase().trim();
        const searchTerms = normalizedQuery.split(/\s+/);

        const allRecipes = await getData("recipes");
        const searchResults = [];

        allRecipes.forEach(recipe => {
            let score = 0;

            const normalizedName = recipe.name.toLowerCase();
            const nameTerms = normalizedName.split(/\s+/); // Divide sottostringhe separate da uno o più spazi
            
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
                    divider++; // Primi termini del nome garantiscono punteggi più alti
                });
            });

            // Bonus per match completo tutti i termini (x2)
            if(matchedTerms === searchTerms.length){
                score += score;
            }
            
            if(score > 0){
                searchResults.push({recipe, score});
            }
        });

        searchResults.sort((a, b) => b.score - a.score);

        return searchResults.map(result => result.recipe); // Estrae solo ricette
    } catch (error) {
        throw error;
    }
}

/**
 * Estrae ricette casuali uniche dal database
 * Garantisce unicità evitando duplicati nell'estrazione
 * 
 * @public
 * @async
 * @param {number} quantity - Numero ricette da estrarre
 * @returns {Promise<Array<FullRecipe>>} Array ricette casuali uniche
 * @see {@link getData} Per recupero DB ricette
 * @throws {Error} Se errori critici, errori di storage o data type non supportato
 * 
 * @example
 * const randomRecipes = await rndSearch(5);
 */
export async function rndSearch(quantity){
    try {
        const allRecipes = await getData("recipes");
        const accumulator = [];
        const picked = [];

        for(let i=0; i <= quantity; i++){
            let rndIndex;

            do {
                rndIndex = Math.floor(Math.random() * ((allRecipes.length -1)+ 1));
            } while (picked.includes(rndIndex));
            
            picked.push(rndIndex);
            accumulator.push(allRecipes[rndIndex]);
        }

        return accumulator;
    } catch (error) {
        throw error;
    }
}

/**
 * Filtra ricette per categoria specifica
 * Filtra array ricette per match esatto su proprietà category
 * 
 * @public
 * @async
 * @param {string} category - Nome categoria da filtrare
 * @returns {Promise<Array<FullRecipe>>} Array ricette della categoria
 * @see {@link getData} Per recupero DB ricette
 * @throws {Error} Se errori critici, errori di storage o data type non supportato
 * 
 * @example
 * const pastaRecipes = await searchRecipesByCategory("pasta");
 */
export async function searchRecipesByCategory(category){
    try {
        const allRecipes = await getData("recipes");
        return allRecipes.filter(recipe => recipe.category === category);    
    } catch (error) {
        throw error;
    }  
}

// ===============================
// NOTE IMPLEMENTAZIONE E LIMITI
// ===============================

/**
 * ARCHITETTURA E LIMITAZIONI:
 * 
 * PATTERN ARCHITETTURALI:
 * - Cache-first strategy: localStorage prioritario, API fallback
 * - Lazy initialization: DB creati solo su richiesta
 * - Structured cloning: prevenzione mutazioni accidentali dati
 * - Error resilience: gestione graceful fallimenti API
 * 
 * DIPENDENZE:
 * - data-models.js: classi Category e FullRecipe per strutturazione dati
 * - storageManagement.js: astrazione gestione localStorage
 * 
 * LIMITAZIONI API THEMEALDB:
 * - Rate limiting non documentato (possibili blocchi temporanei)
 * - Campi opzionali possono essere null/vuoti (gestione robusta richiesta)
 * - Max ~100 risultati per query lettera (iterazione alfabeto necessaria)
 */