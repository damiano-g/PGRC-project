// Gestione completa degli utenti: storage, validazione, autenticazione e operazioni CRUD

import { UserManagementError, } from "./errorsManagement.js";

// ============================================================================
// CONFIGURAZIONE E COSTANTI
// ============================================================================

// Chiavi per dati web storage
const usersDBKey = "users";
const loggedUserKey = "loggedUser";

// ============================================================================
// VARIABILI DI STATO
// ============================================================================

// Registro utenti registrati aggiornato ad ogni caricamento di pagina -> vedi window.onload
// L'aggiornamento costante permette un'eventuale ricerca in tempo reale di username e/o mail già utilizzate
// NOTA: Attualmente la variabile è sovrascritta ad ogni chiamata del getter, quindi non mantiene vera cache
// Da valutare l'implementazione - potrebbe essere superfluo e potrebbe essere rimossa per semplificare il codice
let registeredUsers = [];

let loggedUserId = "";

// ============================================================================
// FUNZIONI GETTER PER ACCESSO AI DATI
// ============================================================================

/**
 * Recupera l'array degli utenti registrati aggiornato dal localStorage
 * Restituisce una copia dell'array originale impedendo modifiche esterne
 * 
 * @returns {Array} Array degli utenti registrati (deep copy)
 * @throws {UserManagementError} In caso di errori di lettura dal localStorage
 */
export function getRegisteredUsers() {
    try{
        registeredUsers = retrieveRegisteredUsers() || [];
        return structuredClone(registeredUsers);
    }catch(error){
        console.error("Error", error);
        registeredUsers = [];
        return [];
    }
}

/**
 * Recupera l'ID dell'utente attualmente loggato dal sessionStorage
 * Gestisce automaticamente gli errori di lettura restituendo una stringa vuota come fallback
 * 
 * @returns {string} ID dell'utente loggato o stringa vuota se non presente o in caso di errore
 * @example
 * // Recupera l'ID dell'utente corrente
 * const currentUserId = getLoggedUserId();
 * if (currentUserId) {
 *   console.log("Utente loggato:", currentUserId);
 * } else {
 *   console.log("Nessun utente loggato");
 * }
 */
export function getLoggedUserId() {
    try {
        loggedUserId = retreiveLoggedUser() || "";
        return loggedUserId;
    } catch (error) {
        console.error("Error", error);
        loggedUserId = "";
        return loggedUserId;
    } 
}

// ============================================================================
// FUNZIONI DI STORAGE INTERNO
// ============================================================================

// Recupera e restituisce l'array di utenti dal localStorage (se non esiste, restituisce array vuoto)
function retrieveRegisteredUsers() {
    try{
        const JSONFile = localStorage.getItem(usersDBKey);
        const array = (JSONFile ? JSON.parse(JSONFile) : []);
        return array;
    }catch(err){
        throw new UserManagementError("STORAGE", "Errore di lettura nel database", err);
    }
}

// Recupera l'ID dell'utente loggato dal sessionStorage con gestione errori
function retreiveLoggedUser(){
    try{
        const userId = sessionStorage.getItem(loggedUserKey) || "";
        return userId;
    }catch(err){
        throw new UserManagementError("STORAGE", "Errore di lettura nel database", err);
    }
}


// Salva l'array utenti nel localStorage con gestione errori
function updateUsersDB(usersArray){
    
    try{
        localStorage.setItem(usersDBKey, JSON.stringify(usersArray));
    }catch(error){
        throw new UserManagementError("STORAGE", "Errore di scrittura nel database", error) ;
    }
}

// Aggiorna l'ID dell'utente loggato nel sessionStorage
export function updateLoggedUser(userId){

    try{
        sessionStorage.setItem(loggedUserKey, userId);
    }catch(error){
        throw new UserManagementError("STORAGE", "Errore di scrittura nel database", error)
    }
}

// ============================================================================
// OPERAZIONI CRUD ATOMICHE
// ============================================================================

/**
 * Aggiunge un nuovo utente all'array e aggiorna il localStorage
 * Implementazione atomica: legge dati freschi, modifica e salva in un'unica operazione
 * 
 * @param {Object} newUserObject - Oggetto utente completo da aggiungere al database
 * @param {string} newUserObject.id - ID univoco dell'utente
 * @param {string} newUserObject.username - Nome utente
 * @param {string} newUserObject.email - Email dell'utente
 * @param {string} newUserObject.password - Password hashata dell'utente
 * @param {Array} newUserObject.favorites - Array dei preferiti dell'utente
 * @param {string} newUserObject.creationDate - Data di creazione in formato ISO
 * 
 * @throws {UserManagementError} In caso di errori di lettura o scrittura nel localStorage
 * 
 * @example
 * // Aggiunge un nuovo utente al database
 * try {
 *   const newUser = await createUserObject("mario", "mario@email.com", "password123");
 *   addNewUser(newUser);
 *   console.log("Utente aggiunto con successo");
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export function addNewUser(newUserObject){
    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    actualRegUsersArray.push(newUserObject);
    updateUsersDB(actualRegUsersArray);
}

/**
 * Rimuove un utente dall'array tramite ID e aggiorna il localStorage
 * Implementazione atomica: legge dati freschi, modifica e salva in un'unica operazione
 * 
 * @param {string} userId - ID univoco dell'utente da rimuovere dal database
 * 
 * @throws {UserManagementError} In caso di errori di lettura o scrittura nel localStorage
 * 
 * @example
 * // Rimuove un utente dal database
 * try {
 *   deleteUser("user_1703123456789_1234");
 *   console.log("Utente rimosso con successo");
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export function deleteUser(userId){
    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.id === userId);
    actualRegUsersArray.splice(index, 1);
    updateUsersDB(actualRegUsersArray);
}

// Aggiorna l'username dell'utente attualmente loggato
export function updateUserUsername(newUsername){

    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.id === getLoggedUserId());
    
    if(index > -1){
        actualRegUsersArray[index].username = newUsername;
    }

    updateUsersDB(actualRegUsersArray);
}

// Aggiorna l'email dell'utente attualmente loggato 
export function updateUserEmail(newUserEmail){

    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.id === getLoggedUserId());
    
    if(index > -1){
        actualRegUsersArray[index].email = newUserEmail;
    }

    updateUsersDB(actualRegUsersArray);
}

// Aggiorna la password dell'utente attualmente loggato con hashing
export async function updateUserPassword(newUserPassword){

    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.id === getLoggedUserId());
    
    if(index > -1){
        actualRegUsersArray[index].password = await hashString(newUserPassword);
    }

    updateUsersDB(actualRegUsersArray);
}


// ============================================================================
// FUNZIONI DI VALIDAZIONE
// ============================================================================

// Verifica la disponibilità di username ed email nel database utenti
// Restituisce "username" o "email" se duplicati, null se disponibili
export function authUserEntries(chosenUsername, chosenEmail){

    if(!authUsername(chosenUsername)){
        return "username";
    }
    if(!authEmail(chosenEmail)){
        return "email";
    }
    return null;
}

// Verifica se un username è disponibile nel database
// Restituisce true se disponibile, false se già in uso
export function authUsername(chosenUsername){

    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    
    if(actualRegUsersArray.some(item => (item.username === chosenUsername))){
        return false;
    }
    
    return true;
}

// Verifica se un'email è disponibile nel database  
// Restituisce true se disponibile, false se già in uso
export function authEmail(chosenEmail){

    const actualRegUsersArray = retrieveRegisteredUsers() || []; 

    if(actualRegUsersArray.some(item => (item.email === chosenEmail))){
        return false;
    }

    return true;
}

// ============================================================================
// FUNZIONI DI CREAZIONE E GESTIONE UTENTI
// ============================================================================

// Genera un nuovo oggetto utente completo con password hashata e ID univoco
export async function createUserObject(chosenUsername, chosenEmail, chosenPassword){
    const hashPassword = await hashString(chosenPassword);
    const timestamp = Date.now();
    const rnd = String(Math.floor(Math.random()*10000)).padStart(4, "0"); 
    const userObject = {
        id: `user_${timestamp}_${rnd}`,
        username: chosenUsername,
        email: chosenEmail,
        password: hashPassword,
        favorites: [],
        creationDate: new Date().toISOString(),
    }
    return userObject;
}

/**
 * Ricerca un utente nel database tramite username e restituisce l'oggetto utente completo
 * Restituisce una deep copy per impedire modifiche esterne ai dati originali
 * 
 * @param {string} providedUsername - Username dell'utente da cercare
 * @returns {Object|null} Oggetto utente completo (deep copy) o null se non trovato
 * 
 * @throws {UserManagementError} In caso di errori di lettura dal localStorage
 * 
 * @example
 * // Cerca un utente per username
 * try {
 *   const user = searchUserbyName("mario");
 *   if (user) {
 *     console.log("Utente trovato:", user.email);
 *   } else {
 *     console.log("Utente non trovato");
 *   }
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export function searchUserbyName(providedUsername) {
    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.username === providedUsername);

    if(index < 0) return null;

    return structuredClone(actualRegUsersArray[index]); // Ritorna una copia profonda dell'oggetto (copia tutti i livelli di annidamento)
}

export function searchUserById(userId){

    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.id === userId);

    if(index < 0) return null;

    return structuredClone(actualRegUsersArray[index]); // Ritorna una copia profonda dell'oggetto (copia tutti i livelli di annidamento)
}

// ============================================================================
// FUNZIONI DI AUTENTICAZIONE
// ============================================================================

// Verifica le credenziali di accesso confrontando la password hashata
export async function admitUser(userId, providedPassword){

    const actualRegUsersArray = retrieveRegisteredUsers() || [];

    const index = actualRegUsersArray.findIndex(item => item.id === userId);
    const userHash = actualRegUsersArray[index].password;

    const providedHash = await hashString(providedPassword);

    return userHash === providedHash;
}

// ============================================================================
// FUNZIONI CRITTOGRAFICHE
// ============================================================================

// Funzione asincrona che riceve una stringa e restituisce il suo hash SHA-256 in formato esadecimale
export async function hashString(originalString) {
    // 1. Converte la stringa in un array di byte (Uint8Array) usando TextEncoder
    const data = new TextEncoder().encode(originalString);

    // 2. Calcola l'hash SHA-256 dell'array di byte tramite la Web Crypto API
    //    crypto.subtle.digest restituisce una Promise che risolve in un ArrayBuffer
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // 3. Converte l'ArrayBuffer in un array di numeri (byte) per poterlo manipolare
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // 4. Trasforma ogni byte in una stringa esadecimale di due cifre e le concatena tutte
    //    Questo produce una stringa hash leggibile e pronta per essere salvata/confrontata
    const hashPassword = hashArray.map(hashArrayItem => hashArrayItem.toString(16).padStart(2, "0")).join("");

    // 5. Restituisce la stringa hash finale
    return hashPassword;
}
