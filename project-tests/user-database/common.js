//Dichiarazioni variabili

// DOM objects
export const usernameInput = {
        DOMelement: document.getElementById("username"),
        inputStatus: 0,
}

export const emailInput = {
        DOMelement: document.getElementById("email"),
        inputStatus: 0,
}

export const passwordInput = {
        DOMelement: document.getElementById("password"),
        inputStatus: 0,
}

export const clearBtn = document.getElementById("clear");
export const subBtn = document.getElementById("submit");


// Chiave usata per salvare l'array utenti in localStorage
export const usersDBKey = "users";

// Registro utenti registrati aggiornato ad ogni caricamento di pagina -> vedi window.onload
// L'aggiornamento costante permette un'eventuale ricerca in tempo reale di username e/o mail già utilizzate
// Da valutare l'implementazione - potrebbe essere superfluo
export let registeredUsers = [];



//Dichiarazioni funzioni

// Recupera e restituisce l'array di utenti dal localStorage (se non esiste, restituisce array vuoto)
function retrieveList(localStorageKey) {
    
    let array = [];

    // Gestione errori di lettura da localStorage (es. storage pieno, permessi negati, modalità privata)
    try{
        const JSONFile = localStorage.getItem(localStorageKey);
        if(JSONFile){
            array = JSON.parse(JSONFile);
        }
    }catch(err){
    // Mostra un alert all'utente in caso di errore di lettura e non blocca l'applicazione
        alert("Errore di lettura nel database: "+err.message);
    }
    return array;
}

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

// Abilita/disabilita il submit in base alla validità di tutti i campi
export function validateSub(inputFieldsArray){

    let ready = !inputFieldsArray.some(item => item.inputStatus != 1);

    if(ready) {
            subBtn.disabled = false;
    }else{
            subBtn.disabled = true;
    }
}



//Gestione eventi

// All'avvio della pagina, recupera l'array utenti dal localStorage
window.addEventListener("load", () => {
    registeredUsers = retrieveList(usersDBKey);
});