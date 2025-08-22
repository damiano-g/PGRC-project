//Gestione eventi per pagina di registrazione

import { addNewUser, getRegisteredUsers, } from "./common.js"
import { validateUsername, validateEmail, validatePassword, validatePassConfirm, formatInputField, validateBtn } from "./validate.js";
import { validateUserEntry, createUserObject, } from "./auth.js";

const signinUsernameInput = {
        DOMelement: document.getElementById("username"),
        inputStatus: 0,
}

const signinEmailInput = {
        DOMelement: document.getElementById("email"),
        inputStatus: 0,
}

const signinPasswordInput = {
        DOMelement: document.getElementById("password"),
        inputStatus: 0,
}

const signinConfPassInput = {
        DOMelement: document.getElementById("confirmPassword"),
        inputStatus: 0,
} 

const signinClearBtn = document.getElementById("clear");
const signinSubBtn = document.getElementById("submit");

const requiredInputFields = [signinUsernameInput, signinEmailInput, signinPasswordInput, signinConfPassInput];

//Eventi

// Attiva la validazione del campo username ad ogni input
signinUsernameInput.DOMelement.addEventListener("input", () => validateUsername(signinUsernameInput));

// Attiva la validazione del campo email ad ogni input
signinEmailInput.DOMelement.addEventListener("input", () => validateEmail(signinEmailInput));

// Attiva la validazione del campo password ad ogni input (agisce anche su classi visive di conferma password)
signinPasswordInput.DOMelement.addEventListener("input", () => {
    validatePassword(signinPasswordInput);
    signinConfPassInput.DOMelement.dispatchEvent(new Event("input"));
    formatInputField(signinConfPassInput);
});

// Attiva la validazione del campo conferma password ad ogni input
signinConfPassInput.DOMelement.addEventListener("input", () => validatePassConfirm(signinConfPassInput, signinPasswordInput));

// Controlla lo stato di tutti i campi ad ogni input per abilitare/disabilitare il submit
requiredInputFields.forEach(inputObject => inputObject.DOMelement.addEventListener("input", () => {
    validateBtn(requiredInputFields, signinSubBtn);
    formatInputField(inputObject);       
}));

//Resetta tutto alla condizione iniziale
signinClearBtn.addEventListener("click", () => {
        requiredInputFields.forEach(item => {
                item.inputStatus = 0;
                formatInputField(item);
        });
        signinConfPassInput.DOMelement.disabled = true;
        validateBtn(requiredInputFields, signinSubBtn);       
});

// Gestisce il click sul bottone di submit: disabilita i campi, valida i dati, crea l’utente, aggiorna il database e mostra messaggi di feedback
signinSubBtn.addEventListener("click", async () => {
    
    signinSubBtn.disabled = true;
    signinClearBtn.disabled = true;
    requiredInputFields.forEach(item => item.DOMelement.disabled = true);

    try{
        const currentUsername = signinUsernameInput.DOMelement.value;
        const currentEmail = signinEmailInput.DOMelement.value;
        const currentPassword = signinPasswordInput.DOMelement.value;
        const duplicateUser = validateUserEntry(currentUsername, currentEmail, getRegisteredUsers());
    
        if(!duplicateUser){
            const newUser = await createUserObject(currentUsername, currentEmail, currentPassword);
            addNewUser(newUser);
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
    }finally{
        signinClearBtn.disabled = false;
        requiredInputFields.forEach(item => item.DOMelement.disabled = false);
        signinClearBtn.click();
    }
});