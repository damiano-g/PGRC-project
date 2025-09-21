/**
 * @fileoverview Dashboard principale - gestione carousel, categorie e ricerca
 * @description Pagina home con carousel ricette casuali, griglia categorie
 * e barra di ricerca per navigazione verso pagine specializzate
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
 */

// ===============================
// IMPORT MODULI E DIPENDENZE
// ===============================

import { getAllCategories } from "../recipesAPI.js";
import { LoggedUser, PreviewArray } from "../sessionControl.js";
import { favBtnDisplay, initializeNavbar, populateCarousel, populatePreviewContainer } from "../UI.js"; // Componenti UI per rendering

// ===============================
// SELEZIONE ELEMENTI DOM
// ===============================

/** @type {HTMLElement} Container interno del carousel Bootstrap */
const slideshow = document.querySelector(".carousel-inner");

/** @type {HTMLElement} Container griglia categorie */
const catContainer = document.getElementById("categories");

/** @type {HTMLButtonElement} Pulsante ricerca nella home */
const homeSearchBtn = document.getElementById("searchBtn");

/** @type {HTMLInputElement} Campo input ricerca nella home */
const homeSearchBar = document.getElementById("searchBar");

document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));
// ===============================
// INIZIALIZZAZIONE DASHBOARD
// ===============================

/**
 * Event listener per caricamento iniziale della dashboard
 * Popola carousel con ricette casuali e griglia con categorie disponibili
 */
window.addEventListener("load", async () => {
    
    // ===============================
    // POPOLAZIONE CAROUSEL RICETTE CASUALI
    // ===============================

    populateCarousel(await PreviewArray.rndMeals(5), slideshow);

    // Attiva il primo slide del carousel (Bootstrap requirement)
    requestAnimationFrame(() => {
        const firstSlide = document.querySelector(".carousel-inner .carousel-item");
        if (firstSlide) {
            firstSlide.classList.add("active");
        }
    });

    // ===============================
    // POPOLAZIONE GRIGLIA CATEGORIE
    // ===============================
    populatePreviewContainer(await PreviewArray.categories(), catContainer);
});


// ===============================
// NAVIGAZIONE DA CATEGORIE
// ===============================

/**
 * Event delegation per click su card categorie
 * Naviga alla pagina ricerca con filtro categoria preimpostato
 */
catContainer.addEventListener("click", (click) => {

    // Trova elemento .card nell'albero DOM tramite event bubbling
    // Permette click su qualsiasi parte della card (immagine, testo, etc.)
    const card = click.target.closest(".card");

    if(card){
        // Naviga a search.html con parametro categoria per filtro automatico
        window.location.href = `./pages/search.html?cat=${card.dataset.itemId}`;
    }
});

// ===============================
// NAVIGAZIONE DA CAROUSEL
// ===============================


/**
 * Event delegation per click su slide del carousel
 * Naviga direttamente ai dettagli della ricetta cliccata
 */
slideshow.addEventListener("click", (click) => {
    const card = click.target.closest(".carousel-item");
    const isBtn = click.target.matches(".fav-icon");

    if(card && !isBtn){
        // Naviga alla pagina dettagli passando l'ID della ricetta come query parameter
        window.location.href = `../../pages/recipe-details.html?id=${card.dataset.itemId}`;
    };

    if(isBtn){
        if(LoggedUser.isLogged()){
            LoggedUser.updateFavourites(card.dataset.itemId);
            favBtnDisplay(card.querySelector(".fav-icon"), card.dataset.itemId);
        }else{
            window.location.href = "./pages/login.html";
        };
    };
});

// ===============================
// RICERCA DALLA HOME
// ===============================

/**
 * Event listener per pulsante ricerca principale
 * Naviga alla pagina ricerca con termine di ricerca preimpostato
 */
homeSearchBtn.addEventListener("click", () => {
    // Naviga a search.html con parametro query per ricerca automatica
    window.location.href = `./pages/search.html?q=${String(homeSearchBar.value)}`
});


