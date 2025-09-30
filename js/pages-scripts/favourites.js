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

/** Container ricette preferite */
const personalFavsContainer = document.getElementById("fav-recipes");
/** Container ricette recensite */
const personalRevsContainer = document.getElementById("rev-recipes");
/** Container ricette annotate */
const personalNotesContainer = document.getElementById("noted-recipes");
/** Body pagina personale (per gestione visibilità) */
const personalPageBody = document.querySelector("body");

/**
 * Mostra la sezione attiva e aggiorna lo stato dei link titolo pagina.
 * @param {string} sectionName - ID della sezione da visualizzare
 */
function displaySectionInternal(sectionName){
    document.querySelectorAll("#recipes-container>section").forEach(section => section.classList.add("d-none"));
    const activeSection = document.getElementById(sectionName);
    activeSection.classList.remove("d-none");
    // Evidenzia link pagina attualmente attiva
    document.querySelectorAll("#page-title a").forEach(anchor => {
        if(activeSection.id === anchor.href.substring(anchor.href.indexOf("#")+1)){
            anchor.classList.add("active"); // Comportamento custom classe active definito in css
        }else{
            anchor.classList.remove("active");
        }
    }); 
    window.scroll({top: 0, behavior: "smooth"}); 
};

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

    // Rendering sezione preferiti
    personalFavsContainer.innerHTML = "Add recipes to favourites to view them in this area";
    populatePreviewContainer(await PreviewArray.fromUserFavourites(), personalFavsContainer);

    // Rendering sezione recensioni
    personalRevsContainer.innerHTML = "Rate recipes taste and difficulty to view them in this area";
    populatePreviewContainer(await PreviewArray.fromUserReviews(), personalRevsContainer);

    // Rendering sezione note
    personalNotesContainer.innerHTML = "Take notes to view relative recipes in this area";
    populatePreviewContainer(await PreviewArray.fromAllUserNotes(), personalNotesContainer);

    const index = window.location.href.indexOf("#");
    if(index >= 0){
        displaySectionInternal(window.location.href.substring(index+1));
    }else{
        displaySectionInternal("fav-section");
    }
});

document.getElementById("page-title").addEventListener("click", (click) => {
    click.preventDefault();
    const sectionLink = click.target.closest("a");
    if(sectionLink){
        displaySectionInternal(sectionLink.href.substring(sectionLink.href.indexOf("#")+1));
        history.pushState(null, "", `${sectionLink.href}`);
    }
});

window.addEventListener("popstate", () => {
    const index = window.location.href.indexOf("#");
    if(index >= 0){
        displaySectionInternal(window.location.href.substring(index+1));
    }else{
        displaySectionInternal("fav-section");
    }
});


document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));