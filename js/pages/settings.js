/**
 * @fileoverview Gestione pagina modifica profilo utente - validazione form e submit autorizzato
 * @description Implementa validazione in tempo reale, gestione submit sicuro con autenticazione,
 * toggle sezioni form, reset stato e protezione accesso autenticato
 * @requires sessionControl.js Per modulo LoggedUser
 * @requires UI.js Per funzioni di rendering UI (initializeNavbar, formatInputField)
 */

// ============================================================================
// IMPORT MODULI E DIPENDENZE
// ============================================================================

import { LoggedUser } from "../services/session-service.js";
import { formatInputField, hideOverlay, initializeNavbar, showOverlay } from "../components/ui.js";



// ============================================================================
// SELEZIONE ELEMENTI DOM
// ============================================================================

/**
 * Campo input password corrente per autorizzazione modifiche
 * @type {HTMLInputElement}
 * @description Input richiesto per autorizzare qualsiasi modifica ai dati utente
 */
const settingsCurrentPassInput = document.getElementById("current-password");

/**
 * Tutti i campi input del form di modifica utente
 * @type {NodeListOf<HTMLInputElement>}
 * @description Include username, email, password, confirm-password per gestione dinamica
 */
const settingsInputFields = document.querySelectorAll("#user-data-form input");

/**
 * Pulsanti per abilitare modifica delle singole sezioni form
 * @type {NodeListOf<HTMLButtonElement>}
 * @description Toggle per attivare/disattivare editing su sezioni specifiche (username, email, password)
 */
const allowModifBtns = document.querySelectorAll(".form-section .allow-modif");

/**
 * Pulsante conferma nella modal di autorizzazione
 * @type {HTMLButtonElement}
 * @description Esegue gli aggiornamenti dopo verifica password corrente
 */
const settingsConfirmBtn = document.getElementById("confirm-btn"); 

/**
 * Pulsante reset per ripristino stato iniziale
 * @type {HTMLButtonElement}
 * @description Trigger per reload completo della pagina
 */
const settingsClearBtn = document.getElementById("clear");

/**
 * Pulsante save per aprire modal di conferma
 * @type {HTMLButtonElement}
 * @description Apre modal di autenticazione quando modifiche sono pronte per il submit
 */
const settingsSaveBtn = document.getElementById("save-btn");

/**
 * Flag per gestione richiesta eliminazione account
 * 
 * @type {boolean}
 * @description
 * Flag globale che indica se l'utente ha richiesto l'eliminazione dell'account.
 * - Impostato a true quando si clicca sul pulsante "Delete account"
 * - Resettato a false quando si chiude la modal di conferma delete
 * - Utilizzato dal submit handler per distinguere tra modifica dati ed eliminazione account
 * - Previene esecuzione accidentale di delete in sessioni successive
 */
let deleteRequest = false;

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
 * document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));
 */
document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));


/**
 * Event listener per protezione accesso e popolamento form
 * 
 * @param {Event} load - Evento triggerato quando la pagina è completamente caricata
 * 
 * @see {@link LoggedUser.isLogged} Per verifica stato autenticazione
 * @see {@link LoggedUser.getData} Per recupero dati utente corrente
 * 
 * @description
 * Gestisce la protezione dell'accesso alla pagina e il popolamento iniziale del form.
 * - Verifica se l'utente è autenticato, altrimenti redirect a login.
 * - Popola i campi username ed email con i dati attuali dell'utente.
 * - Mostra la pagina rimuovendo la classe d-none dal body.
 * - Gestione errori con try-catch per graceful degradation.
 * 
 * @example
 * window.addEventListener("load", () => {
 *    if(!LoggedUser.isLogged()){
 *        window.location.href = "./login.html"
 *    } else {
 *        // Popola form con dati attuali
 *        // Mostra pagina
 *    }
 * });
 */
window.addEventListener("load", () => {

    console.log("On load: ", deleteRequest);
    try {
        if(!LoggedUser.isLogged()){
            window.location.href = "./login.html"
        }else{
            const currentUser = LoggedUser.getData();
            settingsInputFields.forEach(input =>{
                if(input.dataset.field != "password" && input.dataset.field != "confirm-password"){
                    input.value = currentUser[input.dataset.field];
                }
            });
        
            document.querySelector("body").classList.remove("d-none");
        }
    } catch (error) {
        alert("Ooops! Something went wrong. Please try again");
    }
});


// ============================================================================
// GESTIONE TOGGLE SEZIONI FORM
// ============================================================================

/**
 * Event listener per abilitazione/disabilitazione sezioni form
 * 
 * @param {Event} click - Evento click sui pulsanti "Allow Modification"
 * 
 * @see {@link formatInputField} Per reset formattazione visiva
 * @see {@link LoggedUser.getData} Per ripristino valori originali
 * 
 * @description
 * Gestisce il toggle dello stato di modifica per le singole sezioni del form.
 * - Toggle degli attributi required e disabled per gli input della sezione.
 * - Ripristino valori originali per username/email quando si disabilita la modifica.
 * - Aggiornamento formattazione visiva dei campi interessati.
 * - Gestione errori con try-catch per graceful degradation.
 * 
 * @example
 * allowModifBtns.forEach(btn => btn.addEventListener("click", (event) => {
 *    const sectionInputFields = event.target.closest(".form-section").querySelectorAll(".form-control");
 *    sectionInputFields.forEach(input => {
 *        input.toggleAttribute("required");
 *        input.toggleAttribute("disabled");
 *    });
 * }));
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


// ============================================================================
// GESTIONE VALIDAZIONE INPUT
// ============================================================================

/**
 * Event listener per validazione dinamica input form modifica
 * 
 * @param {Event} input - Evento input catturato automaticamente dai campi
 * 
 * @see {@link formatInputField} Per gestione formattazione visiva
 * @see {@link LoggedUser.getData} Per confronto con valori originali
 * 
 * @description
 * Gestisce la validazione in tempo reale degli input del form di modifica.
 * - Per conferma password, passa riferimento al campo password originale.
 * - Per username/email, gestisce required dinamico basato su modifiche effettive.
 * - Per password, gestisce abilitazione/disabilitazione campo conferma.
 * - Verifica validità complessiva per abilitare pulsante save.
 * - Flusso: input → formatInputField (UI.js) → inputValidation (sessionControl.js) → auth* (usersManagement.js)
 * 
 * @example
 * settingsInputFields.forEach(field => field.addEventListener("input", () => {
 *    let reference = field.id === "confirm-password" ? document.querySelector("#password").value : null;
 *    formatInputField(field, reference);
 *    // Logica specifica per username/email/password
 *    // Verifica validità complessiva
 * }));
 */
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
    
    allValid ? settingsSaveBtn.disabled = false : settingsSaveBtn.disabled = true;
}));


// ============================================================================
// GESTIONE ABILITAZIONE CONFERMA MODIFICHE
// ============================================================================

/**
 * Event listener per abilitazione pulsante conferma in modal
 * 
 * @param {Event} input - Evento input dal campo password corrente
 * 
 * @description
 * Gestisce l'abilitazione del pulsante conferma nella modal di autorizzazione.
 * - Abilita pulsante conferma solo se password corrente è inserita.
 * - Previene submit accidentali con modal vuota.
 * 
 * @example
 * settingsCurrentPassInput.addEventListener("input", () => {
 *    if(settingsCurrentPassInput.value.length > 0){
 *        settingsConfirmBtn.disabled = false;
 *    } else {
 *        settingsConfirmBtn.disabled = true;
 *    }
 * });
 */
settingsCurrentPassInput.addEventListener("input", () => {
    if(settingsCurrentPassInput.value.length < 1){
        settingsConfirmBtn.disabled = true;
    }else{
        settingsConfirmBtn.disabled = false;
    }
});

// ============================================================================
// GESTIONE DELETE ACCOUNT
// ============================================================================

/**
 * Event listener per richiesta eliminazione account
 * 
 * @param {Event} click - Evento click sul pulsante "Delete account"
 * 
 * @description
 * Imposta il flag deleteRequest a true quando l'utente clicca sul pulsante delete account.
 * Questo flag viene utilizzato dal submit handler per distinguere tra modifica dati ed eliminazione account.
 * Il flag rimane true fino a quando non viene resettato dal dismiss button o dal completamento dell'operazione.
 * 
 * @example
 * document.getElementById("delete-btn").addEventListener("click", () => deleteRequest = true);
 */
document.getElementById("delete-btn").addEventListener("click", () => deleteRequest = true);


/**
 * Event listener per cancellazione richiesta eliminazione account
 * 
 * @param {Event} click - Evento click sul pulsante dismiss della modal di conferma delete
 * 
 * @description
 * Reset del flag deleteRequest a false quando l'utente chiude la modal di conferma delete.
 * Questo previene che una richiesta di delete precedente venga eseguita accidentalmente
 * in sessioni successive o dopo chiusura della modal senza conferma.
 * 
 * @example
 * document.getElementById("delete-dismiss-btn").addEventListener("click", () => deleteRequest = false);
 */
document.getElementById("delete-dismiss-btn").addEventListener("click", () => deleteRequest = false);



// ============================================================================
// GESTIONE SUBMIT
// ============================================================================

/**
 * Event listener per submit delle modifiche o eliminazione account
 * 
 * @param {Event} click - Evento click sul pulsante conferma modal
 * 
 * @see {@link LoggedUser.authOperations} Per verifica password corrente
 * @see {@link LoggedUser.changePassword} Per aggiornamento password
 * @see {@link LoggedUser.changeUsername} Per aggiornamento username
 * @see {@link LoggedUser.changeEmail} Per aggiornamento email
 * @see {@link LoggedUser.deleteAccount} Per eliminazione account utente
 * @see {@link showOverlay} Per mostrare indicatore caricamento
 * @see {@link hideOverlay} Per nascondere indicatore caricamento
 * 
 * @description
 * Gestisce il processo completo di aggiornamento dati utente o eliminazione account con autorizzazione.
 * - Verifica password corrente prima di procedere con qualsiasi operazione.
 * - Mostra overlay di caricamento durante processing.
 * - Se deleteRequest è false: itera sui campi required e aggiorna in base al tipo (password/username/email).
 * - Se deleteRequest è true: mostra dialog di conferma finale e procede con eliminazione account.
 * - Per password, esclude campo confirm-password dal processing.
 * - Mostra alert di successo per ogni campo aggiornato singolarmente o per eliminazione completata.
 * - In caso di password errata: pulisce campo e nasconde overlay.
 * - In caso di errore validazione: gestione specifica per 409/422, altrimenti errore generico con field context.
 * - Reload pagina per reset stato dopo operazioni (successo o errore).
 * - Usa for...of per gestire correttamente async operations.
 * - Tracking campo corrente per debug e error reporting specifico.
 * 
 * @example
 * settingsConfirmBtn.addEventListener("click", async () => {
 *    let currentInputField;
 *    try {
 *        if(await LoggedUser.authOperations(currentPassword)){
 *            if(!deleteRequest){ // Modifica dati
 *                for(const input of settingsInputFields){
 *                    if(input.required){
 *                        currentInputField = input.dataset.field;
 *                        switch(currentInputField){
 *                            case "password":
 *                                await LoggedUser.changePassword(input.value, confirmPassword);
 *                                alert(`${input.dataset.field} successfully updated`);
 *                                break;
 *                            // altri cases
 *                        }
 *                    }
 *                }
 *            } else { // Eliminazione account
 *                const lastConfirm = confirm("...");
 *                if(lastConfirm){
 *                    LoggedUser.deleteAccount();
 *                    alert("Account deleted successfully");
 *                }
 *            }
 *            location.reload();
 *        } else {
 *            currentPasswordInput.value = "";
 *            alert("Wrong password");
 *            hideOverlay();
 *        }
 *    } catch (error) {
 *        // Gestione errori con context specifico del campo
 *        alert(`Unable to modify ${currentInputField}`);
 *        location.reload();
 *    }
 * });
 */
settingsConfirmBtn.addEventListener("click", async () => {
    
    let currentInputField;

    try {
        showOverlay();
        
        const currentPasswordInput = document.getElementById("current-password");

        if(await LoggedUser.authOperations(currentPasswordInput.value)){
            
            if(!deleteRequest){ // Modifica dati
                for(const input of settingsInputFields){ // NB -> forech non adatto per async op
                    if(input.required){
                        currentInputField = input.dataset.field;       
                        switch(currentInputField){
                            case "password":
                                if(input.id != "confirm-password"){
                                    await LoggedUser.changePassword(input.value, document.getElementById("confirm-password").value);
                                    alert(`${input.dataset.field} successfully updated`);
                                }
                                break;
                            case "username":
                                await LoggedUser.changeUsername(input.value);
                                alert(`${input.dataset.field} successfully updated`);
                                break;
                            case "email":
                                await LoggedUser.changeEmail(input.value);
                                alert(`${input.dataset.field} successfully updated`);
                                break;
                            default:
                                if(input.dataset.field != "confirm-password"){
                                    const badRequest = new Error(`${input.id} is not a supported field type`);
                                    console.error(badRequest.message);
                                    throw badRequest;   
                                }
                        }
                    }
                };

            }else{ // Eliminazione account
                const lastConfirm = confirm("Selecting ok your account will be permanently deleted.\nDo you want to proceed anyway?");
                if(lastConfirm){
                    LoggedUser.deleteAccount();
                    alert("Account deleted successfully");
                }
            }
            
        location.reload();

        }else{
            currentPasswordInput.value = "";
            alert("Wrong password");
            hideOverlay();
        }
    } catch (error) {
        if(error.code === 409 || error.code === 422){
            alert(error.message);
        }else{
            console.error(error.stack);
            alert(`Ooops! Something went wrong.\nUnable to modify ${currentInputField}. Please try again.`);
        }
        location.reload();
    }
});

// ============================================================================
// GESTIONE RESET FORM
// ============================================================================

/**
 * Event listener per reset completo della pagina
 * 
 * @param {Event} click - Evento click sul pulsante clear
 * 
 * @description
 * Gestisce il reset completo della pagina ricaricandola.
 * - Ripristina tutti i campi ai valori originali.
 * - Reset dello stato di validazione e abilitazione sezioni.
 * 
 * @example
 * settingsClearBtn.addEventListener("click", () => location.reload());
 */
settingsClearBtn.addEventListener("click", () => location.reload());




/**
 * @description Flusso di esecuzione del file modif.js
 * 
 * 1. **Import moduli e dipendenze**:
 *    - Importa LoggedUser da sessionControl.js per gestione utente autenticato
 *    - Importa funzioni UI da UI.js (initializeNavbar, formatInputField)
 * 
 * 2. **Selezione elementi DOM**:
 *    - Recupera riferimenti a input form, pulsanti toggle sezioni, submit e navigazione
 * 
 * 3. **Inizializzazione pagina**:
 *    - DOMContentLoaded: configura navbar
 *    - load: verifica autenticazione, popola form con dati utente, mostra pagina
 * 
 * 4. **Gestione toggle sezioni (event listener su allowModifBtns)**:
 *    - Toggle required/disabled per campi delle sezioni specifiche
 *    - Ripristino valori originali quando si disabilita modifica
 * 
 * 5. **Gestione validazione input (event listener su settingsInputFields)**:
 *    - Validazione dinamica: formato + required intelligente per username/email
 *    - Gestione password e confirm-password con dipendenze
 *    - Verifica validità complessiva per abilitare save button
 * 
 * 6. **Gestione abilitazione modal (event listener su settingsCurrentPassInput)**:
 *    - Abilita pulsante conferma modal solo se password corrente inserita
 * 
 * 7. **Gestione submit autorizzato (event listener su settingsConfirmBtn)**:
 *    - Verifica password corrente con LoggedUser.authOperations
 *    - Processing selettivo campi required: password/username/email updates
 *    - Alert di successo per ogni campo + reload finale
 *    - Gestione errori con try-catch e reload in caso di failure
 * 
 * 8. **Gestione reset (event listener su settingsClearBtn)**:
 *    - Reset completo via location.reload()
 * 
 * @note Il flusso è completamente asincrono per submit, sincrono per validazione
 * @note Protezione accesso: redirect automatico se non autenticato
 * @note Sicurezza: doppia autenticazione (login + password corrente per modifiche)
 * @note Graceful degradation: errori locali non crashano l'app, reload ripristina stato pulito
 * @note UX intelligente: required dinamico, toggle sezioni, validazione granulare
 */



