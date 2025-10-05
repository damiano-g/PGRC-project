/**
 * @fileoverview Gestione della pagina dei preferiti dell'utente
 * @description Gestisce l'inizializzazione, il caricamento e le interazioni della pagina personale dell'utente.
 * Include popolamento dinamico delle sezioni preferiti, recensioni e note, gestione degli eventi di click
 * per navigazione e toggle preferiti, e gestione errori con graceful degradation.
 * @requires sessionControl.js Per moduli LoggedUser, PreviewArray, Recipe
 * @requires UI.js Per funzioni di rendering UI (addPreviewToContainer, favBtnDisplay, initializeNavbar, populatePreviewContainer, removePreviewFromContainer)
 */

import { LoggedUser, PreviewArray, Recipe } from "../services/session-service.js";
import { addPreviewToContainer, favBtnDisplay, initializeNavbar, populatePreviewContainer, removePreviewFromContainer } from "../components/ui.js";

// ================================================================================================
// DOM ELEMENTS
// ================================================================================================

/** Container ricette preferite */
const personalFavsContainer = document.getElementById("fav-recipes");
/** Container ricette recensite */
const personalRevsContainer = document.getElementById("rev-recipes");
/** Container ricette annotate */
const personalNotesContainer = document.getElementById("noted-recipes");
/** Body pagina personale (per gestione visibilità) */
const personalPageBody = document.querySelector("body");


// ================================================================================================
// EVENT HANDLERS
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

/**
 * Event listener per gestione click su card ricetta e icona preferiti
 * 
 * @param {Event} click - Evento click catturato dal container
 * 
 * @see {@link favBtnDisplay} Per gestione stato icona preferiti
 * @see {@link addPreviewToContainer} Per aggiunta preview al container
 * @see {@link removePreviewFromContainer} Per rimozione preview dal container
 * @see {@link LoggedUser.updateFavourites} Per toggle preferiti
 * @see {@link PreviewArray.mealsById} Per recupero preview ricetta
 * 
 * @description
 * Gestisce interazioni utente su card e preferiti tramite event delegation.
 * - Click su .card: naviga a pagina dettagli ricetta
 * - Click su .fav-icon: toggle preferiti, aggiorna container e icone nei altri container
 * - Gestione errori con graceful degradation: alert utente, log console
 * - Event delegation per gestire elementi creati dinamicamente
 * 
 * Gestione errori dettagliata:
 * - Try-catch interno: cattura errori specifici nelle operazioni (fav), mostra alert generico e log errore console
 * - Graceful degradation: in caso di errore, UI rimane funzionale per altre azioni
 * - Nessun crash dell'applicazione: errori vengono contenuti e gestiti localmente senza interrompere il flusso utente
 * 
 * @example
 * // Evento catturato automaticamente dal container
 * personalPageBody.addEventListener("click", async click => {
 *    if(card && !isBtn){ ... }
 *    if(isBtn){ ... }
 * });
 * 
 * @todo Aggiungere feedback visivo (spinner, messaggi di stato) durante operazioni asincrone
 */
personalPageBody.addEventListener("click", async (click) => {
    const card = click.target.closest(".card");
    const isBtn = click.target.matches(".fav-icon");

    if(card && !isBtn){
        window.location.href = `../../pages/recipe-details.html?id=${card.dataset.itemId}`;
    };

    if(isBtn){
        
        const clickedCardRecipeId = card.dataset.itemId;
        
        try {
            await LoggedUser.updateFavourites(clickedCardRecipeId);
            
            // Aggiunge o rimuove ricetta dal container dei preferiti
            if(Recipe.isFavourite(card.dataset.itemId)){
                populatePreviewContainer(await PreviewArray.fromUserFavourites(), personalFavsContainer);
            }else{
                removePreviewFromContainer(await PreviewArray.mealsById([clickedCardRecipeId]), personalFavsContainer);
            }
    
            // Aggiorna icone preferiti nei container reviews e notes
            personalRevsContainer.querySelectorAll(".fav-icon").forEach(btn => favBtnDisplay(btn, btn.closest(".card").dataset.itemId));
            personalNotesContainer.querySelectorAll(".fav-icon").forEach(btn => favBtnDisplay(btn, btn.closest(".card").dataset.itemId));
        } catch (error) {
            console.error(error);
            alert("Ooops! Something went wrong. Try reload the page");
        }
    };
});

/**
 * Event listener per inizializzazione pagina personale utente
 * 
 * @param {Event} load - Evento load della finestra (triggerato automaticamente al caricamento completo della pagina)
 * 
 * @see {@link LoggedUser.isLogged} Per verifica stato login utente
 * @see {@link populatePreviewContainer} Per popolamento container con preview
 * @see {@link PreviewArray.fromUserFavourites} Per recupero ricette preferite
 * @see {@link PreviewArray.fromUserReviews} Per recupero ricette recensite
 * @see {@link PreviewArray.fromAllUserNotes} Per recupero ricette annotate
 * 
 * @description
 * Gestisce il caricamento e rendering iniziale della pagina preferiti.
 * - Verifica autenticazione e gestisce redirect.
 * - Carica e visualizza ricette preferite, recensite e annotate.
 * - Gestione errori con alert e log console per graceful degradation
 * 
 * @example
 * // Evento triggerato automaticamente al caricamento pagina
 * window.addEventListener("load", async () => {
 *    if(!isUserLogged){ window.location.href = "./login.html" }
 *    populatePreviewContainer(await PreviewArray.fromUserFavourites(), personalFavsContainer);
 *    // ... popolamento altre sezioni
 * });
 * 
 * @todo Aggiungere loading spinner durante caricamento dati
 */
window.addEventListener("load", async () => {
    // Check autenticazione utente
    let isUserLogged;
    try {
        isUserLogged = LoggedUser.isLogged();
    } catch (error) {
        isUserLogged = false;
        console.error(error);
    }

    if(!isUserLogged){
        window.location.href = "./login.html"
    }else{
        personalPageBody.classList.remove("d-none");
    };

    // Rendering sezione preferiti
    personalFavsContainer.innerHTML = "Add recipes to favourites to view them in this area";
    try {
        populatePreviewContainer(await PreviewArray.fromUserFavourites(), personalFavsContainer);
    } catch (error) {
        personalFavsContainer.innerHTML = "Ooops. Something went wrong. Try reload the page";
        console.error(error);
    }

    // Rendering sezione recensioni
    personalRevsContainer.innerHTML = "Rate recipes taste and difficulty to view them in this area";
    try {
        populatePreviewContainer(await PreviewArray.fromUserReviews(), personalRevsContainer);
    } catch (error) {
        personalFavsContainer.innerHTML = "Ooops. Something went wrong. Try reload the page";
        console.error(error);
    }

    // Rendering sezione note
    personalNotesContainer.innerHTML = "Take notes to view relative recipes in this area";
    try {
        populatePreviewContainer(await PreviewArray.fromAllUserNotes(), personalNotesContainer);
    } catch (error) {
        personalFavsContainer.innerHTML = "Ooops. Something went wrong. Try reload the page";
        console.error(error);
    }
});

/**
 * Event listener per gestione navigazione tab
 * 
 * @param {Event} click - Evento click catturato dal container
 * 
 * @description
 * Gestisce click sulle tab per scrollare in alto con animazione smooth.
 * 
 * @example
 * // Evento catturato automaticamente dal container
 * document.getElementById("page-title").addEventListener("click", click => {
 *    if(link){ window.scroll({top: 0, behavior: "smooth"}); }
 * });
 */
document.getElementById("page-title").addEventListener("click", click => {
    const link = click.target.closest(".nav-link");

    if(link){
        window.scroll({top: 0, behavior: "smooth"});
    }
});


// ================================================================================================
// FLUSSO DI ESECUZIONE DOCUMENTATO
// ================================================================================================

/**
 * @description Flusso di esecuzione del file favourites.js
 * 
 * 1. **Import moduli e dipendenze**:
 *    - Importa LoggedUser, PreviewArray, Recipe da sessionControl.js
 *    - Importa funzioni UI da UI.js (addPreviewToContainer, favBtnDisplay, initializeNavbar, populatePreviewContainer, removePreviewFromContainer)
 * 
 * 2. **Selezione elementi DOM**:
 *    - Recupera riferimenti a container per ricette preferite, recensite, annotate e body della pagina
 * 
 * 3. **Inizializzazione navbar (DOMContentLoaded)**:
 *    - Al caricamento del DOM, chiama initializeNavbar per configurare menu navigazione basato su stato utente
 * 
 * 4. **Gestione interazioni click (event delegation su personalPageBody)**:
 *    - Ascolta click su .card: naviga a pagina dettagli ricetta
 *    - Ascolta click su .fav-icon: toggle preferiti, aggiorna container e icone nei altri container
 *    - Gestione errori con try-catch per graceful degradation
 * 
 * 5. **Inizializzazione pagina (window load)**:
 *    - Verifica autenticazione utente: redirect a login se non loggato, altrimenti mostra pagina
 *    - Popola sezione preferiti con PreviewArray.fromUserFavourites()
 *    - Popola sezione recensioni con PreviewArray.fromUserReviews()
 *    - Popola sezione note con PreviewArray.fromAllUserNotes()
 *    - Gestione errori per ogni sezione con messaggi di fallback
 * 
 * 6. **Gestione navigazione tab (event listener su page-title)**:
 *    - Ascolta click su .nav-link: scrolla in alto con animazione smooth
 * 
 * @note Il flusso è asincrono: popolamento container usa await per dati dinamici
 * @note Event delegation usato per gestire elementi dinamici (card)
 * @note Graceful degradation: errori locali non crashano l'app, UI rimane funzionale con messaggi di errore
 */