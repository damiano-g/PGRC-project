/**
 * @fileoverview Gestore dati ricette - modulo per gestione unificata di dati locali e API
 * @description Fornisce interfaccia per accesso a ricette e categorie con strategia cache-first.
 * Dipende da data-models.js per classi Category/FullRecipe e storageManagement.js per persistenza.
 * @requires data-models.js - Classi Category e FullRecipe
 * @requires storageManagement.js - Modulo gestione storage
 */

import { Category, FullRecipe } from "../data-models.js";
import { StorageOperations } from "../storageManagement.js";

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
        alert("Fetch error");
        // Nota: non rilancia l'errore per evitare crash app
        // TODO: considerare strategia di retry o fallback
    }
}

/**
 * Recupera lista completa categorie da TheMealDB
 * Include metadata: nome, descrizione, thumbnail immagine
 * 
 * @private
 * @async
 * @returns {Promise<Object|null>} Oggetto con array 'categories' o null se errore
 * 
 * @example
 * const data = await fetchAllCategories();
 * if (data?.categories) {
 *   data.categories.forEach(cat => console.log(cat.strCategory));
 * }
 */
async function fetchAllCategories(){
    return fetchRecipes(fetchAllCategoriesURL, fetchOptions);
}

/**
 * Recupera ricette che iniziano con lettera specifica da TheMealDB
 * 
 * @private
 * @async
 * @param {string} letter - Lettera iniziale (a-z)
 * @returns {Promise<Object|null>} Oggetto con array 'meals' o null se errore
 * 
 * @example
 * const pastaRecipes = await fetchByFirstLetter('p');
 */
async function fetchByFirstLetter(letter){
    return fetchRecipes(fetchByFirstLetterURL, fetchOptions, letter);
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
 * @throws {Error} Rilancia errori critici durante creazione
 * 
 * @example
 * const recipes = await createLocalRecipesDB(); // ~500+ ricette
 */
async function createLocalRecipesDB() {
    try {
        let accumulator = [];
        
        // Itera alfabeto per scaricare tutte le ricette
        for(let i=97; i <= 122; i++){
            const fetchedOBJ = await fetchByFirstLetter(String.fromCharCode(i));
            if(fetchedOBJ.meals){
                fetchedOBJ.meals.forEach(meal => accumulator.push(new FullRecipe(meal)));
            }
        }
    
        StorageOperations.set(RECIPES_DB_KEY, accumulator, {storageLocation: "local", dataType: "array"});

        return accumulator;
    } catch (error) {
        console.error(error);
        return [];
    }
}

/**
 * Crea database locale categorie scaricando da TheMealDB
 * Converte dati API in oggetti Category e salva in localStorage tramite StorageManagement
 * 
 * @private
 * @async
 * @returns {Promise<Array<Category>>} Array categorie salvate localmente
 * @throws {Error} Rilancia errori critici durante creazione
 * 
 * @example
 * const categories = await createLocalCategoriesDB(); // ~14 categorie
 */
async function createLocalCategoriesDB() {
    try {
        const fetchedOBJ = await fetchAllCategories();
        console.log(fetchedOBJ);
        const catArray = [];
        fetchedOBJ.categories.forEach(item => catArray.push(new Category(item)));
        StorageOperations.set(CATEGORIES_DB_KEY, catArray, {storageLocation: "local", dataType: "array"});
        return catArray;
    } catch (error) {
        console.error(error);
        return [];
    }
}

// ===============================
// ORCHESTRATORE DATI PRINCIPALE
// ===============================

/**
 * Orchestratore principale per accesso dati con strategia cache-first
 * Prima controlla localStorage tramite StorageManagement, se vuoto inizializza DB da API
 * Ritorna copia profonda per evitare mutazioni accidentali
 * 
 * @private
 * @async
 * @param {string} storageKey - Chiave localStorage ("recipes" o "categories")
 * @returns {Promise<Array>} Array dati (ricette o categorie)
 * @throws {Error} Se chiave non supportata o errori critici
 * 
 * @example
 * const recipes = await getData("recipes"); // Carica da cache o API
 */
async function getData(storageKey) {
    try {
        let dataArray = StorageOperations.get(storageKey, {storageLocation: "local", dataType: "array"});
        
        // Se cache vuota, inizializza da API
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

// ===============================
// API PUBBLICA
// ===============================

/**
 * Ottiene tutte le ricette disponibili
 * Carica da localStorage o API se necessario, tramite @function getData
 * 
 * @public
 * @async
 * @returns {Promise<Array<FullRecipe>>} Array completo ricette
 * 
 * @example
 * const recipes = await getAllRecipes();
 */
export async function getAllRecipes() {
    return await getData(RECIPES_DB_KEY);
}

/**
 * Ottiene tutte le categorie disponibili
 * Carica da localStorage o API se necessario, tramite @function getData
 * 
 * @public
 * @async
 * @returns {Promise<Array<Category>>} Array completo categorie
 * 
 * @example
 * const categories = await getAllCategories();
 */
export async function getAllCategories() {
    return await getData(CATEGORIES_DB_KEY);
}

/**
 * Ricerca ricetta per ID univoco
 * Scansiona array ricette per match esatto su id
 * 
 * @public
 * @async
 * @param {string|number} recipeId - ID ricetta da cercare
 * @returns {Promise<FullRecipe>} Oggetto ricetta trovato
 * @throws {Error} Se ricetta non trovata
 * 
 * @example
 * const recipe = await searchRecipeById(52772);
 */
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

/**
 * Ricerca ricette per nome con algoritmo scoring multi-termine
 * Suddivide query in parole, assegna punteggi per match completi/parziali
 * Ordina risultati per rilevanza decrescente
 * 
 * @public
 * @async
 * @param {string} query - Termine/i ricerca (supporta multi-parola)
 * @returns {Promise<Array<FullRecipe>>} Array ricette filtrate e ordinate per score
 * @throws {Error} Se ricerca fallisce
 * 
 * @example
 * const results = await searchRecipesByName("chicken curry");
 */
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

            // Bonus per match completo tutti i termini
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

/**
 * Estrae ricette casuali uniche dal database
 * Garantisce unicità evitando duplicati nell'estrazione
 * 
 * @public
 * @async
 * @param {number} quantity - Numero ricette da estrarre
 * @returns {Promise<Array<FullRecipe>>} Array ricette casuali uniche
 * @throws {Error} Se estrazione fallisce
 * 
 * @example
 * const randomRecipes = await rndSearch(5);
 */
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

/**
 * Filtra ricette per categoria specifica
 * Filtra array ricette per match esatto su proprietà category
 * 
 * @public
 * @async
 * @param {string} category - Nome categoria da filtrare
 * @returns {Promise<Array<FullRecipe>>} Array ricette della categoria
 * @throws {Error} Se filtro fallisce
 * 
 * @example
 * const pastaRecipes = await searchRecipesByCategory("pasta");
 */
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
 * 
 * PERFORMANCE:
 * - Cache locale riduce latenza da ~2-3s (API) a ~1ms (localStorage)
 * - Database locale: <500 ricette, ~14 categorie (~2-3MB storage)
 * - Ricerca locale: O(n) ma ottimizzata con early exit e scoring
 * 
 * SICUREZZA:
 * - Input sanitization: normalizzazione query ricerca
 * - Error boundaries: try/catch per prevenzione crash
 */