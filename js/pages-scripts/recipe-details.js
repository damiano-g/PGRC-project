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

import { LoggedUser, Recipe } from "../sessionControl.js";
import { createRecipeOverview, favBtnDisplay, populateRecipeNotes } from "../UI.js";

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

/** @type {HTMLElement} Sezione note personali - mostrata solo se utente loggato */
const notesSection = document.getElementById("notes");

/** @type {HTMLElement} Container per rendering note utente esistenti */
const userNotesContainer = document.getElementById("user-notes");

/** @type {HTMLInputElement} Input field per testo nuova nota */
const noteTextInput = document.getElementById("insert-note");

/** @type {HTMLButtonElement} Pulsante inserimento nota */
const noteInsBtn = document.querySelector("form .btn");

/** @type {HTMLButtonElement} Pulsante toggle preferiti */
const detailsFavBtn = document.getElementById("favBtn");

const revBtn = document.getElementById("revBtn");
const revForm = document.querySelector(".modal .form");
const revAlertText = document.querySelector(".modal .text");
const revConfirmBtn = document.querySelector(".modal-footer .btn");
const revFormInputs = document.querySelectorAll(".modal .form input");
const tasteRateInput = document.getElementById("tasteRate");
const difficultyRateInput = document.getElementById("difficultyRate");

const recipeOverviewContainer = document.getElementById("recipe-overview");

/** @type {string} ID ricetta corrente estratto da URL */
const detailedRecipeId = window.location.search.substring(4);


// ===============================
// EVENT LISTENERS - GESTIONE PREFERITI E RECENSIONI
// ===============================

recipeOverviewContainer.addEventListener("click", async click => {
   
   const card = click.target.closest(".card");
   
   if(click.target.matches(".fav-icon")){
      if(LoggedUser.isLogged()){
         LoggedUser.updateFavourites(card.dataset.itemId);
         favBtnDisplay(card.querySelector(".fav-icon"), card.dataset.itemId);
      }else{
         window.location.href = "./login.html";
      };
   };

   if(click.target.matches("#revBtn")){
      try {
         if(LoggedUser.isLogged()){
            if(Recipe.isReviewed(detailedRecipeId)){
               revConfirmBtn.onclick = async () => {
                  Recipe.deleteUserReview(detailedRecipeId);
                  alert("Recensione eliminata");
                  recipeOverviewContainer.replaceChild(createRecipeOverview(await Recipe.getFullData(detailedRecipeId)), card);
                  // revBtnDisplay(card.querySelector("#revBtn"), detailedRecipeId);
                  revConfirmBtn.disabled = true;
               } 
               revForm.classList.add("d-none");
               revAlertText.classList.remove("d-none");
               revConfirmBtn.disabled = false;
            }else{
               revConfirmBtn.onclick = async () => {
                  Recipe.addUserReview(detailedRecipeId, tasteRateInput.value, difficultyRateInput.value);
                  alert("Recensione aggiunta");
                  recipeOverviewContainer.replaceChild(createRecipeOverview(await Recipe.getFullData(detailedRecipeId)), card);
                  // revBtnDisplay(card.querySelector("#revBtn"), detailedRecipeId);
                  revConfirmBtn.disabled = true;
               }
               revForm.classList.remove("d-none");
               revAlertText.classList.add("d-none");
            }
         }else{
            window.location.href = "./login.html";
         }
      } catch (error) {
         console.error(error);
         alert("Recensioni non aggiornate");
      };   
   };

});

revFormInputs.forEach(input => input.addEventListener("change", () => {
   if(Number(tasteRateInput.value) > 0 && Number(difficultyRateInput.value) > 0){
      revConfirmBtn.disabled = false;
   }else{
      revConfirmBtn.disabled = true;
   }
}));

// ===============================
// EVENT LISTENERS - GESTIONE NOTE
// ===============================

/**
 * Event listener per abilitazione dinamica pulsante inserimento nota
 * Abilita pulsante solo se input contiene testo
 */
noteTextInput.addEventListener("input", () => {
   if(noteTextInput.value.length > 0){
      noteInsBtn.disabled = false;
   }else{
      noteInsBtn.disabled = true;
   }
});

/**
 * Event listener per inserimento nuova nota
 * Operazione atomica con UI cleanup e refresh container note
 * Include error handling per ripristino stato button
 */
noteInsBtn.addEventListener("click", () => {
   try {
      noteInsBtn.disabled = true; // Previene doppi inserimenti
      LoggedUser.addNote(detailedRecipeId, noteTextInput.value); 
      noteTextInput.value = "";
      populateRecipeNotes(LoggedUser.getRecipeNotes(detailedRecipeId), userNotesContainer);
      alert("Nota inserita");
   } catch (error) {
      noteInsBtn.disabled = false;
      console.error(error);
      alert("Errore nel salvataggio");
   }
});

/**
 * Event listener per eliminazione note (event delegation)
 * Gestisce click su pulsanti delete all'interno del container note
 * Pattern event delegation per buttons dinamicamente creati
 */
userNotesContainer.addEventListener("click", click => {
   const btn = click.target.closest("button");
   if(btn){
      try {
         LoggedUser.deleteNote(btn.dataset.noteId);
         populateRecipeNotes(LoggedUser.getRecipeNotes(detailedRecipeId), userNotesContainer);
         alert("Nota rimossa");
      } catch (error) {
         console.error(error)
         alert("Errore, nota non rimossa");
      }
   }
});

// ===============================
// CARICAMENTO E RENDERING RICETTA
// ===============================

window.addEventListener("load", async () => {
   try {

      // ===============================
      // FETCH E NORMALIZZAZIONE DATI
      // ===============================

      const fullRecipeObj = await Recipe.getFullData(detailedRecipeId);

      
      // ===============================
      // POPOLAZIONE ELEMENTI UI
      // ===============================
      
      recipeOverviewContainer.appendChild(createRecipeOverview(fullRecipeObj)); 
      
      // Popola la lista degli ingredienti
      fullRecipeObj.ingredients.forEach(element => {
         const listItem = document.createElement("li");
         listItem.innerText = element.name+": "+element.measure;
         ingredientsList.appendChild(listItem);
      });
      
      // Inserisce le istruzioni di preparazione
      instructionsSteps.innerText = fullRecipeObj.instructions;
      
      // Se utente loggato: mostra sezione note e popola note esistenti per ricetta corrente
      if(LoggedUser.isLogged()){
         notesSection.classList.remove("d-none");
         populateRecipeNotes(LoggedUser.getRecipeNotes(detailedRecipeId), userNotesContainer);
      }
   } catch (error) {
      console.error(error);
      alert("Errore nel caricamento della pagina: si prega di riprovare");
      window.history.back();
   }
   
});

// ===============================
// FLUSSO DI ESECUZIONE DOCUMENTATO
// ===============================

/*
SCENARIO TIPICO - Navigazione da search o carousel:

1. **URL Navigation**:
   - Utente clicka card/slide da altra pagina
   - Browser naviga a recipe-details.html?id=52772

2. **Page Load Event**:
   - window.load event triggera il processo di inizializzazione
   - substring(4) estrae "52772" da "?id=52772"

3. **API Call & Data Processing**:
   - fetchById("52772") richiede dettagli a TheMealDB
   - Riceve response: {meals: [{idMeal: "52772", strMeal: "...", ...}]}
   - new FullRecipe(APIresponse.meals[0]) normalizza dati API

4. **UI Population - Recipe Content**:
   - Titolo → recipeTitle.innerText
   - Immagine → imageBox.innerHTML con img responsive
   - Ingredienti → forEach crea li elements con quantità
   - Istruzioni → instructionsSteps.innerText

5. **UI Population - User Features**:
   - favBtnDisplay() configura pulsante preferiti basato su login state
   - Se loggato: mostra sezione note + popola note esistenti per ricetta
   - Event listeners attivi per interazioni preferiti e note
*/