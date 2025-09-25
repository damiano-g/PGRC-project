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
import { StorageManagement } from "../storageManagement.js";

// ============================================================================
// CONFIGURAZIONE E COSTANTI
// ============================================================================

/**
 * Chiave localStorage per array utenti registrati
 * @constant {string}
 */
const USERS_DB_KEY = "users";



// ============================================================================
// VARIABILI DI STATO CACHE
// ============================================================================

/**
 * Cache locale array utenti - aggiornata ad ogni accesso
 * Mantiene copia sincronizzata con localStorage per performance
 * @type {Array<User>}
 */
let registeredUsers = [];


// ============================================================================
// API PUBBLICA - ACCESSO DATI E GESTIONE SESSIONE
// ============================================================================

/**
 * Recupera array utenti registrati aggiornato con deep copy per safety
 * API pubblica per accesso read-only ai dati utenti
 * 
 * @returns {Array<User>} Deep copy array utenti (safe da modifiche esterne)
 * @throws {UsersManagementError} Se errori di lettura, fallback array vuoto
 * 
 * @example
 * const users = getRegisteredUsers();
 * users.forEach(user => console.log(user.username));
 */
export function getRegisteredUsers() {
    try{
        registeredUsers = StorageManagement.get(USERS_DB_KEY, {storageLocation: "local", dataType: "array"});
        return structuredClone(registeredUsers);
    }catch(error){
        console.error("Errore recupero utenti:", error);
        registeredUsers = [];
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
    return searchUser("username", username);
}

/**
 * Ricerca utente per ID con deep copy safety
 * API pubblica per lookup by ID (es. da sessione)
 * 
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
    return searchUser("id", userId);
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
 * @throws {UsersManagementError} Se username/email già in uso (tipo "VALIDATION")
 * @throws {UsersManagementError} Se errori di storage (tipo "STORAGE")
 * @throws {Error} Se errori durante hashing
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
        authUsername(chosenUsername);
        authEmail(chosenEmail);
        
        // User creation con hashing automatico
        const newUser = await createUserObject(chosenUsername, chosenEmail, chosenPassword);
        
        // Storage atomico: read → modify → write
        const actualRegUsersArray = StorageManagement.get(USERS_DB_KEY, {storageLocation: "local", dataType: "array"});
        actualRegUsersArray.push(newUser);
        StorageManagement.set(USERS_DB_KEY, actualRegUsersArray, {storageLocation: "local", dataType: "array"});
        
        return newUser;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * Rimuove utente dal database
 * Operazione atomica per eliminazione account
 * 
 * @param {string} userId - ID utente da eliminare
 * @throws {UsersManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * @throws {UsersManagementError} Se errori di storage (tipo "STORAGE")
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
            throw new UsersManagementError("NOT_FOUND", "Utente non trovato per eliminazione");
        }
        
        actualRegUsersArray.splice(index, 1);
        StorageManagement.set(USERS_DB_KEY, actualRegUsersArray, {storageLocation: "local", dataType: "array"});
    } catch (error) {
        console.error(error);
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
 * @throws {UsersManagementError} Se username già in uso (tipo "VALIDATION")
 * @throws {UsersManagementError} Se errori di storage (tipo "STORAGE")
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
        return true;
    } catch (error) {
        console.error(error);
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
 * @throws {UsersManagementError} Se email già in uso (tipo "VALIDATION")
 * @throws {UsersManagementError} Se errori di storage (tipo "STORAGE")
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
        return true;
    } catch (error) {
        console.error(error);
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
 * @throws {UsersManagementError} Se errori di storage (tipo "STORAGE")
 * @throws {Error} Se errori durante hashing
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
        return true;
    } catch (error) {
        console.error(error);
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
 * @returns {Promise<boolean>} true se operazione completata
 * @throws {UsersManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * @throws {UsersManagementError} Se errori di storage (tipo "STORAGE")
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
        const userFavouritesArray = searchUserById(userId).favourites;
        const index = userFavouritesArray.findIndex(element => element === recipeId);

        if(index < 0){
            userFavouritesArray.push(recipeId);
        }else{
            userFavouritesArray.splice(index, 1);
        }
        await updateUserData(userId, "favourites", userFavouritesArray); 
        return true;
    } catch (error) {
        console.error(error);
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
 * @param {string} userId - ID univoco utente da autenticare
 * @param {string} providedPassword - Password in chiaro fornita
 * @returns {Promise<boolean>} true se credenziali corrette, false altrimenti
 * @throws {UsersManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * @throws {UsersManagementError} Se errori di storage (tipo "STORAGE")
 * @throws {Error} Se errori durante hashing password fornita
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
        const actualRegUsersArray = StorageManagement.get(USERS_DB_KEY, {storageLocation: "local", dataType: "array"});
        const index = actualRegUsersArray.findIndex(user => user.id === userId);
        
        if(index < 0){
            throw new UsersManagementError("NOT_FOUND", "Utente non trovato per autenticazione");
        }
        
        const storedHash = actualRegUsersArray[index].password;
        const providedHash = await hashString(providedPassword);
    
        return storedHash === providedHash;
    } catch (error) {
        console.error(error);
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
}

// ============================================================================
// FUNZIONI PRIVATE - VALIDAZIONE E CONTROLLO DUPLICATI
// ============================================================================

/**
 * Verifica disponibilità username nel database (no duplicati)
 * Controllo atomico con lettura fresh dal localStorage
 * 
 * @private
 * @param {string} chosenUsername - Username da verificare
 * @returns {boolean} true se disponibile
 * @throws {UsersManagementError} Se username già in uso (tipo "VALIDATION")
 * @throws {UsersManagementError} Se errori di lettura storage (tipo "STORAGE")
 */
function authUsername(chosenUsername){
    const actualRegUsersArray = StorageManagement.get(USERS_DB_KEY, {storageLocation: "local", dataType: "array"});
    if(actualRegUsersArray.some(user => user.username === chosenUsername)){
        throw new UsersManagementError("VALIDATION", "Username già in uso");
    }
    
    return true;
}

/**
 * Verifica disponibilità email nel database (no duplicati)
 * Controllo atomico con lettura fresh dal localStorage
 * 
 * @private
 * @param {string} chosenEmail - Email da verificare
 * @returns {boolean} true se disponibile
 * @throws {UsersManagementError} Se email già in uso (tipo "VALIDATION")
 * @throws {UsersManagementError} Se errori di lettura storage (tipo "STORAGE")
 */
function authEmail(chosenEmail){
    const actualRegUsersArray = StorageManagement.get(USERS_DB_KEY, {storageLocation: "local", dataType: "array"});
    if(actualRegUsersArray.some(user => user.email === chosenEmail)){
        throw new UsersManagementError("VALIDATION", "Email già in uso");
    }

    return true;
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
 * @throws {Error} Se errori durante hashing password
 */
async function createUserObject(chosenUsername, chosenEmail, chosenPassword){
    const hashPassword = await hashString(chosenPassword);
    return new User(chosenUsername, chosenEmail, hashPassword);
}

// ============================================================================
// FUNZIONI PRIVATE - UTILITY INTERNE DI RICERCA E AGGIORNAMENTO
// ============================================================================

/**
 * Engine di ricerca generico per utenti tramite campo specifico
 * Utility interna per query flessibili con deep copy safety
 * 
 * @private
 * @param {string} searchField - Campo da usare per ricerca ("username", "id", "email")
 * @param {string} searchValue - Valore da cercare nel campo
 * @returns {User} Deep copy oggetto utente trovato
 * @throws {UsersManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * @throws {UsersManagementError} Se errori di lettura (tipo "STORAGE")
 */
function searchUser(searchField, searchValue){
    try {
        const actualRegUsersArray = getRegisteredUsers();
        const index = actualRegUsersArray.findIndex(user => user[searchField] === searchValue);
     
        if(index < 0){
            throw new UsersManagementError("NOT_FOUND", `Utente non trovato per ${searchField}: ${searchValue}`);
        }

        return structuredClone(actualRegUsersArray[index]);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * Engine di aggiornamento generico per campi utente loggato
 * Utility interna per operazioni atomiche update con preprocessing opzionale
 * 
 * @private
 * @async
 * @param {string} field - Nome campo da aggiornare
 * @param {string|Array} newValue - Nuovo valore da assegnare
 * @param {boolean} [needsHashing=false] - Se true, applica hash SHA-256
 * @throws {UsersManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * @throws {UsersManagementError} Se errori di storage (tipo "STORAGE")
 */
async function updateUserData(userId, field, newValue, needsHashing = null) {
    try {
        // Atomic update operation
        const actualRegUsersArray = getRegisteredUsers();
        const currentUserId = userId;
        const index = actualRegUsersArray.findIndex(user => user.id === currentUserId);
        
        if(index < 0){
            throw new UsersManagementError("NOT_FOUND", "Utente loggato non trovato per aggiornamento");
        }

        const processedValue = (needsHashing ? await hashString(newValue) : newValue);
        
        actualRegUsersArray[index][field] = processedValue;
        StorageManagement.set(USERS_DB_KEY, actualRegUsersArray, {storageLocation: "local", dataType: "array"});
        
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * Engine interno per gestione note utente con operazioni CRUD
 * Utility privata per aggiunta/rimozione note con validazione parametri
 * 
 * @private
 * @async
 * @param {string|null} recipeId - ID ricetta per aggiunta nota (null per rimozione)
 * @param {string|null} text - Testo nota per aggiunta (null per rimozione)
 * @param {string|null} noteId - ID nota per rimozione (null per aggiunta)
 * @returns {Promise<boolean>} true se operazione completata
 * @throws {UsersManagementError} Se utente loggato non trovato (tipo "NOT_FOUND")
 * @throws {UsersManagementError} Se errori di storage (tipo "STORAGE")
 * @throws {Error} Se formato parametri non valido
 * 
 * @example
 * // Uso interno per aggiunta nota
 * await updateUserNotes("recipe_123", "Testo nota", null);
 * 
 * @example  
 * // Uso interno per rimozione nota
 * await updateUserNotes(null, null, "note_456");
 */
export async function updateUserNotes(userId, recipeId = null, text = null, noteId = null){
    try {
        const userNotesArray = searchUserById(userId).notes;
 
        if((text && recipeId) && !noteId){
            userNotesArray.push(new Note(recipeId, text));
        }else{
            if(!(text && recipeId) && noteId){
                const index = userNotesArray.findIndex(element => element.id === noteId);
                userNotesArray.splice(index, 1);
            }else{
                throw new Error("Wrong data format");
                
            }
        }
        
        await updateUserData(userId, "notes", userNotesArray);
        return true;
    } catch (error) {
        console.error(error);
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
 * FUTURI MIGLIORAMENTI:
 * - Caching intelligente: Map per lookup O(1) utenti
 * - Session Management: Expiry automatico con refresh token
 * - Password Recovery: Email reset con token temporaneo
 * - Rate Limiting: Blocco tentativi falliti ripetuti
 * - Concurrency Control: Optimistic locking per multi-tab
 * - Email Verification: Conferma registrazione via email
 * - Password Strength: Validazione complessità client-side
 * - Audit Logging: Tracciamento operazioni sensibili
 */