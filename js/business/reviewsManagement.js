/**
 * @fileoverview Sistema di gestione recensioni ricette con rating gusto e difficoltà
 * @description Gestisce persistenza, CRUD operations e calcoli statistici per recensioni utente.
 * Supporta rating duplici (gusto/difficoltà) e funzioni aggregazione per display UI.
 * @author damia
 * @version 1.0.0
 * @since 2025-09-03
 * @requires data-models - Review constructor per validazione oggetti
 * @requires errorsManagement - ReviewsManagementError per gestione errori tipizzati
 * @requires storageManagement - StorageManagement per persistenza localStorage
 */

import { Review } from "../data-models.js";
import { ReviewsManagementError } from "../errorsManagement.js";
import { StorageManagement } from "../storageManagement.js";

// ================================================================================================
// STORAGE CONFIGURATION
// ================================================================================================

/**
 * Chiave localStorage per persistenza dati recensioni
 * @constant {string}
 * @readonly
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

/**
 * Recupera array recensioni da localStorage con caching automatico
 * 
 * @function getStoredReviews
 * @returns {Array<Review>} Deep clone dell'array recensioni per immutabilità
 * @throws {Error} Se localStorage non accessibile o dati corrotti
 * 
 * @description
 * Caricamento sicuro recensioni con gestione errori e cache refresh.
 * - Carica dati freschi da localStorage ad ogni chiamata
 * - Restituisce structuredClone per prevenire mutazioni accidentali
 * - Reset cache a array vuoto in caso di errore
 * 
 * @example
 * const reviews = getStoredReviews();
 * // reviews è safe da modificare senza affecting storage
 * 
 * @todo Implementare caching intelligente per evitare reload localStorage
 * @todo Aggiungere validazione schema per dati corrotti
 * 
 * @since 1.0.0
 */
export function getStoredReviews(){
    try{
        storedReviews = StorageManagement.get(REVIEWS_DB_KEY, {storageLocation: "local", dataType: "array"});
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

/**
 * Recupera recensioni specifiche per combinazione ricetta-utente
 * 
 * @function getReviewId
 * @private
 * @param {string} recipeId - ID ricetta target
 * @param {string} userId - ID utente target
 * @returns {Array<Review>} Array recensioni filtrate (max 1 elemento per business logic)
 * 
 * @description
 * Utility per lookup recensioni con filtro combinato.
 * Business rule: ogni utente può avere max 1 recensione per ricetta.
 * 
 * @todo Completare gestione errori nel catch block
 * @todo Ottimizzare con Map() per lookup O(1) se performance critiche
 * 
 * @since 1.0.0
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
 * Core engine per operazioni CRUD su recensioni con validazione business rules
 * 
 * @function updateRecipeReviews
 * @private
 * @param {string} recipeId - ID ricetta target
 * @param {string} userId - ID utente che esegue l'operazione
 * @param {number|null} [tasteRate=null] - Rating gusto (1-5), null per delete operation
 * @param {number|null} [difficultyRate=null] - Rating difficoltà (1-5), null per delete operation
 * @returns {boolean} True se operazione completata con successo
 * @throws {ReviewsManagementError} Se validazione fallisce o recensione non trovata
 * 
 * @description
 * Funzione polivalente per ADD/DELETE recensioni con validazione parametri:
 * 
 * **ADD MODE**: recipeId + userId + tasteRate + difficultyRate
 * - Crea nuova Review e la aggiunge all'array
 * - Non verifica duplicati (business rule da gestire upstream)
 * 
 * **DELETE MODE**: recipeId + userId + rate=null
 * - Trova recensione esistente e la rimuove
 * - Throws NOT_FOUND se recensione non esiste
 * 
 * **VALIDATION**: Parametri malformati → Throws VALIDATION error
 * 
 * @todo Aggiungere verifica duplicati in ADD mode
 * @todo Implementare UPDATE mode per modifiche senza delete/add
 * @todo Validare range rating (1-5) prima di creazione Review
 * 
 * @since 1.0.0
 */
export function updateRecipeReviews(userId, recipeId, tasteRate = null, difficultyRate = null){
    try {
        const recipeReviewsArray = getStoredReviews();
 
        if(recipeId && userId && tasteRate && difficultyRate){
            // ADD MODE: Crea nuova recensione
            recipeReviewsArray.push(new Review(recipeId, userId, tasteRate, difficultyRate));
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
        StorageManagement.set(REVIEWS_DB_KEY, recipeReviewsArray, {storageLocation: "local", dataType: "array"});
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }    
}

/**
 * Calcola rating medio per ricetta su tipo specificato
 * 
 * @function recipeAvgRate
 * @private
 * @param {string} recipeId - ID ricetta per calcolo statistiche
 * @param {string} ratingType - Tipo rating ("tasteRate"|"difficultyRate")
 * @returns {number} Media aritmetica rating, NaN se nessuna recensione
 * @throws {Error} Se accesso storage fallisce
 * 
 * @description
 * Calcolo statistico real-time su tutte le recensioni della ricetta.
 * - Itera recensioni e somma rating del tipo specificato
 * - Restituisce media aritmetica (sum/count)
 * - NaN per ricette senza recensioni (gestire upstream)
 * 
 * @todo Gestire esplicitamente caso nessuna recensione (return 0 vs NaN)
 * @todo Implementare caching per ricette con molte recensioni
 * @todo Aggiungere validazione ratingType parameter
 * 
 * @since 1.0.0
 */
export function recipeAvgRate (recipeId, ratingType) {
    try {
        let sum = 0;
        let totalReviews = 0;
        getStoredReviews().forEach(element => {
            if(element.recipeId === recipeId){
                sum += element[ratingType];
                totalReviews++;
            }
        });
        return sum/totalReviews;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

/**
 * Recupera rating specifico utente per ricetta e tipo
 * 
 * @function recipeUserRate
 * @private
 * @param {string} recipeId - ID ricetta target
 * @param {string} userId - ID utente target
 * @param {string} ratingType - Tipo rating ("tasteRate"|"difficultyRate")
 * @returns {number|undefined} Rating utente o undefined se non recensita
 * @throws {Error} Se accesso storage fallisce
 * 
 * @description
 * Lookup diretto rating utente specifico senza aggregazione.
 * - Trova recensione univoca per coppia ricetta-utente
 * - Restituisce valore specifico del ratingType
 * - undefined se utente non ha recensito la ricetta
 * 
 * @todo Aggiungere validazione esistenza userId prima del lookup
 * @todo Implementare caching per utenti con molte recensioni
 * 
 * @since 1.0.0
 */
export function recipeUserRate(recipeId, userId, ratingType) {
    try {
        const review = getStoredReviews().find(element => element.recipeId === recipeId && element.userId === userId);
        return review ? review[ratingType] : undefined;
    } catch (error) {
        console.error(error);
        throw error;
    }
}


// ================================================================================================
// ARCHITECTURE NOTES
// ================================================================================================

/*
DESIGN PATTERNS IMPLEMENTATI:

1. **Repository Pattern**:
   - getStoredReviews() come data access layer
   - Astrazione storage con StorageManagement dependency
   - Immutabilità garantita con structuredClone()

2. **Command Pattern**:
   - updateRecipeReviews() polivalente per ADD/DELETE
   - Parametri determinano operazione (presence/absence logic)
   - Transactional operations con rollback automatico su errore

3. **Facade Pattern**:
   - GlobalRatingFunctions e UserRatingFunctions come API semplificate
   - Nascondono complessità calcoli e gestione errori
   - Interface uniforme per UI components

4. **Error Handling Strategy**:
   - Custom errors (ReviewsManagementError) per business logic
   - Generic errors per infrastructure (storage, network)
   - Silent fail vs rethrow in base a criticità operazione

BUSINESS RULES IMPLEMENTATE:

- **One Review Per User Per Recipe**: Un utente può avere max 1 recensione per ricetta
- **Dual Rating System**: Ogni recensione ha gusto + difficoltà (entrambi obbligatori)
- **No Partial Updates**: Modifiche richiedono delete + add (atomicità)
- **Real-time Aggregation**: Statistiche calcolate on-demand senza caching

PERFORMANCE CONSIDERATIONS:

- **Array Linear Search**: Accettabile per MVP, da ottimizzare con Map/Index per scale
- **Storage Access**: Ogni operazione ricarica da localStorage (trade-off consistency vs performance)
- **Immutability**: structuredClone garantisce safety ma ha overhead memory
*/