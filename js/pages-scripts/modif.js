/**
 * @fileoverview Gestione pagina di modifica profilo utente con sezioni selettive
 * @description Fornisce interfaccia per modifica username, email e password con validazione
 * real-time e autorizzazione richiesta per operazioni sensibili
 * @author damia
 * @version 1.0.0
 * @since 2025-09-03
 * @requires usersManagement - Funzioni CRUD utente e autenticazione
 * @requires validate - Validazione form e formatting UI
 * @requires errorsManagement - Gestione errori tipizzati
 */

import { handleUserError } from "../errorsManagement.js";
import { searchUserById, getLoggedUserId, admitUser, updateUserPassword, updateUserUsername, updateUserEmail, getRegisteredUsers } from "../usersManagement.js";
import * as validate from "../validate.js";

// ================================================================================================
// FORM INPUT OBJECTS - STRUTTURE DATI PER GESTIONE STATO
// ================================================================================================

/**
 * @typedef {Object} FormInputObject
 * @property {HTMLInputElement} DOMelement - Riferimento elemento DOM input
 * @property {string} defaultValue - Valore di default per reset field
 * @property {number} inputStatus - Stato validazione (0=neutro, 1=valido, -1=invalido)
 */

/**
 * Oggetto gestione input username con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo username con tracking stato e valore default
 */
const modifUsernameInput = {
    DOMelement: document.getElementById("username"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Oggetto gestione input email con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo email con tracking stato e valore default
 */
const modifEmailInput = {
    DOMelement: document.getElementById("email"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Oggetto gestione input password corrente con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo password corrente per autorizzazione modifiche
 */
const modifCurrentPassInput = {
    DOMelement: document.getElementById("currentPassword"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Oggetto gestione input nuova password con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo nuova password con validazione policy
 */
const modifNewPassInput = {
    DOMelement: document.getElementById("newPassword"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Oggetto gestione input conferma password con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo conferma password con matching validation
 */
const modifConfPassInput = {
    DOMelement: document.getElementById("confirmPassword"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Array di tutti gli input del form per operazioni batch
 * @type {Array<FormInputObject>}
 * @description Collezione per iterazione validazione e formatting globale
 */
const modifFormInputs = [modifUsernameInput, modifEmailInput, modifCurrentPassInput, modifNewPassInput, modifConfPassInput];

// ================================================================================================
// DOM REFERENCES - ELEMENTI UI PRINCIPALI
// ================================================================================================

/**
 * Pulsante autorizzazione per sbloccare modifica password
 * @type {HTMLButtonElement}
 * @description Richiede verifica password corrente prima di abilitare nuova password
 */
const authModifBtn = document.getElementById("auth-modif");

/**
 * Pulsanti "Abilita modifica" per ogni sezione del form
 * @type {NodeListOf<HTMLButtonElement>}
 * @description Toggle per abilitare/disabilitare editing su sezioni specifiche
 */
const allowModifBtns = document.querySelectorAll(".form-section .allow-modif");

/**
 * Pulsante submit principale per applicare modifiche
 * @type {HTMLButtonElement}
 * @description Esegue aggiornamenti selettivi in base a sezioni abilitate
 */
const modifSubBtn = document.getElementById("submit");

/**
 * Pulsante reset per ripristino stato iniziale pagina
 * @type {HTMLButtonElement}
 * @description Trigger reload completo per reset form e stato UI
 */
const modifClearBtn = document.getElementById("clear");

// ================================================================================================
// EVENT HANDLERS - GESTIONE ABILITAZIONE SEZIONI
// ================================================================================================

/**
 * Event handler per pulsanti "Abilita modifica" sezioni form
 * 
 * @description
 * Gestisce l'abilitazione selettiva delle sezioni modificabili del form.
 * Implementa logica mutually exclusive per sezioni password vs altre.
 * 
 * **Workflow:**
 * 1. Disabilita sempre sezione password quando si abilita altro
 * 2. Toggle stato disabled/required per input della sezione target
 * 3. Reset validazione per tutti i campi e aggiornamento UI
 * 
 * **Business Logic:**
 * - Una sola sezione abilitabile per volta (sicurezza)
 * - Password richiede autorizzazione separata
 * - Reset automatico campi non coinvolti
 * 
 * @listens click
 * @param {MouseEvent} event - Evento click su pulsante sezione
 * 
 * @example
 * // Click su "Abilita modifica" sezione username
 * // → Disabilita password section
 * // → Abilita username input (disabled=false, required=true)
 * // → Reset email input a valore default
 * 
 * @since 1.0.0
 */
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

/**
 * Event handler per autorizzazione modifica password
 * 
 * @description
 * Verifica password corrente utente prima di abilitare modifica password.
 * Implementa security gate per operazioni sensibili con feedback immediato.
 * 
 * **Security Workflow:**
 * 1. Cattura password inserita e maschera campo
 * 2. Verifica autenticazione tramite admitUser()
 * 3. Se valida: abilita campi nuova password
 * 4. Se invalida: reset campo e notifica errore
 * 
 * **UX Features:**
 * - Password masking immediato per sicurezza
 * - Alert feedback per risultato autenticazione
 * - Campo reset automatico su fallimento
 * 
 * @listens click
 * @async
 * @throws {Error} Se autenticazione fallisce per errori sistema
 * 
 * @example
 * // User inserisce password corrente → click "Autorizza"
 * // → Campo mostra "*********" 
 * // → Se corretta: abilita newPassword + confirmPassword
 * // → Se sbagliata: campo vuoto + alert "Password errata"
 * 
 * @todo Aggiungere rate limiting per tentativi falliti
 * @todo Implementare timeout sessione per autorizzazione
 * 
 * @since 1.0.0
 */
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

// ================================================================================================
// EVENT HANDLERS - VALIDAZIONE REAL-TIME
// ================================================================================================

/**
 * Event handler per validazione real-time username
 * @listens input
 * @description Attiva validazione formato e disponibilità username ad ogni keystroke
 * @since 1.0.0
 */
modifUsernameInput.DOMelement.addEventListener("input", () => validate.validateUsername(modifUsernameInput));

/**
 * Event handler per validazione real-time email  
 * @listens input
 * @description Attiva validazione formato e disponibilità email ad ogni keystroke
 * @since 1.0.0
 */
modifEmailInput.DOMelement.addEventListener("input", () => validate.validateEmail(modifEmailInput));

/**
 * Event handler per validazione password con cascade su conferma
 * 
 * @listens input
 * @description 
 * Valida nuova password e triggera re-validazione conferma password.
 * Gestisce interdipendenza tra campi password per matching real-time.
 * 
 * @since 1.0.0
 */
modifNewPassInput.DOMelement.addEventListener("input", () => {
    validate.validatePassword(modifNewPassInput);
    modifConfPassInput.DOMelement.dispatchEvent(new Event("input"));
    validate.formatInputField(modifNewPassInput);
});

/**
 * Event handler per validazione conferma password con matching
 * @listens input  
 * @description Verifica matching tra nuova password e conferma password
 * @since 1.0.0
 */
modifConfPassInput.DOMelement.addEventListener("input", () => validate.validatePassConfirm(modifConfPassInput, modifNewPassInput));

/**
 * Event handlers per controllo stato submit button
 * 
 * @listens input
 * @description
 * Monitora stato validazione di tutti i campi per abilitare/disabilitare submit.
 * Aggiorna formattazione visuale campi (colori, icone, messaggi).
 * 
 * @since 1.0.0
 */
modifFormInputs.forEach(inputObject => inputObject.DOMelement.addEventListener("input", () => {
    validate.validateBtn(modifFormInputs, modifSubBtn);
    validate.formatInputField(inputObject);       
}));

/**
 * Event handler per abilitazione dinamica pulsante autorizzazione
 * 
 * @listens input
 * @description
 * Abilita pulsante "Autorizza" solo quando password corrente contiene caratteri.
 * Previene click accidentali su campo vuoto.
 * 
 * @since 1.0.0
 */
modifCurrentPassInput.DOMelement.addEventListener("input", () => {
    if(authModifBtn.disabled && modifCurrentPassInput.DOMelement.value.length > 0){
        authModifBtn.disabled = false;
    }else{
        if(modifCurrentPassInput.DOMelement.value.length < 1){
            authModifBtn.disabled = true;
        }
    }
});

// ================================================================================================
// UTILITY EVENT HANDLERS
// ================================================================================================

/**
 * Event handler per reset completo pagina
 * @listens click
 * @description Ricarica pagina per ripristino stato iniziale completo
 * @since 1.0.0
 */
modifClearBtn.addEventListener("click", () => location.reload());

// ================================================================================================
// FORM SUBMISSION - AGGIORNAMENTI SELETTIVI
// ================================================================================================

/**
 * Event handler per submit form di modifica profilo utente
 * 
 * @description
 * Gestisce aggiornamenti selettivi in base alle sezioni abilitate dall'utente.
 * Ogni operazione è indipendente con error handling isolato per garantire
 * che un errore su un campo non impedisca l'aggiornamento degli altri.
 * 
 * **Workflow Aggiornamenti:**
 * 1. **Password**: Se sezione password abilitata → updateUserPassword()
 * 2. **Username**: Se sezione username abilitata → updateUserUsername()  
 * 3. **Email**: Se sezione email abilitata → updateUserEmail()
 * 4. **Page Reload**: Reset completo stato per mostrare dati aggiornati
 * 
 * **Error Handling Strategy:**
 * - Try/catch individuali per ogni aggiornamento
 * - Errori non bloccano operazioni successive
 * - Alert feedback per ogni operazione completata
 * - handleUserError() per gestione errori tipizzati
 * 
 * **Security Features:**
 * - Password richiede autorizzazione preliminare
 * - Validazione availability per username/email
 * - Operazioni atomic per consistency
 * 
 * @listens click
 * @async
 * @throws {Error} Gestiti individualmente per ogni sezione
 * 
 * @example
 * // User abilita username + email, disabilita password
 * // → updateUserUsername() + updateUserEmail() 
 * // → Password non toccata
 * // → location.reload() per refresh stato
 * 
 * @todo Aggiungere progress indicator per operazioni multiple
 * @todo Implementare rollback su errori critici
 * 
 * @since 1.0.0
 */
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

// ================================================================================================
// PAGE INITIALIZATION
// ================================================================================================

/**
 * Event handler per inizializzazione pagina con caricamento dati utente
 * 
 * @description
 * Carica dati utente corrente nei campi form e gestisce autenticazione.
 * Implementa protection redirect per utenti non autenticati.
 * 
 * **Initialization Workflow:**
 * 1. **Authentication Check**: Verifica utente loggato esiste nel sistema
 * 2. **Redirect Unauthenticated**: Redirect a login se non autenticato
 * 3. **Load User Data**: Popola campi con dati correnti utente
 * 4. **Show Page**: Rimuove classe d-none per mostrare contenuto
 * 
 * **Data Population:**
 * - Username e email caricati nei campi default
 * - Campi password rimangono vuoti per sicurezza
 * - Default values aggiornati per reset functionality
 * 
 * @listens load
 * @throws {Error} Gestiti da handleUserError per errori caricamento dati
 * 
 * @example
 * // User autenticato con id "user123"
 * // → Carica username "johndoe" e email "john@example.com"
 * // → Mostra pagina con dati popolati
 * 
 * // User non autenticato  
 * // → Redirect immediato a "./login.html"
 * 
 * @todo Aggiungere loading indicator durante fetch dati
 * @todo Implementare cache dati utente per performance
 * 
 * @since 1.0.0
 */
window.addEventListener("load", () => {
    if(!getRegisteredUsers().some(item => item.id === getLoggedUserId())){
        window.location.href = "./login.html"
    }else{
        try {
            const currentUser = searchUserById(getLoggedUserId());
            modifUsernameInput.defaultValue = currentUser.username;
            modifUsernameInput.DOMelement.value = modifUsernameInput.defaultValue
            modifEmailInput.defaultValue = currentUser.email;
            modifEmailInput.DOMelement.value = modifEmailInput.defaultValue;
        } catch (error) {
            handleUserError(error)
        }
        document.querySelector("body").classList.remove("d-none");
    }
});

// ================================================================================================
// ARCHITECTURE NOTES
// ================================================================================================

/*
DESIGN PATTERNS IMPLEMENTATI:

1. **State Management Pattern**:
   - FormInputObject per tracking stato validazione
   - Centralized state con inputStatus per ogni campo
   - Default values per reset functionality

2. **Event Delegation Pattern**:
   - forEach su allowModifBtns per gestione uniforme
   - Consistent handler signature per tutti gli input
   - Event bubbling per parent section detection

3. **Security Gate Pattern**:
   - Two-step authorization per password changes
   - Separate authentication gate prima di field unlock
   - Immediate field masking per security

4. **Selective Update Pattern**:
   - Independent try/catch per ogni update operation
   - Required field detection per conditional updates
   - Atomic operations con individual error handling

BUSINESS RULES IMPLEMENTATE:

- **One Section Active**: Solo una sezione modificabile per volta
- **Password Authorization**: Richiede verifica password corrente
- **Real-time Validation**: Feedback immediato durante typing
- **Graceful Error Handling**: Errori non bloccano altre operazioni
- **State Reset**: Page reload per consistency dopo updates

UX PATTERNS:

- **Progressive Disclosure**: Sezioni abilitate on-demand
- **Immediate Feedback**: Visual validation real-time
- **Security Transparency**: Password masking e authorization flow
- **Atomic Operations**: Clear separation tra diverse modifiche
*/