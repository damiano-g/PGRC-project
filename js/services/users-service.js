/**
 * @fileoverview Gestione completa utenti - storage, validazione, autenticazione e operazioni CRUD
 * @description Sistema completo per gestione utenti con localStorage/sessionStorage,
 * validazione duplicati, autenticazione sicura e operazioni atomiche
 * @requires data-models.js - Classi User e Note per costruzione oggetti
 * @requires storage.js - Modulo StorageOperations per persistenza dati
 */

import { Note, User } from "../core/data-models.js";
import { StorageOperations } from "../core/storage.js";
import * as ErrorsManagement from "../core/errors.js";

// ============================================================================
// CONFIGURAZIONE E COSTANTI
// ============================================================================

/**
 * Chiave localStorage per array utenti registrati
 * @constant {string}
 */
const USERS_DB_KEY = "users";

/**
 * Opzioni di storage DB utenti
 * @constant {Object}
 * @see {@link StorageOperations}
 */
const USERS_STORAGE_OPTS = {storageLocation: "local", dataType: "array"};

// ============================================================================
// API PUBBLICA - ACCESSO DATI E GESTIONE SESSIONE
// ============================================================================

/**
 * Recupera array utenti registrati aggiornato con deep copy per safety
 * API pubblica per accesso read-only ai dati utenti
 * 
 * @returns {Array<User>} Deep copy array utenti (safe da modifiche esterne)
 * @see {@link StorageOperations} - Per operazioni di lettura e scrittura web storage
 * @throws {Error} Se errori di lettura database
 * 
 * @example
 * const users = getRegisteredUsers();
 * users.forEach(user => console.log(user.username));
 */
export function getRegisteredUsers() {
    try{
        const registeredUsers = StorageOperations.get(USERS_DB_KEY, USERS_STORAGE_OPTS);
        return structuredClone(registeredUsers); // Utile per eventuali future implementazioni (es chached data)
    }catch(error){
        throw error;
    }
};


// ============================================================================
// API PUBBLICA - OPERAZIONI CRUD UTENTI
// ============================================================================

/**
 * Aggiunge nuovo utente al sistema con validation chain completa
 * Entry point unificato per registrazione con operazione atomica
 * 
 * @async
 * @param {string} chosenUsername - Username desiderato
 * @param {string} chosenEmail - Email desiderata
 * @param {string} chosenPassword - Password in chiaro
 * @returns {Promise<User>} Utente creato e salvato
 * @see {@link searchDuplicates} - Per gestione valori duplicati
 * @see {@link getRegisteredUsers} - Lettura database utenti (deep copy)
 * @see {@link StorageOperations.set} - Aggiornamento database utenti
 * @see {@link createUserObject} - Creazione nuovo oggetto utente
 * @throws {ErrorsManagement.Duplicated} Se username/email già in uso
 * @throws {ErrorsManagement.InvalidFormat} Per formato valori dei parametri non conformi 
 * @throws {Error} Se errori di storage o hashing
 * 
 * @example
 * try {
 *   const newUser = await addNewUser("mario", "mario@email.com", "password123");
 * } catch (error) {
 *   console.log("Errore registrazione");
 * }
 */
export async function addNewUser(chosenUsername, chosenEmail, chosenPassword, passConfirm){

    try {
        // Validation chain: username + email duplicati
        authUsername(chosenUsername);
        authEmail(chosenEmail);
        authPassword(chosenPassword, passConfirm);
        
        // User creation con hashing automatico
        const newUser = await createUserObject(chosenUsername, chosenEmail, chosenPassword);
        
        // Storage atomico: read → modify → write
        const actualRegUsersArray = getRegisteredUsers();
        actualRegUsersArray.push(newUser);
        StorageOperations.set(USERS_DB_KEY, actualRegUsersArray, USERS_STORAGE_OPTS);
        
        return newUser;
    } catch (error) {
        throw error;
    }
}

/**
 * Rimuove utente dal database
 * Operazione atomica per eliminazione account
 * 
 * @param {string} userId - ID utente da eliminare
 * @returns {string} Stringa JSON dell'array utenti aggiornato
 * @see {@link getRegisteredUsers} Per lettura db utenti
 * @see {@link StorageOperations} Per aggiornamento db utenti
 * @throws {new ErrorsManagement.NotFound} Se utente non trovato
 * @throws {Error} Se errori di storage
 * 
 * @example
 * try {
 *   deleteUser("user123");
 * } catch (error) {
 *   console.log("Errore eliminazione");
 * }
 */
export function deleteUser(userId){

    try {
        const actualRegUsersArray = getRegisteredUsers();
        const index = actualRegUsersArray.findIndex(user => user.id === userId);
        
        if(index < 0){
            throw new ErrorsManagement.NotFound("User", "id", userId);
        }
        
        actualRegUsersArray.splice(index, 1);
        return StorageOperations.set(USERS_DB_KEY, actualRegUsersArray, USERS_STORAGE_OPTS);
    } catch (error) {
        throw error;
    }
}

// ============================================================================
// API PUBBLICA - AGGIORNAMENTO PROFILO
// ============================================================================

/**
 * Aggiorna username utente con validation duplicati
 * API pubblica per modifica profilo con controlli atomici
 * 
 * @async
 * @param {string} userId - ID utente da aggiornare
 * @param {string} newUsername - Nuovo username desiderato
 * @return {string} Username aggiornato
 * @see {@link searchDuplicates} Per controllo valori duplicati
 * @see {@link updateUserData} Per aggiornamento dati utente
 * @throws {ErrorsManagement.Duplicated} Se username già in uso
 * @throws {ErrorsManagement.NotFound} Se utente non trovato
 * @throws {Error} se errori di storage, parametri errati
 * 
 * @example
 * try {
 *   await updateUserUsername("user123", "nuovoUsername");
 * } catch (error) {
 *   console.log("Errore aggiornamento username");
 * }
 */
export async function updateUserUsername(userId, newUsername){
    try {
        authUsername(newUsername); // Validation duplicati
        return await updateUserData(userId, "username", newUsername); // NB -> await per consistenza
    } catch (error) {
        throw error;
    }
}

/**
 * Aggiorna email utente con validation duplicati
 * API pubblica per modifica profilo con controlli atomici
 * 
 * @async
 * @param {string} userId - ID utente da aggiornare
 * @param {string} newEmail - Nuova email desiderata
 * @return {string} Email aggiornata
 * @see {@link searchDuplicates} Per controllo valori duplicati
 * @see {@link updateUserData} Per aggiornamento db utenti 
 * @throws {ErrorsManagement.Duplicated} Se email già in uso
 * @throws {Error} Se errori di storage, parametri errati 
 * @throws {ErrorsManagement.NotFound} se utente non trovato
 * 
 * @example
 * try {
 *   await updateUserEmail("user123", "nuovaemail@esempio.com");
 * } catch (error) {
 *   console.log("Errore aggiornamento email");
 * }
 */
export async function updateUserEmail(userId, newEmail){
    try {
        authEmail(newEmail); // Validation duplicati
        return await updateUserData(userId, "email", newEmail);
    } catch (error) {
        throw error;
    }   
}

/**
 * Aggiorna password utente con hashing automatico
 * API pubblica per cambio password sicuro
 * 
 * @async
 * @param {string} userId - ID utente da aggiornare
 * @param {string} newPassword - Nuova password in chiaro
 * @param {string} passConfirm - Valore di conferma della password
 * @returns {string} Password aggiornata e hashata
 * @throws {Error} Se errori durante hashing, errori di storage, parametri errati
 * @throws {ErrorsManagement.NotFound} se utente non trovato
 * 
 * @example
 * try {
 *   await updateUserPassword("user123", "nuovaPassword123");
 * } catch (error) {
 *   console.log("Errore aggiornamento password");
 * }
 */
export async function updateUserPassword(userId, newPassword, passConfirm){
    try {
        authPassword(newPassword, passConfirm);
        return await updateUserData(userId, "password", newPassword, true); // needsHashing = true
    } catch (error) {
        throw error;
    }
}

/**
 * Gestisce toggle favourites per ricetta specifica (add/remove automatico)
 * API pubblica per gestione ricette preferite con logica toggle
 * 
 * @async
 * @param {string} userId - ID utente da aggiornare
 * @param {string} recipeId - ID ricetta da aggiungere/rimuovere dai preferiti
 * @returns {Array} Array preferiti aggiornato
 * @see {@link searchUser} Per lettura dati utente
 * @see {@link updateUserData} Per aggiornamento dati utente
 * @throws {Error} Se errori di storage (r/w)
 * @throws {ErrorsManagement.NotFound} se utente non trovato
 * 
 * @example
 * try {
 *   await updateUserFavourites("user123", "recipe_52772");
 * } catch (error) {
 *   console.log("Errore aggiornamento preferiti");
 * }
 */
export async function updateUserFavourites(userId, recipeId){
    try {
        const userFavourites = searchUser("id", userId).favourites;
        const index = userFavourites.findIndex(element => element === recipeId);

        if(index < 0){
            userFavourites.unshift(recipeId);
        }else{
            userFavourites.splice(index, 1);
        }

        return await updateUserData(userId, "favourites", userFavourites); 
    } catch (error) {
        throw error;
    }    
}

/**
 * Gestisce toggle note utente per ricetta specifica (add/remove automatico)
 * API pubblica per gestione note utente con logica toggle
 * 
 * @async
 * @param {string} userId - ID utente
 * @param {string|null} recipeId - ID ricetta per aggiunta nota (null per rimozione)
 * @param {string|null} text - Testo nota per aggiunta (null per rimozione)
 * @param {string|null} noteId - ID nota per rimozione (null per aggiunta)
 * @returns {Array} Array note utente aggiornato
 * @see {@link searchUser} Per recupero note utente
 * @see {@link updateUserData} Per aggiornamento note utente
 * @throws {ErrorsManagement.NotFound} Se utente loggato non trovato 
 * @throws {Error} Se errori di storage
 * 
 * @example
 * Aggiunta nota
 * await updateUserNotes("recipe_123", "Testo nota", null);
 * 
 * @example
 * Rimozione nota  
 * await updateUserNotes(null, null, "note_456");
 */
export async function updateUserNotes(userId, recipeId = null, text = null, noteId = null){
    try {
        const userNotes = searchUser("id", userId).notes;
 
        if((text && recipeId) && !noteId){
            userNotes.unshift(new Note(recipeId, text));
        }else{
            if(!(text && recipeId) && noteId){
                const index = userNotes.findIndex(element => element.id === noteId);
                userNotes.splice(index, 1);
            }else{
                const dataFormatError = new Error("Wrong data format");
                console.error(dataFormatError);
                throw dataFormatError;   
            }
        }
        
        return await updateUserData(userId, "notes", userNotes);
    } catch (error) {
        throw error;
    }    
}

// ============================================================================
// API PUBBLICA - AUTENTICAZIONE
// ============================================================================

/**
 * Verifica credenziali utente tramite confronto hash password
 * Core function per autenticazione sicura durante login
 * 
 * @async
 * @param {"id"|"username"|"email"} idField - Parametro di identificazione utente
 * @param {string} idValue - Valore di identificazione
 * @param {string} providedPassword - Password in chiaro fornita
 * @returns {Promise<boolean>} true se credenziali corrette, false altrimenti
 * @see {@link searchUser} Lettura dati utente
 * @see {@link hashString} Per hashing password
 * @throws {ErrorsManagement.NotFound} Se utente non trovato 
 * @throws {Error} errori di lettura da storage o hashing
 * 
 * @example
 * try {
 *   if(await admitUser("user123", "password123")){
 *      console.log("Utente autenticato con successo")
 *      }else{
 *      console.log("Autenticazione fallita")
 *      }
 * } catch (error) {
 *   console.log("Errore");
 * }
 */
export async function admitUser(idField, idValue, providedPassword){
    try {
        const storedHash = searchUser(idField, idValue).password;
        const providedHash = await hashString(providedPassword);
        return storedHash === providedHash;
    } catch (error) {
        throw error;
    }  
}

/**
 * Genera hash SHA-256 di una stringa utilizzando Web Crypto API
 * Funzione core per sicurezza password con algoritmo standard
 * 
 * @async
 * @param {string} originalString - Stringa in chiaro da hashare
 * @returns {Promise<string>} Hash SHA-256 in formato esadecimale (64 caratteri)
 * @throws {Error} Se Web Crypto API non disponibile o errori di processing
 * 
 * @example
 * const hashedPassword = await hashString("password123");
 * console.log(hashedPassword.length); // 64
 */
export async function hashString(originalString) {
    try {
        // Encoding stringa → byte array per Web Crypto API
        const data = new TextEncoder().encode(originalString);
        
        // Calcolo hash SHA-256 (ArrayBuffer)
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        
        // Conversione ArrayBuffer → Array di byte per manipolazione
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        
        // Formattazione esadecimale: byte → hex string (2 cifre, zero-padded)
        const hashPassword = hashArray
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");
    
        return hashPassword;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// ============================================================================
// VALIDAZIONE E CONTROLLO DUPLICATI
// ============================================================================

/**
 * Verifica disponibilità del valore per il campo scelto per evitare duplicati
 * Controllo atomico con lettura fresh dal localStorage
 * 
 * @private
 * @param {"username"|"email"} fieldType - Campo da verificare
 * @param {string} fieldValue - Valore fornito per il campo
 * @returns {false} Se nessun duplicato trovato (NB -> valori duplicati lanciano eccezione)
 * @see {@link getRegisteredUsers} - Per lettura array utenti registrati
 * @throws {ErrorsManagement.Duplicated} Se valore già in uso per il campo selezionato
 * @throws {Error} Se errori di lettura storage
 */
function searchDuplicates(fieldType, fieldValue){
    try {
        const acceptedFields = ["username", "email"];
        if(!acceptedFields.includes(fieldType)){
            const dataTypeError = new Error(`${fieldType} not supported`);
            console.error(error);
            throw dataTypeError;
        }

        const registeredUsers = getRegisteredUsers();

        if(registeredUsers.some(user => user[fieldType] === fieldValue)){ 
            throw new ErrorsManagement.Duplicated("User", fieldType, fieldValue);
        }
        
        return false;
    } catch (error) {
        throw error;
    }
}

/**
 * Valida formato password con regex complessa
 * Controllo sicurezza password: maiuscola, minuscola, numero, lunghezza minima 8 caratteri
 * 
 * @private
 * @param {string} password - Password in chiaro da validare
 * @param {string} passConfirm - Valore di conferma della password
 * @returns {true} Se password validata
 * @throws {ErrorsManagement.InvalidFormat} Se password non rispetta formato richiesto
 * @see {@link ErrorsManagement.InvalidFormat} Per gestione errori formato
 * 
 * @description
 * Valida password con regex che richiede:
 * - Almeno una lettera maiuscola
 * - Almeno una lettera minuscola
 * - Almeno un numero
 * - Lunghezza minima 8 caratteri
 * - Solo caratteri alfanumerici, underscore, dash, dot
 * 
 * @example
 * authPassword("Password123"); // OK
 * authPassword("pass"); // Throws InvalidFormat
 */
export function authPassword(password, passConfirm){
    const regEx = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])[\w.-]{8,}/;

    if(!regEx.test(password) || password != passConfirm){
        throw new ErrorsManagement.InvalidFormat("password", password);
    }

    return true;
};


/**
 * Valida formato email e unicità nel sistema
 * Controllo formato email + verifica duplicati nel database utenti
 * 
 * @private
 * @param {string} email - Email da validare
 * @throws {ErrorsManagement.InvalidFormat} Se email non rispetta formato
 * @throws {ErrorsManagement.Duplicated} Se email già registrata
 * @returns {true} Se email validata
 * @see {@link ErrorsManagement.InvalidFormat} Per errori formato
 * @see {@link ErrorsManagement.Duplicated} Per errori duplicati
 * @see {@link searchDuplicates} Per controllo unicità
 * 
 * @description
 * Valida email con regex che controlla:
 * - Formato generale email
 * - No doppi punti consecutivi
 * - No punto prima di @
 * - Dominio con almeno 2 lettere
 * Poi verifica unicità chiamando searchDuplicates
 * 
 * @example
 * authEmail("user@example.com"); // OK se unica
 * authEmail("invalid-email"); // Throws InvalidFormat
 * authEmail("existing@example.com"); // Throws Duplicated
 */
export function authEmail(email){
    const regEx = /^(?!.*\.\.)(?!.*\.\@)[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

    if(!regEx.test(email)){
        throw new ErrorsManagement.InvalidFormat("email", email);
    }

    try {
        searchDuplicates("email", email);
        return true;
    } catch (error) {
        throw error;
    }
};


/**
 * Valida lunghezza username e unicità nel sistema
 * Controllo lunghezza minima + verifica duplicati nel database utenti
 * 
 * @private
 * @param {string} username - Username da validare
 * @return {true} Se username validato
 * @throws {ErrorsManagement.InvalidFormat} Se username troppo corto
 * @throws {ErrorsManagement.Duplicated} Se username già registrato
 * @see {@link ErrorsManagement.InvalidFormat} Per errori formato
 * @see {@link ErrorsManagement.Duplicated} Per errori duplicati
 * @see {@link searchDuplicates} Per controllo unicità
 * 
 * @description
 * Valida username controllando:
 * - Lunghezza minima 2 caratteri
 * Poi verifica unicità chiamando searchDuplicates
 * 
 * @example
 * authUsername("mario"); // OK se unico
 * authUsername("a"); // Throws InvalidFormat
 * authUsername("existingUser"); // Throws Duplicated
 */
export function authUsername(username){
    if(username.length < 2){
        throw new ErrorsManagement.InvalidFormat("username", username);
    }

    try {
        searchDuplicates("username", username);
        return true;
    } catch (error) {
        throw error;
    }
};


// ============================================================================
// FACTORY E COSTRUZIONE OGGETTI
// ============================================================================

/**
 * Factory function per creazione oggetto User con validation e hashing automatico
 * Funzione interna che coordina validazione, hashing e costruzione
 * 
 * @private
 * @async
 * @param {string} chosenUsername - Username già validato
 * @param {string} chosenEmail - Email già validata
 * @param {string} chosenPassword - Password in chiaro da hashare
 * @returns {Promise<User>} Istanza User completa pronta per storage
 * @see {@link hashString} Per hashing password
 * @throws {Error} Se errori durante hashing password
 */
async function createUserObject(chosenUsername, chosenEmail, chosenPassword){
    try {
        const hashPassword = await hashString(chosenPassword);
        return new User(chosenUsername, chosenEmail, hashPassword);
    } catch (error) {
        throw error;
    }
}

// ============================================================================
// RICERCA E AGGIORNAMENTO
// ============================================================================

/**
 * Engine di ricerca generico per utenti tramite campo specifico
 * Utility interna per query flessibili con deep copy safety
 * 
 * @private
 * @param {"username"|"id"|"email"} searchField - Campo da usare per ricerca - campi univoci
 * @param {string} searchValue - Valore da cercare nel campo
 * @returns {User} Deep copy oggetto utente trovato
 * @see {@link getRegisteredUsers} Per lettura db utenti
 * @throws {ErrorsManagement.NotFound} Se utente non trovato
 * @throws {Error} se field non supportato o errori di storage (read)
 */
export function searchUser(searchField, searchValue){
    try {
        const acceptedFields = ["username", "id", "email"];
        if(!acceptedFields.includes(searchField)){
            const fieldError = new Error(`${searchField} is not an accepted field`);
            console.error(fieldError, fieldError.message, `Error code: ${fieldError.code}`);
            throw fieldError;
        }
        const actualRegUsersArray = getRegisteredUsers();
        const index = actualRegUsersArray.findIndex(user => user[searchField] === searchValue);
     
        if(index < 0){
            throw new ErrorsManagement.NotFound("User", searchField, searchValue);
        }

        return structuredClone(actualRegUsersArray[index]); // Deep copy assicura consistenza dati in caso di implementazione cache
    } catch (error) {
        throw error;
    }
}

/**
 * Engine di aggiornamento generico per campi utente loggato
 * Utility interna per operazioni atomiche update con preprocessing opzionale
 * 
 * @private
 * @async
 * @param {"username"|"email"|"password"|"favourites"|"notes"} field - Nome campo da aggiornare
 * @param {string|Array} newValue - Nuovo valore da assegnare
 * @param {boolean} [needsHashing=false] - Se true, applica hash SHA-256 (necessario per processamento password)
 * @returns {string|Array} Valore del campo aggiornato
 * @see {@link getRegisteredUsers} Per lettura db utenti
 * @see {@link hashString} Per hashing password
 * @see {@link StorageOperations} Per aggiornamento db utenti
 * @throws {ErrorsManagement.NotFound} se utente non trovato
 * @throws {Error} Se errori di storage, hashing o parametri errati
 * 
 */
async function updateUserData(userId, field, newValue, needsHashing = null) {
    try {
        const userFields = ["username", "email", "password", "favourites", "notes"]
        if(!userFields.includes(field)){
            const fieldError = new Error("Field parameter not accepted");
            console.error(fieldError);
            throw fieldError;
        }
        // Atomic update operation
        const registeredUsers = getRegisteredUsers();
        const currentUserId = userId;
        const index = registeredUsers.findIndex(user => user.id === currentUserId);
        
        if(index < 0){
            throw new ErrorsManagement.NotFound("User", "id", userId);
        }

        const processedValue = (needsHashing ? await hashString(newValue) : newValue);
        
        registeredUsers[index][field] = processedValue;
        StorageOperations.set(USERS_DB_KEY, registeredUsers, USERS_STORAGE_OPTS);

        return processedValue;
        
    } catch (error) {
        throw error;
    }
}


// ============================================================================
// ANALISI E DESCRIZIONE DEL FILE
// ============================================================================

/**
 * @description Analisi e descrizione del file users-service.js
 * 
 * **Scopo e ruolo nel progetto:**
 * Modulo di servizio per la gestione completa degli utenti.
 * Fornisce un'interfaccia pubblica per operazioni CRUD su utenti, autenticazione sicura con hashing SHA-256,
 * validazione duplicati e unicità, e persistenza localStorage. Implementa business rules per registrazione,
 * login, aggiornamenti profilo e gestione preferenze/note.
 * 
 * **Architettura e struttura:**
 * - **Configurazione storage:** Costanti per chiave localStorage e opzioni.
 * - **API pubblica - Accesso dati:** Funzione per lettura utenti registrati.
 * - **API pubblica - CRUD utenti:** Funzioni per aggiunta, eliminazione, aggiornamenti profilo.
 * - **API pubblica - Autenticazione:** Funzioni per login e hashing password.
 * - **Validazione:** Funzioni per controllo formato e duplicati.
 * - **Factory:** Funzione per creazione oggetti User.
 * - **Utility:** Funzioni per ricerca e aggiornamento generico.
 * - **Pattern utilizzati:** Validation chain per sicurezza, operazioni atomiche per consistenza.
 * - **Dipendenze:** Importa data-models.js (User, Note), storage.js (StorageOperations), errors.js (Duplicated, NotFound, InvalidFormat).
 * 
 * **Interazioni con altri moduli:**
 * - **Data models (data-models.js):** Istanzia oggetti User/Note per costruzione.
 * - **Storage (storage.js):** Persiste/legge array utenti in localStorage.
 * - **Errors (errors.js):** Lancia errori custom (Duplicated, NotFound, InvalidFormat) per validazioni.
 * - **Session (session-service.js):** Agisce come layer di astrazione superiore, orchestrando operazioni business sugli utenti tramite chiamate a questo modulo (users-service.js) 
 *      per isolamento e astrazione dalla logica di basso livello.
 * - **UI (ui.js, pagine):** Non interagisce direttamente - accedono ai dati unicamente tramite session-service per isolamento e astrazione.
 * 
 * **Flusso di esecuzione documentato:**
 * 
 * 1. **Import e configurazione:**
 *    - Importa classi modelli, storage e errori.
 *    - Definisce costanti chiave storage e opzioni.
 * 
 * 2. **Lettura dati:**
 *    - getRegisteredUsers: Recupera array utenti con deep copy.
 * 
 * 3. **CRUD operations:**
 *    - addNewUser: Validation chain, creazione User, storage atomico.
 *    - deleteUser: Ricerca per ID, rimozione da array, update storage.
 *    - updateUserUsername/updateUserEmail/updateUserPassword: Validation, update atomico.
 *    - updateUserFavourites: Toggle add/remove ricetta da preferiti.
 *    - updateUserNotes: Toggle add/remove note utente.
 * 
 * 4. **Autenticazione:**
 *    - admitUser: Verifica credenziali con confronto hash.
 *    - hashString: Genera hash SHA-256 per password.
 * 
 * 5. **Validazione:**
 *    - searchDuplicates: Controllo unicità username/email.
 *    - authPassword/authEmail/authUsername: Validazione formato + duplicati.
 * 
 * 6. **Factory e utility:**
 *    - createUserObject: Costruzione User con hashing.
 *    - searchUser: Ricerca generica per campo univoco.
 *    - updateUserData: Aggiornamento atomico con preprocessing.
 * 
 * **Note tecniche:**
 * - **Sicurezza:** Hashing SHA-256 per password, validation chain per input.
 * - **Consistenza:** Operazioni atomiche (read-modify-write) per evitare race conditions.
 * - **Immutabilità:** Deep copy per prevenzione mutazioni accidentali.
 * - **Business rules:** Unicità username/email, formato password complesso.
 * - **Gestione errori:** Rilancio errori custom per graceful degradation.
 * - **Performance:** Letture sincrone, scritture asincrone per hashing.
 * - **Scalabilità:** Funzioni modulari facilitano aggiunta campi/validazioni.
 * - **Limitazioni:** Dipendenza localStorage (no server), hashing lato client.
 * 
 * @note Questo modulo gestisce logica utenti: errori qui impattano registrazione e autenticazione.
 * @note Compatibilità: Usa Web Crypto API per hashing, compatibile con browser moderni.
 */