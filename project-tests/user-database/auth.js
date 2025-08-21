// Importa riferimenti agli elementi del form e oggetti di input dal modulo validate.js
import { subBtn, clearBtn, requiredInputFields, usernameInput, emailInput, passwordInput } from "./validate.js";

// Chiave usata per salvare l'array utenti in localStorage
const usersDBKey = "users";
let registeredUsers = [];

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

// Controlla se username o email sono già presenti nell'array utenti (restituisce true se non ci sono duplicati)
function validateUserEntry(chosenUsername, chosenEmail, usersArray){
    
    if(usersArray.some(item => (item.username === chosenUsername))){
        return "username";
    }
    if(usersArray.some(item => (item.email === chosenEmail))){
        return "email";
    }
    return null;
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
async function createUserObject(chosenUsername, chosenEmail, chosenPassword){
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

// Aggiunge un nuovo utente all'array e aggiorna il localStorage
function addNewUser(userObject, usersArray, localStorageKey){
    usersArray.push(userObject);
    localStorage.setItem(localStorageKey, JSON.stringify(usersArray));
    return usersArray;
}


//Eventi

// Gestisce il click sul bottone di submit: disabilita i campi, valida i dati, crea l’utente, aggiorna il database e mostra messaggi di feedback
subBtn.addEventListener("click", async () => {
    
    subBtn.disabled = true;
    clearBtn.disabled = true;
    requiredInputFields.forEach(item => item.DOMelement.disabled = true);

    try{
        const currentUsername = usernameInput.DOMelement.value;
        const currentEmail = emailInput.DOMelement.value;
        const currentPassword = passwordInput.DOMelement.value;
        const duplicateUser = validateUserEntry(currentUsername, currentEmail, registeredUsers);
    
        if(!duplicateUser){
            const newUser = await createUserObject(currentUsername, currentEmail, currentPassword);
            registeredUsers = addNewUser(newUser, registeredUsers, usersDBKey);
            try{
                localStorage.setItem(usersDBKey, JSON.stringify(registeredUsers));
            }catch(err){
                alert("Errore di scrittura nel database: "+err.message);
                console.error(err);
            }
            alert("Utente registrato con successo");
        }else{
            if(duplicateUser === "username"){
                alert("Nome utente non disponibile");
            }
            if(duplicateUser === "email"){
                alert("Errore: email già registrata. Utilizzare un'altra email o effettuare il login");
            }
        }
    }catch(err){
        alert("Errore: "+err.message+"\nCodice errore: "+(err.code || "N/A"));
        console.error(err);
    }
});


// All'avvio della pagina, recupera l'array utenti dal localStorage
window.addEventListener("load", () => {
    registeredUsers = retrieveList(usersDBKey);
});