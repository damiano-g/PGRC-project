/**
 * @fileoverview Gestione completa utenti - storage, validazione, autenticazione e operazioni CRUD
 * @description Sistema completo per gestione utenti con localStorage/sessionStorage,
 * validazione duplicati, autenticazione sicura e operazioni atomiche
 * @requires errorsManagement.js - Classe UsersManagementError per errori tipizzati
 * @requires data-models.js - Classi User e Note per costruzione oggetti
 * @requires storageManagement.js - Modulo StorageManagement per persistenza dati
 */

import { UsersManagementError, } from "../errorsManagement.js";
import { User, Note } from "../data-models.js";
import { StorageOperations } from "../storageManagement.js";

// ============================================================================
// CONFIGURAZIONE E COSTANTI
// ============================================================================

/**
 * Chiave localStorage per array utenti registrati
 * @constant {string}
 */
const USERS_DB_KEY = "users";

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
 * @throws {Error} Se errori di lettura - from {@link StorageOperations}
 * 
 * @example
 * const users = getRegisteredUsers();
 * users.forEach(user => console.log(user.username));
 */
export function getRegisteredUsers() {
    try{
        const registeredUsers = StorageOperations.get(USERS_DB_KEY, USERS_STORAGE_OPTS);
        return structuredClone(registeredUsers);
    }catch(error){
        throw error;
    }
};

// ============================================================================
// API PUBBLICA - RICERCA UTENTI
// ============================================================================

/**
 * Ricerca utente per username con deep copy safety
 * API pubblica per lookup utenti durante login
 * 
 * @deprecated Wrapper superfluo
 * @param {string} username - Username da cercare
 * @returns {User} Deep copy oggetto utente (safe da modifiche)
 * @throws {UsersManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * 
 * @example
 * try {
 *   const user = searchUserbyName("mario");
 * } catch (error) {
 *   console.log("Utente non trovato");
 * }
 */
export function searchUserbyName(username) {
    try {
        return searchUser("username", username);
    } catch (error) {
        throw error;
    }
}

/**
 * Ricerca utente per ID con deep copy safety
 * API pubblica per lookup by ID (es. da sessione)
 * 
 * @deprecated wrapper superfluo
 * @param {string} userId - ID univoco da cercare
 * @returns {User} Deep copy oggetto utente (safe da modifiche)
 * @throws {UsersManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * 
 * @example
 * try {
 *   const user = searchUserById("user123");
 * } catch (error) {
 *   console.log("Utente non trovato");
 * }
 */
export function searchUserById(userId){
    try {
        return searchUser("id", userId);
    } catch (error) {
        throw error;
    }
}

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
 * @see {@link authField} - Per gestione valori duplicati
 * @see {@link getRegisteredUsers} - Lettura database utenti (deep copy)
 * @see {@link StorageOperations.set} - Aggiornamento database utenti
 * @see {@link createUserObject} - Creazione nuovo oggetto utente
 * @throws {Error} Se username/email già in uso - from {@link authField} 
 * @throws {Error} Se errori di storage - from {@link StorageOperations} or {@link getRegisteredUsers}
 * @throws {Error} Se errori durante hashing - from {@link createUserObject}
 * 
 * @example
 * try {
 *   const newUser = await addNewUser("mario", "mario@email.com", "password123");
 * } catch (error) {
 *   console.log("Errore registrazione");
 * }
 */
export async function addNewUser(chosenUsername, chosenEmail, chosenPassword){

    try {
        // Validation chain: username + email duplicati
        authField("username", chosenUsername);
        authField("email", chosenEmail);
        
        // User creation con hashing automatico
        const newUser = await createUserObject(chosenUsername, chosenEmail, chosenPassword);
        
        // Storage atomico: read → modify → write
        const actualRegUsersArray = StorageOperations.get(USERS_DB_KEY, USERS_STORAGE_OPTS);
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
 * @throws {new Error} Se utente non trovato
 * @throws {Error} Se errori di storage - from {@link getRegisteredUsers} o {@link StorageOperations}
 * @throws {new Error} Se utente non trovato
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
        const currentUserId = userId;
        const index = actualRegUsersArray.findIndex(user => user.id === currentUserId);
        
        if(index < 0){
            const userError = new Error("User non found");
            console.error(userError);
            throw userError;
        }
        
        actualRegUsersArray.splice(index, 1);
        StorageOperations.set(USERS_DB_KEY, actualRegUsersArray, USERS_STORAGE_OPTS);
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
 * @returns {Promise<boolean>} true se aggiornamento completato
 * @throws {Error} Se username già in uso from {@link authUsername}
 * @throws {Error} Se errori di storage {@link StorageOperations}
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
        await updateUserData(userId, "username", newUsername);
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
 * @returns {Promise<boolean>} true se aggiornamento completato
 * @throws {Error} Se username già in uso from {@link authEmail}
 * @throws {Error} Se errori di storage {@link StorageOperations}
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
        await updateUserData(userId, "email", newEmail);
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
 * @returns {Promise<boolean>} true se aggiornamento completato
 * @throws {Error} Se errori durante hashing o errori di storage - from {@link updateUserData}
 * 
 * @example
 * try {
 *   await updateUserPassword("user123", "nuovaPassword123");
 * } catch (error) {
 *   console.log("Errore aggiornamento password");
 * }
 */
export async function updateUserPassword(userId, newPassword){
    try {
        await updateUserData(userId, "password", newPassword, true); // needsHashing = true
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
 * @throws {Error} Se utente non trovato o se errori di storage (r/w) - from {@link searchUser} o {@link updateUserData}
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
            userFavourites.push(recipeId);
        }else{
            userFavourites.splice(index, 1);
        }

        await updateUserData(userId, "favourites", userFavourites); 
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
 * NB - A differenza delle altre funzioni del modulo ritorna valori booleani (invece di logica successo/errori)
 *      per consentire una gestione di ammissione esplicita upstream
 * 
 * @async
 * @param {string} userId - ID univoco utente da autenticare
 * @param {string} providedPassword - Password in chiaro fornita
 * @returns {Promise<boolean>} true se credenziali corrette, false altrimenti
 * @throws {Error} Se utente non trovato o errori di lettura da storage - from {@link searchUser}
 * @throws {Error} Se errori durante hashing password fornita - from {@link hashString}
 * 
 * @example
 * try {
 *   const isAuthenticated = await admitUser("user123", "password123");
 * } catch (error) {
 *   console.log("Errore autenticazione");
 * }
 */
export async function admitUser(userId, providedPassword){
    try {
        const storedHash = searchUser("id", userId).password;
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
// FUNZIONI PRIVATE - VALIDAZIONE E CONTROLLO DUPLICATI
// ============================================================================

/**
 * Verifica disponibilità username nel database (no duplicati)
 * Controllo atomico con lettura fresh dal localStorage
 * 
 * @deprecated Logica gestibile tramite funzione generica {@link authField}
 * @private
 * @param {string} chosenUsername - Username da verificare
 * @returns {boolean} true se disponibile
 * @throws {UsersManagementError} Se username già in uso (tipo "VALIDATION")
 * @throws {UsersManagementError} Se errori di lettura storage (tipo "STORAGE")
 */
function authUsername(chosenUsername){
    const actualRegUsersArray = StorageOperations.get(USERS_DB_KEY, USERS_STORAGE_OPTS);
    if(actualRegUsersArray.some(user => user.username === chosenUsername)){
        throw new UsersManagementError("VALIDATION", "Username già in uso");
    }
    return true;
}

/**
 * Verifica disponibilità email nel database (no duplicati)
 * Controllo atomico con lettura fresh dal localStorage
 * 
 * @deprecated Logica gestibile tramite funzione generica {@link authField}
 * @private
 * @param {string} chosenEmail - Email da verificare
 * @returns {boolean} true se disponibile
 * @throws {UsersManagementError} Se email già in uso (tipo "VALIDATION")
 * @throws {UsersManagementError} Se errori di lettura storage (tipo "STORAGE")
 */
function authEmail(chosenEmail){
    const actualRegUsersArray = StorageOperations.get(USERS_DB_KEY, USERS_STORAGE_OPTS);
    if(actualRegUsersArray.some(user => user.email === chosenEmail)){
        throw new UsersManagementError("VALIDATION", "Email già in uso");
    }

    return true;
}

/**
 * Verifica disponibilità del valore per il campo scelto per evitare duplicati
 * Controllo atomico con lettura fresh dal localStorage
 * 
 * @private
 * @param {"username"|"email"} fieldType - Campo da verificare
 * @param {string} fieldValue - Valore fornito per il campo
 * @see {@link getRegisteredUsers} - Per lettura array utenti registrati
 * @throws {new Error} Se valore già in uso per il campo selezionato
 * @throws {Error} Se errori di lettura storage - from {@link getRegisteredUsers}
 */
function authField(fieldType, fieldValue){
    try {
        const acceptedFields = ["username", "email"];
        if(!acceptedFields.includes(fieldType)){
            const dataTypeError = new Error(`${fieldType} not supported`);
            console.error(error);
            throw dataTypeError;
        }

        const registeredUsers = getRegisteredUsers();

        if(registeredUsers.some(user => user[fieldType] === fieldValue)){
            const duplicatedValue = new Error(`${fieldType} ${fieldValue} already in use`);
            console.error(duplicatedValue);
            throw duplicatedValue;
        }    
    } catch (error) {
        throw error;
    }
}

// ============================================================================
// FUNZIONI PRIVATE - FACTORY E COSTRUZIONE OGGETTI
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
 * @throws {Error} Se errori durante hashing password - from {@link hashString}
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
// FUNZIONI PRIVATE - UTILITY INTERNE DI RICERCA E AGGIORNAMENTO
// ============================================================================

/**
 * Engine di ricerca generico per utenti tramite campo specifico
 * Utility interna per query flessibili con deep copy safety
 * 
 * @private
 * @param {"username"|"id"|"email"} searchField - Campo da usare per ricerca - campi univoci
 * @param {string} searchValue - Valore da cercare nel campo
 * @returns {User} Deep copy oggetto utente trovato
 * @throws {new Error} Se utente non trovato o se field non supportato
 * @throws {Error} Se errori di lettura - from {@link getRegisteredUsers}
 */
function searchUser(searchField, searchValue){
    try {
        const acceptedFields = ["username", "id", "email"];
        if(!acceptedFields.includes(searchField)){
            const fieldError = new Error(`${searchField} is not an accepted field`);
            console.error(fieldError);
            throw fieldError;
        }
        const actualRegUsersArray = getRegisteredUsers();
        const index = actualRegUsersArray.findIndex(user => user[searchField] === searchValue);
     
        if(index < 0){
            const userError = new Error(`User not found for ${searchField}: ${searchValue}`);
            console.error(userError);
            throw userError;
        }

        return structuredClone(actualRegUsersArray[index]);
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
 * @throws {new Error} Se parametro field errato o utente non trovato
 * @throws {Error} Se errori di storage from {@link getRegisteredUsers} o {@link StorageOperations}
 * @throws {Error} Se errori di hashing - from {@link hashString}
 * 
 */
export async function updateUserData(userId, field, newValue, needsHashing = null) {
    try {
        const userFields = ["username", "email", "password", "favourites", "notes"]
        if(!userFields.includes(field)){
            const fieldError = new Error("Field parameter not accepted");
            console.error(fieldError);
            throw fieldError;
        }
        // Atomic update operation
        const actualRegUsersArray = getRegisteredUsers();
        const currentUserId = userId;
        const index = actualRegUsersArray.findIndex(user => user.id === currentUserId);
        
        if(index < 0){
            const userError = new Error("User id not found");
            console.error(userError);
            throw userError;
        }

        const processedValue = (needsHashing ? await hashString(newValue) : newValue);
        
        actualRegUsersArray[index][field] = processedValue;
        StorageOperations.set(USERS_DB_KEY, actualRegUsersArray, USERS_STORAGE_OPTS);
        
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
 * @see {@link searchUser} Per recupero note utente
 * @see {@link updateUserData} Per aggiornamento note utente
 * @throws {Error} Se utente loggato non trovato - from {@link searchUser} 
 * @throws {Error} Se errori di storage - from {@link searchUser} or {@link updateUserData}
 * @throws {Error} Se formato parametri non valido
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
            userNotes.push(new Note(recipeId, text));
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
        
        await updateUserData(userId, "notes", userNotes);
    } catch (error) {
        throw error;
    }    
}

// ============================================================================
// NOTE ARCHITETTURALI E LIMITI
// ============================================================================

/**
 * ARCHITETTURA E PATTERN:
 * 
 * PATTERN IMPLEMENTATI:
 * - Repository Pattern: getRegisteredUsers() come data access layer con astrazione storage
 * - Factory Pattern: createUserObject() per costruzione oggetti User standardizzata
 * - Command Pattern: updateUserData() polivalente per aggiornamenti campi diversi
 * - Immutability: structuredClone() previene mutazioni accidentali dati
 * - Atomic Operations: read-modify-write per consistency storage
 * 
 * BUSINESS RULES:
 * - Unicità: Username e email unici nel sistema
 * - Sicurezza: Password hashate SHA-256, no storage in chiaro
 * - Toggle Favourites: Add/remove automatico basato su presenza ricetta
 * - CRUD Notes: Operazioni separate per aggiunta/rimozione note
 * - Validation Chain: Controlli duplicati prima creazione/aggiornamento
 * 
 * DIPENDENZE:
 * - errorsManagement.js: UsersManagementError per errori tipizzati business
 * - data-models.js: Classi User/Note per validazione e costruzione oggetti
 * - storageManagement.js: StorageManagement per persistenza localStorage
 * 
 * PERFORMANCE:
 * - Cache Locale: registeredUsers aggiornata ad ogni accesso (trade-off freshness vs performance)
 * - Linear Search: findIndex() accettabile per MVP, ottimizzabile con Map per scale
 * - Atomic Updates: Lettura completa array per ogni modifica (consistency over performance)
 * - Hashing Overhead: SHA-256 computazionalmente costoso ma sicuro
 * 
 * LIMITAZIONI:
 * - No Session Expiry: Utenti persistono indefinitamente
 * - No Concurrency: Operazioni sequenziali, no locking per multi-tab
 * - No Password Recovery: Sistema solo verifica, no reset mechanism
 * - No Email Validation: Controllo formato lasciato a upstream
 * - No Rate Limiting: Nessun limite tentativi login/fail
 * 
 * SICUREZZA:
 * - Password Hashing: SHA-256 con Web Crypto API (standard sicuro)
 * - No Plain Text: Password mai memorizzate in chiaro
 * - Input Sanitization: Validation duplicati previene injection indiretta
 * - Error Handling: Messaggi errori non rivelano info sensibili
 * 
 */