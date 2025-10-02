//Gestione eventi per pagina di registrazione

import { NewUser } from "../sessionControl.js";
import { initializeNavbar, formatInputField, showOverlay, hideOverlay } from "../UI.js";

// Oggetti DOM per gli input del form di registrazione con stato di validazione
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

const signinInputFields = document.querySelectorAll("#signin-form input");

// Riferimenti ai pulsanti del form di registrazione
const signinClearBtn = document.getElementById("clear");
const signinSubBtn = document.getElementById("submit");
const signinGotoLogBtn = document.getElementById("gotoLog");

// Array di tutti gli input richiesti per la validazione del form
const requiredInputFields = [signinUsernameInput, signinEmailInput, signinPasswordInput, signinConfPassInput];


/**
 * Event listener per validazione dinamica degli input del form di registrazione
 * 
 * @param {Event} input - Evento input catturato automaticamente dal campo
 * @returns {void}
 * 
 * @see {@link formatInputField} Per gestione formattazione visiva campi
 * @see {@link inputValidation} Per logica validazione business
 * 
 * @description
 * Gestisce la validazione in tempo reale degli input del form di registrazione.
 * - Per il campo conferma password, passa il riferimento al campo password originale.
 * - Per il campo password, abilita/disabilita e valida il campo conferma password.
 * - Verifica se tutti i campi sono validi per abilitare il pulsante submit.
 * - Aggiorna lo stato del pulsante submit in base alla validità complessiva del form.
 * - Flusso: input → formatInputField (UI.js) → inputValidation (sessionControl.js) → auth* (usersManagement.js)
 * - Gestione errori: propagazione da business → UI → graceful degradation con feedback visivo
 * 
 * @example
 * // Evento catturato automaticamente per ogni input del form
 * signinInputFields.forEach(field => field.addEventListener("input", () => {
 *    formatInputField(field, reference);
 *    // Gestione logica specifica per password e conferma
 *    // Verifica validità complessiva e aggiorna submit
 * }));
 */
signinInputFields.forEach(field => field.addEventListener("input", () => {
    let reference = null;
    
    if(field.id === "confirm-password"){
        reference = document.querySelector("#password").value;
    }
    
    formatInputField(field, reference);
    
    if(field.id === "password"){
        const passConfirm = document.querySelector("#confirm-password");
        if(field.classList.contains("is-valid")){
            passConfirm.disabled = false;
            formatInputField(passConfirm, field.value);
        }else{
            passConfirm.value = "";
            passConfirm.disabled = true;
            formatInputField(passConfirm);
        }
    }

    let allValid = true;
    console.log(signinInputFields);
    signinInputFields.forEach(element => {
        if(!element.classList.contains("is-valid")){
            allValid = false;
        }
    });

    console.log(allValid);
    allValid ? signinSubBtn.disabled = false : signinSubBtn.disabled = true;
}));


/**
 * Event listener per reset del form di registrazione
 * 
 * @param {Event} click - Evento click catturato automaticamente dal pulsante clear
 * @returns {void}
 * 
 * @see {@link formatInputField} Per reset formattazione visiva campi
 * 
 * @description
 * Gestisce il reset completo del form di registrazione alla condizione iniziale.
 * - Svuota tutti i campi di input richiesti.
 * - Resetta la formattazione visiva di ogni campo chiamando formatInputField.
 * - Disabilita il pulsante submit per forzare nuova validazione.
 * 
 * @example
 * // Evento catturato automaticamente dal pulsante clear
 * signinClearBtn.addEventListener("click", () => {
 *    requiredInputFields.forEach(field => {
 *        field.value = "";
 *        formatInputField(field, null);
 *    });
 *    signinSubBtn.disabled = true;
 * });
 */
signinClearBtn.addEventListener("click", () => {
    requiredInputFields.forEach(field => {
        field.value = "";
        formatInputField(field, null);
    });
    signinSubBtn.disabled = true;       
});

// ============================================================================
// GESTIONE SUBMIT DEL FORM DI REGISTRAZIONE
// ============================================================================

// Gestisce il processo completo di registrazione di un nuovo utente
// Implementa il pattern di disabilitazione temporanea degli input durante l'elaborazione
// per prevenire doppi submit e garantire l'integrità dei dati
signinSubBtn.addEventListener("click", async () => {
    // Disabilita tutti i controlli del form durante l'elaborazione per prevenire doppi input
    
    try{
        showOverlay();
        const chosenUsername = document.getElementById("username").value;
        const chosenEmail = document.getElementById("email").value;
        const chosenPassword = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("confirm-password").value;
        
        await NewUser.addToDB(chosenUsername, chosenEmail, chosenPassword, passwordConfirm);
        
        alert("User registered");
        window.location.href = "../../index.html";

    }catch(error){
        // console.error(error);
        if(error.code === 409 || error.code === 422){
            alert(`${error.message}\nPlease try again`);
        }else{
            console.error(error);
            alert("Ooops! Something went wrong. Please try again");
        }
        signinClearBtn.click();
        hideOverlay();
    }
});

document.addEventListener("DOMContentLoaded", initializeNavbar(document.querySelector("body"), document.querySelector("nav")));

signinGotoLogBtn.addEventListener("click", () => window.location.href = "./login.html");

