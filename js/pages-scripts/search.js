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

import { fetchByCategory, fetchByName, } from "../recipesAPI.js";        // Funzioni API per ricerca ricette
import { ItemPreview, createPreviewArray } from "../data-models.js";     // Modelli dati e normalizzazione
import { populatePreviewContainer } from "../UI.js";         // Componenti UI per rendering
import { RatingFunctions } from "../reviewsManagement.js";

// ===============================
// SELEZIONE ELEMENTI DOM
// ===============================

/** @type {HTMLButtonElement} Pulsante per avviare la ricerca */
const searchBtn = document.getElementById("searchBtn");

/** @type {HTMLInputElement} Campo di input per il termine di ricerca */
const searchBar = document.getElementById("searchBar");

/** @type {HTMLElement} Container dove vengono mostrati i risultati della ricerca */
const resultsContainer = document.getElementById("results-container");

// ===============================
// GESTIONE RICERCA PER NOME
// ===============================

/**
 * Event listener per il pulsante di ricerca
 * Gestisce ricerca per nome ricetta + aggiornamento URL per navigazione
 */
searchBtn.addEventListener("click", async () => {
    const array = createPreviewArray(await fetchByName(String(searchBar.value)));
    history.pushState(null, "", `../../pages/search.html?q=${String(searchBar.value)}`);
    populatePreviewContainer(array, resultsContainer, RatingFunctions);
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

    if(card){
        // Naviga alla pagina dettagli passando l'ID della ricetta come query parameter
        window.location.href = `../../pages/recipe-details.html?id=${card.dataset.itemId}`;
    }
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

    console.log(query[0], query[1]);
    
    if(query[0] === "q"){
        searchBar.value = query[1];
        searchBtn.click();
    }
    
    if(query[0] === "cat"){
        const array = createPreviewArray(await fetchByCategory(query[1]));
        populatePreviewContainer(array, resultsContainer, RatingFunctions);
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