/**
 * @fileoverview Gestione pagina ricerca ricette - controllo UI e navigazione
 * @description Implementa funzionalità di ricerca per nome e categoria, gestione risultati,
 * navigazione ai dettagli e sincronizzazione con cronologia browser
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
 */

// ===============================
// IMPORT MODULI E DIPENDENZE
// ===============================

import { LoggedUser, PreviewArray } from "../sessionControl.js";
import { displayCards, favBtnDisplay } from "../UI.js"; // Componenti UI per rendering

// ===============================
// SELEZIONE ELEMENTI DOM
// ===============================

/** @type {HTMLButtonElement} Pulsante per avviare la ricerca */
const searchBtn = document.getElementById("searchBtn");

/** @type {HTMLInputElement} Campo di input per il termine di ricerca */
const searchBar = document.getElementById("searchBar");

/** @type {HTMLElement} Container dove vengono mostrati i risultati della ricerca */
const resultsContainer = document.getElementById("results-container");

let searchPageCards;

// ===============================
// GESTIONE RICERCA PER NOME
// ===============================

/**
 * Event listener per il pulsante di ricerca
 * Gestisce ricerca per nome ricetta + aggiornamento URL per navigazione
 */
searchBtn.addEventListener("click", async () => {
    const recipesPreviewArray = await PreviewArray.mealsByName(String(searchBar.value));
    if(recipesPreviewArray.meals){
        //const array = createPreviewArray(response);
        history.pushState(null, "", `../../pages/search.html?q=${String(searchBar.value)}`);
        displayCards(recipesPreviewArray, resultsContainer, "meals");
        //CardDisplayStrategy.displayWithRating(array, resultsContainer)
    }else{
        const paragraph = document.createElement("div");
        paragraph.innerText = "La ricerca non ha prodotto risultati";
        resultsContainer.innerHTML = "";
        resultsContainer.appendChild(paragraph);
    }
});

// ===============================
// NAVIGAZIONE AI DETTAGLI RICETTA
// ===============================

/**
 * Event delegation per click su card dei risultati
 * Usa event bubbling per catturare click su qualsiasi parte della card
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
        if(LoggedUser.isLogged()){
            LoggedUser.updateFavourites(card.dataset.itemId);
            favBtnDisplay(card.querySelector(".fav-icon"), card.dataset.itemId);
        }else{
            window.location.href = "./login.html";
        };
    };
});


// ===============================
// GESTIONE CARICAMENTO PAGINA
// ===============================

/**
 * Event listener per caricamento iniziale della pagina
 * Gestisce parametri URL per ripristinare stato da cronologia/link condivisi
 */
window.addEventListener("load", async () => {
    
    // Parsing manuale dell'URL query string (es. "?q=pasta" → ["q", "pasta"])
    const query = window.location.search.substring(1).split("=");
    
    if(query[0] === "q"){
        searchBar.value = query[1];
        searchBtn.click();
    }
    
    if(query[0] === "cat"){
        displayCards(await PreviewArray.mealsByCategory(query[1]), resultsContainer);
        //const array = createPreviewArray(await fetchByCategory(query[1]));
        //CardDisplayStrategy.displayWithRating(array, resultsContainer);
        // cardsFavBtnsDisplay(Boolean(getLoggedUserId()));
    }  
});




// ===============================
// GESTIONE CRONOLOGIA BROWSER
// ===============================

/**
 * Event listener per navigazione cronologia (pulsanti Indietro/Avanti)
 * Ricarica la pagina per ripristinare lo stato corretto basato sull'URL
 */
window.addEventListener("popstate", () => {
    window.location.reload();
});

// ===============================
// FLUSSO DI ESECUZIONE TIPICO
// ===============================

/*
SCENARIO 1 - Ricerca diretta:
1. Utente digita "pasta" e clicca searchBtn
2. fetchByName("pasta") → API call a TheMealDB
3. createPreviewArray() → normalizza risposta API in array ItemPreview
4. populateContainer() → crea card DOM e le mostra
5. history.pushState() → URL diventa search.html?q=pasta

SCENARIO 2 - Link condiviso/bookmark:
1. Utente apre search.html?q=pasta direttamente
2. window.load → parsing query: ["q", "pasta"]
3. searchBar.value = "pasta" + searchBtn.click()
4. Esegue stesso flusso dello scenario 1

SCENARIO 3 - Click su card risultati:
1. Utente clicca su una card nei risultati
2. Event bubbling → .closest(".card") trova la card contenitore
3. Estrae card.dataset.itemId dalla card
4. Naviga a recipe-details.html?id=123

SCENARIO 4 - Cronologia browser:
1. Utente preme "Indietro" nel browser
2. popstate event → window.location.reload()
3. Riprocessa l'URL precedente con logica del load event

SCENARIO 5 - Ricerca per categoria (da dashboard):
1. Utente clicca categoria su index.html → naviga a search.html?cat=Beef
2. window.load → parsing query: ["cat", "Beef"]
3. fetchByCategory("Beef") → API call specifica
4. populateContainer() → mostra ricette della categoria
*/