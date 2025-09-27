/**
 * @fileoverview Sistema centralizzato per gestione errori custom multi-modulo
 * @description Definisce error classes specializzate per ogni dominio applicativo
 * con gestione unificata UI e debugging capabilities
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
 */

// ============================================================================
// CUSTOM ERROR CLASSES PER DOMINI APPLICATIVI
// ============================================================================

/**
 * Classe errore specializzata per operazioni gestione utenti
 * Estende Error nativo mantenendo compatibility con error handling JavaScript
 * 
 * @constructor
 * @param {string} type - Categoria errore per gestione specifica
 * @param {string} message - Messaggio descrittivo per logging/UI
 * @param {any} [details=null] - Informazioni aggiuntive per debugging
 * 
 * @property {string} name - Identificatore tipo errore "UsersManagementError"
 * @property {string} type - Categoria per switch case handling
 * @property {string} message - Messaggio descrittivo errore
 * @property {any} details - Dati extra per debugging (stack trace, input data)
 * @property {string} timestamp - ISO timestamp creazione errore
 * 
 * @example
 * // Errore validazione con dettagli
 * throw new UsersManagementError(
 *   "VALIDATION", 
 *   "Username già in uso", 
 *   { attemptedUsername: "mario", existingCount: 2 }
 * );
 * 
 * @example
 * // Errore storage con stack trace originale
 * try {
 *   localStorage.setItem(key, data);
 * } catch (storageError) {
 *   throw new UsersManagementError("STORAGE", "Quota exceeded", storageError);
 * }
 */
export function UsersManagementError(type, message, details = null){
        this.name = "UsersManagementError";
        this.type = type;
        this.message = message;
        this.details = details;
        this.timestamp = new Date().toISOString();
}

/**
 * Setup prototype chain per ereditarietà Error nativa
 * Garantisce compatibility con instanceof Error e error handling standard
 */
UsersManagementError.prototype = Object.create(Error.prototype);
UsersManagementError.prototype.constructor = UsersManagementError;

/**
 * Classe errore specializzata per operazioni gestione recensioni
 * Pattern identico a UsersManagementError per consistency API
 * 
 * @constructor
 * @param {string} type - Categoria errore ("VALIDATION", "STORAGE", "NOT_FOUND")
 * @param {string} message - Messaggio descrittivo per logging/UI
 * @param {any} [details=null] - Informazioni aggiuntive per debugging
 * 
 * @property {string} name - Identificatore tipo errore "ReviewsManagementError"
 * @property {string} type - Categoria per switch case handling
 * @property {string} message - Messaggio descrittivo errore
 * @property {any} details - Dati extra per debugging
 * @property {string} timestamp - ISO timestamp creazione errore
 * 
 * @example
 * // Errore validazione rating
 * throw new ReviewsManagementError(
 *   "VALIDATION", 
 *   "Rating deve essere tra 1 e 5", 
 *   { providedRating: 7, validRange: [1,5] }
 * );
 * 
 * @example
 * // Errore ricetta non trovata
 * throw new ReviewsManagementError(
 *   "NOT_FOUND", 
 *   "Ricetta non trovata per review", 
 *   { recipeId: "recipe_123", searchAttempts: 3 }
 * );
 */
export function ReviewsManagementError(type, message, details = null){
        this.name = "ReviewsManagementError"; // ← FIX: Era "StorageManagementError"
        this.type = type;
        this.message = message;
        this.details = details;
        this.timestamp = new Date().toISOString();
}

ReviewsManagementError.prototype = Object.create(Error.prototype);
ReviewsManagementError.prototype.constructor = ReviewsManagementError;

/**
 * Classe errore specializzata per operazioni storage layer
 * Gestisce errori localStorage, sessionStorage, database operations
 * 
 * @constructor
 * @param {string} type - Categoria errore ("READ", "WRITE", "PARSE", "QUOTA")
 * @param {string} message - Messaggio descrittivo per logging/UI
 * @param {any} [details=null] - Informazioni aggiuntive per debugging
 * 
 * @property {string} name - Identificatore tipo errore "StorageManagementError"
 * @property {string} type - Categoria per switch case handling
 * @property {string} message - Messaggio descrittivo errore
 * @property {any} details - Dati extra per debugging
 * @property {string} timestamp - ISO timestamp creazione errore
 * 
 * @example
 * // Errore parsing JSON malformato
 * throw new StorageManagementError(
 *   "PARSE", 
 *   "JSON malformato in localStorage", 
 *   { storageKey: "users", rawData: "invalid{json" }
 * );
 * 
 * @example
 * // Errore quota storage
 * throw new StorageManagementError(
 *   "QUOTA", 
 *   "Spazio localStorage esaurito", 
 *   { attemptedSize: "2MB", availableSpace: "500KB" }
 * );
 */
export function StorageManagementError(type, message, details = null){
        this.name = "StorageManagementError";
        this.type = type;
        this.message = message;
        this.details = details;
        this.timestamp = new Date().toISOString();
}

StorageManagementError.prototype = Object.create(Error.prototype);
StorageManagementError.prototype.constructor = StorageManagementError;

// ============================================================================
// ERROR HANDLING CENTRALIZZATO UI
// ============================================================================

/**
 * Gestore centralizzato errori con alerting personalizzato per categoria
 * Fornisce UI feedback consistency e logging centralizzato per debugging
 * 
 * @param {Error|UsersManagementError|ReviewsManagementError|StorageManagementError} error 
 *        Oggetto errore da gestire - deve implementare properties 'type' e 'message'
 * 
 * @description
 * Switch handler per categorie errore:
 * - VALIDATION: Errori input utente, duplicati, constraint violations
 * - STORAGE: Errori persistence layer, quota, access permissions
 * - AUTH: Errori autenticazione, autorizzazione, sessioni
 * - NOT_FOUND: Errori ricerca entità, risorse mancanti
 * - DEFAULT: Fallback per errori non categorizzati
 * 
 * @example
 * // Gestione errore validation
 * try {
 *   addNewUser("", "invalid-email", "123");
 * } catch (error) {
 *   handleUserError(error); // → "Errore di validazione: Email già in uso"
 * }
 * 
 * @example
 * // Gestione errore storage con logging
 * try {
 *   updateUsersDB(largeData);
 * } catch (error) {
 *   console.error("Storage error details:", error.details);
 *   handleUserError(error); // → "Errore di storage: Quota exceeded"
 * }
 * 
 * @example
 * // Chain error handling per multiple operations
 * try {
 *   const user = searchUserbyName("mario");
 *   const isAuth = await admitUser(user.id, password);
 *   updateLoggedUser(user.id);
 * } catch (error) {
 *   handleUserError(error); // Gestisce qualsiasi errore nella chain
 * }
 * 
 * @todo Implementa toast notifications invece di alert per UX migliore
 */
export function handleUserError(error) {

    if(error instanceof Error){
        switch(error.type){
            case 'VALIDATION':
                alert(`Errore di validazione: ${error.message}`);
                break;
            case 'STORAGE':
                alert(`Errore di storage: ${error.message}`);
                break;
            case 'AUTH':
                alert(`Errore di autenticazione: ${error.message}`);
                break;
            case 'NOT_FOUND':
                alert(`Risorsa non trovata: ${error.message}`);
                break;
            default:
                alert(`Errore: ${error.message}`);
        }
    }
}