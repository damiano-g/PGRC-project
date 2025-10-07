/**
 * @fileoverview Componenti UI per rendering card e popolamento container
 * @description Fornisce funzioni per creare elementi DOM delle card preview
 * e gestire il popolamento dei contenuti nelle pagine
 * @requires sessionControl
 */

import { inputValidation, LoggedUser, Recipe } from "../services/session-service.js";

// ================================================================================================
// PRIVATE UTILITY FUNCTIONS
// ================================================================================================

/**
 * Crea elemento card preview da oggetto ItemPreview con contenuto opzionale
 * 
 * @function createPreviewCard
 * @private
 * @param {Object} itemObj - Oggetto dati con proprietà id, image, name
 * @param {HTMLElement|null} [bodyElement=null] - Elemento DOM opzionale da aggiungere al card-body
 * @returns {HTMLElement} Elemento card Bootstrap pronto per inserimento DOM
 * 
 * @see {@link favBtnDisplay} Per gestione stato icona preferiti
 * 
 * @description
 * Factory per card preview con layout responsive e contenuto dinamico.
 * - Struttura base: immagine + titolo + body opzionale
 * - Data attribute dataset.itemId per event delegation
 * - Icona preferiti aggiunta automaticamente se bodyElement fornito
 * - Styling Bootstrap per consistenza UI
 * 
 * @example
 * const recipe = {id: "52772", image: "pizza.jpg", name: "Pizza Margherita"};
 * const ratingElement = createRatingDiv(4.5, 3.2);
 * const card = createPreviewCard(recipe, ratingElement);
 * container.appendChild(card);
 * 
 * @todo Aggiungere validazione input per itemObj
 * @todo Considerare lazy loading per immagini
 */
function createPreviewCard (itemObj, bodyElement = null) { 
   const card = document.createElement("div");
   card.classList.add("card", "p-0");

   // Aggiunge data attribute per identificazione durante event delegation
   card.dataset.itemId = itemObj.id;
   card.innerHTML = `
         <div class="card-image position-relative">
               <img src="${itemObj.image}" alt="${itemObj.name}" class="img-fluid rounded-start">
         </div>
         <div class="card-body ps-4">
            <h5 class="card-title mb-3">${itemObj.name}</h5>
         </div>
   `;

   if(bodyElement){
      const cardImage = card.querySelector(".card-image");
      const cardFavIcon = document.createElement("i");
      cardFavIcon.classList.add("bi", "bi-heart", "fav-icon", "position-absolute", "top-0", "start-0");
      cardImage.appendChild(cardFavIcon);
      const cardBody = card.querySelector(".card-body");
      cardBody.appendChild(bodyElement);
      favBtnDisplay(cardFavIcon, itemObj.id);
   }

   return card;
 };

 /**
 * Crea elemento DOM per card con visualizzazione valutazioni ricetta
 * 
 * @private
 * @param {number} tasteRate - Valutazione sapore (0-5)
 * @param {number} difficultyRate - Valutazione difficoltà (0-5)
 * @param {string} title - Titolo sezione (es. "Global ratings")
 * @returns {HTMLElement} Div con contenuto valutazione formattato
 * 
 * @description
 * Factory per elemento rating con icone Bootstrap e testo.
 * - Mostra titolo sezione
 * - Se valutazioni > 0: icone stella e forchetta con valori
 * - Altrimenti: messaggio "Ancora nessuna recensione"
 * - Styling Bootstrap per layout responsive
 * 
 * @example
 * const ratingDiv = cardRatingContent(4.2, 3.1, "Global ratings");
 * cardBody.appendChild(ratingDiv);
 */
function cardRatingContent(tasteRate, difficultyRate, title) {
   const reviews = document.createElement("div");
      
   reviews.classList.add("container", "px-0", "rate-container");

   let content = `<span>${title}</span><br>`;

   if(Number(tasteRate) > 0 && Number(difficultyRate) > 0){
      content += `
      <div>
         <i class="bi bi-star-fill"></i><span class="ms-2 me-3">${tasteRate}</span>
         <i class="bi bi-fork-knife"></i><span class="ms-1">${difficultyRate}</span>
      </div>
      `;
   }else{
      content += "No ratings yet";
   }

   reviews.innerHTML = content;

   return reviews;
};

/**
 * Utility generica per popolamento container con array di card
 * 
 * @param {Object} itemsObj - Oggetto con type e array items
 * @param {HTMLElement} displayContainer - Container target per inserimento card
 * @param {string|null} [action=null] - Azione speciale: "add" o "remove"
 * 
 * @see {@link createPreviewCard} Per creazione singola card
 * @see {@link CardDisplayStrategy} Per strategie contenuto body
 * 
 * @description
 * Popolazione sequenziale container con matching 1:1 tra preview e body elements.
 * - Reset completo container (innerHTML = "") se action non "add"
 * - Iterazione con indice per matching array paralleli
 * - Creazione card con body element corrispondente se fornito
 * - Supporto rimozione selettiva per action "remove"
 * - Gestione errori locale: console.error per tipi non supportati, graceful degradation con relatedBodyElement = null
 * 
 * @example
 * const recipes = await PreviewArray.mealsByName("pasta");
 * populatePreviewContainer(recipes, document.getElementById("results-container"));
 */
export function populatePreviewContainer (itemsObj, displayContainer, action = null) {
   if(action != "remove"){
      if(itemsObj.items.length > 0){ // Permette di lasciare il messaggio di default della pagina in caso di array vuoto
         if(action != "add"){
            displayContainer.innerHTML = "";
         }
         
         for(let i=0; i < itemsObj.items.length; i++){
            let relatedBodyElement = null;
   
            switch(itemsObj.type){
               case "meals":
                  relatedBodyElement = CardDisplayStrategy.withGlobalRating(itemsObj.items[i]);
                  break;
               case "reviews":
                  relatedBodyElement = CardDisplayStrategy.withUserRating(itemsObj.items[i]);
                  break;
               case "notes":
                  relatedBodyElement = CardDisplayStrategy.withNotes(itemsObj.items[i]);
                  break;
               case "categories":
                  break;
               default:
                  console.error(`Unsupported item type ${itemsObj.type}`);
                  relatedBodyElement = null; 
            }
            
            displayContainer.appendChild(createPreviewCard(itemsObj.items[i], relatedBodyElement));
         }
      }
   }else{
      const allCards = displayContainer.querySelectorAll(".card");
      allCards.forEach(card => {
         if(itemsObj.items.some(preview => preview.id === card.dataset.itemId)){
            displayContainer.removeChild(card);
         };
      });
   }
};

/**
 * Aggiunge preview al container esistente senza reset
 * 
 * @function addPreviewToContainer
 * @param {Object} itemsObj - Oggetto con type e array items
 * @param {HTMLElement} displayContainer - Container target
 * 
 * @throws {Error} Rilancia errore se oggetto passato non conforme
 * 
 * @see {@link populatePreviewContainer}
 */
export function addPreviewToContainer(itemsObj, displayContainer){
   try {
      populatePreviewContainer(itemsObj, displayContainer, "add");
   } catch (error) {
      throw error;
   }
};

/**
 * Aggiunge preview al container esistente senza reset
 * 
 * @function addPreviewToContainer
 * @param {Object} itemsObj - Oggetto con type e array items
 * @param {HTMLElement} displayContainer - Container target
 * 
 * @throws {Error} Rilancia errore se oggetto passato non conforme
 * 
 * @see {@link populatePreviewContainer} 
 */
export function removePreviewFromContainer(itemsObj, displayContainer){
   try {
      populatePreviewContainer(itemsObj, displayContainer, "remove");
   } catch (error) {
      throw error;
   }
};


/**
 * Crea elemento slide per carousel Bootstrap da oggetto ItemPreview
 * 
 * @private
 * @param {Object} recipeObj - Oggetto dati con id, image, name
 * @returns {HTMLElement} Elemento carousel-item pronto per carousel Bootstrap
 * 
 * @see {@link favBtnDisplay} Per gestione icona preferiti
 * @see {@link Recipe.avgTasteRate} Per calcolo rating medio
 * 
 * @description
 * Factory per slide carousel con caption overlay e icona preferiti.
 * - Immagine full-width responsive (d-block w-100)
 * - Caption overlay con titolo e rating se disponibili
 * - Icona preferiti Bootstrap con stato dinamico
 * - Data attribute per event delegation
 * 
 * @example
 * const recipe = {id: "456", image: "pizza.jpg", name: "Pizza Margherita"};
 * const slideElement = createCarouselItem(recipe);
 * carouselInner.appendChild(slideElement);
 * 
 * @todo Aggiungere validazione input per recipeObj
 * @todo Considerare lazy loading per immagini slide
 */
function createCarouselItem(recipeObj) { 
   const carouselItem = document.createElement("div");
   carouselItem.classList.add("carousel-item");

   let tasteAvg;
   let difficultyAvg;

   // Graceful degradation: errore trascurabile - non blocca esecuzione e nessun messaggio per utente
   try {
      tasteAvg = Recipe.avgTasteRate(recipeObj.id)
      difficultyAvg = Recipe.avgDifficultyRate(recipeObj.id);
   } catch (error) {
      tasteAvg = 0;
      difficultyAvg = 0;
      console.error(error);
   }

   carouselItem.dataset.itemId = String(recipeObj.id);

   const image = document.createElement("img");
   image.src = recipeObj.image;
   image.alt = recipeObj.name;
   image.classList.add("d-block", "w-100");
   carouselItem.appendChild(image);

   const captionContainer = document.createElement("div");
   captionContainer.classList.add("carousel-caption", "start-0", "px-5");
   const recipeTitle = document.createElement("h1");
   recipeTitle.innerText = recipeObj.name;
   captionContainer.appendChild(recipeTitle);
   if(tasteAvg > 0 && difficultyAvg > 0){
      const recipeRating = document.createElement("span");
      recipeRating.innerHTML = `
         <i class="bi bi-star-fill"></i><span class="ms-2 me-3">${tasteAvg}</span>
         <i class="bi bi-fork-knife"></i><span class="ms-1">${difficultyAvg}</span>
      `;
      captionContainer.appendChild(recipeRating);
   }
   carouselItem.appendChild(captionContainer);

   const slideFavBtn = document.createElement("i");
   slideFavBtn.classList.add("bi", "bi-heart", "fs-4", "fav-icon", "position-absolute", "top-0", "end-0");
   carouselItem.appendChild(slideFavBtn);
   
   favBtnDisplay(slideFavBtn, recipeObj.id);

   return carouselItem;   
};

/**
 * Crea card per visualizzazione note utente con pulsante rimozione
 * 
 * @function createNoteCard
 * @private
 * @param {Object} userNote - Oggetto nota utente con id e text
 * @param {string} userNote.id - ID univoco nota per data attribute
 * @param {string} userNote.text - Contenuto testuale della nota
 * @returns {HTMLElement} Card Bootstrap con footer e pulsante rimozione
 * 
 * @description
 * Factory specializzata per card note con layout card-body + card-footer.
 * - Contenuto nota nel body
 * - Pulsante rimozione nel footer con data-note-id
 * - Styling Bootstrap standard per consistenza UI
 * 
 * @example
 * const note = {id: "123", text: "Ricetta facile"};
 * const card = createNoteCard(note);
 * notesContainer.appendChild(card);
 * 
 * @todo Aggiungere truncate per note lunghe
 */
function createNoteCard(userNote) { 
   const noteCard = document.createElement("div");
   noteCard.classList.add("card");

   noteCard.innerHTML = `
      <div class="card-body">${userNote.text}</div>
      <div class="card-footer"><button class="btn btn-secondary btn-sm" data-note-id="${userNote.id}">Rimuovi nota</button></div>
   `;

   return noteCard;
};

// ================================================================================================
// PUBLIC API - DISPLAY STRATEGIES
// ================================================================================================

/**
 * Namespace per strategie di display specializzate per diversi tipi di contenuto
 * 
 * @namespace CardDisplayStrategy
 * @description
 * Raccolta di metodi specializzati per rendering preview con contenuto aggiuntivo.
 * Ogni metodo implementa una strategia specifica per tipo di dati e layout.
 */
const CardDisplayStrategy = {

   /**
    * Display preview con rating globale
    * 
    * @function withGlobalRating
    * @memberof CardDisplayStrategy
    * @param {Object} itemObj - Oggetto con id per recuperare rating
    * @returns {HTMLElement} Elemento rating formattato
    * 
    * @see {@link cardRatingContent} Per creazione elemento rating
    * @see {@link Recipe.avgTasteRate} Per calcolo rating sapore
    * @see {@link Recipe.avgDifficultyRate} Per calcolo rating difficoltà
    * 
    * @description
    * Strategia display per ricette con rating globale calcolato.
    * - Recupero rating tramite Recipe.avgTasteRate e avgDifficultyRate
    * - Rendering con icone stella e forchetta
    * - Gestisce errori con graceful degradation - rate = 0 - non bloccante
    * 
    * @example
    * const ratingElement = CardDisplayStrategy.withGlobalRating(recipeObj);
    * card.appendChild(ratingElement);
    */
   withGlobalRating: function (itemObj) {
      let tasteRate;
      let difficultyRate;
      try {
         tasteRate = Recipe.avgTasteRate(itemObj.id);
         difficultyRate = Recipe.avgDifficultyRate(itemObj.id);
      } catch (error) {
         tasteRate = 0;
         difficultyRate = 0;
         console.error(error);
      }
      return cardRatingContent(tasteRate, difficultyRate, "Global ratings");
   },

   /**
    * Display preview con rating utente
    * 
    * @function withUserRating
    * @memberof CardDisplayStrategy
    * @param {Object} itemObj - Oggetto con id per recuperare rating utente
    * @returns {HTMLElement} Elemento rating formattato
    * 
    * @see {@link cardRatingContent} Per creazione elemento rating
    * @see {@link Recipe.userTasteRate} Per recupero rating sapore utente
    * @see {@link Recipe.userDifficultyRate} Per recupero rating difficoltà utente
    * 
    * @description
    * Strategia display per ricette con rating personale dell'utente.
    * - Recupero rating tramite Recipe.userTasteRate e userDifficulyRate
    * - Rendering con icone stella e forchetta
    * - Gestisce errori con graceful degradation - rate = 0 - non bloccante
    * 
    * @example
    * const ratingElement = CardDisplayStrategy.withUserRating(recipeObj);
    * card.appendChild(ratingElement);
    */
   withUserRating: function (itemObj) {
      let tasteRate;
      let difficultyRate;
      try {
         tasteRate = Recipe.userTasteRate(itemObj.id);
         difficultyRate = Recipe.userDifficultyRate(itemObj.id);
      } catch (error) {
         tasteRate = 0;
         difficultyRate = 0;
         console.error(error);
      }
      return cardRatingContent(tasteRate, difficultyRate, "Your rating");
   },

   /**
    * Display preview con note testuali utente
    * 
    * @function withNotes
    * @memberof CardDisplayStrategy
    * @param {Object} itemObj - Oggetto con id per recuperare note
    * @returns {HTMLElement} Lista note formattata
    * 
    * @see {@link LoggedUser.getRecipeNotes} Per recupero note utente
    * 
    * @description
    * Strategia display per ricette con note testuali dell'utente.
    * - Recupero note tramite LoggedUser.getRecipeNotes()
    * - Rendering come lista con truncate per testi lunghi
    * - Gestisce eccezioni con messaggio di errore in card non bloccante
    * 
    * @example
    * const notesElement = CardDisplayStrategy.withNotes(recipeObj);
    * card.appendChild(notesElement);
    */
   withNotes: function (itemObj) {
      const notesContainer = document.createElement("ul");

      try {
         LoggedUser.getRecipeNotes(itemObj.id).forEach(note => {
            const noteDOMObj = document.createElement("li");
            const noteInner = document.createElement("span");
            noteInner.classList.add("text-truncate", "d-block");
            noteInner.innerText = note.text;
            noteDOMObj.appendChild(noteInner);
            notesContainer.appendChild(noteDOMObj);
         });
      } catch (error) {
         notesContainer.innerHTML = "Oooops! Something went wrong";
         console.error(error);
      }

      return notesContainer;
   }
};

// ================================================================================================
// PUBLIC API - CAROUSEL MANAGEMENT
// ================================================================================================

/**
 * Popola carousel Bootstrap con array di slide da ItemPreview
 * 
 * @param {Object} recipesObj - Oggetto con array items
 * @param {HTMLElement} carouselInner - Elemento .carousel-inner di Bootstrap
 * @returns {void}
 * 
 * @see {@link createCarouselItem} Per creazione singola slide
 * 
 * @description
 * Popolamento completo carousel con slide e caption.
 * - Reset completo carousel-inner
 * - Creazione slide sequenziale con icone preferiti
 * - Compatibilità Bootstrap carousel controls/indicators
 * - Nessuna attivazione automatica primo slide (da gestire esternamente)
 * 
 * @example
 * const randomRecipes = await get5RandomRecipes();
 * populateCarousel(randomRecipes, document.querySelector(".carousel-inner"));
 * // Attivazione manuale primo slide
 * document.querySelector(".carousel-item").classList.add("active");
 * 
 * @todo Implementare lazy loading per immagini slide
 */
export function populateCarousel(recipesObj, carouselInner) { 
   carouselInner.innerHTML = "";

   recipesObj.items.forEach(element => {
      carouselInner.appendChild(createCarouselItem(element));
   }); 
};

// ================================================================================================
// PUBLIC API - SPECIALIZED CONTAINERS
// ================================================================================================

/**
 * Gestione container note con logica show/hide automatica
 * 
 * @function populateRecipeNotes
 * @param {Array<Object>} userNotesArray - Array note utente
 * @param {HTMLElement} container - Container target per note
 * @returns {void}
 * 
 * @see {@link createNoteCard} Per creazione singola card nota
 * 
 * @description
 * Popolamento specializzato per container note con gestione visibilità.
 * - Array vuoto → container nascosto (.d-none)
 * - Array popolato → container visibile + note cards
 * - Card note con pulsanti rimozione
 * 
 * @example
 * // Container nascosto se nessuna nota
 * populateRecipeNotes([], notesContainer);
 * 
 * // Container visibile con note
 * populateRecipeNotes(userNotes, notesContainer);
 * 
 * @todo Aggiungere animazioni show/hide
 * @todo Implementare paginazione per molte note
 */
export function populateRecipeNotes(userNotesArray, container) { 
   container.innerHTML = "";
   if(userNotesArray.length > 0){
      userNotesArray.forEach(element => {
         container.appendChild(createNoteCard(element));
      });
      container.classList.remove("d-none");
   }else{
      container.classList.add("d-none");
   } 
};

// ================================================================================================
// PUBLIC API - BUTTON STATE MANAGEMENT
// ================================================================================================

/**
 * Aggiorna icona pulsante preferiti in base allo stato utente e ricetta
 * 
 * @param {HTMLElement} btn - Elemento icona Bootstrap (bi-heart/bi-heart-fill)
 * @param {string} recipeId - ID ricetta per verifica stato
 * 
 * @see {@link LoggedUser.isLogged} Per verifica stato login
 * @see {@link Recipe.isFavourite} Per verifica preferiti
 * 
 * @description
 * State management per icona toggle preferiti con classi Bootstrap Icons.
 * - UserStatus.isLogged() && RecipeStatus.isFavourite(recipeId) → bi-heart-fill (pieno)
 * - Altri casi → bi-heart (vuoto)
 * - Gestione automatica aggiunta/rimozione classi CSS
 * - Intercetta e gestisce eventuali errori provenienti dai moduli downstream
 *   senza interrompere il flusso delle funzioni chiamanti -> graceful degradation: icona vuota
 * 
 * @example
 * favBtnDisplay(iconElement, "52772");
 */
export function favBtnDisplay(btn, recipeId) {
   let condition;
   
   try {
      condition = Recipe.isFavourite(recipeId);
   } catch (error) {
      condition = false;
      console.error(error);
   }
   
   if(condition){
      btn.classList.remove("bi-heart");
      btn.classList.add("bi-heart-fill");
   }else{
      btn.classList.remove("bi-heart-fill");
      btn.classList.add("bi-heart");
   }
};

/**
 * Aggiorna testo pulsante recensione in base allo stato utente e ricetta
 * 
 * @param {HTMLButtonElement} btn - Pulsante recensione da aggiornare
 * @param {string} recipeId - ID ricetta per verifica stato recensione
 * 
 * @see {@link LoggedUser.isLogged} Per verifica stato login
 * @see {@link Recipe.isReviewed} Per verifica recensione
 * 
 * @description
 * State management per pulsante toggle recensione.
 * - UserStatus.isLogged() && RecipeStatus.isReviewed(recipeId) → "Delete review"
 * - Altri casi → "Add review"
 * - Intercetta e gestisce eventuali errori provenienti dai moduli downstream
 *   senza interrompere il flusso delle funzioni chiamanti -> graceful degradation: nessun testo per btn
 * 
 * @example
 * revBtnDisplay(reviewButton, "52772");
 * 
 * @todo Sistemare gestione errori
 */
export function revBtnDisplay(btn, recipeId) {
   try {
      const dialogBody = document.querySelector("#review-dialog .modal-body");
      btn.innerText = "Add review";

      if(Recipe.isReviewed(recipeId)){
         btn.innerText = "Delete review";
         dialogBody.querySelector(".form").classList.add("d-none");
         dialogBody.querySelector(".text").classList.remove("d-none");
      }else{
         dialogBody.querySelector(".form").classList.remove("d-none");
         dialogBody.querySelector(".text").classList.add("d-none");
      }
   } catch (error) {
      console.error(error);
   }
};

/**
 * Crea card overview ricetta con rating e pulsante recensione
 * 
 * @param {Object} recipeObj - Oggetto ricetta con id, image, name
 * @returns {HTMLElement} Card completa con rating e pulsante
 * 
 * @see {@link CardDisplayStrategy.withGlobalRating} Per rating globale
 * @see {@link CardDisplayStrategy.withUserRating} Per rating utente
 * @see {@link revBtnDisplay} Per stato pulsante recensione
 * @see {@link createPreviewCard} Per creazione base card
 * @see {@link LoggedUser.isLogged} Per verifica login utente
 * 
 * @description
 * Factory per card overview ricetta con contenuti dinamici.
 * - Rating globale sempre visibile
 * - Rating utente se loggato
 * - Pulsante recensione con stato dinamico
 * 
 * @example
 * const overview = createRecipeOverview(recipeData);
 * recipeContainer.appendChild(overview);
 * 
 * @todo Implementare strategia gestione errori
 */
export function createRecipeOverview(recipeObj) {
   
   const bodyElement = document.createElement("div");

   bodyElement.appendChild(CardDisplayStrategy.withGlobalRating(recipeObj));

   if(LoggedUser.isLogged()){
      bodyElement.appendChild(CardDisplayStrategy.withUserRating(recipeObj));
   }

   const overviewCard = createPreviewCard(recipeObj, bodyElement);
   const cardRevBtn = document.createElement("button");
   cardRevBtn.classList.add("btn", "btn-outline-secondary", "position-absolute", "bottom-0", "end-0");
   cardRevBtn.type = "button";
   cardRevBtn.id = "rev-btn";
   cardRevBtn.dataset.bsToggle = "modal";
   cardRevBtn.dataset.bsTarget = "#review-dialog";

   overviewCard.appendChild(cardRevBtn);

   revBtnDisplay(cardRevBtn, recipeObj.id);

   return overviewCard;
};

/**
 * Inizializza navbar con logica dinamica per navigazione
 * 
 * @param {HTMLElement} bodyDOMObject - Elemento body della pagina
 * @param {HTMLElement} navBarDOMObject - Elemento navbar
 * 
 * @see {@link LoggedUser.isLogged} Per verifica stato login
 * @see {@link LoggedUser.endSession} Per logout
 * 
 * @description
 * Configurazione dinamica navbar basata su stato utente e pagina corrente.
 * - Gestione link homepage, personale, impostazioni, login/logout
 * - Prefissi path dinamici per navigazione tra pagine
 * - Event listeners per click e navigazione
 * - Gestisce errori come user not logged - non bloccante
 * 
 * @example
 * initializeNavbar(document.body, document.querySelector("nav"));
 */
export function initializeNavbar(bodyDOMObject, navBarDOMObject){
   
   let linkPrefix = "./";
   let userLogged;
   try {
      userLogged = LoggedUser.isLogged();
   } catch (error) {
      userLogged = false;
      console.error("Error during navbar inizialization", error);
   }

   const homepageLink = navBarDOMObject.querySelector("#home-link");

   
   if(bodyDOMObject.id === "index-page"){
      linkPrefix += "pages/";
      homepageLink.classList.add("d-none");
   }else{
      homepageLink.addEventListener("click", () => window.location.href = "../index.html");      
   }

   if(bodyDOMObject.id != "personal-page" && bodyDOMObject.id != "login-page"){
      const personalpageLink = navBarDOMObject.querySelector("#personal-page-link");
      if(userLogged){
         personalpageLink.addEventListener("click", () => window.location.href = linkPrefix + "favourites.html"); 
      }else{
         personalpageLink.addEventListener("click", () => window.location.href = linkPrefix + "login.html");
      }
      personalpageLink.classList.remove("d-none");
   }

   if(bodyDOMObject.id != "settings-page" && userLogged){
      const settingPageLink = navBarDOMObject.querySelector("#account-settings-link");
      settingPageLink.addEventListener("click", () => window.location.href = linkPrefix + "settings.html");
      settingPageLink.classList.remove("d-none");
   }

   if(bodyDOMObject.id != "login-page" && !userLogged){
      const loginPageLink = navBarDOMObject.querySelector("#login-link");
      loginPageLink.addEventListener("click", () => window.location.href = linkPrefix + "login.html");
      loginPageLink.classList.remove("d-none");
   }

   if(bodyDOMObject.id != "signin-page" && !userLogged){
      const signinPageLink = navBarDOMObject.querySelector("#signin-link");
      signinPageLink.addEventListener("click", () => window.location.href = linkPrefix + "signin.html");
      signinPageLink.classList.remove("d-none");
   }

   if(bodyDOMObject.id != "search-page"){
      navBarDOMObject.querySelector("#search-btn").addEventListener("click", () => {
         // Naviga a search.html con parametro query per ricerca automatica
         window.location.href = `${linkPrefix}search.html?q=${String(navBarDOMObject.querySelector("#search-bar").value)}`;
      });
   }

   if(userLogged){
      const logoutLink = navBarDOMObject.querySelector("#logout-link"); 
      logoutLink.addEventListener("click", () => {
         try {
            LoggedUser.endSession();
            if(bodyDOMObject.id != "index-page" && bodyDOMObject.id != "search-page"){
               window.location.href = "../index.html";
            }else{
               window.location.reload();
            }
         } catch (error) {
            alert("Something went wrong. Try again to end session properly");
            console.error("Error during session ending", error);
         }
      });
      logoutLink.classList.remove("d-none");
   }
};



// ================================
// FORM VISUALIZATION
// ================================

/**
 * Formatta campo input con classi Bootstrap basate su validazione
 * 
 * @param {HTMLElement} inputElement - Elemento input DOM da formattare
 * @param {string|null} [reference=null] - Valore riferimento per validazione (es. password per conferma)
 * 
 * @see {@link inputValidation} Per logica validazione business
 * 
 * @description
 * Gestisce visualizzazione stato validazione per campi form con feedback specifico.
 * - Valore presente: chiama inputValidation e applica classi "is-valid"
 * - Valore assente: rimuove classi validazione
 * - Errore validazione: applica "is-invalid" e mostra feedback specifico per tipo errore
 * - Gestione errori generici con graceful degradation: alert + console.error per debug
 * 
 * **Struttura HTML necessaria per feedback specifico:**
 * ```html
 * <div class="form-group">
 *    <input id="email" type="email" class="form-control">
 *    <div class="invalid-feedback">
 *       <div class="invalid-format d-none">Formato email non valido</div>
 *       <div class="duplicated d-none">Email già registrata</div>
 *    </div>
 * </div>
 * ```
 * - `.invalid-feedback`: Contenitore messaggi errore
 * - `.invalid-format`: Messaggio per errori formato (codice 422)
 * - `.duplicated`: Messaggio per errori duplicazione (codice 409)
 * - Classi `d-none` per nascondere/mostrare messaggi
 * 
 * @example
 * formatInputField(document.getElementById("username"));
 * // Aggiunge "is-valid" se valido, "is-invalid" se errore
 * 
 * formatInputField(document.getElementById("confirm-password"), "password123");
 * // Valida conferma password con riferimento alla password originale
 */
export function formatInputField(inputElement, reference = null) {

   try {
      if(inputElement.value.length > 0 && inputElement.required){
         inputValidation(inputElement.dataset.field, inputElement.value, reference);
         inputElement.classList.add("is-valid");
         inputElement.classList.remove("is-invalid");
      }else{
         inputElement.classList.remove("is-valid");
         inputElement.classList.remove("is-invalid");
      }
   } catch (error) {

      const formatFeedback = inputElement.parentElement.querySelector(".invalid-feedback .invalid-format");
      const duplicatedFeedback = inputElement.parentElement.querySelector(".invalid-feedback .duplicated");
      
      switch(error.code){
         case 422:
            // Invalid format
            if(formatFeedback) formatFeedback.classList.remove("d-none");
            if(duplicatedFeedback) duplicatedFeedback.classList.add("d-none");
            break;
         case 409:
            // Duplicated value
            if(formatFeedback) formatFeedback.classList.add("d-none");
            if(duplicatedFeedback) duplicatedFeedback.classList.remove("d-none");
            break;
         default:
            alert("Ooops! Something went wrong. Please try again");
            inputElement.value = "";
            console.error(error, error.code);
      }

      inputElement.classList.remove("is-valid");
      inputElement.classList.add("is-invalid");
   }
};



/**
 * Mostra lo spinner overlay creando e aggiungendo un elemento al DOM
 * 
 * @function showOverlay
 * 
 * @see {@link hideOverlay} Per nascondere lo spinner
 * 
 * @description
 * Crea dinamicamente un overlay spinner Bootstrap e lo aggiunge al body della pagina.
 * L'overlay include uno spinner animato e testo accessibile per screen reader.
 * Utilizzato per bloccare l'interfaccia utente durante operazioni critiche e/o asincrone lunghe.
 * L'overlay ha ID "spinner-overlay" per identificazione univoca.
 * 
 * @example
 * showOverlay(); // Mostra spinner durante caricamento dati
 * // Esegue operazioni async...
 * hideOverlay(); // Nasconde spinner al completamento
 */
export function showOverlay(){
   const spinnerOverlay = document.createElement("div");
   spinnerOverlay.id = "spinner-overlay";
   spinnerOverlay.innerHTML = `
      <div class="spinner-border text-light">
         <span class="visually-hidden">Loading</span> <!-- Per screen reader -->
      </div>
   `;
   document.querySelector("body").appendChild(spinnerOverlay);
};

/**
 * Nasconde lo spinner overlay rimuovendo l'elemento dal DOM
 * 
 * @function hideOverlay
 * 
 * @see {@link showOverlay} Per mostrare lo spinner
 * 
 * @description
 * Rimuove completamente l'overlay spinner dal DOM selezionandolo per ID e rimuovendolo dal body.
 * Utilizzato per ripristinare l'interfaccia utente dopo il completamento di operazioni asincrone.
 * Include controllo di esistenza per evitare errori se l'overlay non è presente.
 * 
 * @example
 * showOverlay(); // Mostra spinner
 * // ...operazioni async completate
 * hideOverlay(); // Rimuove completamente l'overlay dal DOM
 */
export function hideOverlay(){
   const spinnerOverlay = document.querySelector("#spinner-overlay");
   if(spinnerOverlay){
      document.querySelector("body").removeChild(spinnerOverlay);
   }
}


// ============================================================================
// ANALISI E DESCRIZIONE DEL FILE
// ============================================================================

/**
 * @description Analisi e descrizione del file ui.js
 * 
 * **Scopo e ruolo nel progetto:**
 * Modulo principale per la gestione dell'interfaccia utente (UI).
 * Fornisce componenti riutilizzabili per il rendering di elementi DOM, la gestione dello stato dei pulsanti,
 * la validazione dei form e l'interazione con l'utente.
 * È progettato per separare la logica di presentazione dalla logica di business, facilitando la manutenzione e la scalabilità.
 * 
 * **Architettura e struttura:**
 * - **Funzioni private:** Utility interne per creazione elementi (createPreviewCard, cardRatingContent, ecc.).
 * - **Namespace CardDisplayStrategy:** Strategie specializzate per rendering contenuti dinamici (rating, note).
 * - **API pubblica:** Funzioni esportate per popolamento container, gestione carousel, navbar, form e overlay.
 * - **Dipendenze:** Importa moduli da session-service.js per logica business (LoggedUser, Recipe, inputValidation).
 * 
 * **Interazioni con altri moduli:**
 * - **session-service.js:** Riceve dati e stati utente/ricette per rendering dinamico.
 * - **Pagine (es. signin.js, recipe-details.js):** Utilizzano funzioni come formatInputField, showOverlay per validazione e feedback.
 * - **Storage:** Indiretto tramite moduli business per recupero dati da visualizzare.
 * 
 * **Flusso di esecuzione documentato:**
 * 
 * 1. **Import moduli e dipendenze:**
 *    - Importa funzioni da session-service.js per validazione, stati utente e ricette.
 * 
 * 2. **Definizione funzioni private (utility):**
 *    - createPreviewCard: Factory per card preview con contenuto opzionale.
 *    - cardRatingContent: Crea elementi rating con icone e testo.
 *    - createCarouselItem: Factory per slide carousel con caption e preferiti.
 *    - createNoteCard: Factory per card note utente con pulsante rimozione.
 * 
 * 3. **Namespace CardDisplayStrategy:**
 *    - withGlobalRating: Rendering rating globale per ricette.
 *    - withUserRating: Rendering rating personale utente.
 *    - withNotes: Rendering note testuali utente.
 * 
 * 4. **API pubblica - popolamento container:**
 *    - populatePreviewContainer: Popola container con card basate su tipo (meals, reviews, notes).
 *    - addPreviewToContainer/removePreviewFromContainer: Wrapper per aggiunta/rimozione selettiva.
 *    - populateCarousel: Popola carousel Bootstrap con slide.
 *    - populateRecipeNotes: Gestisce container note con show/hide automatico.
 * 
 * 5. **API pubblica - gestione stato pulsanti:**
 *    - favBtnDisplay: Aggiorna icona preferiti (bi-heart/bi-heart-fill) basata su stato.
 *    - revBtnDisplay: Aggiorna testo pulsante recensione (Add/Delete) basata su stato.
 *    - createRecipeOverview: Crea card completa overview con rating e pulsante.
 * 
 * 6. **API pubblica - navbar e form:**
 *    - initializeNavbar: Configura navbar dinamica basata su pagina e stato utente.
 *    - formatInputField: Valida campi form e applica classi Bootstrap con feedback specifico.
 * 
 * 7. **API pubblica - overlay e spinner:**
 *    - showOverlay: Crea e mostra spinner overlay per operazioni asincrone.
 *    - hideOverlay: Rimuove spinner overlay al completamento.
 * 
 * **Note tecniche:**
 * - **Graceful degradation:** Errori nei moduli downstream (es. Recipe.avgTasteRate) non bloccano rendering.
 * - **Scalabilità:** Permette aggiunta facile di nuovi tipi di contenuto senza modificare codice esistente.
 * - **Testabilità:** Funzioni pure dove possibile, separazione logica UI da business facilita unit testing.
 * 
 * @note Questo modulo è centrale per l'UX: errori qui impattano direttamente l'interfaccia utente.
 * @note Compatibilità: Dipendente da Bootstrap 5 per classi CSS e componenti (carousel, modal, form validation).
 */