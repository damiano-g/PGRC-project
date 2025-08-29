// Gestione completa degli utenti: storage, validazione, autenticazione e operazioni CRUD

import { UserManagementError, } from "./errorsManagement.js";
import { User } from "./data-models.js";

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

/**
 * Funzione interna per recuperare l'array degli utenti registrati dal localStorage
 * Gestisce il parsing JSON e restituisce un array vuoto se non esistono dati
 * 
 * @private
 * @returns {Array} Array degli utenti registrati dal localStorage o array vuoto se non presente
 * 
 * @throws {UserManagementError} Se si verificano errori di lettura dal localStorage (tipo "STORAGE")
 * @throws {UserManagementError} Se si verificano errori di parsing JSON (tipo "STORAGE")
 * 
 * @example
 * // Uso interno - recupera dati dal storage
 * const users = retrieveRegisteredUsers();
 * console.log("Utenti trovati:", users.length);
 */
function retreiveLoggedUser(){
    try{
        const userId = sessionStorage.getItem(loggedUserKey) || "";
        return userId;
    }catch(err){
        throw new UserManagementError("STORAGE", "Errore di lettura nel database", err);
    }
}


/**
 * Funzione interna per salvare l'array degli utenti nel localStorage
 * Gestisce la serializzazione JSON e la scrittura con gestione errori
 * 
 * @private
 * @param {Array} usersArray - Array degli utenti da salvare nel localStorage
 * 
 * @throws {UserManagementError} Se si verificano errori di scrittura nel localStorage (tipo "STORAGE")
 * @throws {UserManagementError} Se si verificano errori di serializzazione JSON (tipo "STORAGE")
 * 
 * @example
 * // Uso interno - salva array utenti aggiornato
 * updateUsersDB(modifiedUsersArray);
 */
function updateUsersDB(usersArray){
    
    try{
        localStorage.setItem(usersDBKey, JSON.stringify(usersArray));
    }catch(error){
        throw new UserManagementError("STORAGE", "Errore di scrittura nel database", error) ;
    }
}


/**
 * Aggiorna l'ID dell'utente attualmente loggato nel sessionStorage
 * Gestisce la sessione di login dell'utente corrente con persistenza tra le pagine
 * 
 * @param {string} userId - ID univoco dell'utente da impostare come loggato
 * 
 * @throws {UserManagementError} Se si verificano errori di scrittura nel sessionStorage (tipo "STORAGE")
 * 
 * @example
 * // Imposta un utente come loggato dopo autenticazione
 * try {
 *   updateLoggedUser("user_1703123456789_1234");
 *   console.log("Utente impostato come loggato");
 * } catch (error) {
 *   handleUserError(error);
 * }
 * 
 * @example
 * // Uso tipico nel flusso di login
 * const admitted = await admitUser(foundUserId, password);
 * if (admitted) {
 *   updateLoggedUser(foundUserId);
 *   window.location.href = "./pages/landing.html";
 * }
 * */
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

/**
 * Funzione utility interna per aggiornare un campo specifico dell'utente corrente
 * Gestisce il pattern atomico di lettura-modifica-scrittura per tutti i tipi di aggiornamento utente
 * Supporta preprocessing opzionale (es. hashing password) tramite parametro booleano
 * 
 * @private
 * @async
 * @param {string} field - Nome del campo da aggiornare nell'oggetto utente (es. "username", "email", "password")
 * @param {string} newValue - Nuovo valore da assegnare al campo (in chiaro per password)
 * @param {boolean|null} [needsPreprocessing=null] - Se true, applica hashing SHA-256 al valore prima del salvataggio
 * 
 * @returns {Promise<void>} Promise che risolve quando l'operazione è completata
 * 
 * @throws {UserManagementError} Se l'utente corrente non è trovato nel database (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se si verificano errori di lettura o scrittura nel localStorage (tipo "STORAGE")
 * @throws {Error} Se si verificano errori durante l'hashing della password (solo se needsPreprocessing=true)
 * 
 * @example
 * // Aggiorna username (sincrono)
 * await updateUserData("username", "nuovoUsername");
 * 
 * @example  
 * // Aggiorna password con hashing (asincrono)
 * await updateUserData("password", "nuovaPassword123", true);
 * 
 * @example
 *  * // Aggiorna email (sincrono)
 * await updateUserData("email", "nuova@email.com");
 */
async function updateUserData(field, newValue, needsPreprocessing = null, isArray = null) {
    try {
        const processedValue = (needsPreprocessing ? await hashString(newValue) : (isArray ? newValue.split(",") : newValue));
        const actualRegUsersArray = retrieveRegisteredUsers() || [];
        const index = actualRegUsersArray.findIndex(item => item.id === getLoggedUserId());
        if(index < 0){
            throw new UserManagementError("NOT_FOUND", "Utente non trovato");
        }
        actualRegUsersArray[index][field] = processedValue;
        updateUsersDB(actualRegUsersArray);
    } catch (error) {
        throw error;
    }
}

/**
 * Aggiorna l'username dell'utente attualmente loggato
 * Implementazione atomica: legge dati freschi dal localStorage, modifica e salva
 * 
 * @param {string} newUsername - Nuovo username da assegnare all'utente corrente
 * @returns {boolean} true se l'operazione è completata con successo
 * 
 * @throws {UserManagementError} Se l'utente corrente non è trovato nel database (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se si verificano errori di lettura o scrittura nel localStorage (tipo "STORAGE")
 * 
 * @example
 * // Aggiorna l'username dell'utente loggato
 * try {
 *   updateUserUsername("nuovoUsername");
 *   console.log("Username aggiornato con successo");
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export function updateUserUsername(newUsername){
    updateUserData("username", newUsername);
    return true;
}

/**
 * Aggiorna l'email dell'utente attualmente loggato
 * Implementazione atomica: legge dati freschi dal localStorage, modifica e salva
 * 
 * @param {string} newUserEmail - Nuova email da assegnare all'utente corrente
 * @returns {boolean} true se l'operazione è completata con successo
 * 
 * @throws {UserManagementError} Se l'utente corrente non è trovato nel database (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se si verificano errori di lettura o scrittura nel localStorage (tipo "STORAGE")
 * 
 * @example
 * // Aggiorna l'email dell'utente loggato
 * try {
 *   updateUserEmail("nuova@email.com");
 *   console.log("Email aggiornata con successo");
 * } catch (error) {
 *   handleUserError(error);
 * }
 */ 
export function updateUserEmail(newUserEmail){
    updateUserData("email", newUserEmail);
    return true;
}

/**
 * Aggiorna la password dell'utente attualmente loggato con hashing automatico
 * Implementazione atomica: legge dati freschi dal localStorage, applica hash SHA-256 e salva
 * 
 * @async
 * @param {string} newUserPassword - Nuova password in chiaro da hashare e assegnare
 * @returns {Promise<boolean>} Promise che risolve a true se l'operazione è completata con successo
 * 
 * @throws {UserManagementError} Se l'utente corrente non è trovato nel database (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se si verificano errori di lettura o scrittura nel localStorage (tipo "STORAGE")
 * @throws {Error} Se si verificano errori durante l'hashing della password
 * 
 * @example
 * // Aggiorna la password dell'utente loggato
 * try {
 *   await updateUserPassword("nuovaPassword123");
 *   console.log("Password aggiornata con successo");
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export async function updateUserPassword(newUserPassword){
    updateUserData("password", newUserPassword, true);
    return true;
}

export function upddateUserFavourites(newUserFavouritesArray){
    updateUserData("favourites", newUserFavouritesArray.toString(), null, true);
    return true;
}


// ============================================================================
// FUNZIONI DI VALIDAZIONE
// ============================================================================


/**
 * Verifica se un username è disponibile nel database
 * Implementazione atomica: legge dati freschi dal localStorage
 * 
 * @param {string} chosenUsername - Username da verificare per duplicati
 * @returns {boolean} true se l'username è disponibile
 * 
 * @throws {UserManagementError} Se username già in uso (tipo "VALIDATION")
 * @throws {UserManagementError} Se errori di lettura dal localStorage (tipo "STORAGE")
 * 
 * @example
 * // Verifica disponibilità username
 * try {
 *   authUsername("mario");
 *   console.log("Username disponibile");
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export function authUsername(chosenUsername){

    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    
    if(actualRegUsersArray.some(item => (item.username === chosenUsername))){
        throw new UserManagementError("VALIDATION", "Username già in uso");
    }
    
    return true;
}

/**
 * Verifica se un'email è disponibile nel database
 * Implementazione atomica: legge dati freschi dal localStorage
 * 
 * @param {string} chosenEmail - Email da verificare per duplicati
 * @returns {boolean} true se l'email è disponibile
 * 
 * @throws {UserManagementError} Se email già in uso (tipo "VALIDATION")
 * @throws {UserManagementError} Se errori di lettura dal localStorage (tipo "STORAGE")
 * 
 * @example
 * // Verifica disponibilità email
 * try {
 *   authEmail("mario@email.com");
 *   console.log("Email disponibile");
 * } catch (error) {
 *   handleUserError(error);
 * }
 */
export function authEmail(chosenEmail){

    const actualRegUsersArray = retrieveRegisteredUsers() || []; 

    if(actualRegUsersArray.some(item => (item.email === chosenEmail))){
        throw new UserManagementError("VALIDATION", "Email già in uso");
    }

    return true;
}

// ============================================================================
// FUNZIONI DI CREAZIONE E GESTIONE UTENTI
// ============================================================================

/**
 * Genera un nuovo oggetto utente completo con password hashata e ID univoco
 * Crea la struttura dati completa necessaria per la registrazione di un nuovo utente
 * Include generazione automatica di ID timestamp-based e hashing sicuro della password
 * 
 * @async
 * @param {string} chosenUsername - Username scelto dall'utente per la registrazione
 * @param {string} chosenEmail - Indirizzo email dell'utente per la registrazione
 * @param {string} chosenPassword - Password in chiaro che verrà automaticamente hashata
 * 
 * @returns {Promise<import('./data-models.js').User>} Promise che risolve nell'istanza User completa pronta per il salvataggio
 * 
 * @throws {Error} Se si verificano errori durante l'hashing della password
 * 
 * @example
 * // Crea un nuovo oggetto utente con password hashata
 * try {
 *   const newUser = await createUserObject("mario", "mario@email.com", "password123");
 *   console.log("Nuovo utente creato:", newUser.id);
 *   addNewUser(newUser);
 * } catch (error) {
 *   console.error("Errore nella creazione utente:", error);
 * }
 * 
 * @example
 * // Uso tipico nel flusso di registrazione
 * async function registerUser(username, email, password) {
 *   try {
 *     authUsername(username);           // Verifica disponibilità username
 *     authEmail(email);                 // Verifica disponibilità email
 *     const user = await createUserObject(username, email, password);
 *     addNewUser(user);                 // Salva nel database
 *     return user;
 *   } catch (error) {
 *     handleUserError(error);
 *   }
 * }
 */
export async function createUserObject(chosenUsername, chosenEmail, chosenPassword){
    const hashPassword = await hashString(chosenPassword);
    return new User(chosenUsername, chosenEmail, chosenPassword);
}


/**
 * Funzione utility interna per ricercare un utente nel database tramite parametro generico
 * Supporta ricerca per qualsiasi campo dell'oggetto utente (username, email, id, ecc.)
 * Restituisce una deep copy per impedire modifiche esterne ai dati originali
 * 
 * @private
 * @param {string} searchParameter - Nome del campo da utilizzare per la ricerca -> "username", "id", "email"
 * @param {string} searchValue - Valore da cercare nel campo specificato
 * @returns {Object} Oggetto utente completo (deep copy) se trovato
 * 
 * @throws {UserManagementError} Se l'utente non è trovato nel database (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se si verificano errori di lettura dal localStorage (tipo "STORAGE")
 * 
 * @example
 * // Cerca utente per username (uso interno)
 * const user = searchUser("username", "mario");
 * 
 * @example
 * // Cerca utente per ID (uso interno)
 * const user = searchUser("id", "user_1703123456789_1234");
 */
function searchUser(searchParameter, searchValue){
    try {
        const actualRegUsersArray = retrieveRegisteredUsers() || [];
        const index = actualRegUsersArray.findIndex(item => item[searchParameter] === searchValue);
     
        if(index < 0){
            throw new UserManagementError("NOT_FOUND", "Utente non trovato");
        }

        return structuredClone(actualRegUsersArray[index]);
    } catch (error) {
        throw error;
    }
}

/**
 * Ricerca un utente nel database tramite username e restituisce l'oggetto utente completo
 * Restituisce una deep copy per impedire modifiche esterne ai dati originali
 * 
 * @param {string} providedUsername - Username dell'utente da cercare
 * @returns {Object} Oggetto utente completo (deep copy) se trovato
 * 
 * @throws {UserManagementError} Se l'utente non è trovato nel database (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se si verificano errori di lettura dal localStorage (tipo "STORAGE")
 * 
 * @example
 * // Cerca un utente per username
 * try {
 *   const user = searchUserbyName("mario");
 *   console.log("Utente trovato:", user.email);
 * } catch (error) {
 *   if (error.type === "NOT_FOUND") {
 *     console.log("Utente non trovato");
 *   } else {
 *     handleUserError(error);
 *   }
 * }
 */
export function searchUserbyName(providedUsername) {
    return searchUser("username", providedUsername);
}

/**
 * Ricerca un utente nel database tramite ID e restituisce l'oggetto utente completo
 * Restituisce una deep copy per impedire modifiche esterne ai dati originali
 * 
 * @param {string} userId - ID univoco dell'utente da cercare
 * @returns {Object} Oggetto utente completo (deep copy) se trovato
 * 
 * @throws {UserManagementError} Se l'utente non è trovato nel database (tipo "NOT_FOUND")
 * @throws {UserManagementError} Se si verificano errori di lettura dal localStorage (tipo "STORAGE")
 * 
 * @example
 * // Cerca un utente per ID
 * try {
 *   const user = searchUserById("user_1703123456789_1234");
 *   console.log("Utente trovato:", user.username);
 * } catch (error) {
 *   if (error.type === "NOT_FOUND") {
 *     console.log("Utente non trovato");
 *   } else {
 *     handleUserError(error);
 *   }
 * }
 */
export function searchUserById(userId){
    return searchUser("id", userId);
}

// ============================================================================
// FUNZIONI DI AUTENTICAZIONE
// ============================================================================

/**
 * Verifica le credenziali di autenticazione di un utente confrontando password hashate
 * Implementa l'autenticazione sicura hashando la password fornita e confrontandola con quella salvata
 * Utilizzata durante il processo di login per validare le credenziali utente
 * 
 * @async
 * @param {string} userId - ID univoco dell'utente da autenticare
 * @param {string} providedPassword - Password in chiaro fornita dall'utente per l'autenticazione
 * 
 * @returns {Promise<boolean>} Promise che risolve a true se le credenziali sono corrette, false altrimenti
 * 
 * @throws {UserManagementError} Se si verificano errori di lettura dal localStorage (tipo "STORAGE")
 * @throws {Error} Se si verificano errori durante l'hashing della password fornita
 * 
 * @example
 * // Autentica un utente durante il login
 * try {
 *   const user = searchUserbyName("mario");
 *   const isAuthenticated = await admitUser(user.id, "password123");
 *   
 *   if (isAuthenticated) {
 *     updateLoggedUser(user.id);
 *     console.log("Login riuscito");
 *   } else {
 *     console.log("Password errata");
 *   }
 * } catch (error) {
 *   handleUserError(error);
 * }
 * 
 * @example
 * // Uso tipico nel flusso completo di login
 * async function loginUser(username, password) {
 *   try {
 *     const user = searchUserbyName(username);        // Cerca utente
 *     const admitted = await admitUser(user.id, password); // Verifica password
 *     
 *     if (admitted) {
 *       updateLoggedUser(user.id);                    // Imposta come loggato
 *       window.location.href = "./pages/landing.html"; // Redirect
 *     } else {
 *       alert("Password errata");
 *     }
 *   } catch (error) {
 *     handleUserError(error);                         // Gestisce errori (es. utente non trovato)
 *   }
 * }
 */
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

/**
 * Genera l'hash SHA-256 di una stringa utilizzando la Web Crypto API
 * Converte la stringa in formato esadecimale sicuro per storage e confronti
 * Utilizzata per hashing delle password e verifica credenziali
 * 
 * @async
 * @param {string} originalString - Stringa originale da hashare (es. password in chiaro)
 * 
 * @returns {Promise<string>} Promise che risolve nella stringa hash SHA-256 in formato esadecimale
 * 
 * @throws {Error} Se si verificano errori durante il processo di hashing (es. Web Crypto API non disponibile)
 * 
 * @example
 * // Hashing di una password per registrazione
 * try {
 *   const hashedPassword = await hashString("password123");
 *   console.log("Password hashata:", hashedPassword);
 *   // Output: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
 * } catch (error) {
 *   console.error("Errore nell'hashing:", error);
 * }
 * 
 * @example
 * // Uso nel processo di autenticazione
 * async function verifyPassword(inputPassword, storedHash) {
 *   try {
 *     const inputHash = await hashString(inputPassword);
 *     return inputHash === storedHash;
 *   } catch (error) {
 *     throw new Error("Errore durante la verifica password");
 *   }
 * }
 * 
 * @example
 * // Integrazione nel flusso di creazione utente
 * const userObject = {
 *   username: "mario",
 *   email: "mario@email.com",
 *   password: await hashString("mySecretPassword"),
 *   // ...altri campi
 * };
 */
export async function hashString(originalString) {
    // ========================================
    // FASE 1: ENCODING DELLA STRINGA
    // ========================================
    // Converte la stringa in un array di byte (Uint8Array) usando TextEncoder
    // Necessario perché la Web Crypto API lavora con dati binari, non stringhe
    const data = new TextEncoder().encode(originalString);

    // ========================================
    // FASE 2: CALCOLO HASH SHA-256
    // ========================================
    // Calcola l'hash SHA-256 dell'array di byte tramite la Web Crypto API
    // crypto.subtle.digest restituisce una Promise che risolve in un ArrayBuffer
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // ========================================
    // FASE 3: CONVERSIONE IN ARRAY MANIPOLABILE
    // ========================================
    // Converte l'ArrayBuffer in un array di numeri (byte) per poterlo manipolare
    // Ogni elemento rappresenta un byte del hash (valore 0-255)
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // ========================================
    // FASE 4: FORMATTAZIONE ESADECIMALE
    // ========================================
    // Trasforma ogni byte in una stringa esadecimale di due cifre e le concatena tutte
    // padStart(2, "0") garantisce sempre 2 cifre (es. "0f" invece di "f")
    // Questo produce una stringa hash leggibile e pronta per essere salvata/confrontata
    const hashPassword = hashArray
        .map(hashArrayItem => hashArrayItem.toString(16).padStart(2, "0"))
        .join("");

    // ========================================
    // FASE 5: RETURN HASH FINALE
    // ========================================
    // Restituisce la stringa hash finale (64 caratteri esadecimali per SHA-256)
    return hashPassword;
}
