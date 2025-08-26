// Gestione eventi per pagina di modifica profilo utente

import { handleUserError } from "./errorsManagement.js";
import { searchUserById, getLoggedUserId, admitUser, updateUserPassword, authUsername, updateUserUsername, authEmail, updateUserEmail, } from "./usersManagement.js";
import * as validate from "./validate.js";

// Oggetti DOM per gli input del form di modifica con valori di default e stato di validazione
const modifUsernameInput = {
    DOMelement: document.getElementById("username"),
    defaultValue: "",
    inputStatus: 0,
}

const modifEmailInput = {
    DOMelement: document.getElementById("email"),
    defaultValue: "",
    inputStatus: 0,
}

const modifCurrentPassInput = {
    DOMelement: document.getElementById("currentPassword"),
    defaultValue: "",
    inputStatus: 0,
}

const modifNewPassInput = {
    DOMelement: document.getElementById("newPassword"),
    defaultValue: "",
    inputStatus: 0,
}

const modifConfPassInput = {
    DOMelement: document.getElementById("confirmPassword"),
    defaultValue: "",
    inputStatus: 0,
}

// Array di tutti gli input per iterazione nelle validazioni
const modifFormInputs = [modifUsernameInput, modifEmailInput, modifCurrentPassInput, modifNewPassInput, modifConfPassInput];

// Riferimenti ai pulsanti della pagina
const authModifBtn = document.getElementById("auth-modif");
const allowModifBtns = document.querySelectorAll(".form-section .allow-modif");
const modifSubBtn = document.getElementById("submit");
const modifClearBtn = document.getElementById("clear");



// Gestisce l'abilitazione dei campi tramite i pulsanti "Abilita modifica" per ogni sezione
allowModifBtns.forEach(item => item.addEventListener("click", function (event) {
    const parentDiv = event.target.parentElement;

    const textInputs = parentDiv.querySelectorAll(".form-control");

    // Disabilita sempre i campi password quando si abilita un'altra sezione
    modifNewPassInput.DOMelement.disabled = true;
    modifNewPassInput.DOMelement.required = false;
    modifConfPassInput.DOMelement.disabled = true;
    modifConfPassInput.DOMelement.required = false;
    authModifBtn.disabled = true;

    // Toggle dello stato disabled/required per gli input della sezione corrente
    textInputs.forEach(item => {
        item.toggleAttribute("disabled");
        item.toggleAttribute("required");
    });

    // Aggiorna lo stato di validazione e UI per tutti i campi
    modifFormInputs.forEach(item => {
        if(item.DOMelement.required === true){
            item.DOMelement.dispatchEvent(new Event("input"));
        }else{
            item.DOMelement.value = item.defaultValue;
            item.inputStatus = 0;
            validate.formatInputField(item);
        }
    });
}));


// Verifica la password corrente prima di abilitare la modifica password
authModifBtn.addEventListener("click", async () => {

    const providedPassword = modifCurrentPassInput.DOMelement.value;
    modifCurrentPassInput.DOMelement.value = "*********";

    // Verifica la password tramite autenticazione
    try {
        if(await admitUser(getLoggedUserId(), providedPassword)){
            modifCurrentPassInput.inputStatus = 1;
            modifNewPassInput.DOMelement.disabled = false;
            modifNewPassInput.DOMelement.required = true;
            modifConfPassInput.DOMelement.required = true;
        }else{
            modifCurrentPassInput.DOMelement.value = ""
            alert("Password errata");
        }
    } catch (error) {
        handleUserError(error);
    }
});

// Attiva la validazione del campo username ad ogni input
modifUsernameInput.DOMelement.addEventListener("input", () => validate.validateUsername(modifUsernameInput));

// Attiva la validazione del campo email ad ogni input
modifEmailInput.DOMelement.addEventListener("input", () => validate.validateEmail(modifEmailInput));

// Attiva la validazione del campo password ad ogni input (agisce anche su classi visive di conferma password)
modifNewPassInput.DOMelement.addEventListener("input", () => {
    validate.validatePassword(modifNewPassInput);
    modifConfPassInput.DOMelement.dispatchEvent(new Event("input"));
    validate.formatInputField(modifNewPassInput);
});

// Attiva la validazione del campo conferma password ad ogni input
modifConfPassInput.DOMelement.addEventListener("input", () => validate.validatePassConfirm(modifConfPassInput, modifNewPassInput));

// Controlla lo stato di tutti i campi ad ogni input per abilitare/disabilitare il submit
modifFormInputs.forEach(inputObject => inputObject.DOMelement.addEventListener("input", () => {
    validate.validateBtn(modifFormInputs, modifSubBtn);
    validate.formatInputField(inputObject);       
}));


// Reset completo della pagina
modifClearBtn.addEventListener("click", () => location.reload());

// Gestisce l'abilitazione del pulsante "Autorizza" in base al contenuto password corrente
modifCurrentPassInput.DOMelement.addEventListener("input", () => {
    if(authModifBtn.disabled && modifCurrentPassInput.DOMelement.value.length > 0){
        authModifBtn.disabled = false;
    }else{
        if(modifCurrentPassInput.DOMelement.value.length < 1){
            authModifBtn.disabled = true;
        }
    }
});

// ============================================================================
// GESTIONE SUBMIT DEL FORM DI MODIFICA
// ============================================================================

// Gestisce il submit finale del form di modifica profilo utente
// Applica selettivamente le modifiche in base ai campi attivati dall'utente
// Ogni operazione di aggiornamento è gestita separatamente con try/catch individuali
// per garantire che un errore su un campo non impedisca l'aggiornamento degli altri
modifSubBtn.addEventListener("click", async () => {

    // ========================================
    // AGGIORNAMENTO PASSWORD
    // ========================================
    // Aggiorna la password se la sezione password è stata abilitata
    // Prerequisito: l'utente deve aver superato l'autenticazione con password corrente
    if(modifNewPassInput.DOMelement.required){
        try {
            await updateUserPassword(modifNewPassInput.DOMelement.value);
            alert("Password aggiornata");
        } catch (error) {
            handleUserError(error);
        }
    }

    // ========================================
    // AGGIORNAMENTO USERNAME
    // ========================================
    // Aggiorna l'username se la sezione username è stata abilitata
    // Sequenza: 1) Verifica disponibilità username, 2) Applica modifica al database
    if(modifUsernameInput.DOMelement.required){
        try {
            // Verifica che il nuovo username non sia già in uso
            authUsername(modifUsernameInput.DOMelement.value);
            // Se la validazione passa, procede con l'aggiornamento
            updateUserUsername(modifUsernameInput.DOMelement.value);
            alert("Nome utente aggiornato");
        } catch (error) {
            // Gestisce errori di validazione (username già in uso) o storage
            handleUserError(error);
        }
    }

    // ========================================
    // AGGIORNAMENTO EMAIL
    // ========================================
    // Aggiorna l'email se la sezione email è stata abilitata
    // Sequenza: 1) Verifica disponibilità email, 2) Applica modifica al database
    if(modifEmailInput.DOMelement.required){
        try {
            // Verifica che la nuova email non sia già in uso
            authEmail(modifEmailInput.DOMelement.value)
            // Se la validazione passa, procede con l'aggiornamento
            updateUserEmail(modifEmailInput.DOMelement.value);
            alert("Email aggiornata");
        } catch (error) {
            // Gestisce errori di validazione (email già in uso) o storage
            handleUserError(error);
        }
    }

    // ========================================
    // RICARICA PAGINA
    // ========================================
    // Ricarica la pagina per resettare lo stato del form e mostrare i dati aggiornati
    // Questo garantisce che tutti i campi tornino ai valori di default (ora aggiornati)
    // e che tutte le sezioni vengano disabilitate per sicurezza
    location.reload();
});

// Carica i dati dell'utente corrente nei campi al caricamento della pagina
window.addEventListener("load", () => {
    try {
        const currentUser = searchUserById(getLoggedUserId());
        modifUsernameInput.defaultValue = currentUser.username;
        modifUsernameInput.DOMelement.value = modifUsernameInput.defaultValue
        modifEmailInput.defaultValue = currentUser.email;
        modifEmailInput.DOMelement.value = modifEmailInput.defaultValue;
    } catch (error) {
        handleUserError(error)
    }
});