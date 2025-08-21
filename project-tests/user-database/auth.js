// Importa riferimenti agli elementi del form e oggetti di input dal modulo validate.js
import { subBtn, clearBtn, requiredInputFields, usernameInput, emailInput, passwordInput } from "./validate.js";
import { usersDBKey, registeredUsers, hashString, } from "./common.js";

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
