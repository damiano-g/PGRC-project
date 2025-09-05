//Gestione eventi per pagina di registrazione

import { handleUserError } from "../errorsManagement.js";
import { addNewUser, } from "../business/usersManagement.js";
import { validateUsername, validateEmail, validatePassword, validatePassConfirm, formatInputField, validateBtn } from "../validate.js";

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

// Riferimenti ai pulsanti del form di registrazione
const signinClearBtn = document.getElementById("clear");
const signinSubBtn = document.getElementById("submit");

// Array di tutti gli input richiesti per la validazione del form
const requiredInputFields = [signinUsernameInput, signinEmailInput, signinPasswordInput, signinConfPassInput];

// Gestione eventi di validazione per tutti gli input del form

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

// Gestisce il reset completo del form alla condizione iniziale
signinClearBtn.addEventListener("click", () => {
        requiredInputFields.forEach(item => {
                item.inputStatus = 0;
                formatInputField(item);
        });
        signinConfPassInput.DOMelement.disabled = true;
        validateBtn(requiredInputFields, signinSubBtn);       
});

// ============================================================================
// GESTIONE SUBMIT DEL FORM DI REGISTRAZIONE
// ============================================================================

// Gestisce il processo completo di registrazione di un nuovo utente
// Implementa il pattern di disabilitazione temporanea degli input durante l'elaborazione
// per prevenire doppi submit e garantire l'integrità dei dati
signinSubBtn.addEventListener("click", async () => {
    
    // ========================================
    // FASE 1: DISABILITAZIONE INTERFACCIA
    // ========================================
    // Disabilita tutti i controlli del form durante l'elaborazione
    // Questo previene modifiche accidentali ai dati e doppi submit
    signinSubBtn.disabled = true;
    signinClearBtn.disabled = true;
    requiredInputFields.forEach(item => item.DOMelement.disabled = true);

    try{

        // ========================================
        // RACCOLTA DATI DAL FORM
        // ========================================
        // Estrae i valori correnti dai campi di input validati
        const currentUsername = signinUsernameInput.DOMelement.value;
        const currentEmail = signinEmailInput.DOMelement.value;
        const currentPassword = signinPasswordInput.DOMelement.value;
    
        // ========================================
        // CREAZIONE E SALVATAGGIO UTENTE
        // ========================================        
        // Aggiunge il nuovo utente al database (localStorage)
        // Può lanciare UserManagementError in caso di errori di storage, validazione username e email, passwordhashing
        await addNewUser(currentUsername, currentEmail, currentPassword);
        
        alert("Utente registrato con successo");
        window.location.href = "../../index.html";

    }catch(error){
        // ========================================
        // GESTIONE ERRORI CENTRALIZZATA
        // ========================================
        // Gestisce tutti i tipi di errore in modo uniforme:
        // - VALIDATION: Username o email già in uso
        // - STORAGE: Problemi di accesso a localStorage
        // - CRYPTO: Errori durante l'hashing della password
        handleUserError(error);
    }finally{
        // ========================================
        // FASE 6: RIPRISTINO INTERFACCIA
        // ========================================
        // Garantisce sempre il ripristino dello stato dell'interfaccia
        // indipendentemente dal successo o fallimento dell'operazione
        signinClearBtn.disabled = false;
        requiredInputFields.forEach(item => item.DOMelement.disabled = false);
        
        // Reset automatico del form per preparare una nuova registrazione
        signinClearBtn.click();
    }
});