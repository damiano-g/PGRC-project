/**
 * @fileoverview Gestione pagina ricerca ricette - controllo UI e navigazione
 * @description Implementa funzionalità di ricerca per nome e categoria, gestione risultati,
 * navigazione ai dettagli e sincronizzazione con cronologia browser
 * @requires sessionControl.js Per moduli LoggedUser, PreviewArray
 * @requires UI.js Per funzioni di rendering UI (favBtnDisplay, initializeNavbar, populatePreviewContainer)
 */

// ===============================
// IMPORT MODULI E DIPENDENZE
// ===============================

import { LoggedUser, PreviewArray } from "../sessionControl.js";
import { favBtnDisplay, initializeNavbar, populatePreviewContainer } from "../UI.js"; // Componenti UI per rendering

// ===============================
// SELEZIONE ELEMENTI DOM
// ===============================

/** @type {HTMLButtonElement} Pulsante per avviare la ricerca */
const searchBtn = document.getElementById("searchBtn");

/** @type {HTMLInputElement} Campo di input per il termine di ricerca */
const searchBar = document.getElementById("searchBar");

/** @type {HTMLElement} Container di visualizzazione dei risultati di ricerca */
const resultsContainer = document.getElementById("results-container");


/**
 * Funzione per gestione ricerca da URL (query parameters)
 * 
 * @see {@link PreviewArray.mealsByCategory} Per recupero ricette per categoria
 * @see {@link populatePreviewContainer} Per popolamento container risultati
 * 
 * @description
 * Gestisce caricamento pagina con parametri URL per ricerca automatica.
 * - Se parametro "q": imposta valore searchBar e simula click su searchBtn.
 * - Se parametro "cat": popola container con ricette della categoria.
 * - Gestione errori con messaggi di fallback per graceful degradation.
 * 
 * @example
 * // Chiamata automatica al load della pagina
 * navigationSearch();
 * 
 */
async function navigationSearch(){
    // Parsing manuale dell'URL query string (es. "?q=pasta" → ["q", "pasta"])
    const query = window.location.search.substring(1).split("=");
    
    if(query[0] === "q"){
        searchBar.value = query[1];
        searchBtn.click();
    }
    
    if(query[0] === "cat"){
        try {
            populatePreviewContainer(await PreviewArray.mealsByCategory(query[1]), resultsContainer);
        } catch (error) {
            resultsContainer.innerHTML = "Ooops! Something went wrong. Try reload the page";
            console.error(error);
        }
    }  
};


// ================================================================================================
// INIZIALIZZAZIONE PAGINA
// ================================================================================================

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
document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));




// ================================================================================================
// GESTIONE CARICAMENTO PAGINA
// ================================================================================================

/**
 * Event listener per caricamento iniziale della pagina
 * 
 * @param {Event} load - Evento load della finestra (triggerato automaticamente al caricamento completo della pagina)
 * 
 * @see {@link navigationSearch} Per gestione parametri URL
 * 
 * @description
 * Gestisce caricamento iniziale della pagina.
 * - Chiama navigationSearch per gestire parametri URL e ricerca automatica.
 * 
 * @example
 * // Evento triggerato automaticamente al caricamento pagina
 * window.addEventListener("load", navigationSearch);
 */
window.addEventListener("load", navigationSearch);





// ================================================================================================
// GESTIONE CRONOLOGIA BROWSER
// ================================================================================================

/**
 * Event listener per navigazione cronologia (pulsanti Indietro/Avanti)
 * 
 * @param {Event} popstate - Evento triggerato quando l'utente naviga nella cronologia
 * 
 * @see {@link navigationSearch} Per gestione parametri URL
 * 
 * @description
 * Gestisce navigazione cronologia browser.
 * - Ricarica la pagina per ripristinare lo stato corretto basato sull'URL.
 * 
 * @example
 * // Evento triggerato automaticamente dalla navigazione browser
 * window.addEventListener("popstate", navigationSearch);
 */
window.addEventListener("popstate", navigationSearch);





// ================================================================================================
// GESTIONE RICERCA PER NOME
// ================================================================================================

/**
 * Event listener per il pulsante di ricerca
 * 
 * @param {Event} click - Evento click catturato dal pulsante
 * 
 * @see {@link PreviewArray.mealsByName} Per recupero ricette per nome
 * @see {@link populatePreviewContainer} Per popolamento container risultati
 * 
 * @description
 * Gestisce ricerca per nome ricetta + aggiornamento URL per navigazione.
 * - Recupera ricette per nome da API.
 * - Aggiorna URL con history.pushState per sincronizzazione cronologia.
 * - Popola container risultati o mostra messaggio se nessun risultato.
 * - Gestione errori robusta con try-catch: alert utente e log console per graceful degradation.
 * 
 * Gestione errori dettagliata:
 * - Try-catch interno: cattura errori specifici nelle operazioni (ricerca), mostra alert generico e log errore console.
 * - Graceful degradation: in caso di errore, UI rimane funzionale per altre azioni.
 * - Nessun crash dell'applicazione: errori vengono contenuti e gestiti localmente senza interrompere il flusso utente.
 * 
 * @example
 * // Evento catturato automaticamente dal pulsante
 * searchBtn.addEventListener("click", async () => {
 *    const recipesPreviewArray = await PreviewArray.mealsByName(String(searchBar.value));
 *    if(recipesPreviewArray){ ... } else { ... }
 * });
 * 
 * @todo Aggiungere feedback visivo (spinner, messaggi di stato) durante operazioni asincrone
 */
searchBtn.addEventListener("click", async () => {
    try {
        const recipesPreviewArray = await PreviewArray.mealsByName(String(searchBar.value));
        if(recipesPreviewArray){
            history.pushState(null, "", `../../pages/search.html?q=${String(searchBar.value)}`);
            populatePreviewContainer(recipesPreviewArray, resultsContainer);
        }else{
            const paragraph = document.createElement("div");
            paragraph.innerText = "La ricerca non ha prodotto risultati";
            resultsContainer.innerHTML = "";
            resultsContainer.appendChild(paragraph);
        }
    } catch (error) {
        resultsContainer.innerHTML = "Ooops! Something went wrong. Try reload the page."
        console.error(error);
    }
});




// ================================================================================================
// NAVIGAZIONE AI DETTAGLI RICETTA
// ================================================================================================

/**
 * Event delegation per click su card dei risultati
 * 
 * @param {Event} click - Evento click catturato dal container
 * @returns {void}
 * 
 * @see {@link favBtnDisplay} Per gestione stato icona preferiti
 * @see {@link LoggedUser.updateFavourites} Per toggle preferiti
 * @see {@link LoggedUser.isLogged} Per verifica stato login utente
 * 
 * @description
 * Gestisce click su card dei risultati per navigazione a dettagli ricetta o toggle preferiti.
 * - Click su .card (non su .fav-icon): naviga a pagina dettagli ricetta passando ID come query parameter.
 * - Click su .fav-icon: se utente loggato, toggle preferiti e aggiorna icona; altrimenti redirect a login.
 * - Gestione errori robusta con try-catch: alert utente e log console per graceful degradation.
 * - Event delegation per gestire elementi creati dinamicamente (card dei risultati).
 * 
 * Gestione errori dettagliata:
 * - Try-catch interno: cattura errori specifici nelle operazioni (fav), mostra alert generico e log errore console.
 * - Graceful degradation: in caso di errore, UI rimane funzionale per altre azioni.
 * - Nessun crash dell'applicazione: errori vengono contenuti e gestiti localmente senza interrompere il flusso utente.
 * 
 * @example
 * // Evento catturato automaticamente dal container
 * resultsContainer.addEventListener("click", (click) => {
 *    if(card && !isBtn){ window.location.href = `../../pages/recipe-details.html?id=${card.dataset.itemId}`; }
 *    if(isBtn){ if(LoggedUser.isLogged()){ ... } else { window.location.href = "./login.html"; } }
 * });
 * 
 */
resultsContainer.addEventListener("click", (click) => {

    // Cattura evento click -> se il target è inserito in un elemento .card (o lo è) 
    // restituisce il primo elemento card incontrato nella gerarchia (event bubbling)
    const card = click.target.closest(".card");
    const isBtn = click.target.matches(".fav-icon");

    if(card && !isBtn){
        // Naviga alla pagina dettagli passando l'ID della ricetta come query parameter
        window.location.href = `../../pages/recipe-details.html?id=${card.dataset.itemId}`;
    };

    if(isBtn){
        try {
            if(LoggedUser.isLogged()){
                LoggedUser.updateFavourites(card.dataset.itemId);
                favBtnDisplay(card.querySelector(".fav-icon"), card.dataset.itemId);
            }else{
                window.location.href = "./login.html";
            };
        } catch (error) {
            alert("Ooops! Something went wrong. Please try again.");
            console.error(error);
        }
    };
});




// ================================================================================================
// FLUSSO DI ESECUZIONE DOCUMENTATO
// ================================================================================================

/**
 * @description Flusso di esecuzione del file search.js
 * 
 * 1. **Import moduli e dipendenze**:
 *    - Importa LoggedUser, PreviewArray da sessionControl.js
 *    - Importa funzioni UI da UI.js (favBtnDisplay, initializeNavbar, populatePreviewContainer)
 * 
 * 2. **Selezione elementi DOM**:
 *    - Recupera riferimenti a searchBtn, searchBar, resultsContainer
 * 
 * 3. **Inizializzazione navbar (DOMContentLoaded)**:
 *    - Al caricamento del DOM, chiama initializeNavbar per configurare menu navigazione basato su stato utente
 * 
 * 4. **Gestione ricerca da URL (navigationSearch)**:
 *    - Al load della pagina, parsing query parameters
 *    - Se "q": imposta searchBar e simula click su searchBtn
 *    - Se "cat": popola container con ricette della categoria
 *    - Gestione errori per graceful degradation
 * 
 * 5. **Gestione ricerca manuale (event listener su searchBtn)**:
 *    - Ascolta click su searchBtn: recupera ricette per nome, aggiorna URL, popola container
 *    - Gestione errori con try-catch per graceful degradation
 * 
 * 6. **Navigazione da risultati (event listener su resultsContainer)**:
 *    - Ascolta click su .card: naviga a recipe-details.html
 *    - Ascolta click su .fav-icon: toggle preferiti se loggato, altrimenti redirect a login
 *    - Gestione errori con try-catch per graceful degradation
 * 
 * 7. **Gestione cronologia (popstate)**:
 *    - Ascolta navigazione browser: chiama navigationSearch per ripristinare stato
 * 
 * @note Il flusso è asincrono: operazioni API usano await per dati dinamici
 * @note Event delegation usato per gestire elementi dinamici (card)
 * @note Graceful degradation: errori locali non crashano l'app, UI rimane funzionale con messaggi di errore
 */