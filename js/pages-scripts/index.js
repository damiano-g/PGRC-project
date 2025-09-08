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

import { LoggedUser, PreviewArray } from "../sessionControl.js";
import { favBtnDisplay, populateCarousel, populatePreviewContainer } from "../UI.js"; // Componenti UI per rendering

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
    
    /**Array per accumulo 5 ricette casuali */
    // const recipesObjAccumulator = await rndFetch();

    // for(let i=1; i < 5; i++){
    //     const singleRecipeObj = await rndFetch();
    //     recipesObjAccumulator.meals.push(singleRecipeObj.meals[0]);
    // }
    // console.log(recipesObjAccumulator);

    populateCarousel(await PreviewArray.rndMeals(5), slideshow);

    // Attiva il primo slide del carousel (Bootstrap requirement)
    document.querySelector(".carousel-inner .carousel-item").classList.add("active");

    // ===============================
    // POPOLAZIONE GRIGLIA CATEGORIE
    // ===============================
    populatePreviewContainer(await PreviewArray.categories(), catContainer);
    //const categoriesArray = createPreviewArray(await fetchAllCategories());
    //CardDisplayStrategy.displayCategories(categoriesArray, catContainer);
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
        window.location.href = `../../pages/search.html?cat=${card.dataset.itemId}`;
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
    window.location.href = `../../pages/search.html?q=${String(homeSearchBar.value)}`
});


// ===============================
// FLUSSI DI NAVIGAZIONE
// ===============================

/*
FLUSSO 1 - Caricamento dashboard:
1. window.load triggera inizializzazione
2. 5 chiamate rndFetch() per ricette casuali (sequenziali)
3. fetchAllCategories() per lista categorie (parallelo)
4. populateCarousel() + populateContainer() per rendering
5. Primo slide carousel attivato per Bootstrap

FLUSSO 2 - Click su categoria:
1. Utente clicka su card categoria nella griglia
2. Event bubbling trova .card più vicino
3. Estrae card.dataset.itemId (nome categoria)
4. Naviga a search.html?cat=NomeCategoria
5. Pagina search rileverà parametro e filtrerà automaticamente

FLUSSO 3 - Click su ricetta carousel:
1. Utente clicca su slide nel carousel
2. Event bubbling trova .carousel-item più vicino
3. Estrae slide.dataset.itemId (ID ricetta)
4. Naviga direttamente a recipe-details.html?id=123
5. Pagina dettagli caricherà ricetta specifica

FLUSSO 4 - Ricerca dalla home:
1. Utente digita termine e clicca pulsante
2. String(homeSearchBar.value) estrae valore input
3. Naviga a search.html?q=termine
4. Pagina search rileverà parametro e cercherà automaticamente

PATTERN COMUNI:
- Event delegation con .closest() per robustezza
- URL parameters per state passing tra pagine
- createPreviewArray() per normalizzazione dati API
- populateContainer/populateCarousel per rendering unificato
*/
