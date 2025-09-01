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
import { FullRecipe, Note } from "../data-models.js";          // Modello dati completo ricetta
import { addNewUserNote, deleteUserNote, getLoggedUserId, getUserNotes, isFavourite, searchUserById, searchUserbyName, updateUserFavourites, } from "../usersManagement.js";
import { favBtnDisplay, revBtnDisplay, populateNotesContainer } from "../UI.js";
import { addReview, deleteReview, isReviewed } from "../reviewsManagement.js";

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
const favBtn = document.getElementById("favBtn");

const revBtn = document.getElementById("revBtn");
const revForm = document.querySelector(".modal .form");
const revAlertText = document.querySelector(".modal .text");
const revConfirmBtn = document.querySelector(".modal-footer .btn");
const revFormInputs = document.querySelectorAll(".modal .form input");
const tasteRateInput = document.getElementById("tasteRate");
const difficultyRateInput = document.getElementById("difficultyRate");

/** @type {string} ID ricetta corrente estratto da URL */
const detailedRecipeId = window.location.search.substring(4);


// ===============================
// EVENT LISTENERS - GESTIONE PREFERITI
// ===============================

/**
 * Event listener per toggle preferiti
 * Gestisce aggiunta/rimozione ricetta dai preferiti con controllo login
 * Try/catch gestisce errori storage e user feedback
 */
favBtn.addEventListener("click", () => {
   try {
      if(getLoggedUserId()){
         updateUserFavourites(detailedRecipeId);
         favBtnDisplay(favBtn, true, isFavourite(detailedRecipeId)); // Aggiornamento UI stato button
      }else{
         window.location.href = "./login.html";
      }
   } catch (error) {
      console.error(error); //Da implementare meglio il comportamento in caso di errore
      alert("Errore: preferiti non aggiornati");
   }
});

revFormInputs.forEach(input => input.addEventListener("change", () => {
   if(Number(tasteRateInput.value) > 0 && Number(difficultyRateInput.value) > 0){
      revConfirmBtn.disabled = false;
   }else{
      revConfirmBtn.disabled = true;
   }
}));

revBtn.addEventListener("click", () => {
   try {
      const currentUserId = getLoggedUserId();
      if(currentUserId){
         if(isReviewed(detailedRecipeId, currentUserId)){
            revConfirmBtn.onclick = () => {
               deleteReview(detailedRecipeId, currentUserId);
               alert("Recensione eliminata");
               revBtnDisplay(revBtn, true, false);
               revConfirmBtn.disabled = true;
            } 
            revForm.classList.add("d-none");
            revAlertText.classList.remove("d-none");
            revConfirmBtn.disabled = false;
         }else{
            revConfirmBtn.onclick = () => {
               addReview(detailedRecipeId, currentUserId, tasteRateInput.value, difficultyRateInput.value);
               alert("Recensione aggiunta");
               revBtnDisplay(revBtn, true, true);
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
});

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
      addNewUserNote(detailedRecipeId, noteTextInput.value); 
      noteTextInput.value = "";
      populateNotesContainer(getUserNotes(detailedRecipeId), userNotesContainer);
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
         deleteUserNote(btn.dataset.noteId);
         populateNotesContainer(getUserNotes(detailedRecipeId), userNotesContainer);
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

/**
 * Event listener per caricamento iniziale della pagina dettagli
 * Orchestrazione completa: URL parsing → API call → data processing → UI population
 * Gestisce sia contenuto ricetta che features user-specific (preferiti/note)
 */
window.addEventListener("load", async () => {
   try {
      // ===============================
      // ESTRAZIONE PARAMETRO URL
      // ===============================

      // Estrae l'id della ricetta dalla query string dell'URL (?id=...)
      //detailedRecipeId = window.location.search.substring(4);

      // ===============================
      // FETCH E NORMALIZZAZIONE DATI
      // ===============================

      // Effettua la fetch dei dettagli ricetta tramite l'ID
      const APIresponse = await fetchById(detailedRecipeId);

      // Crea un oggetto ricetta completo a partire dalla risposta API
      const recipeDetails = new FullRecipe(APIresponse.meals[0]);


      const currentUserId = getLoggedUserId();

      // ===============================
      // POPOLAZIONE ELEMENTI UI
      // ===============================

      // Inserisce il titolo della ricetta nella pagina
      recipeTitle.innerText = recipeDetails.name;

      // Configurazione pulsante preferiti basata su stato login e preferenze utente
      favBtnDisplay(favBtn, currentUserId, isFavourite(detailedRecipeId, currentUserId));
      revBtnDisplay(revBtn, currentUserId, isReviewed(detailedRecipeId, currentUserId)); // Da valutare unificazione funzione se gestione tramite icone

      // Se utente loggato: mostra sezione note e popola note esistenti per ricetta corrente
      if(currentUserId){
         notesSection.classList.remove("d-none");
         populateNotesContainer(getUserNotes(detailedRecipeId), userNotesContainer);
      }

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