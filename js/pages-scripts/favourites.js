/**
 * @fileoverview Pagina personale utente: gestione preferiti, recensioni e note
 * @description Script per la pagina protetta dell’utente loggato. Gestisce autenticazione, caricamento dati personali e rendering delle sezioni ricette preferite, recensite e annotate.
 *              Implementa event delegation per navigazione e toggle preferiti.
 * @requires sessionControl - Gestione autenticazione e dati utente
 * @requires UI - Componenti di visualizzazione card e funzioni display
 */

import { LoggedUser, PreviewArray, Recipe } from "../sessionControl.js";
import { addPreviewToContainer, favBtnDisplay, initializeNavbar, populatePreviewContainer, removePreviewFromContainer } from "../UI.js";

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
        
        const clickedCardRecipeId = [card.dataset.itemId];
        
        try {
            LoggedUser.updateFavourites(clickedCardRecipeId);
            
            // Aggiunge o rimuove ricetta dal container dei preferiti
            if(Recipe.isFavourite(card.dataset.itemId)){
                addPreviewToContainer(await PreviewArray.mealsById(clickedCardRecipeId), personalFavsContainer);
            }else{
                removePreviewFromContainer(await PreviewArray.mealsById(clickedCardRecipeId), personalFavsContainer);
            }
    
            // Aggiorna icone preferiti nei container reviews e notes
            personalRevsContainer.querySelectorAll(".fav-icon").forEach(btn => favBtnDisplay(btn, btn.closest(".card").dataset.itemId));
            personalRevsContainer.querySelectorAll(".fav-icon").forEach(btn => favBtnDisplay(btn, btn.closest(".card").dataset.itemId));
        } catch (error) {
            click.target.closest(".tab-pane").innerHTML = "Oooooops! Something went wrong. Try reload the page";
            console.error(error);
        }
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

document.getElementById("page-title").addEventListener("click", click => {
    const link = click.target.closest(".nav-link");

    if(link){
        window.scroll({top: 0, behavior: "smooth"});
    }
});


document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));