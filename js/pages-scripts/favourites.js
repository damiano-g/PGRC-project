/**
 * @fileoverview Gestione pagina personale utente con sezioni favourites, reviews e notes
 * @description Pagina protetta che mostra ricette salvate, recensite e annotate dall'utente loggato.
 * Implementa autenticazione, caricamento dati utente e rendering con rating personalizzati.
 * @requires UI - Display components per preview con rating e note
 * @requires sessionControl - Autenticazione e gestione dati utente
 */

import { LoggedUser, PreviewArray } from "../sessionControl.js";
import { favBtnDisplay, populatePreviewContainer } from "../UI.js";

// ================================================================================================
// DOM ELEMENTS
// ================================================================================================

/** 
 * Pulsante ricerca nella navbar della pagina favourites
 * @type {HTMLButtonElement} 
 * @readonly
 */
const favSearchBtn = document.getElementById("searchBtn");

/** 
 * Campo input ricerca nella navbar della pagina favourites
 * @type {HTMLInputElement} 
 * @readonly
 */
const favSearchBar = document.getElementById("searchBar");

/** 
 * Container grid per ricette salvate nei preferiti utente
 * @type {HTMLElement} 
 * @readonly
 */
const personalFavsContainer = document.getElementById("fav-recipes");

/** 
 * Container grid per ricette recensite dall'utente corrente
 * @type {HTMLElement} 
 * @readonly
 */
const personalRevsContainer = document.getElementById("rev-recipes");

/** 
 * Container grid per ricette annotate dall'utente corrente
 * @type {HTMLElement} 
 * @readonly
 */
const personalNotesContainer = document.getElementById("noted-recipes");

/** 
 * Body element per gestione classe d-none durante auth check
 * @type {HTMLBodyElement} 
 * @readonly
 */
const personalPageBody = document.querySelector("body");

// ================================================================================================
// EVENT HANDLERS
// ================================================================================================

/**
 * Event handler per navigazione da card ricetta a pagina dettagli
 * 
 * @description
 * Implementa pattern delegation per gestire click su qualsiasi card nella pagina.
 * Utilizza event bubbling per catturare click su card ricette e navigare
 * alla pagina recipe-details.html passando l'ID ricetta come query parameter.
 * 
 * @listens click
 * @param {MouseEvent} click - Evento click bubbled da elementi figli della card
 * 
 * @example
 * // Click su card con data-item-id="52772"
 * // → Naviga a: ../../pages/recipe-details.html?id=52772
 * 
 * @since 1.0.0
 */
personalPageBody.addEventListener("click", (click) => {
    /** @type {HTMLElement|null} Card element closest al target del click */
    const card = click.target.closest(".card");
    const isBtn = click.target.matches(".fav-icon");

    if(card && !isBtn){
        // Naviga alla pagina dettagli passando l'ID della ricetta come query parameter
        window.location.href = `../../pages/recipe-details.html?id=${card.dataset.itemId}`;
    };

    if(isBtn){
        LoggedUser.updateFavourites(card.dataset.itemId);
        favBtnDisplay(card.querySelector(".fav-icon"), card.dataset.itemId);
    };
});

/**
 * Event handler principale per inizializzazione pagina protetta
 * 
 * @description
 * Gestisce il workflow completo di caricamento della pagina:
 * 1. Verifica autenticazione utente corrente
 * 2. Redirect a login se non autenticato  
 * 3. Caricamento sequenziale ricette da tre fonti (favourites, reviews, notes)
 * 4. Rendering sezioni con appropriate funzioni display e rating
 * 
 * @listens load
 * @async
 * @throws {Error} Se fetch API fallisce o utente non autenticato
 * 
 * @todo Ottimizzare caricamento con Promise.all per fetch paralleli
 * @todo Aggiungere loading states per UX migliore  
 * @todo Implementare error handling granulare per fetch falliti
 */
window.addEventListener("load", async () => {
    
    // ============================================================================================
    // AUTHENTICATION CHECK
    // ============================================================================================
    
    /**
     * Verifica autenticazione e redirect condizionale
     * @description Controlla se l'utente corrente esiste nel registro utenti
    */
   if(!LoggedUser.isLogged()){
       window.location.href = "./login.html"
    }else{
        personalPageBody.classList.remove("d-none");
    };
    
    /** @type {Object} Oggetto utente corrente da localStorage */
    const currentUser = LoggedUser.getData();
    
    /**
     * @description Rendering sezione favourites con rating globali
     * @param {Array}
     * @param {HTMLElement} personalFavsContainer - Container target  
     */
    populatePreviewContainer(await PreviewArray.personalFavourites(), personalFavsContainer);
    //CardDisplayStrategy.displayWithRating(createPreviewArray(tempArray, "meals"), personalFavsContainer);

    // ============================================================================================
    // SEZIONE REVIEWS
    // ============================================================================================

    populatePreviewContainer(await PreviewArray.personalReviews(), personalRevsContainer);

    // ============================================================================================
    // SEZIONE NOTES
    // ============================================================================================

    populatePreviewContainer(await PreviewArray.allPersonalNotes(), personalNotesContainer);
});