//Dichiarazioni variabili

// Chiave usata per salvare l'array utenti in localStorage
export const usersDBKey = "users";
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



//Gestione eventi

// All'avvio della pagina, recupera l'array utenti dal localStorage
window.addEventListener("load", () => {
    registeredUsers = retrieveList(usersDBKey);
});