import { handleUserError, } from "../errorsManagement.js";
import { NewUser } from "../sessionControl.js";
import { initializeNavbar } from "../UI.js";
import { validateBtn, } from "../validate.js";

// Oggetti DOM per gli input del form di login con stato di validazione
const loginUsernameInput = {
        DOMelement: document.getElementById("username"),
        inputStatus: 0,
}

const loginPasswordInput = {
        DOMelement: document.getElementById("password"),
        inputStatus: 0,
}

// Array degli input richiesti per la validazione del form
const loginRequiredInputs = [loginUsernameInput, loginPasswordInput];

// Riferimenti ai pulsanti del form di login
const loginCLearBtn = document.getElementById("clear");
const loginSubBtn = document.getElementById("submit");
const loginGotosignBtn = document.getElementById("gotoSign");

document.addEventListener("DOMContentLoaded", initializeNavbar(document.querySelector("body"), document.querySelector("nav")));

loginGotosignBtn.addEventListener("click", () => window.location.href = "./signin.html");

// Gestione eventi degli input e validazione form

// Aggiorna lo stato dell'input username in base al contenuto
loginUsernameInput.DOMelement.addEventListener("input", () => {
    if(loginUsernameInput.DOMelement.value.length > 0){
        loginUsernameInput.inputStatus = 1;
    }else{
        loginUsernameInput.inputStatus = 0;
    }
});

// Aggiorna lo stato dell'input password in base al contenuto
loginPasswordInput.DOMelement.addEventListener("input", () => {
    if(loginPasswordInput.DOMelement.value.length > 0){
        loginPasswordInput.inputStatus = 1;
    }else{
        loginPasswordInput.inputStatus = 0;
    }
});

// Valida il form ad ogni input per abilitare/disabilitare il pulsante submit
loginRequiredInputs.forEach(inputObject => inputObject.DOMelement.addEventListener("input", () => validateBtn(loginRequiredInputs, loginSubBtn)));

// ============================================================================
// GESTIONE SUBMIT DEL FORM DI LOGIN
// ============================================================================

// Gestisce il processo completo di autenticazione utente
// Implementa il pattern di disabilitazione temporanea degli input durante l'elaborazione
loginSubBtn.addEventListener("click", async () => {

    // ========================================
    // FASE 1: DISABILITAZIONE INTERFACCIA
    // ========================================
    // Disabilita tutti i controlli del form durante l'elaborazione
    // per prevenire modifiche accidentali ai dati e doppi submit
    loginSubBtn.disabled = true;
    loginCLearBtn.disabled = true;
    loginRequiredInputs.forEach(item => item.DOMelement.disabled = true);

    try{
        // ========================================
        // FASE 2: RACCOLTA E BACKUP CREDENZIALI
        // ========================================
        // Estrae e memorizza le credenziali PRIMA di modificare l'interfaccia
        const currentUsername = loginUsernameInput.DOMelement.value;
        const currentPassword = loginPasswordInput.DOMelement.value;
        
        if(await NewUser.startSession(currentUsername, currentPassword)){
            alert("Login effettuato");
            window.location.href = "./favourites.html";
        }else{
            alert("Password errata");
        }
    }catch(error){
        handleUserError(error);
    }finally{
        loginRequiredInputs.forEach(item => item.DOMelement.disabled = false);
        loginPasswordInput.DOMelement.value = "";
        loginPasswordInput.inputStatus = 0;
        loginCLearBtn.disabled = false;
    }
});

