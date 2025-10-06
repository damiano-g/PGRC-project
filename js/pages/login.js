/**
 * @fileoverview Gestione pagina login utente - validazione form e autenticazione
 * @description Implementa validazione in tempo reale, gestione submit sicuro con autenticazione,
 * navigazione a registrazione e protezione accesso autenticato
 * @requires sessionControl.js Per moduli LoggedUser e NewUser
 * @requires UI.js Per funzioni di rendering UI (initializeNavbar, showOverlay, hideOverlay)
 */

// ============================================================================
// IMPORT MODULI E DIPENDENZE
// ============================================================================

import { LoggedUser, NewUser } from "../services/session-service.js";
import { hideOverlay, initializeNavbar, showOverlay } from "../components/ui.js";



// ============================================================================
// SELEZIONE ELEMENTI DOM
// ============================================================================

/**
 * Campi input richiesti del form di login
 * @type {NodeListOf<HTMLInputElement>}
 * @description Include username e password per validazione dinamica
 */
const loginRequiredInputs = document.querySelectorAll("#login-form input");

/**
 * Pulsante submit per esecuzione login
 * @type {HTMLButtonElement}
 * @description Esegue l'autenticazione quando tutti i campi sono validi
 */
const loginSubBtn = document.getElementById("submit");

/**
 * Pulsante navigazione a pagina registrazione
 * @type {HTMLButtonElement}
 * @description Redirect a signin.html per registrazione nuovo utente
 */
const loginGotoSigninBtn = document.getElementById("goto-signin");


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
document.addEventListener("DOMContentLoaded", initializeNavbar(document.querySelector("body"), document.querySelector("nav")));

/**
 * Event listener per protezione accesso e gestione redirect
 * 
 * @param {Event} load - Evento triggerato quando la pagina è completamente caricata
 * 
 * @see {@link LoggedUser.isLogged} Per verifica stato autenticazione
 * 
 * @description
 * Gestisce la protezione dell'accesso alla pagina di login e i redirect intelligenti.
 * - Verifica se l'utente è già autenticato.
 * - Se autenticato: redirect intelligente basato su pagina precedente.
 * - Se provenienza da favourites.html: redirect a index.html.
 * - Altrimenti: redirect a favourites.html.
 * - Se non autenticato: mostra la pagina rimuovendo la classe d-none dal body.
 * - Gestione errori con try-catch per graceful degradation.
 * 
 * @example
 * window.addEventListener("load", () => {
 *    if(LoggedUser.isLogged()){
 *        if(previousUrl.includes("favourites.html")){
 *            window.location.href = "../index.html";
 *        } else {
 *            window.location.href = "./favourites.html";
 *        }
 *    } else {
 *        document.querySelector("body").classList.remove("d-none");
 *    }
 * });
 */
window.addEventListener("load", () => {

    const previousUrl = document.referrer;

    try {
        if(LoggedUser.isLogged()){
            if(previousUrl && previousUrl.includes("favourites.html")){
                window.location.href = "../index.html";
            }else{
                window.location.href = "./favourites.html";
            }
        }else{
            document.querySelector("body").classList.remove("d-none");
        }
    } catch (error) {
        alert("Ooops. Something went wrong. Please try again");
    }
});


// ============================================================================
// GESTIONE VALIDAZIONE INPUT
// ============================================================================

/**
 * Event listener per validazione dinamica input form login
 * 
 * @param {Event} input - Evento input catturato automaticamente dai campi
 * 
 * @description
 * Gestisce la validazione in tempo reale degli input del form di login.
 * - Aggiunge/rimuove classe "valid" basata sulla presenza di testo.
 * - Verifica validità complessiva per abilitare pulsante submit.
 * - Flusso semplice: presenza testo → classe valid → abilitazione pulsante.
 * 
 * @example
 * loginRequiredInputs.forEach(inputField => inputField.addEventListener("input", () => {
 *    if(inputField.value.length > 0){
 *        inputField.classList.add("valid");
 *    } else {
 *        inputField.classList.remove("valid");
 *    }
 *    // Verifica validità complessiva
 *    allValid ? loginSubBtn.disabled = false : loginSubBtn.disabled = true;
 * }));
 */
loginRequiredInputs.forEach(inputField => inputField.addEventListener("input", () =>{
    
    if(inputField.value.length > 0){
        inputField.classList.add("valid");
    }else{
        inputField.classList.remove("valid");
    }
    
    let allValid = true;
    
    loginRequiredInputs.forEach(field => {
        console.log(field.classList.contains("valid"));
        if(!field.classList.contains("valid")){
            allValid = false;
        }
    });
    allValid ? loginSubBtn.disabled = false : loginSubBtn.disabled = true;
}));



// ============================================================================
// GESTIONE SUBMIT
// ============================================================================

/**
 * Event listener per submit autenticazione utente
 * 
 * @param {Event} click - Evento click sul pulsante submit
 * 
 * @see {@link NewUser.startSession} Per esecuzione autenticazione
 * @see {@link showOverlay} Per mostrare indicatore caricamento
 * @see {@link hideOverlay} Per nascondere indicatore caricamento
 * 
 * @description
 * Gestisce il processo di autenticazione utente con gestione errori.
 * - Mostra overlay di caricamento durante l'autenticazione.
 * - Recupera valori username e password dai campi form.
 * - Esegue autenticazione con NewUser.startSession.
 * - In caso di successo: redirect a favourites.html.
 * - In caso di password errata: alert semplice.
 * - In caso di utente non trovato (404): alert specifico con username.
 * - In caso di altri errori: alert generico.
 * - Nasconde overlay sempre alla fine.
 * 
 * @example
 * loginSubBtn.addEventListener("click", async () => {
 *    showOverlay();
 *    try {
 *        if(await NewUser.startSession(username, password)){
 *            window.location.href = "./favourites.html";
 *        } else {
 *            alert("Wrong password");
 *        }
 *    } catch (error) {
 *        if(error.code === 404){
 *            alert(`User ${username} not found`);
 *        } else {
 *            alert("Ooops. Something went wrong. Please try again");
 *        }
 *    }
 *    hideOverlay();
 * });
 */
loginSubBtn.addEventListener("click", async () => {
    
   showOverlay();
   const insertedUsername = document.querySelector("#username").value;
   const insertedPassword = document.querySelector("#password").value;
   try{
       if(await NewUser.startSession(insertedUsername, insertedPassword)){
            window.location.href = "./favourites.html";
        }else{
            alert("Wrong password");
        }
    }catch(error){
        if(error.code === 404){
            alert(`User ${insertedUsername} not found`)
        }else{
            alert("Ooops. Something went wrong. Please try again");
        }
    }
    
    hideOverlay();
});


// ============================================================================
// GESTIONE NAVIGAZIONE
// ============================================================================

/**
 * Event listener per navigazione a pagina registrazione
 * 
 * @param {Event} click - Evento click sul pulsante "goto-signin"
 * 
 * @description
 * Gestisce la navigazione alla pagina di registrazione quando l'utente sceglie di creare un nuovo account.
 * 
 * @example
 * loginGotoSigninBtn.addEventListener("click", () => window.location.href = "./signin.html");
 */
loginGotoSigninBtn.addEventListener("click", () => window.location.href = "./signin.html");



/**
 * @description Flusso di esecuzione del file login.js
 * 
 * 1. **Import moduli e dipendenze**:
 *    - Importa LoggedUser e NewUser da sessionControl.js per gestione autenticazione
 *    - Importa funzioni UI da UI.js (initializeNavbar, showOverlay, hideOverlay)
 * 
 * 2. **Selezione elementi DOM**:
 *    - Recupera riferimenti a input form, pulsante submit e pulsante navigazione
 * 
 * 3. **Inizializzazione pagina**:
 *    - DOMContentLoaded: configura navbar
 * 
 * 4. **Gestione navigazione (event listener su loginGotoSigninBtn)**:
 *    - Redirect a signin.html per registrazione
 * 
 * 5. **Gestione validazione input (event listener su loginRequiredInputs)**:
 *    - Validazione semplice: presenza testo → classe "valid"
 *    - Verifica validità complessiva per abilitare submit button
 * 
 * 6. **Gestione submit (event listener su loginSubBtn)**:
 *    - Mostra overlay durante autenticazione
 *    - Recupera valori form e chiama NewUser.startSession
 *    - Gestione success: redirect a favourites.html
 *    - Gestione errori: alert specifici per 404, generici per altri
 *    - Nasconde overlay sempre
 * 
 * 7. **Protezione accesso (event listener su window load)**:
 *    - Verifica autenticazione esistente
 *    - Redirect intelligente basato su provenienza
 *    - Mostra pagina se non autenticato
 * 
 * @note Il flusso è asincrono per submit, sincrono per validazione
 * @note Protezione accesso: redirect automatico se già autenticato
 * @note Sicurezza: validazione client-side + autenticazione server-side
 * @note Graceful degradation: errori locali non crashano l'app
 * @note UX: validazione real-time, overlay durante loading, redirect intelligenti
 */