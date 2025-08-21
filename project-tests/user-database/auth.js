
// Chiave usata per salvare l'array utenti in localStorage
const usersDBKey = "users";
let usersArray = [];

// Recupera e restituisce l'array di utenti dal localStorage (se non esiste, restituisce array vuoto)
function retrieveList(localStorageKey) {
    const array = [];
    const JSONFile = localStorage.getItem(localStorageKey);
    if(JSONFile){
        array = JSON.parse(JSONFile);
    }
    return array;
}

// Controlla se username o email sono già presenti nell'array utenti (restituisce true se non ci sono duplicati)
function validateUserEntry(chosenUsername, chosenEmail, registeredUsersArray){
    if(registeredUsersArray.some(item => (item.username === chosenUsername) || (item.email === chosenEmail))){
        return false;
    }
    return true;
}

// Funzione asincrona che riceve una stringa e restituisce il suo hash SHA-256 in formato esadecimale
async function hashString(originalString) {
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

// Crea un oggetto utente con i dati forniti e la password hashata
async function createUserCard(chosenUsername, chosenEmail, chosenPassword){
    const hashPassword = await hashString(chosenPassword);
    const timestamp = new Date();
    const rnd = String(Math.floor(Math.random()*10000)).padStart(4, "0"); 
    const newUser = {
        id: `user_${String(timestamp)}_${rnd}`,
        username: chosenUsername,
        email: chosenEmail,
        password: hashPassword,
        favorites: [],
        creationDate: timestamp.toISOString(),
    }
    return newUser;
}

// Aggiunge un nuovo utente all'array e aggiorna il localStorage
function addNewUser(newUser, registeredUsersArray, localStorageKey){
    registeredUsersArray.push(newUser);
    localStorage.setItem(localStorageKey, JSON.stringify(registeredUsersArray));
    return registeredUsersArray;
}

// All'avvio della pagina, recupera l'array utenti dal localStorage
window.addEventListener("load", () => {
    usersArray = retrieveList(usersDBKey);
});