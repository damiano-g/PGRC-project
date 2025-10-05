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
     * const users = StorageManagement.get("users", {
     *   storageLocation: "local", 
     *   dataType: "array"
     * });
     * 
     * @example
     * // Recupero ID utente loggato da sessionStorage
     * const userId = StorageManagement.get("loggedUser", {
     *   storageLocation: "session", 
     *   dataType: "string"
     * });
     */
    get: function(storageKey, options = {}){
        const {storageLocation, dataType} = options;

        try {
            let retrievedData;

            // Selezione storage engine basato su parametro
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
            console.error(error);
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
     * @throws {Error} Se parametri non validi o errori storage
     * 
     * @example
     * // Salvataggio array utenti in localStorage
     * StorageManagement.set("users", usersArray, {
     *   storageLocation: "local", 
     *   dataType: "array"
     * });
     * 
     * @example
     * // Salvataggio ID utente loggato in sessionStorage
     * StorageManagement.set("loggedUser", "user_123", {
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

            // Persistenza su storage engine selezionato
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
        } catch (error) {
            console.error(error);
            // Re-throw errori per propagazione a business logic layer
            throw error;
        }
    }
}