/**
 * @fileoverview Pagina dettagli ricetta - visualizzazione completa ingredienti e istruzioni
 * @description Gestisce caricamento e rendering dei dettagli di una ricetta specifica
 * tramite ID passato come parametro URL
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
 */

// ===============================
// IMPORT MODULI E DIPENDENZE
// ===============================

import { fetchById } from "../recipesAPI.js";            // API call per dettagli ricetta singola
import { FullRecipe } from "../data-models.js";          // Modello dati completo ricetta

// ===============================
// SELEZIONE ELEMENTI DOM
// ===============================

/** @type {HTMLElement} Container per il titolo della ricetta */
const recipeTitle = document.getElementById("recipe-title");

/** @type {HTMLElement} Container per l'immagine principale */
const imageBox = document.getElementById("image-box");

/** @type {HTMLUListElement} Lista ingredienti con quantità */
const ingredientsList = document.getElementById("ingredients-list");

/** @type {HTMLElement} Container per le istruzioni di preparazione */
const instructionsSteps = document.getElementById("instructions-steps");

// ===============================
// CARICAMENTO E RENDERING RICETTA
// ===============================

/**
 * Event listener per caricamento iniziale della pagina dettagli
 * Estrae ID ricetta dall'URL e carica tutti i dettagli completi
 */
window.addEventListener("load", async () => {
    
    // ===============================
    // ESTRAZIONE PARAMETRO URL
    // ===============================

    // Estrae l'id della ricetta dalla query string dell'URL (?id=...)
    const recipeId = window.location.search.substring(4);

    // ===============================
    // FETCH E NORMALIZZAZIONE DATI
    // ===============================

    // Effettua la fetch dei dettagli ricetta tramite l'ID
    const APIresponse = await fetchById(recipeId);

    // Crea un oggetto ricetta completo a partire dalla risposta API
    const recipeDetails = new FullRecipe(APIresponse.meals[0]);

    // ===============================
    // POPOLAZIONE ELEMENTI UI
    // ===============================

    // Inserisce il titolo della ricetta nella pagina
    recipeTitle.innerText = recipeDetails.name;
    
    // Inserisce l'immagine della ricetta nella pagina
    imageBox.innerHTML = `
        <img src="${recipeDetails.image}" alt="${recipeDetails.name}">
    `;

    // Popola la lista degli ingredienti
    recipeDetails.ingredients.forEach(element => {
        const listItem = document.createElement("li");
        listItem.innerText = element.name+": "+element.measure;
        ingredientsList.appendChild(listItem);
    });

    // Inserisce le istruzioni di preparazione
    instructionsSteps.innerText = recipeDetails.instructions;
});

// ===============================
// FLUSSO DI ESECUZIONE
// ===============================

/*
SCENARIO TIPICO - Navigazione da search o carousel:

1. **URL Navigation**:
   - Utente clicca card/slide da altra pagina
   - Browser naviga a recipe-details.html?id=52772

2. **Page Load**:
   - window.load event triggera il processo
   - substring(4) estrae "52772" da "?id=52772"

3. **API Call**:
   - fetchById("52772") richiede dettagli a TheMealDB
   - Riceve response: {meals: [{idMeal: "52772", strMeal: "...", ...}]}

4. **Data Processing**:
   - new FullRecipe(APIresponse.meals[0]) normalizza dati
   - Ingredienti processati in array strutturato
   - Istruzioni pulite e formattate

5. **UI Population**:
   - Titolo → recipeTitle.innerText
   - Immagine → imageBox.innerHTML con img responsive
   - Ingredienti → forEach crea li elements
   - Istruzioni → instructionsSteps.innerText
*/