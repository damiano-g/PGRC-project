/**
 * @fileoverview Gestione centralizzata operazioni storage (localStorage/sessionStorage)
 * @description Modulo unificato per operazioni CRUD su web storage con supporto multi-tipo
 */

/**
 * Manager centralizzato per operazioni web storage
 * Fornisce API unificata per localStorage e sessionStorage con supporto tipi multipli
 * 
 * @namespace StorageOperations
 */
export const StorageOperations = {
    
    /**
     * Recupera dati da web storage con deserializzazione automatica basata su tipo
     * 
     * @param {string} storageKey - Chiave identificativa storage
     * @param {Object} options - Configurazione operazione storage
     * @param {("local"|"session")} options.storageLocation - Tipo storage da utilizzare
     * @param {("array"|"string")} options.dataType - Tipo dato per deserializzazione
     * @returns {Array|string} Dati deserializzati secondo dataType specificato
     * @throws {Error} Se parametri non validi o errori storage
     * 
     * @example
     * // Recupero array utenti da localStorage
     * const users = StorageOperations.get("users", {
     *   storageLocation: "local", 
     *   dataType: "array"
     * });
     * 
     * @example
     * // Recupero ID utente loggato da sessionStorage
     * const userId = StorageOperations.get("loggedUser", {
     *   storageLocation: "session", 
     *   dataType: "string"
     * });
     */
    get: function(storageKey, options = {}){
        const {storageLocation, dataType} = options;

        try {
            let retrievedData;

            // Selezione storage basata su parametro
            switch (storageLocation) {
                case "local":
                    retrievedData = localStorage.getItem(storageKey);
                    break;
                case "session":
                    retrievedData = sessionStorage.getItem(storageKey);
                    break;
                default:
                    throw new Error(`Unsupported storage location: ${storageLocation}`);
            }

            // Deserializzazione basata su tipo dato richiesto
            switch (dataType) {
                case "array":
                    // Parsing JSON con fallback array vuoto se null/undefined
                    return retrievedData ? JSON.parse(retrievedData) : [];
                case "string":
                    // Return stringa con fallback stringa vuota se null/undefined
                    return retrievedData || "";
                default:
                    throw new Error(`Unsupported data type: ${dataType}`);
            }
        } catch (error) {
            // Re-throw errori per propagazione a business logic layer
            throw error;
        }
    },

    /**
     * Salva dati in web storage con serializzazione automatica basata su tipo
     * 
     * @param {string} storageKey - Chiave identificativa storage
     * @param {Array|string} data - Dati da persistere
     * @param {Object} options - Configurazione operazione storage
     * @param {("local"|"session")} options.storageLocation - Tipo storage da utilizzare
     * @param {("array"|"string")} options.dataType - Tipo dato per serializzazione
     * @returns Dati processati e salvati su web storage
     * @throws {Error} Se parametri non validi o errori storage
     * 
     * @example
     * // Salvataggio array utenti in localStorage
     * StorageOperations.set("users", usersArray, {
     *   storageLocation: "local", 
     *   dataType: "array"
     * });
     * 
     * @example
     * // Salvataggio ID utente loggato in sessionStorage
     * StorageOperations.set("loggedUser", "user_123", {
     *   storageLocation: "session", 
     *   dataType: "string"
     * });
     */
    set: function(storageKey, data, options = {}){
        const {storageLocation, dataType} = options;

        try {
            let processedData;

            // Serializzazione basata su tipo dato
            switch (dataType) {
                case "array":
                    // Conversione array/object a JSON string
                    processedData = JSON.stringify(data);
                    break;
                case "string":
                    // String rimane invariata
                    processedData = data;
                    break;
                default:
                    throw new Error(`Unsupported data type: ${dataType}`);
            }

            // Persistenza su storage selezionato
            switch (storageLocation) {
                case "local":
                    localStorage.setItem(storageKey, processedData);
                    break;
                case "session":
                    sessionStorage.setItem(storageKey, processedData);
                    break;
                default:    
                    throw new Error(`Unsupported storage location: ${storageLocation}`);
            }

            return processedData;
        } catch (error) {
            // Re-throw errori per propagazione a business logic layer
            throw error;
        }
    }
}


// ============================================================================
// DESCRIZIONE DEL FILE
// ============================================================================

/**
 * @description storage.js
 * 
 * **Scopo e ruolo nel progetto:**
 * Modulo core per la gestione centralizzata del web storage.
 * Fornisce un'API unificata per operazioni CRUD su localStorage e sessionStorage, con supporto
 * per serializzazione/deserializzazione automatica basata su tipo di dato. Abilita persistenza
 * dati per utenti, ricette, preferenze e stato sessione.
 * 
 * **Architettura e struttura:**
 * - **Namespace StorageOperations:** Oggetto con metodi get/set per operazioni storage.
 * - **Supporto multi-tipo:** Gestione array (JSON) e stringhe con serializzazione automatica.
 * - **Storage engines:** Supporto localStorage (persistente) e sessionStorage (temporaneo).
 * - **Pattern utilizzati:** Factory per selezione storage, switch per tipi dato, try-catch per error handling.
 * - **Dipendenze:** Nessuna dipendenza esterna - modulo self-contained basato su Web Storage API.
 * 
 * **Interazioni con altri moduli:**
 * - **Business (users-service.js, recipes-service.js, reviews-service.js):** Salvataggio/recupero dati utenti, ricette e recensioni.
 * - **Session (session-service.js):** Persistenza stato login e preferenze utente.
 * 
 * **Note tecniche:**
 * - **Serializzazione:** JSON.stringify/parse per array, string diretta.
 * - **Type safety:** Switch statement per validazione tipi supportati.
 * - **Compatibilità:** Web Storage API supportata in tutti browser moderni.
 * - **Limitazioni:** Nessun supporto per dati complessi, quota storage limitata (~5-10MB).
 */