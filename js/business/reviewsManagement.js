/**
 * @fileoverview Gestore recensioni ricette con sistema rating duale
 * @description Fornisce interfaccia per CRUD operazioni su recensioni, con supporto rating gusto/difficoltà,
 * calcoli statistici aggregati e persistenza localStorage. Gestisce business rules come unicità
 * recensioni per utente/ricetta e validazione parametri.
 * @requires data-models.js - Classe Review per costruzione oggetti recensione
 * @requires errorsManagement.js - Classe ReviewsManagementError per errori tipizzati
 * @requires storageManagement.js - Modulo StorageManagement per persistenza dati
 */

import { Review } from "../data-models.js";
import { ReviewsManagementError } from "../errorsManagement.js";
import { StorageOperations } from "../storageManagement.js";

// ===============================
// CONFIGURAZIONE STORAGE
// ===============================

/**
 * Chiave localStorage per persistenza array recensioni
 * @constant {string}
 */
const REVIEWS_DB_KEY = "reviews";

/**
 * Cache in-memory per recensioni caricate da localStorage
 * @type {Array<Review>}
 * @private
 */
let storedReviews = [];

// ================================================================================================
// STORAGE OPERATIONS
// ================================================================================================

// ===============================
// OPERAZIONI STORAGE
// ===============================

/**
 * Recupera array recensioni da localStorage con refresh cache
 * Restituisce copia profonda per prevenire mutazioni accidentali
 * 
 * @public
 * @returns {Array<Review>} Clone profondo dell'array recensioni
 * @throws {Error} Se localStorage inaccessibile o dati corrotti
 * 
 * @example
 * const reviews = getStoredReviews();
 */
export function getStoredReviews(){
    try{
        storedReviews = StorageOperations.get(REVIEWS_DB_KEY, {storageLocation: "local", dataType: "array"});
        return structuredClone(storedReviews);
    }catch(error){
        console.error("Errore recupero recensioni:", error);
        storedReviews = [];
        throw error;
    }
}

// ================================================================================================
// PRIVATE HELPER FUNCTIONS
// ================================================================================================

// ===============================
// FUNZIONI HELPER PRIVATE
// ===============================

/**
 * Recupera recensioni per combinazione specifica ricetta-utente
 * Business rule: max 1 recensione per coppia utente-ricetta
 * 
 * @private
 * @param {string} recipeId - ID ricetta target
 * @param {string} userId - ID utente target
 * @returns {Array<Review>} Array recensioni filtrate (max 1 elemento)
 * 
 * @example
 * const userReview = getReviewId("52772", "user123");
 */
function getReviewId(recipeId, userId){
    try {
        const actualStoredReviews = getStoredReviews();
        return actualStoredReviews.filter(element => element.recipeId === recipeId && element.userId === userId);
    } catch (error) {
        // @todo Implementare gestione errore specifica
    }
}

/**
 * Motore CRUD per operazioni su recensioni con validazione business rules
 * Supporta ADD (con rating) e DELETE (senza rating) basandosi su presenza parametri
 * 
 * @public
 * @param {string} userId - ID utente che esegue operazione
 * @param {string} recipeId - ID ricetta target
 * @param {number|null} [tasteRate=null] - Rating gusto (1-5) per ADD, null per DELETE
 * @param {number|null} [difficultyRate=null] - Rating difficoltà (1-5) per ADD, null per DELETE
 * @returns {boolean} True se operazione completata
 * @throws {ReviewsManagementError} Se validazione fallisce o recensione non trovata
 * 
 * @example
 * // ADD recensione
 * updateRecipeReviews("user123", "52772", 4, 3);
 * 
 * @example
 * // DELETE recensione
 * updateRecipeReviews("user123", "52772", null, null);
 */
export function updateRecipeReviews(userId, recipeId, tasteRate = null, difficultyRate = null){
    try {
        const recipeReviewsArray = getStoredReviews();
 
        if(recipeId && userId && tasteRate && difficultyRate){
            // ADD MODE: Crea nuova recensione
            recipeReviewsArray.push(new Review(recipeId, userId, Number(tasteRate), Number(difficultyRate)));
        }else{
            if(recipeId && userId && !(tasteRate || difficultyRate)){
                // DELETE MODE: Rimuovi recensione esistente
                const index = recipeReviewsArray.findIndex(element => (element.recipeId === recipeId) && (element.userId === userId));
                if(index < 0){
                    throw new ReviewsManagementError("NOT_FOUND", "Recensione non trovata");
                }else{
                    recipeReviewsArray.splice(index, 1);
                }
            }else{
                // VALIDATION ERROR: Parametri malformati
                throw new ReviewsManagementError("VALIDATION", "Wrong data format"); 
            }
        }
        
        // Persistenza dati aggiornati
        StorageOperations.set(REVIEWS_DB_KEY, recipeReviewsArray, {storageLocation: "local", dataType: "array"});
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }    
}

/**
 * Calcola rating medio per ricetta su tipo specificato
 * Itera tutte recensioni per aggregazione real-time
 * 
 * @public
 * @param {string} recipeId - ID ricetta per calcolo
 * @param {string} ratingType - Tipo rating ("tasteRate"|"difficultyRate")
 * @returns {string} Media aritmetica formattata a 1 decimale, "NaN" se nessuna recensione
 * @throws {Error} Se accesso storage fallisce
 * 
 * @example
 * const avgTaste = recipeAvgRate("52772", "tasteRate"); // "4.2"
 */
export function recipeAvgRate (recipeId, ratingType) {
    try {
        let sum = 0;
        let totalReviews = 0;
        getStoredReviews().forEach(review => {
            if(review.recipeId === recipeId){
                sum += Number(review[ratingType]);
                totalReviews++;
            }
        });
        return (sum/totalReviews).toFixed(1);
    } catch (error) {
        console.error(error);
        throw error;
    }
};

/**
 * Recupera rating specifico utente per ricetta e tipo
 * Lookup diretto senza aggregazione
 * 
 * @public
 * @param {string} recipeId - ID ricetta target
 * @param {string} userId - ID utente target
 * @param {string} ratingType - Tipo rating ("tasteRate"|"difficultyRate")
 * @returns {string|undefined} Rating formattato a 1 decimale o undefined se non recensita
 * @throws {Error} Se accesso storage fallisce
 * 
 * @example
 * const userTaste = recipeUserRate("52772", "user123", "tasteRate"); // "4.0"
 */
export function recipeUserRate(recipeId, userId, ratingType) {
    try {
        const review = getStoredReviews().find(element => element.recipeId === recipeId && element.userId === userId);
        return review ? Number(review[ratingType]).toFixed(1) : undefined;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// ===============================
// NOTE ARCHITETTURALI
// ===============================

/**
 * ARCHITETTURA E PATTERN:
 * 
 * PATTERN IMPLEMENTATI:
 * - Repository Pattern: getStoredReviews() come data access layer con astrazione storage
 * - Command Pattern: updateRecipeReviews() polivalente per ADD/DELETE basata su parametri
 * - Immutability: structuredClone() previene mutazioni accidentali dati
 * 
 * BUSINESS RULES:
 * - Unicità: Max 1 recensione per utente per ricetta
 * - Dual Rating: Ogni recensione richiede gusto + difficoltà
 * - No Partial Updates: Modifiche tramite delete + add per atomicità
 * - Real-time Aggregation: Statistiche calcolate on-demand senza caching (scelta effettuata per non appesantire troppo fase di costruzione pagine)
 * 
 * DIPENDENZE:
 * - data-models.js: Costruttore Review per validazione oggetti
 * - errorsManagement.js: ReviewsManagementError per errori tipizzati business
 * - storageManagement.js: StorageManagement per persistenza localStorage
 * 
 * PERFORMANCE:
 * - Array Linear Search: Accettabile per MVP, ottimizzabile con Map/Index per scale
 * - Storage Access: Reload completo ad ogni operazione (trade-off consistency vs performance)
 * - Immutability Overhead: structuredClone() garantisce safety ma aumenta memoria
 * 
 * LIMITAZIONI:
 * - No Cache Expiry: Dati persistono indefinitamente
 * - No Concurrency: Operazioni sequenziali, no locking per multi-tab
 * - No Validation Range: Rating accettati senza controllo 1-5 (da gestire upstream)
 * 
 * FUTURI MIGLIORAMENTI:
 * - Caching intelligente per ridurre accessi localStorage
 * - Validazione range rating prima costruzione Review
 * - Supporto UPDATE mode separato da ADD/DELETE
 * - Ottimizzazione lookup con Map() per performance O(1)
 * - Gestione concorrenza con versioning o locking
 */