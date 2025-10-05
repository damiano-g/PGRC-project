/**
 * @fileoverview Gestione pagina registrazione utente - validazione form e submit
 * @description Implementa validazione in tempo reale, gestione submit sicuro,
 * reset form e navigazione alla pagina login
 * @requires sessionControl.js Per modulo NewUser
 * @requires UI.js Per funzioni di rendering UI (initializeNavbar, formatInputField, showOverlay, hideOverlay)
 */

// ============================================================================
// IMPORT MODULI E DIPENDENZE
// ============================================================================

import { NewUser } from "../services/session-service.js";
import { initializeNavbar, formatInputField, showOverlay, hideOverlay } from "../components/ui.js";

// ============================================================================
// SELEZIONE ELEMENTI DOM
// ============================================================================

/** @type {NodeListOf<HTMLInputElement>} Campi input del form di registrazione */
export const signinInputFields = document.querySelectorAll("#signin-form input");

/** @type {HTMLButtonElement} Pulsante per reset del form */
const signinClearBtn = document.getElementById("clear");

/** @type {HTMLButtonElement} Pulsante per submit del form */
export const signinSubBtn = document.getElementById("submit");

/** @type {HTMLButtonElement} Pulsante per navigazione alla pagina login */
const signinGotoLogBtn = document.getElementById("gotoLog");


// ============================================================================
// INIZIALIZZAZIONE PAGINA
// ============================================================================

/**
 * Event listener per inizializzazione navbar
 * 
 * @param {Event} DOMContentLoaded - Evento triggerato quando il DOM è completamente caricato
 * 
 * @see {@link initializeNavbar} Per configurazione menu navigazione
 * 
 * @description
 * Inizializza la navbar quando il DOM è pronto, passando body e nav come argomenti.
 * 
 * @example
 * // Evento triggerato automaticamente al caricamento DOM
 * document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));
 */
document.addEventListener("DOMContentLoaded", initializeNavbar(document.querySelector("body"), document.querySelector("nav")));

// ============================================================================
// GESTIONE VALIDAZIONE INPUT
// ============================================================================

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
    signinInputFields.forEach(element => {
        if(!element.classList.contains("is-valid")){
            allValid = false;
        }
    });

    console.log(allValid);
    allValid ? signinSubBtn.disabled = false : signinSubBtn.disabled = true;
}));


// ============================================================================
// GESTIONE SUBMIT DEL FORM DI REGISTRAZIONE
// ============================================================================

/**
 * Event listener per submit del form di registrazione
 * 
 * @param {Event} click - Evento click catturato automaticamente dal pulsante submit
 * 
 * @see {@link NewUser.addToDB} Per creazione nuovo utente
 * @see {@link showOverlay} Per blocco UI durante elaborazione
 * @see {@link hideOverlay} Per ripristino UI
 * 
 * @description
 * Gestisce il processo completo di registrazione di un nuovo utente.
 * - Mostra overlay per prevenire doppi submit.
 * - Raccoglie valori dai campi input.
 * - Chiama NewUser.addToDB per registrazione.
 * - In caso di successo: alert conferma e redirect a index.html.
 * - In caso di errore: gestione specifica per errori 409/422, altrimenti errore generico.
 * - Reset form e nascondi overlay in caso di errore.
 * - Gestione errori con try-catch: alert utente e log console per graceful degradation.
 * 
 * @example
 * // Evento catturato automaticamente dal pulsante submit
 * signinSubBtn.addEventListener("click", async () => {
 *    try {
 *        showOverlay();
 *        await NewUser.addToDB(username, email, password, confirmPassword);
 *        alert("User registered");
 *        window.location.href = "../../index.html";
 *    } catch (error) {
 *        // Gestione errori
 *    }
 * });
 */
signinSubBtn.addEventListener("click", async () => {
    try{
        showOverlay(); // Previene doppi input
        const chosenUsername = document.getElementById("username").value;
        const chosenEmail = document.getElementById("email").value;
        const chosenPassword = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("confirm-password").value;
        
        await NewUser.addToDB(chosenUsername, chosenEmail, chosenPassword, passwordConfirm);
        
        alert("User registered");
        window.location.href = "../../index.html";

    }catch(error){
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



// ============================================================================
// GESTIONE RESET FORM
// ============================================================================

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
 *    signinInputFields.forEach(field => {
 *        field.value = "";
 *        formatInputField(field, null);
 *    });
 *    document.getElementById("confirm-password").disabled = true;
 *    signinSubBtn.disabled = true;
 * });
 */
signinClearBtn.addEventListener("click", () => {
    signinInputFields.forEach(field => {
        field.value = "";
        formatInputField(field, null);
    });
    document.getElementById("confirm-password").disabled = true;
    signinSubBtn.disabled = true;       
});


// ============================================================================
// GESTIONE NAVIGAZIONE
// ============================================================================

/**
 * Event listener per navigazione alla pagina login
 * 
 * @param {Event} click - Evento click catturato automaticamente dal pulsante gotoLog
 * @returns {void}
 * 
 * @description
 * Gestisce la navigazione alla pagina di login quando l'utente clicca sul pulsante gotoLog.
 * 
 * @example
 * // Evento catturato automaticamente dal pulsante gotoLog
 * signinGotoLogBtn.addEventListener("click", () => window.location.href = "./login.html");
 */
signinGotoLogBtn.addEventListener("click", () => window.location.href = "./login.html");


/**
 * @description Flusso di esecuzione del file singin.js
 * 
 * 1. **Import moduli e dipendenze**:
 *    - Importa NewUser da sessionControl.js per gestione registrazione
 *    - Importa funzioni UI da UI.js (initializeNavbar, formatInputField, showOverlay, hideOverlay)
 * 
 * 2. **Selezione elementi DOM**:
 *    - Recupera riferimenti a input form, pulsanti submit, clear e navigazione
 * 
 * 3. **Inizializzazione pagina (DOMContentLoaded)**:
 *    - Al caricamento del DOM, chiama initializeNavbar per configurare menu navigazione
 * 
 * 4. **Gestione validazione input (event listener su signinInputFields)**:
 *    - Ascolta input su ogni campo: valida formato, aggiorna UI, abilita/disabilita conferma password
 *    - Verifica validità complessiva del form per abilitare pulsante submit
 *    - Flusso sincrono: input → formatInputField (UI) → inputValidation (sessionControl) → auth* (usersManagement)
 * 
 * 5. **Gestione submit form (event listener su signinSubBtn)**:
 *    - Mostra overlay per bloccare UI, raccoglie valori, chiama NewUser.addToDB
 *    - In caso di successo: alert e redirect a index.html
 *    - In caso di errore: gestione specifica per 409/422, altrimenti errore generico con reset form
 *    - Gestione errori con try-catch per graceful degradation
 * 
 * 6. **Gestione reset form (event listener su signinClearBtn)**:
 *    - Svuota campi, resetta formattazione, disabilita conferma password e submit
 * 
 * 7. **Gestione navigazione (event listener su signinGotoLogBtn)**:
 *    - Naviga a pagina login al click
 * 
 * @note Il flusso è misto sincrono/asincrono: validazione sincrona, submit asincrono
 * @note Validazione granulare: feedback immediato su ogni input, pulsante submit abilitato solo se tutto valido
 * @note Graceful degradation: errori locali non crashano l'app, UI rimane funzionale con alert e reset
 * @note Sicurezza: overlay previene doppi submit, validazione lato page scripts + business modules
 */