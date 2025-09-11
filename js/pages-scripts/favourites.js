/**
 * @fileoverview Pagina personale utente: gestione preferiti, recensioni e note
 * @description Script per la pagina protetta dell’utente loggato. Gestisce autenticazione, caricamento dati personali e rendering delle sezioni ricette preferite, recensite e annotate. Implementa event delegation per navigazione e toggle preferiti.
 * @author damia
 * @version 1.0.0
 * @since 2025-09-08
 * @requires sessionControl - Gestione autenticazione e dati utente
 * @requires UI - Componenti di visualizzazione card e funzioni display
 */

import { LoggedUser, PreviewArray, Recipe } from "../sessionControl.js";
import { addPreviewToContainer, favBtnDisplay, initializeNavbar, populatePreviewContainer, removePreviewFromArray } from "../UI.js";

// ================================================================================================
// DOM ELEMENTS
// ================================================================================================

/** Pulsante ricerca nella navbar */
const favSearchBtn = document.getElementById("searchBtn");
/** Campo input ricerca nella navbar */
const favSearchBar = document.getElementById("searchBar");
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
 * Gestione click su card ricetta e icona preferiti.
 * - Naviga alla pagina dettagli ricetta se si clicca sulla card.
 * - Aggiorna stato preferiti se si clicca sull’icona cuore.
 * @listens click
 */
personalPageBody.addEventListener("click", async (click) => {
    const card = click.target.closest(".card");
    const isBtn = click.target.matches(".fav-icon");

    if(card && !isBtn){
        window.location.href = `../../pages/recipe-details.html?id=${card.dataset.itemId}`;
    };

    if(isBtn){
        LoggedUser.updateFavourites(card.dataset.itemId);
        const favContainerCards = personalFavsContainer.querySelectorAll(".card");
        const revContainerBtns = personalRevsContainer.querySelectorAll(".fav-icon");
        const notesContainerBtns = personalNotesContainer.querySelectorAll(".fav-icon");
        
        const clickedCardRecipeId = [card.dataset.itemId];
        
        if(Recipe.isFavourite(card.dataset.itemId)){
            addPreviewToContainer(await PreviewArray.mealsById(clickedCardRecipeId), personalFavsContainer);
        }else{
            removePreviewFromArray(await PreviewArray.mealsById(clickedCardRecipeId), personalFavsContainer);
        }
        revContainerBtns.forEach(btn => favBtnDisplay(btn, btn.closest(".card").dataset.itemId));
        notesContainerBtns.forEach(btn => favBtnDisplay(btn, btn.closest(".card").dataset.itemId));

        // favBtnDisplay(card.querySelector(".fav-icon"), card.dataset.itemId);
    };
});

/**
 * Inizializzazione pagina personale utente.
 * - Verifica autenticazione e gestisce redirect.
 * - Carica e visualizza ricette preferite, recensite e annotate.
 * @listens load
 * @async
 */
window.addEventListener("load", async () => {
    // Check autenticazione utente
    if(!LoggedUser.isLogged()){
        window.location.href = "./login.html"
    }else{
        personalPageBody.classList.remove("d-none");
    };

    const currentUser = LoggedUser.getData();

    // Rendering sezione preferiti
    populatePreviewContainer(await PreviewArray.fromUserFavourites(), personalFavsContainer);

    // Rendering sezione recensioni
    populatePreviewContainer(await PreviewArray.fromUserReviews(), personalRevsContainer);

    // Rendering sezione note
    populatePreviewContainer(await PreviewArray.fromAllUserNotes(), personalNotesContainer);
    console.log(await PreviewArray.fromAllUserNotes());
});


document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));