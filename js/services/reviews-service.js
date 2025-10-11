/**
 * @fileoverview Gestore recensioni ricette con sistema rating duale
 * @description Fornisce interfaccia per CRUD operazioni su recensioni, con supporto rating gusto/difficoltà,
 * calcoli statistici aggregati e persistenza localStorage. Gestisce business rules come unicità
 * recensioni per utente/ricetta e validazione parametri.
 * @requires data-models.js - Classe Review per costruzione oggetti recensione
 * @requires errors.js - Modulo errori custom per validazioni
 * @requires storage.js - Modulo StorageOperations per persistenza dati
 */

import { Review } from "../core/data-models.js";
import * as ErrorsManagment from "../core/errors.js";
import { StorageOperations } from "../core/storage.js";

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
 * @returns {Review} Oggetto Review creato/modificato nell'operazione
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
        const recipeReviewsArray = getStoredReviews();
 
        if(recipeId && userId && tasteRate && difficultyRate){
            // ADD MODE: Crea nuova recensione
            if(recipeReviewsArray.some(review => review.userId === userId && review.recipeId === recipeId)){
                throw new ErrorsManagment.Duplicated("Review");
            }else{
                updatedReview = new Review(recipeId, userId, Number(tasteRate), Number(difficultyRate));
                recipeReviewsArray.unshift(updatedReview);
            }
        }else{
            if(recipeId && userId && !(tasteRate || difficultyRate)){
                // DELETE MODE: Rimuovi recensione esistente
                const index = recipeReviewsArray.findIndex(element => (element.recipeId === recipeId) && (element.userId === userId));
                if(index < 0){
                    throw new ErrorsManagment.NotFound("Review", "id", userId);
                }else{
                    updatedReview = recipeReviewsArray[index];
                    recipeReviewsArray.splice(index, 1);
                }
            }else{
                // VALIDATION ERROR: Parametri malformati
                throw new Error("Wrong data format"); 
            }
        }
        
        // Persistenza dati aggiornati
        return StorageOperations.set(REVIEWS_DB_KEY, recipeReviewsArray, REVIEWS_STORAGE_OPTS);
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

// ============================================================================
// DESCRIZIONE DEL FILE
// ============================================================================

/**
 * @description reviews-service.js
 * 
 * **Scopo e ruolo nel progetto:**
 * Modulo di servizio per la gestione unificata delle recensioni utente.
 * Fornisce un'interfaccia pubblica per operazioni CRUD su recensioni con sistema rating duale (gusto/difficoltà),
 * calcoli statistici aggregati in tempo reale e persistenza localStorage. 
 * Implementa business rules come unicità recensioni per coppia utente-ricetta e validazione parametri, abilitando feedback
 * granulare sulle ricette.
 * 
 * **Architettura e struttura:**
 * - **Configurazione storage:** Costanti per chiave localStorage e opzioni.
 * - **Operazioni storage:** Funzione per lettura con copia profonda (getStoredReviews).
 * - **CRUD engine:** Funzione principale per ADD/DELETE toggle (updateRecipeReviews).
 * - **Aggregazioni:** Funzioni per calcoli statistici (recipeAvgRate, recipeUserRate).
 * - **Pattern utilizzati:** Toggle mode basato su parametri, real-time aggregation senza caching.
 * - **Dipendenze:** Importa data-models.js (Review), errors.js (Duplicated, NotFound), storage.js (StorageOperations).
 * 
 * **Interazioni con altri moduli:**
 * - **Data models (data-models.js):** Istanzia oggetti Review per nuove recensioni.
 * - **Storage (storage.js):** Persiste/legge array recensioni in localStorage.
 * - **Errors (errors.js):** Lancia errori custom (Duplicated, NotFound) per validazioni.
 * - **Session (session-service.js):** Utilizzato per operazioni business su recensioni
 * 
 * **Note tecniche:**
 * - **Sistema rating duale:** Supporto gusto/difficoltà per feedback completo.
 * - **Business rules:** Unicità per coppia utente-ricetta, validazione parametri.
 * - **Immutabilità:** Copia profonda previene mutazioni accidentali.
 * - **Gestione errori:** Rilancia errori custom per graceful degradation.
 * - **Scalabilità:** Facile aggiunta tipi rating o statistiche seguendo pattern esistente.
 * - **Limitazioni:** Nessun caching aggregazioni, dipendenza storage locale.
 * 
 * @note Questo modulo gestisce logica recensioni: errori qui impattano rating e feedback utente.
 * @note Compatibilità: Usa localStorage per persistenza.
 */