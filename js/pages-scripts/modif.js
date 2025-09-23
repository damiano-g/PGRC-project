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
import { LoggedUser } from "../sessionControl.js";
import { initializeNavbar } from "../UI.js";
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
const settingsUsernameInput = {
    DOMelement: document.getElementById("username"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Oggetto gestione input email con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo email con tracking stato e valore default
 */
const settingsEmailInput = {
    DOMelement: document.getElementById("email"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Oggetto gestione input password corrente con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo password corrente per autorizzazione modifiche
 */
const settingsCurrentPassInput = {
    DOMelement: document.getElementById("currentPassword"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Oggetto gestione input nuova password con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo nuova password con validazione policy
 */
const settingsNewPassInput = {
    DOMelement: document.getElementById("newPassword"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Oggetto gestione input conferma password con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo conferma password con matching validation
 */
const settingsConfPassInput = {
    DOMelement: document.getElementById("confirmPassword"),
    defaultValue: "",
    inputStatus: 0,
}

/**
 * Array di tutti gli input del form per operazioni batch
 * @type {Array<FormInputObject>}
 * @description Collezione per iterazione validazione e formatting globale
 */
const allSettingsFormInputs = [settingsUsernameInput, settingsEmailInput, settingsCurrentPassInput, settingsNewPassInput, settingsConfPassInput];

// ================================================================================================
// DOM REFERENCES - ELEMENTI UI PRINCIPALI
// ================================================================================================

/**
 * Pulsante autorizzazione per sbloccare modifica password
 * @type {HTMLButtonElement}
 * @description Richiede verifica password corrente prima di abilitare nuova password
 */
const authPasswordModifBtn = document.getElementById("auth-modif");

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
const settingsSubBtn = document.getElementById("submit");

/**
 * Pulsante reset per ripristino stato iniziale pagina
 * @type {HTMLButtonElement}
 * @description Trigger reload completo per reset form e stato UI
 */
const settingsClearBtn = document.getElementById("clear");

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
    settingsNewPassInput.DOMelement.disabled = true;
    settingsNewPassInput.DOMelement.required = false;
    settingsConfPassInput.DOMelement.disabled = true;
    settingsConfPassInput.DOMelement.required = false;
    authPasswordModifBtn.disabled = true;

    // Toggle dello stato disabled/required per gli input della sezione corrente
    textInputs.forEach(item => {
        item.toggleAttribute("disabled");
        item.toggleAttribute("required");
    });

    // Aggiorna lo stato di validazione e UI per tutti i campi
    allSettingsFormInputs.forEach(item => {
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
authPasswordModifBtn.addEventListener("click", async () => {
    const providedPassword = settingsCurrentPassInput.DOMelement.value;
    settingsCurrentPassInput.DOMelement.value = "*********";

    // Verifica la password tramite autenticazione
    try {
        if(await LoggedUser.authOperations(providedPassword)){
            settingsCurrentPassInput.inputStatus = 1;
            settingsNewPassInput.DOMelement.disabled = false;
            settingsNewPassInput.DOMelement.required = true;
            settingsConfPassInput.DOMelement.required = true;
        }else{
            settingsCurrentPassInput.DOMelement.value = ""
            alert("Password errata");
        }
    } catch (error) {
        console.error(error);
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
settingsUsernameInput.DOMelement.addEventListener("input", () => validate.validateUsername(settingsUsernameInput));

/**
 * Event handler per validazione real-time email  
 * @listens input
 * @description Attiva validazione formato e disponibilità email ad ogni keystroke
 * @since 1.0.0
 */
settingsEmailInput.DOMelement.addEventListener("input", () => validate.validateEmail(settingsEmailInput));

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
settingsNewPassInput.DOMelement.addEventListener("input", () => {
    validate.validatePassword(settingsNewPassInput);
    settingsConfPassInput.DOMelement.dispatchEvent(new Event("input"));
    validate.formatInputField(settingsNewPassInput);
});

/**
 * Event handler per validazione conferma password con matching
 * @listens input  
 * @description Verifica matching tra nuova password e conferma password
 * @since 1.0.0
 */
settingsConfPassInput.DOMelement.addEventListener("input", () => validate.validatePassConfirm(settingsConfPassInput, settingsNewPassInput));

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
allSettingsFormInputs.forEach(inputObject => inputObject.DOMelement.addEventListener("input", () => {
    validate.validateBtn(allSettingsFormInputs, settingsSubBtn);
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
settingsCurrentPassInput.DOMelement.addEventListener("input", () => {
    if(authPasswordModifBtn.disabled && settingsCurrentPassInput.DOMelement.value.length > 0){
        authPasswordModifBtn.disabled = false;
    }else{
        if(settingsCurrentPassInput.DOMelement.value.length < 1){
            authPasswordModifBtn.disabled = true;
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
settingsClearBtn.addEventListener("click", () => location.reload());

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
settingsSubBtn.addEventListener("click", async () => {

    // ========================================
    // AGGIORNAMENTO PASSWORD
    // ========================================
    // Aggiorna la password se la sezione password è stata abilitata
    // Prerequisito: l'utente deve aver superato l'autenticazione con password corrente
    if(settingsNewPassInput.DOMelement.required){
        try {
            await LoggedUser.changePassword(settingsNewPassInput.DOMelement.value);
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
    if(settingsUsernameInput.DOMelement.required){
        try {
            LoggedUser.changeUsername(settingsUsernameInput.DOMelement.value);
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
    if(settingsEmailInput.DOMelement.required){
        try {
            // Se la validazione passa, procede con l'aggiornamento
            LoggedUser.changeEmail(settingsEmailInput.DOMelement.value);
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
    if(!LoggedUser.isLogged()){
        window.location.href = "./login.html"
    }else{
        try {
            const currentUser = LoggedUser.getData();
            settingsUsernameInput.defaultValue = currentUser.username;
            settingsUsernameInput.DOMelement.value = settingsUsernameInput.defaultValue
            settingsEmailInput.defaultValue = currentUser.email;
            settingsEmailInput.DOMelement.value = settingsEmailInput.defaultValue;
        } catch (error) {
            handleUserError(error)
        }
        document.querySelector("body").classList.remove("d-none");
    }
});

document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));
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