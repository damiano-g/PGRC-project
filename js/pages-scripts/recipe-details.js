/**
 * @fileoverview Gestione della pagina dettagli ricetta
 * @description Gestisce il caricamento, rendering e interazioni utente per la pagina dettagli di una ricetta specifica.
 * Include gestione preferiti, recensioni, note personali e popolamento dinamico dei contenuti.
 * @requires sessionControl.js Per moduli LoggedUser e Recipe
 * @requires UI.js Per funzioni di rendering UI
 */

// ===============================
// IMPORT MODULI E DIPENDENZE
// ===============================

import { LoggedUser, Recipe } from "../sessionControl.js";
import { createRecipeOverview, favBtnDisplay, initializeNavbar, populateRecipeNotes } from "../UI.js";

// ===============================
// SELEZIONE ELEMENTI DOM
// ===============================

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
const noteInsBtn = document.querySelector("#notes form .btn");

/** @type {HTMLButtonElement} Pulsante conferma review nella modale */
const revConfirmBtn = document.querySelector(".modal-footer .btn");

/** @type {HTMLSelectElement} Select per rating gusto nella modale review */
const tasteRateSelector = document.getElementById("tasteSelect");

/** @type {HTMLSelectElement} Select per rating difficoltà nella modale review */
const difficultyRateSelector = document.getElementById("difficultySelect");

/** @type {HTMLElement} Container per la card overview della ricetta */
const recipeOverviewContainer = document.getElementById("recipe-overview");

/** @type {string} ID ricetta corrente estratto da URL */
const detailedRecipeId = window.location.search.substring(4);


document.addEventListener("DOMContentLoaded", () => initializeNavbar(document.querySelector("body"), document.querySelector("nav")));

// ===============================
// EVENT LISTENERS - GESTIONE PREFERITI E RECENSIONI
// ===============================

/**
 * Event listener per gestione click su preferiti e recensioni
 * 
 * @param {Event} click - Evento click catturato dal container
 * @returns {void}
 * 
 * @see {@link favBtnDisplay} Per gestione stato icona preferiti
 * @see {@link revBtnDisplay} Per gestione stato pulsante recensioni
 * @see {@link LoggedUser.updateFavourites} Per toggle preferiti
 * @see {@link Recipe.addUserReview} Per aggiunta recensione
 * @see {@link Recipe.deleteUserReview} Per eliminazione recensione
 * @see {@link createRecipeOverview} Per aggiornamento card dopo modifiche
 * 
 * @description
 * Gestisce interazioni utente su preferiti e recensioni tramite event delegation.
 * - Click su .fav-icon: toggle preferiti se loggato, redirect login altrimenti
 * - Click su #revBtn: gestione recensioni (aggiunta/eliminazione) con validazione
 * - Aggiornamento UI dopo ogni azione per riflettere nuovo stato
 * - Gestione errori robusta con graceful degradation: alert utente, log console, disabilitazione pulsante in caso di fallimenti
 * - Event delegation per gestire elementi creati dinamicamente
 * 
 * Gestione errori dettagliata:
 * - Try-catch interno: cattura errori specifici nelle operazioni (fav, review), mostra alert generico e log errore console
 * - Try-catch esterno: cattura errori generali (es. problemi di autenticazione), disabilita pulsante review per prevenire ulteriori interazioni fallite
 * - Graceful degradation: in caso di errore, UI rimane funzionale per altre azioni, ma pulsante problematico viene disabilitato
 * - Nessun crash dell'applicazione: errori vengono contenuti e gestiti localmente senza interrompere il flusso utente
 * 
 * @example
 * // Evento catturato automaticamente dal container
 * recipeOverviewContainer.addEventListener("click", async click => {
 *    if(click.target.matches(".fav-icon") || click.target.matches("#revBtn")){ ... }
 * });
 * 
 * @todo Implementare retry automatico per operazioni fallite a causa di problemi temporanei
 * @todo Aggiungere feedback visivo (spinner, messaggi di stato) durante operazioni asincrone
 */
recipeOverviewContainer.addEventListener("click", async click => { // Event delegation in container per aggirare tempi di caricamento card
   
   if(click.target.matches(".fav-icon") || click.target.matches("#revBtn")){
      try {
         const isUserLogged = LoggedUser.isLogged();
         try {      
            if(click.target.matches(".fav-icon")){
               if(isUserLogged){
                  LoggedUser.updateFavourites(detailedRecipeId);
                  favBtnDisplay(document.querySelector(".card .fav-icon"), detailedRecipeId);
               }else{
                  window.location.href = "./login.html";
               };
            };
         
            if(click.target.matches("#revBtn")){
               if(isUserLogged){
                  revConfirmBtn.onclick = async () =>{ // NB -> eventListener si accumulano - onCLick viene sostituito
                     if(Recipe.isReviewed(detailedRecipeId)){
                        Recipe.deleteUserReview(detailedRecipeId);
                        alert("Review deleted");
                     }else{
                        if(tasteRateSelector.value > 0 && difficultyRateSelector.value > 0){
                           Recipe.addUserReview(detailedRecipeId, tasteRateSelector.value, difficultyRateSelector.value);
                           alert("Review added");
                        }else{
                           alert("Please fill both rating fields in order to submit your review");
                        }
                     }
                     recipeOverviewContainer.replaceChild(createRecipeOverview(await Recipe.getFullData(detailedRecipeId)), recipeOverviewContainer.firstChild);
                  };
               }else{
                  window.location.href = "./login.html";
               }  
            };
         } catch (error) {
            switch(error.code){
               case 404:
                  alert("No review found for current user and recipe")
                  break;
               case 409:
                  alert("Current user has already reviewed this recipe.");
                  break;
               default:
                  alert("Ooops! Something went wrong. Please try again or reload page");
            }
            console.error(error);
         }
      } catch (error) {
         document.getElementById("revBtn").disabled = true;
         console.error(error);
      }
   } 
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
      LoggedUser.addNote(detailedRecipeId, noteTextInput.value); 
      noteTextInput.value = "";
      populateRecipeNotes(LoggedUser.getRecipeNotes(detailedRecipeId), userNotesContainer);
      alert("Note added");
   } catch (error) {
      noteInsBtn.disabled = false;
      alert("Something went wrong. Please retry later.");
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
         alert("Note deleted");
      } catch (error) {
         alert("Something went wrong. Please retry later.");
      }
   }
});

// ===============================
// CARICAMENTO E RENDERING RICETTA
// ===============================

/**
 * Event listener per caricamento iniziale della pagina ricetta
 * 
 * @param {Event} load - Evento load della finestra (triggerato automaticamente al caricamento completo della pagina)
 * @returns {void}
 * 
 * @see {@link Recipe.getFullData} Per recupero dati completi ricetta
 * @see {@link createRecipeOverview} Per creazione card overview ricetta
 * @see {@link populateRecipeNotes} Per popolamento note utente
 * @see {@link LoggedUser.isLogged} Per verifica stato login utente
 * @see {@link LoggedUser.getRecipeNotes} Per recupero note utente per ricetta
 * 
 * @description
 * Gestisce il caricamento e rendering iniziale della pagina dettagli ricetta.
 * - Recupera dati completi ricetta tramite ID URL
 * - Popola card overview, lista ingredienti e istruzioni
 * - Mostra sezione note se utente loggato e popola note esistenti
 * - Gestione errori con alert e log console per graceful degradation
 * 
 * @example
 * // Evento triggerato automaticamente al caricamento pagina
 * window.addEventListener("load", async () => {
 *    const fullRecipeObj = await Recipe.getFullData(detailedRecipeId);
 *    recipeOverviewContainer.appendChild(createRecipeOverview(fullRecipeObj));
 *    // ... popolamento ingredienti, istruzioni, note
 * });
 * 
 * @todo Aggiungere loading spinner durante caricamento dati
 * @todo Implementare fallback per ricette non trovate (es. redirect a pagina errore)
 */
window.addEventListener("load", async () => {
   
   try {
      const fullRecipeObj = await Recipe.getFullData(detailedRecipeId);
 
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
      alert("Something went wrong. Please try reload the page.");
      console.error(error);
   }
});


// ===============================
// FLUSSO DI ESECUZIONE DOCUMENTATO
// ===============================

/**
 * @description Flusso di esecuzione del file recipe-details.js
 * 
 * 1. **Import moduli e dipendenze**:
 *    - Importa LoggedUser, Recipe da sessionControl.js
 *    - Importa funzioni UI da UI.js (createRecipeOverview, favBtnDisplay, initializeNavbar, populateRecipeNotes)
 * 
 * 2. **Selezione elementi DOM**:
 *    - Recupera riferimenti a elementi HTML (liste, input, bottoni, container) necessari per rendering e interazioni
 *    - Estrae ID ricetta dall'URL (detailedRecipeId)
 * 
 * 3. **Inizializzazione navbar (DOMContentLoaded)**:
 *    - Al caricamento del DOM, chiama initializeNavbar per configurare menu navigazione basato su stato utente
 * 
 * 4. **Gestione interazioni preferiti e recensioni (event delegation su recipeOverviewContainer)**:
 *    - Ascolta click su .fav-icon: se loggato, toggle preferiti e aggiorna UI; altrimenti redirect a login
 *    - Ascolta click su #revBtn: se loggato, gestisce aggiunta/eliminazione review con validazione; altrimenti redirect a login
 *    - Aggiorna UI dopo ogni azione (replaceChild per ricreare card overview)
 *    - Gestione errori con try-catch per graceful degradation
 * 
 * 5. **Gestione note personali**:
 *    - Abilita/disabilita pulsante inserimento nota in base a input testo (event listener su noteTextInput)
 *    - Inserimento nota: valida, aggiunge via LoggedUser.addNote, aggiorna UI e reset input
 *    - Eliminazione nota: event delegation su userNotesContainer, chiama LoggedUser.deleteNote e aggiorna UI
 *    - Gestione errori per ogni operazione
 * 
 * 6. **Caricamento iniziale ricetta (window load)**:
 *    - Recupera dati completi ricetta via Recipe.getFullData(detailedRecipeId)
 *    - Crea e appende card overview
 *    - Popola lista ingredienti e istruzioni
 *    - Se utente loggato, mostra sezione note e popola note esistenti
 *    - Gestione errori con alert e log console
 * 
 * @note Il flusso è asincrono: operazioni come recupero dati e aggiornamenti UI sono await/async
 * @note Event delegation usato per gestire elementi dinamici (card, note)
 * @note Graceful degradation: errori locali non crashano l'app, UI rimane funzionale
 */
