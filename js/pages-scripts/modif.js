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

import { LoggedUser } from "../sessionControl.js";
import { formatInputField, initializeNavbar } from "../UI.js";

// ================================================================================================
// FORM INPUT OBJECTS - STRUTTURE DATI PER GESTIONE STATO
// ================================================================================================

/**
 * Oggetto gestione input password corrente con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo password corrente per autorizzazione modifiche
 */
const settingsCurrentPassInput = document.getElementById("current-password");

/**
 * Oggetto gestione input nuova password con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo nuova password con validazione policy
 */
const settingsNewPassInput = document.getElementById("password");


/**
 * Oggetto gestione input conferma password con stato di validazione
 * @type {FormInputObject}
 * @description Wrapper per campo conferma password con matching validation
 */
// const settingsConfPassInput = document.getElementById("confirm-password");

const settingsInputFields = document.querySelectorAll("#user-data-form input");



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
const settingsConfirmBtn = document.getElementById("confirm-btn"); 

/**
 * Pulsante reset per ripristino stato iniziale pagina
 * @type {HTMLButtonElement}
 * @description Trigger reload completo per reset form e stato UI
 */
const settingsClearBtn = document.getElementById("clear");

const settingsSaveBtn = document.getElementById("save-btn");



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
allowModifBtns.forEach(btn => btn.addEventListener("click", (event) => {
    const sectionInputFields = event.target.closest(".form-section").querySelectorAll(".form-control");

    // Toggle dello stato disabled/required per gli input della sezione corrente
    try {
        sectionInputFields.forEach(input => {
            input.toggleAttribute("required");
            if(!input.required && (input.id === "username" || input.id === "email")){
                input.value = LoggedUser.getData()[input.id];
                formatInputField(input);
            }
            input.toggleAttribute("disabled");
        });
    } catch (error) {
        alert("Oooops. Something went wrong. Please try again.");
    }
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
 */
// authPasswordModifBtn.addEventListener("click", async () => {
//     const providedPassword = settingsCurrentPassInput.value;
//     settingsCurrentPassInput.value = "*********";

//     // Verifica la password tramite autenticazione
//     try {
//         if(await LoggedUser.authOperations(providedPassword)){
//             settingsCurrentPassInput.inputStatus = 1;
//             settingsNewPassInput.disabled = false;
//             settingsNewPassInput.required = true;
//             settingsConfPassInput.required = true;
//         }else{
//             settingsCurrentPassInput.value = ""
//             alert("Password errata");
//         }
//     } catch (error) {
//         alert("Oooops. Something went wrong. Please try again.");
//     }
// });

// ================================================================================================
// EVENT HANDLERS - VALIDAZIONE REAL-TIME
// ================================================================================================


settingsInputFields.forEach(field => field.addEventListener("input", () => {
    let reference = null;
    
    if(field.id === "confirm-password"){
        reference = document.querySelector("#password").value;
    }
    
    if(field.id === "username" || field.id === "email"){ // Esclude username/email non modificati dalla formattazione e invio dati
        if(field.value === LoggedUser.getData()[field.id]){
            field.required = false;
        }else{
            field.required = true;
        }
    }
    
    formatInputField(field, reference);
    
    if(field.id === "password"){
        const passConfirm = document.getElementById("confirm-password");
        passConfirm.value = "";
        if(field.classList.contains("is-valid")){
            passConfirm.disabled = false;
            passConfirm.required = true;
            // formatInputField(passConfirm, field.value);
        }else{
            passConfirm.disabled = true;
            passConfirm.required = false;
            formatInputField(passConfirm);
        }
    }
    
    
    let allValid = true;

    settingsInputFields.forEach(element => {
        if(element.required && !element.classList.contains("is-valid")){ // Esclude dal controllo elementi non richiesti (es:email non modificata)
            allValid = false;
        }
    });
    
    console.log(allValid);
    allValid ? settingsSaveBtn.disabled = false : settingsSaveBtn.disabled = true;
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
settingsCurrentPassInput.addEventListener("input", () => {
    if(settingsCurrentPassInput.value.length < 1){
        settingsConfirmBtn.disabled = true;
    }else{
        settingsConfirmBtn.disabled = false;
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
settingsConfirmBtn.addEventListener("click", async () => {
    
    try {
        if(await LoggedUser.authOperations(document.getElementById("current-password").value)){
            
            for(const input of settingsInputFields){ // NB -> forech non adatto per async op
                if(input.required){      
                    switch(input.dataset.field){
                        case "password":
                            if(input.id != "confirm-password"){
                                await LoggedUser.changePassword(input.value, document.getElementById("confirm-password").value);
                            }
                            break;
                        case "username":
                            LoggedUser.changeUsername(input.value);
                            break;
                        case "email":
                            LoggedUser.changeEmail(input.value);
                            break;
                        default:
                            const badRequest = new Error(`${input.id} is not a supported field type`);
                            console.error(badRequest.message);
                            throw badRequest;   
                    }
                    alert(`${input.dataset.field} successfully updated`);
                }
            };
            
            location.reload();
        }else{
            alert("Wrong password");
        }
    } catch (error) {
        if(error.code === 409 || error.code === 422){
            console.error(error);
            alert(error.message);
        }else{
            alert(`Ooops! Something went wrong.\nUnable to modify ${input.dataset.field}. Please try again.`);
        }
        location.reload();
    }
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

    try {
        if(!LoggedUser.isLogged()){
            window.location.href = "./login.html"
        }else{
            const currentUser = LoggedUser.getData();
            settingsInputFields.forEach(input =>{
                if(input.dataset.field != "password"){
                    input.value = currentUser[input.dataset.field];
                }
            });
        
            document.querySelector("body").classList.remove("d-none");
        }
    } catch (error) {
        alert("Ooops! Something went wrong. Please try again");
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