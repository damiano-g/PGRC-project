// Gestione completa degli utenti: storage, validazione, autenticazione e operazioni CRUD

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

// Recupera l'array degli utenti registrati aggiornato dal localStorage
// Restituisce una copia dell'array originale impedendo modifiche in funzioni esterne al modulo
export function getRegisteredUsers() {
    return [...registeredUsers];
}

// Recupera l'ID dell'utente attualmente loggato dal sessionStorage
// La stringa è immutabile -> non possibili modifiche esterne
export function getLoggedUserId() {
    return loggedUserId;
}

// ============================================================================
// FUNZIONI DI STORAGE INTERNO
// ============================================================================

// Recupera e restituisce l'array di utenti dal localStorage (se non esiste, restituisce array vuoto)
function retrieveRegisteredUsers() {
    
    let array = [];

    try{
        const JSONFile = localStorage.getItem(usersDBKey);
        if(JSONFile){
            array = JSON.parse(JSONFile);
        }
    }catch(err){
        alert("Errore di lettura nel database: "+err.message);
    }
    return array;
}

// Recupera l'ID dell'utente loggato dal sessionStorage con gestione errori
function retreiveLoggedUser(){
    
    let userId = "";
    
    try{
        userId = sessionStorage.getItem(loggedUserKey) || "";
    }catch(err){
        alert("Errore di lettura nel database: "+err.message);
    }
    return userId;
}

// Salva l'array utenti nel localStorage con gestione errori
function updateUsersDB(usersArray){
    
    try{
        localStorage.setItem(usersDBKey, JSON.stringify(usersArray));
    }catch(err){
        alert("Errore di scrittura nel database: "+err.message);
        console.error(err);
        throw err;
    }
}

// Aggiorna l'ID dell'utente loggato nel sessionStorage
export function updateLoggedUser(userId){

    try{
        sessionStorage.setItem(loggedUserKey, userId);
    }catch(err){
        alert("Errore di scrittura nel database: "+err.message);
        console.error(err);
    }
}

// ============================================================================
// OPERAZIONI CRUD ATOMICHE
// ============================================================================

// Aggiunge un nuovo utente all'array e aggiorna il localStorage
// Implementazione atomica: legge dati freschi, modifica e salva in un'unica operazione
export function addNewUser(newUserObject){
    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    actualRegUsersArray.push(newUserObject);
    try {
        updateUsersDB(actualRegUsersArray);
        registeredUsers = actualRegUsersArray;
    } catch (err) {
        alert("impossibile effettuare le modifiche: "+err.message);
        console.error(err);
    }
}

// Rimuove un utente dall'array tramite ID e aggiorna il localStorage
// Implementazione atomica: legge dati freschi, modifica e salva in un'unica operazione
export function deleteUser(userId){
    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.id === userId);
    actualRegUsersArray.splice(index, 1);
    try {
        updateUsersDB(actualRegUsersArray);
        registeredUsers = actualRegUsersArray;
    } catch (err) {
        alert("impossibile effettuare le modifiche: "+err.message);
        console.error(err);
    }
}

// ============================================================================
// FUNZIONI DI VALIDAZIONE
// ============================================================================

// Verifica la disponibilità di username ed email nel database utenti
// Restituisce "username" o "email" se duplicati, null se disponibili
export function validateUserEntry(chosenUsername, chosenEmail){
    
    if(registeredUsers.some(item => (item.username === chosenUsername))){
        return "username";
    }
    if(registeredUsers.some(item => (item.email === chosenEmail))){
        return "email";
    }
    return null;
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

// Ricerca un utente nel database tramite username e restituisce il suo ID
export function searchUserbyName(providedUsername) {

    const index = registeredUsers.findIndex(item => item.username === providedUsername);

    if(index < 0) return null;
    return registeredUsers[index].id;
}

// ============================================================================
// FUNZIONI DI AUTENTICAZIONE
// ============================================================================

// Verifica le credenziali di accesso confrontando la password hashata
export async function admitUser(userId, providedPassword){

    const index = registeredUsers.findIndex(item => item.id === userId);
    const userHash = registeredUsers[index].password;

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
