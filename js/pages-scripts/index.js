/**
 * @fileoverview Dashboard principale - gestione carousel, categorie e ricerca
 * @description Pagina home con carousel ricette casuali, griglia categorie
 * e barra di ricerca per navigazione verso pagine specializzate
 * @requires sessionControl.js Per moduli LoggedUser, PreviewArray
 * @requires UI.js Per funzioni di rendering UI (favBtnDisplay, initializeNavbar, populateCarousel, populatePreviewContainer)
 */

// ===============================
// IMPORT MODULI E DIPENDENZE
// ===============================

import { LoggedUser, PreviewArray } from "../sessionControl.js";
import { favBtnDisplay, initializeNavbar, populateCarousel, populatePreviewContainer } from "../UI.js"; // Componenti UI per rendering

// ===============================
// SELEZIONE ELEMENTI DOM
// ===============================

/** @type {HTMLElement} Container interno del carousel Bootstrap */
const slideshow = document.querySelector(".carousel-inner");

/** @type {HTMLElement} Container griglia categorie */
const catContainer = document.getElementById("categories-container");


// ===============================
// INIZIALIZZAZIONE DASHBOARD
// ===============================

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
 * Event listener per caricamento iniziale della dashboard
 * 
 * @param {Event} load - Evento load della finestra (triggerato automaticamente al caricamento completo della pagina)
 * @returns {void}
 * 
 * @see {@link populateCarousel} Per popolamento carousel con ricette
 * @see {@link populatePreviewContainer} Per popolamento container categorie
 * @see {@link PreviewArray.mostPopular} Per recupero ricette più popolari
 * @see {@link PreviewArray.categories} Per recupero categorie disponibili
 * 
 * @description
 * Gestisce il caricamento e rendering iniziale della dashboard.
 * - Popola carousel con ricette più popolari.
 * - Popola griglia categorie.
 * - Gestione errori con messaggi di fallback per graceful degradation.
 * 
 * @example
 * // Evento triggerato automaticamente al caricamento pagina
 * window.addEventListener("load", async () => {
 *    populateCarousel(await PreviewArray.mostPopular(5), slideshow);
 *    populatePreviewContainer(await PreviewArray.categories(), catContainer);
 * });
 * 
 * @todo Aggiungere loading spinner durante caricamento dati
 */
window.addEventListener("load", async () => {
    
    /** Popola il carousel con le cinque ricette più votate */
    try {
        populateCarousel(await PreviewArray.mostPopular(5), slideshow);
    
        // Attiva il primo slide del carousel (Bootstrap requirement)
        requestAnimationFrame(() => {
            const firstSlide = document.querySelector(".carousel-inner .carousel-item");
            if (firstSlide) {
                firstSlide.classList.add("active");
            }
        });
    } catch (error) {
        slideshow.innerHTML = "Oooops! Something went wrong. Try reload the page.";
        console.error(error);
    }

    /** Popola una griglia con card per ogni categoria di TMDB API */
    try {
        populatePreviewContainer(await PreviewArray.categories(), catContainer);
    } catch (error) {
        catContainer.innerHTML = "Oooops! Something went wrong. Try reload the page.";
        console.error(error);
    }
});


// ===============================
// NAVIGAZIONE DA CATEGORIE
// ===============================

/**
 * Event delegation per click su card categorie
 * 
 * @param {Event} click - Evento click catturato dal container
 * 
 * @description
 * Gestisce click su card categorie per navigazione a pagina ricerca con filtro categoria.
 * 
 * @example
 * // Evento catturato automaticamente dal container
 * catContainer.addEventListener("click", (click) => {
 *    if(card){ window.location.href = `./pages/search.html?cat=${card.dataset.itemId}`; }
 * });
 */
catContainer.addEventListener("click", (click) => {

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
 * 
 * @param {Event} click - Evento click catturato dal container
 * 
 * @see {@link favBtnDisplay} Per gestione stato icona preferiti
 * @see {@link LoggedUser.updateFavourites} Per toggle preferiti
 * @see {@link LoggedUser.isLogged} Per verifica stato login utente
 * 
 * @description
 * Gestisce click su slide del carousel per navigazione a dettagli ricetta o toggle preferiti.
 * - Click su .carousel-item (non su .fav-icon): naviga a pagina dettagli ricetta passando ID come query parameter.
 * - Click su .fav-icon: se utente loggato, toggle preferiti e aggiorna icona; altrimenti redirect a login.
 * - Gestione errori con alert utente e log console per graceful degradation.
 * - Event delegation per gestire elementi creati dinamicamente (slide del carousel).
 * 
 * Gestione errori dettagliata:
 * - Try-catch interno: cattura errori specifici nelle operazioni (fav), mostra alert generico e log errore console.
 * - Graceful degradation: in caso di errore, UI rimane funzionale per altre azioni.
 * - Nessun crash dell'applicazione: errori vengono contenuti e gestiti localmente senza interrompere il flusso utente.
 * 
 * @example
 * // Evento catturato automaticamente dal container
 * slideshow.addEventListener("click", (click) => {
 *    if(card && !isBtn){ window.location.href = `../../pages/recipe-details.html?id=${card.dataset.itemId}`; }
 *    if(isBtn){ if(LoggedUser.isLogged()){ LoggedUser.updateFavourites(card.dataset.itemId); favBtnDisplay(card.querySelector(".fav-icon"), card.dataset.itemId); } else { window.location.href = "./pages/login.html"; } }
 * });
 * 
 */
slideshow.addEventListener("click", (click) => {
    const card = click.target.closest(".carousel-item");
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
                window.location.href = "./pages/login.html";
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
 * @description Flusso di esecuzione del file index.js
 * 
 * 1. **Import moduli e dipendenze**:
 *    - Importa LoggedUser, PreviewArray da sessionControl.js
 *    - Importa funzioni UI da UI.js (favBtnDisplay, initializeNavbar, populateCarousel, populatePreviewContainer)
 * 
 * 2. **Selezione elementi DOM**:
 *    - Recupera riferimenti a container carousel e categorie
 * 
 * 3. **Inizializzazione navbar (DOMContentLoaded)**:
 *    - Al caricamento del DOM, chiama initializeNavbar per configurare menu navigazione basato su stato utente
 * 
 * 4. **Inizializzazione dashboard (window load)**:
 *    - Popola carousel con PreviewArray.mostPopular(5)
 *    - Attiva primo slide del carousel
 *    - Popola griglia categorie con PreviewArray.categories()
 *    - Gestione errori per ogni sezione con messaggi di fallback
 * 
 * 5. **Navigazione da categorie (event listener su catContainer)**:
 *    - Ascolta click su .card: naviga a search.html con parametro categoria
 * 
 * 6. **Navigazione da carousel (event listener su slideshow)**:
 *    - Ascolta click su .carousel-item: naviga a recipe-details.html
 *    - Ascolta click su .fav-icon: toggle preferiti se loggato, altrimenti redirect a login
 * 
 * @note Il flusso è asincrono: popolamento usa await per dati dinamici
 * @note Event delegation usato per gestire elementi dinamici (card, slide)
 * @note Graceful degradation: errori locali non crashano l'app, UI rimane funzionale con messaggi di errore
 */
