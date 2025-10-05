/**
 * @fileoverview Gestore recensioni ricette con sistema rating duale
 * @description Fornisce interfaccia per CRUD operazioni su recensioni, con supporto rating gusto/difficoltà,
 * calcoli statistici aggregati e persistenza localStorage. Gestisce business rules come unicità
 * recensioni per utente/ricetta e validazione parametri.
 * @requires data-models.js - Classe Review per costruzione oggetti recensione
 * @requires storageManagement.js - Modulo StorageManagement per persistenza dati
 */

import { Review, Response } from "../data-models.js";
import { StorageOperations } from "../storageManagement.js";
import * as ErrorsManagment from "../errorsManagement.js";

// ===============================
// CONFIGURAZIONE STORAGE
// ===============================

/**
 * Chiave localStorage per persistenza array recensioni
 * @constant {string}
 */
const REVIEWS_DB_KEY = "reviews";

/**
 * Opzioni di storage DB recensioni
 * @constant {Object}
 * @see {@link StorageOperations}
 */
const REVIEWS_STORAGE_OPTS = {storageLocation: "local", dataType: "array"};

// ===============================
// OPERAZIONI STORAGE
// ===============================

/**
 * Recupera array recensioni da localStorage con refresh cache
 * Restituisce copia profonda per prevenire mutazioni accidentali
 * 
 * @public
 * @returns {Array<Review>} Clone profondo dell'array recensioni
 * @see {@link StorageOperations} Per lettura dati da web storage
 * @throws {Error} Se errori di storage
 * 
 * @example
 * const reviews = getStoredReviews();
 */
export function getStoredReviews(){
    try{
        const storedReviews = StorageOperations.get(REVIEWS_DB_KEY, REVIEWS_STORAGE_OPTS);
        return structuredClone(storedReviews);
    }catch(error){
        throw error;
    }
};

// ===============================
// FUNZIONI HELPER PRIVATE
// ===============================

/**
 * Motore CRUD per operazioni su recensioni con validazione business rules
 * Toggle automatico per ADD (con rating) e DELETE (senza rating) basato su presenza parametri
 * 
 * @public
 * @param {string} userId - ID utente che esegue operazione
 * @param {string} recipeId - ID ricetta target
 * @param {number|null} [tasteRate=null] - Rating gusto (1-5) per ADD, null per DELETE
 * @param {number|null} [difficultyRate=null] - Rating difficoltà (1-5) per ADD, null per DELETE
 * 
 * @returns {{resourceType: "review", resourceObj: Review, statusCode: "add"|"delete"}} Response object contenente la recensione aggiornata
 * 
 * @see {@link getStoredReviews} Per lettura database recensioni
 * @see {@link StorageOperations} Per aggionamento database recensioni
 * 
 * @throws {Error} Se parametri passati non corretti e rilancia errori di storage
 * @throws {ErrorsManagment.Duplicated} Se l'utente ha già fornito una recensione per la ricetta - solo per add
 * @throws {ErrorsManagment.NotFound} se recensione non trovata - solo per delete
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
        let updatedReview;
        let operationType;
        const recipeReviewsArray = getStoredReviews();
 
        if(recipeId && userId && tasteRate && difficultyRate){
            // ADD MODE: Crea nuova recensione
            if(recipeReviewsArray.some(review => review.userId === userId && review.recipeId === recipeId)){
                const duplicated = new ErrorsManagment.Duplicated("Review");
                console.error(duplicated);
                throw duplicated;
            }else{
                updatedReview = new Review(recipeId, userId, Number(tasteRate), Number(difficultyRate));
                operationType = "add";
                recipeReviewsArray.push(updatedReview);
            }
        }else{
            if(recipeId && userId && !(tasteRate || difficultyRate)){
                // DELETE MODE: Rimuovi recensione esistente
                const index = recipeReviewsArray.findIndex(element => (element.recipeId === recipeId) && (element.userId === userId));
                if(index < 0){
                    const notFound = new ErrorsManagment.NotFound("Review", "id", userId);
                    console.error(notFound);
                    throw notFound;
                }else{
                    updatedReview = recipeReviewsArray[index];
                    operationType = "delete";
                    recipeReviewsArray.splice(index, 1);
                }
            }else{
                // VALIDATION ERROR: Parametri malformati
                const dataFormat = new Error("Wrong data format");
                console.error(dataFormat);
                throw dataFormat; 
            }
        }
        
        // Persistenza dati aggiornati
        StorageOperations.set(REVIEWS_DB_KEY, recipeReviewsArray, REVIEWS_STORAGE_OPTS);
        return new Response("review", updatedReview, operationType);
    } catch (error) {
        throw error;
    }    
};

/**
 * Calcola rating medio per ricetta su tipo specificato
 * Itera tutte recensioni per aggregazione real-time
 * 
 * @public
 * @param {string} recipeId - ID ricetta per calcolo
 * @param {"tasteRate"|"difficultyRate"} ratingType - Tipo rating
 * @returns {number} Media aritmetica formattata a 1 decimale, 0 se nessuna recensione o errori
 * @see {@link getStoredReviews} Per lettura database ricette
 * 
 * @throws {Error} Rilancia errori critici e di storage
 *
 * @example
 * const avgTaste = recipeAvgRate("52772", "tasteRate"); // "4.2"
 */
export function recipeAvgRate (recipeId, ratingType) {
    try {
        let sum = 0;
        let totalReviews = 0;
        let avgRate = 0;

        getStoredReviews().forEach(review => {
            if(review.recipeId === recipeId){
                sum += Number(review[ratingType]);
                totalReviews++;
            }
        });
        if(totalReviews > 0){
            avgRate = (sum/totalReviews);
        }
        return avgRate.toFixed(1);
    } catch (error) {
        throw error;
    }
};

/**
 * Recupera rating specifico utente per ricetta e tipo
 * 
 * @public
 * @param {string} recipeId - ID ricetta target
 * @param {string} userId - ID utente target
 * @param {"tasteRate"|"difficultyRate"} ratingType - Tipo rating
 * @returns {number} Rating formattato a 1 decimale, 0 se non recensita o in caso di errore
 * @see {@link getStoredReviews} Per lettura database recensioni
 * 
 * @throws {Error} Rilancia errori critici e di storage
 *
 * @example
 * const userTaste = recipeUserRate("52772", "user123", "tasteRate"); // "4.0"
 */
export function recipeUserRate(recipeId, userId, ratingType) {
    try {
        const review = getStoredReviews().find(element => element.recipeId === recipeId && element.userId === userId);
        return review ? Number(review[ratingType]).toFixed(1) : 0;
    } catch (error) {
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