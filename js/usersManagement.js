/**
 * @fileoverview Gestione completa utenti - storage, validazione, autenticazione e operazioni CRUD
 * @description Sistema completo per gestione utenti con localStorage/sessionStorage,
 * validazione duplicati, autenticazione sicura e operazioni atomiche
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
 */

import { UserManagementError, } from "./errorsManagement.js";
import { User, Note } from "./data-models.js";

// ============================================================================
// CONFIGURAZIONE E COSTANTI
// ============================================================================

/** @type {string} Chiave localStorage per array utenti registrati */
const USERS_DB_KEY = "users";

/** @type {string} Chiave sessionStorage per ID utente correntemente loggato */
const LOGGED_USER_KEY = "loggedUser";

// ============================================================================
// VARIABILI DI STATO CACHE
// ============================================================================

/** 
 * @type {Array} Cache locale array utenti - aggiornata ad ogni accesso
 * @description Mantiene copia sincronizzata con localStorage per performance.
 * Attualmente sovrascritta ad ogni getter call - da valutare ottimizzazione futura
 */
let registeredUsers = [];

/** 
 * @type {string} Cache locale ID utente loggato - sincronizzata con sessionStorage
 */
let loggedUserId = "";

// ============================================================================
// LAYER STORAGE - ACCESSO DATI PERSISTENCE
// ============================================================================

/**
 * Recupera array utenti registrati dal localStorage con parsing JSON automatico
 * Layer interno per accesso sicuro ai dati persistenti
 * 
 * @private
 * @returns {Array<User>} Array utenti o array vuoto se storage vuoto
 * @throws {UserManagementError} Se errori di lettura o parsing JSON (tipo "STORAGE")
 */
function retrieveRegisteredUsers() {
    try{
        const JSONFile = localStorage.getItem(USERS_DB_KEY);
        return JSONFile ? JSON.parse(JSONFile) : [];
    }catch(err){
        throw new UserManagementError("STORAGE", "Errore di lettura database utenti", err);
    }
}

/**
 * Recupera ID utente loggato dal sessionStorage
 * Layer interno per accesso sicuro alla sessione corrente
 * 
 * @private
 * @returns {string} ID utente loggato o stringa vuota se non presente
 * @throws {UserManagementError} Se errori di lettura sessionStorage (tipo "STORAGE")
 */
function retreiveLoggedUser(){
    try{
        return sessionStorage.getItem(LOGGED_USER_KEY) || "";
    }catch(err){
        throw new UserManagementError("STORAGE", "Errore di lettura sessione utente", err);
    }
}

/**
 * Salva array utenti nel localStorage con serializzazione JSON automatica
 * Layer interno per persistenza sicura dei dati
 * 
 * @private
 * @param {Array<User>} usersArray - Array utenti da persistere
 * @throws {UserManagementError} Se errori di scrittura o serializzazione (tipo "STORAGE")
 */
function updateUsersDB(usersArray){
    try{
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersArray));
    }catch(error){
        throw new UserManagementError("STORAGE", "Errore di scrittura database utenti", error);
    }
}

// ============================================================================
// API PUBBLICA - ACCESSO DATI CON CACHE
// ============================================================================

/**
 * Recupera array utenti registrati aggiornato con deep copy per safety
 * API pubblica per accesso read-only ai dati utenti
 * 
 * @returns {Array<User>} Deep copy array utenti (safe da modifiche esterne)
 * @throws {UserManagementError} Se errori di lettura, fallback array vuoto
 * 
 * @example
 * // Accesso sicuro lista utenti
 * const users = getRegisteredUsers();
 * users.forEach(user => console.log(user.username)); // Safe iteration
 */
export function getRegisteredUsers() {
    try{
        registeredUsers = retrieveRegisteredUsers();
        return structuredClone(registeredUsers);
    }catch(error){
        console.error("Errore recupero utenti:", error);
        registeredUsers = [];
        return [];
    }
}

/**
 * Recupera ID utente attualmente loggato con gestione errori automatica
 * API pubblica per controllo stato login cross-page
 * 
 * @returns {string} ID utente loggato o stringa vuota se non presente/errori
 * 
 * @example
 * // Check stato login
 * const currentUserId = getLoggedUserId();
 * if (currentUserId) {
 *   console.log("Utente loggato:", currentUserId);
 *   // Mostra UI autenticata
 * } else {
 *   // Redirect a login page
 *   window.location.href = "./login.html";
 * }
 */
export function getLoggedUserId() {
    try {
        loggedUserId = retreiveLoggedUser();
        return loggedUserId;
    } catch (error) {
        console.error("Errore recupero sessione:", error);
        loggedUserId = "";
        return "";
    } 
}

/**
 * Aggiorna ID utente loggato nel sessionStorage per persistenza sessione
 * API pubblica per gestione stato login post-autenticazione
 * 
 * @param {string} userId - ID univoco utente da impostare come loggato
 * @throws {UserManagementError} Se errori di scrittura sessionStorage (tipo "STORAGE")
 * 
 * @example
 * // Post-login: imposta utente come loggato
 * try {
 *   updateLoggedUser("user_1703123456789_1234");
 *   window.location.href = "./pages/landing.html";
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export function updateLoggedUser(userId){
    try{
        sessionStorage.setItem(LOGGED_USER_KEY, userId);
        loggedUserId = userId; // Aggiorna cache locale
    }catch(error){
        throw new UserManagementError("STORAGE", "Errore aggiornamento sessione", error);
    }
}

// ============================================================================
// VALIDAZIONE - CONTROLLO DUPLICATI E DISPONIBILITÀ
// ============================================================================

/**
 * Verifica disponibilità username nel database (no duplicati)
 * Controllo atomico con lettura fresh dal localStorage
 * 
 * @private
 * @param {string} chosenUsername - Username da verificare
 * @returns {boolean} true se disponibile
 * @throws {UserManagementError} Se username già in uso (tipo "VALIDATION")
 * @throws {UserManagementError} Se errori di lettura storage (tipo "STORAGE")
 */
function authUsername(chosenUsername){
    const actualRegUsersArray = retrieveRegisteredUsers();
    
    if(actualRegUsersArray.some(user => user.username === chosenUsername)){
        throw new UserManagementError("VALIDATION", "Username già in uso");
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
 * @throws {UserManagementError} Se email già in uso (tipo "VALIDATION")
 * @throws {UserManagementError} Se errori di lettura storage (tipo "STORAGE")
 */
function authEmail(chosenEmail){
    const actualRegUsersArray = retrieveRegisteredUsers();

    if(actualRegUsersArray.some(user => user.email === chosenEmail)){
        throw new UserManagementError("VALIDATION", "Email già in uso");
    }

    return true;
}

// ============================================================================
// CRITTOGRAFIA - HASHING SICURO PASSWORD
// ============================================================================

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
 * // Hash password per storage sicuro
 * const hashedPassword = await hashString("password123");
 * console.log(hashedPassword); // "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
 * 
 * @example
 * // Uso in verifica credenziali
 * const inputHash = await hashString(userInput);
 * const isValid = inputHash === storedHash;
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
 * @throws {Error} Se errori durante hashing password
 */
async function createUserObject(chosenUsername, chosenEmail, chosenPassword){
    const hashPassword = await hashString(chosenPassword);
    return new User(chosenUsername, chosenEmail, hashPassword);
}

// ============================================================================
// OPERAZIONI CRUD - CREATE, READ, UPDATE, DELETE
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
 * @throws {UserManagementError} Se username/email già in uso (tipo "VALIDATION")
 * @throws {UserManagementError} Se errori di storage (tipo "STORAGE")
 * @throws {Error} Se errori durante hashing
 * 
 * @example
 * // Registrazione completa con gestione errori
 * try {
 *   const newUser = await addNewUser("mario", "mario@email.com", "password123");
 *   console.log("Utente registrato:", newUser.id);
 *   // Redirect to welcome page
 * } catch (error) {
 *   handleUserError(error);
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
        const actualRegUsersArray = retrieveRegisteredUsers();
        actualRegUsersArray.push(newUser);
        updateUsersDB(actualRegUsersArray);
        
        return newUser;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * Rimuove utente attualmente loggato dal database
 * Operazione atomica per self-deletion account
 * 
 * @throws {UserManagementError} Se utente loggato non trovato (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se errori di storage (tipo "STORAGE")
 * 
 * @example
 * // Eliminazione account corrente
 * try {
 *   deleteLoggedUser();
 *   sessionStorage.clear(); // Cleanup sessione
 *   window.location.href = "./index.html";
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export function deleteLoggedUser(){

    try {
        const actualRegUsersArray = retrieveRegisteredUsers();
        const currentUserId = retreiveLoggedUser();
        const index = actualRegUsersArray.findIndex(user => user.id === currentUserId);
        
        if(index < 0){
            throw new UserManagementError("NOT_FOUND", "Utente loggato non trovato per eliminazione");
        }
        
        actualRegUsersArray.splice(index, 1);
        updateUsersDB(actualRegUsersArray);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// ============================================================================
// UTILITY INTERNE - RICERCA E AGGIORNAMENTO
// ============================================================================

/**
 * Engine di ricerca generico per utenti tramite campo specifico
 * Utility interna per query flessibili con deep copy safety
 * 
 * @private
 * @param {string} searchField - Campo da usare per ricerca ("username", "id", "email")
 * @param {string} searchValue - Valore da cercare nel campo
 * @returns {User} Deep copy oggetto utente trovato
 * @throws {UserManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se errori di lettura (tipo "STORAGE")
 */
function searchUser(searchField, searchValue){
    try {
        const actualRegUsersArray = retrieveRegisteredUsers();
        const index = actualRegUsersArray.findIndex(user => user[searchField] === searchValue);
     
        if(index < 0){
            throw new UserManagementError("NOT_FOUND", `Utente non trovato per ${searchField}: ${searchValue}`);
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
 * @throws {UserManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se errori di storage (tipo "STORAGE")
 */
async function updateUserData(field, newValue, needsHashing = null) {
    try {
        // Atomic update operation
        const actualRegUsersArray = retrieveRegisteredUsers();
        const currentUserId = retreiveLoggedUser();
        const index = actualRegUsersArray.findIndex(user => user.id === currentUserId);
        
        if(index < 0){
            throw new UserManagementError("NOT_FOUND", "Utente loggato non trovato per aggiornamento");
        }

        const processedValue = (needsHashing ? await hashString(newValue) : newValue);
        
        actualRegUsersArray[index][field] = processedValue;
        updateUsersDB(actualRegUsersArray);
        
    } catch (error) {
        console.error(error);
        throw error;
    }
}

// ============================================================================
// API PUBBLICA - RICERCA UTENTI
// ============================================================================

/**
 * Ricerca utente per username con deep copy safety
 * API pubblica per lookup utenti durante login
 * 
 * @param {string} username - Username da cercare
 * @returns {User} Deep copy oggetto utente (safe da modifiche)
 * @throws {UserManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * 
 * @example
 * // Lookup utente per login
 * try {
 *   const user = searchUserbyName("mario");
 *   const isAuthenticated = await admitUser(user.id, inputPassword);
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
 * @throws {UserManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * 
 * @example
 * // Recupero profilo utente loggato
 * try {
 *   const currentUserId = getLoggedUserId();
 *   const currentUser = searchUserById(currentUserId);
 *   displayUserProfile(currentUser);
 * } catch (error) {
 *   redirectToLogin();
 * }
 */
export function searchUserById(userId){
    return searchUser("id", userId);
}

// ============================================================================
// API PUBBLICA - AGGIORNAMENTO PROFILO
// ============================================================================

/**
 * Aggiorna username utente loggato con validation duplicati
 * API pubblica per modifica profilo con controlli atomici
 * 
 * @async
 * @param {string} newUsername - Nuovo username desiderato
 * @returns {Promise<boolean>} true se aggiornamento completato
 * @throws {UserManagementError} Se username già in uso (tipo "VALIDATION")
 * @throws {UserManagementError} Se errori di storage (tipo "STORAGE")
 * 
 * @example
 * // Aggiornamento username da form profilo
 * try {
 *   await updateUserUsername("nuovoUsername");
 *   showSuccessMessage("Username aggiornato!");
 * } catch (error) {
 *   showErrorMessage(error.message);
 * }
 */
export async function updateUserUsername(newUsername){
    try {
        authUsername(newUsername); // Validation duplicati
        await updateUserData("username", newUsername);
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

/**
 * Aggiorna email utente loggato con validation duplicati
 * API pubblica per modifica profilo con controlli atomici
 * 
 * @async
 * @param {string} newEmail - Nuova email desiderata
 * @returns {Promise<boolean>} true se aggiornamento completato
 * @throws {UserManagementError} Se email già in uso (tipo "VALIDATION")
 * @throws {UserManagementError} Se errori di storage (tipo "STORAGE")
 * 
 * @example
 * // Aggiornamento email da form profilo
 * try {
 *   await updateUserEmail("nuovaemail@esempio.com");
 *   showSuccessMessage("Email aggiornata!");
 * } catch (error) {
 *   showErrorMessage(error.message);
 * }
 */
export async function updateUserEmail(newEmail){
    try {
        authEmail(newEmail); // Validation duplicati
        await updateUserData("email", newEmail);
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
    
}

/**
 * Aggiorna password utente loggato con hashing automatico
 * API pubblica per cambio password sicuro
 * 
 * @async
 * @param {string} newPassword - Nuova password in chiaro
 * @returns {Promise<boolean>} true se aggiornamento completato
 * @throws {UserManagementError} Se errori di storage (tipo "STORAGE")
 * @throws {Error} Se errori durante hashing
 * 
 * @example
 * // Cambio password da form profilo
 * try {
 *   await updateUserPassword("nuovaPassword123");
 *   showSuccessMessage("Password aggiornata!");
 * } catch (error) {
 *   showErrorMessage("Errore nell'aggiornamento password");
 * }
 */
export async function updateUserPassword(newPassword){
    try {
        await updateUserData("password", newPassword, true); // needsHashing = true
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
 * @param {string} recipeId - ID ricetta da aggiungere/rimuovere dai preferiti
 * @returns {Promise<boolean>} true se operazione completata
 * @throws {UserManagementError} Se utente loggato non trovato (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se errori di storage (tipo "STORAGE")
 * 
 * @example
 * // Toggle preferiti da pagina ricetta
 * try {
 *   await updateUserFavourites("recipe_52772");
 *   const user = searchUserById(getLoggedUserId());
 *   const isFav = user.favourites.includes("recipe_52772");
 *   updateFavouriteButton(isFav ? "remove" : "add");
 * } catch (error) {
 *   showErrorMessage("Errore nell'aggiornamento preferiti");
 * }
 */
export async function updateUserFavourites(recipeId){
    try {
        const userFavouritesArray = searchUserById(retreiveLoggedUser()).favourites;
        const index = userFavouritesArray.findIndex(element => element === recipeId);
        if(index < 0){
            userFavouritesArray.push(recipeId);
        }else{
            userFavouritesArray.splice(index, 1);
        }
        await updateUserData("favourites", userFavouritesArray); 
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
    
}

/**
 * Gestisce note utente con operazione toggle automatica basata sul tipo di input
 * Se riceve oggetto Note → aggiunge alla collezione utente
 * Se riceve stringa ID → cerca e rimuove nota corrispondente
 * 
 * @async
 * @param {import('./data-models.js').Note|string} userNote 
 *   - Note object: Istanza Note completa da aggiungere alla collezione
 *   - String: ID nota esistente da cercare e rimuovere
 * @returns {Promise<boolean>} true se operazione completata con successo
 * @throws {UserManagementError} Se utente loggato non trovato (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se errori di storage durante aggiornamento (tipo "STORAGE")
 * @throws {UserManagementError} Se nota da rimuovere non trovata (tipo "NOT_FOUND")
 * 
 * @example
 * // Aggiunta nuova nota
 * const newNote = new Note("Ottima ricetta!", "recipe_123");
 * await updateUserNotes(newNote);
 * 
 * @example
 * // Rimozione nota esistente
 * await updateUserNotes("note_456"); // Rimuove nota con ID specifico
 * 
 * @example
 * // Uso tipico da UI - toggle basato su presenza
 * const noteExists = currentUser.notes.some(note => note.recipeId === currentRecipeId);
 * if (noteExists) {
 *   const noteToRemove = currentUser.notes.find(note => note.recipeId === currentRecipeId);
 *   await updateUserNotes(noteToRemove.id); // Rimuove per ID
 * } else {
 *   const newNote = new Note(userInput, currentRecipeId);
 *   await updateUserNotes(newNote); // Aggiunge oggetto completo
 * }
 */
export async function updateUserNotes(userNote){
    try {
        const userNotesArray = searchUserById(retreiveLoggedUser()).notes;
        if(userNote instanceof Note){
            userNotesArray.push(userNote);
        }else{
            const index = userNotesArray.findIndex(element => element.id === userNote);
            userNotesArray.splice(index, 1);
        }
        await updateUserData("notes", userNotesArray);
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
    
}

// ============================================================================
// AUTENTICAZIONE - VERIFICA CREDENZIALI
// ============================================================================

/**
 * Verifica credenziali utente tramite confronto hash password
 * Core function per autenticazione sicura durante login
 * 
 * @async
 * @param {string} userId - ID univoco utente da autenticare
 * @param {string} providedPassword - Password in chiaro fornita
 * @returns {Promise<boolean>} true se credenziali corrette, false altrimenti
 * @throws {UserManagementError} Se utente non trovato (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se errori di storage (tipo "STORAGE")
 * @throws {Error} Se errori durante hashing password fornita
 * 
 * @example
 * // Flusso login completo
 * try {
 *   const user = searchUserbyName("mario");
 *   const isAuthenticated = await admitUser(user.id, inputPassword);
 *   
 *   if (isAuthenticated) {
 *     updateLoggedUser(user.id);
 *     window.location.href = "./pages/landing.html";
 *   } else {
 *     showErrorMessage("Password errata");
 *   }
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export async function admitUser(userId, providedPassword){
    try {
        const actualRegUsersArray = retrieveRegisteredUsers();
        const index = actualRegUsersArray.findIndex(user => user.id === userId);
        
        if(index < 0){
            throw new UserManagementError("NOT_FOUND", "Utente non trovato per autenticazione");
        }
        
        const storedHash = actualRegUsersArray[index].password;
        const providedHash = await hashString(providedPassword);
    
        return storedHash === providedHash;
    } catch (error) {
        console.error(error);
        throw error;
    }
    
}