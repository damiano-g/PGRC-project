/**
 * @fileoverview Gestione pagina personale utente con sezioni favourites, reviews e notes
 * @description Pagina protetta che mostra ricette salvate, recensite e annotate dall'utente loggato.
 * Implementa autenticazione, caricamento dati utente e rendering con rating personalizzati.
 * @author [Nome Autore]
 * @version 1.0.0
 * @since 2025-09-03
 * @requires data-models - Trasformazione oggetti API in ItemPreview
 * @requires recipesAPI - Fetch dettagli ricette da TheMealDB per ID
 * @requires reviewsManagement - Sistema rating, reviews e funzioni di lookup
 * @requires UI - Display components per preview con rating e note
 * @requires usersManagement - Autenticazione e gestione dati utente
 */

import { createPreviewArray } from "../data-models.js";
import { fetchById } from "../recipesAPI.js";
import { RecipeStatus } from "../recipesManagement.js";
import { getStoredReviews, isReviewedBy, GlobalRatingFunctions, UserRatingFunctions } from "../reviewsManagement.js";
import { DisplayPreviews, favBtnDisplay } from "../UI.js";
import { getRegisteredUsers, getLoggedUserId, searchUserById, currentUserFavourite, updateUserFavourites } from "../usersManagement.js";

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
        updateUserFavourites(card.dataset.itemId);
        favBtnDisplay(card.querySelector(".fav-icon"), Boolean(getLoggedUserId()), currentUserFavourite(card.dataset.itemId));
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
 * 
 * @example
 * // Struttura dati risultante:
 * // personalFavsContainer ← ricette da currentUser.favourites + GlobalRatingFunctions
 * // personalRevsContainer ← ricette da user reviews + UserRatingFunctions  
 * // personalNotesContainer ← ricette da currentUser.notes + displayWithNote
 * 
 * @since 1.0.0
 */
window.addEventListener("load", async () => {
    
    // ============================================================================================
    // AUTHENTICATION CHECK
    // ============================================================================================
    
    const loggedUserId = getLoggedUserId();
    
    /**
     * Verifica autenticazione e redirect condizionale
     * @description Controlla se l'utente corrente esiste nel registro utenti
    */
   if(!getRegisteredUsers().some(item => item.id === loggedUserId)){
       window.location.href = "./login.html"
    }else{
        personalPageBody.classList.remove("d-none");
    };
    
    /** @type {Object} Oggetto utente corrente da localStorage */
    const currentUser = searchUserById(loggedUserId);
    // ============================================================================================
    // DATA LOADING & RENDERING
    // ============================================================================================

    /** 
     * Array temporaneo riutilizzabile per accumulare oggetti ricetta raw
     * @type {Array<Object>} 
     */
    const tempArray = [];

    /** 
     * Array filtrato di review dell'utente corrente per estrazione recipe IDs
     * @type {Array<Object>} 
     */
    const currentUserRevsRecipesIds = getStoredReviews().filter(element => RecipeStatus.isReviewed(element.recipeId));

    // ============================================================================================
    // SEZIONE FAVOURITES
    // ============================================================================================

    /**
     * @description Fetch sequenziale ricette preferite dell'utente
     * @todo Sostituire con Promise.all per performance migliori
     */
    for(let i=0; i < currentUser.favourites.length; i++){
        /** @type {Object} Response object da TheMealDB API */
        const response = await fetchById(currentUser.favourites[i]);
        tempArray.push(response.meals[0]);
    }

    /**
     * @description Rendering sezione favourites con rating globali
     * @param {Array<ItemPreview>} createPreviewArray(tempArray, "meals") - Array preview ricette
     * @param {HTMLElement} personalFavsContainer - Container target  
     * @param {Object} GlobalRatingFunctions - Funzioni rating medie globali
     */
    DisplayPreviews.displayWithRating(createPreviewArray(tempArray, "meals"), personalFavsContainer, GlobalRatingFunctions);

    /** @description Reset array per riutilizzo sezione successiva */
    tempArray.splice(0, tempArray.length);

    // ============================================================================================
    // SEZIONE REVIEWS
    // ============================================================================================

    /**
     * @description Fetch sequenziale ricette recensite dall'utente
     * @todo Sostituire con Promise.all per performance migliori
     */
    for(let i=0; i < currentUserRevsRecipesIds.length; i++){
        /** @type {Object} Response object da TheMealDB API */
        const response = await fetchById(currentUserRevsRecipesIds[i].recipeId);
        tempArray.push(response.meals[0]);
    }

    /**
     * @description Rendering sezione reviews con rating utente specifici
     * @param {Array<ItemPreview>} createPreviewArray(tempArray, "reviews") - Array preview ricette
     * @param {HTMLElement} personalRevsContainer - Container target
     * @param {Object} UserRatingFunctions - Funzioni rating specifiche utente
     * @param {string} currentUser.id - ID utente per filter rating personalizzati
     */
    DisplayPreviews.displayWithRating(createPreviewArray(tempArray, "reviews"), personalRevsContainer, UserRatingFunctions, currentUser.id);

    /** @description Reset array per riutilizzo sezione successiva */
    tempArray.splice(0, tempArray.length);

    // ============================================================================================
    // SEZIONE NOTES
    // ============================================================================================

    /**
     * @description Fetch sequenziale ricette annotate dall'utente
     * @todo Sostituire con Promise.all per performance migliori
     */
    for(let i=0; i < currentUser.notes.length; i++){
        /** @type {Object} Response object da TheMealDB API */
        const response = await fetchById(currentUser.notes[i].recipeId);
        tempArray.push(response.meals[0]);
    }

    /**
     * @description Rendering sezione notes con display specializzato per annotazioni
     * @param {Array<ItemPreview>} createPreviewArray(tempArray, "notes") - Array preview ricette
     * @param {HTMLElement} personalNotesContainer - Container target
     * @param {Array<Object>} currentUser.notes - Array notes utente per display contenuto
     */
    DisplayPreviews.displayWithNote(createPreviewArray(tempArray, "notes"), personalNotesContainer, currentUser.notes);
});