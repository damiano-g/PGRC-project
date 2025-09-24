/**
 * @fileoverview Componenti UI per rendering card e popolamento container
 * @description Fornisce funzioni per creare elementi DOM delle card preview
 * e gestire il popolamento dei container con layout Bootstrap
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
 * @requires data-models - ItemPreview objects per input standardizzato
 */

import { LoggedUser, Recipe } from "./sessionControl.js";

// ================================================================================================
// PRIVATE UTILITY FUNCTIONS
// ================================================================================================

/**
 * Crea una singola card preview da oggetto ItemPreview normalizzato
 * 
 * @function createPreviewCard
 * @private
 * @param {import('./data-models.js').ItemPreview} itemObj - Oggetto dati normalizzato
 * @param {string} itemPreviewObj.id - ID univoco per data attribute
 * @param {string} itemPreviewObj.name - Nome da mostrare nel titolo
 * @param {string} itemPreviewObj.image - URL immagine per card
 * @param {HTMLElement|null} [bodyElement=null] - Elemento aggiuntivo da appendere al card-body
 * @returns {HTMLElement} Card Bootstrap pronta per inserimento nel DOM
 * 
 * @description
 * Factory function per card Bootstrap responsive con layout 5/7 colonne.
 * - Immagine sinistra (col-5) responsive con .img-fluid
 * - Contenuto destro (col-7) con titolo e spazio per elementi aggiuntivi
 * - Data attribute per identificazione durante event delegation
 * - Compatibile con CSS Grid per layout affiancato automatico
 * - Se bodyElement fornito, aggiunge button preferiti con icona Bootstrap
 * 
 * @example
 * const recipe = new ItemPreview({idMeal: "123", strMeal: "Pasta"});
 * const extraContent = document.createElement("div");
 * const cardElement = createPreviewCard(recipe, extraContent);
 * 
 * @since 1.0.0
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
      content += "Ancora nessuna recensione";
   }
   
   reviews.innerHTML = content;
   
   return reviews;
 }

/**
 * Utility generica per popolamento container con array di card
 * 
 * @function populatePreviewContainer
 * @private
 * @param {Array<import('./data-models.js').ItemPreview>} itemsObj - Array oggetti normalizzati
 * @param {HTMLElement} displayContainer - Container target per inserimento card
 * @param {Array<HTMLElement>|null} [bodyElementsArray=null] - Array elementi body opzionali
 * @returns {void}
 * 
 * @description
 * Popolazione sequenziale container con matching 1:1 tra preview e body elements.
 * - Reset completo container (innerHTML = "")
 * - Iterazione con indice per matching array paralleli
 * - Creazione card con body element corrispondente se fornito
 * 
 * @todo Aggiungere validazione lunghezza array per mismatch
 * @todo Considerare batch DOM insertion per performance
 * 
 * @since 1.0.0
 */
export function populatePreviewContainer (itemsObj, displayContainer, action = null) {
   if(action != "remove"){
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
            throw new Error("Wrong data format");
         }
         
         displayContainer.appendChild(createPreviewCard(itemsObj.items[i], relatedBodyElement));
      }
   }else{
      const allCards = displayContainer.querySelectorAll(".card");
      allCards.forEach(card => {
         if(itemsObj.items.some(preview => preview.id === card.dataset.itemId)){
            displayContainer.removeChild(card);
         };
      });
   }
}

export function addPreviewToContainer(itemsObj, displayContainer){
   populatePreviewContainer(itemsObj, displayContainer, "add");
};

export function removePreviewFromArray(itemsObj, displayContainer){
   populatePreviewContainer(itemsObj, displayContainer, "remove");
};


/**
 * Crea elemento slide per carousel Bootstrap da oggetto ItemPreview
 * 
 * @function createCarouselItem
 * @private
 * @param {import('./data-models.js').ItemPreview} fullRecipeObj - Oggetto dati normalizzato
 * @returns {HTMLElement} Elemento carousel-item pronto per carousel Bootstrap
 * 
 * @description
 * Factory per slide carousel con caption overlay e icona preferiti.
 * - Immagine full-width responsive (d-block w-100)
 * - Caption overlay nascosta su mobile (d-none d-md-block)
 * - Icona preferiti Bootstrap (bi-heart) con stato dinamico
 * - Data attribute per event delegation
 * - Progress bars per rating commentate nel codice
 * 
 * @example
 * const recipe = new ItemPreview({idMeal: "456", strMeal: "Pizza"});
 * const slideElement = createCarouselItem(recipe, GlobalRatingFunctions);
 * 
 * @since 1.0.0
 */
function createCarouselItem(fullRecipeObj) { 
   const carouselItem = document.createElement("div");
   carouselItem.classList.add("carousel-item");

   // Data attribute per identificazione (conversione esplicita a stringa)
   const tasteAvg = Recipe.avgTasteRate(fullRecipeObj.id)
   const difficultyAvg = Recipe.avgDifficultyRate(fullRecipeObj.id);
   carouselItem.dataset.itemId = String(fullRecipeObj.id);

   const image = document.createElement("img");
   image.src = fullRecipeObj.image;
   image.alt = fullRecipeObj.name;
   image.classList.add("d-block", "w-100");
   carouselItem.appendChild(image);

   const captionContainer = document.createElement("div");
   captionContainer.classList.add("carousel-caption", "start-0", "px-5");
   const recipeTitle = document.createElement("h1");
   recipeTitle.innerText = fullRecipeObj.name;
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
   
   favBtnDisplay(slideFavBtn, fullRecipeObj.id);

   return carouselItem;   
};

/**
 * Crea card per visualizzazione note utente con pulsante rimozione
 * 
 * @function createNoteCard
 * @private
 * @param {Object} userNote - Oggetto nota utente
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
 * @todo Aggiungere truncate per note lunghe
 * @todo Implementare preview/expand per contenuto esteso
 * 
 * @since 1.0.0
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
 * @namespace PreviewDisplayStrategy
 * @description
 * Raccolta di metodi specializzati per rendering preview con contenuto aggiuntivo.
 * Ogni metodo implementa una strategia specifica per tipo di dati e layout.
 * 
 * @since 1.0.0
 */
const CardDisplayStrategy = {

   withGlobalRating: function (itemObj) {
      return cardRatingContent(Recipe.avgTasteRate(itemObj.id), Recipe.avgTasteRate(itemObj.id), "Global ratings");
   },

   withUserRating: function (itemObj) {
      return cardRatingContent(Recipe.userTasteRate(itemObj.id), Recipe.userDifficulyRate(itemObj.id), "Your rating");
   },


   /**
    * Display preview con note testuali utente
    * 
    * @function displayWithNote
    * @memberof DisplayPreviews
    * @param {Array<import('./data-models.js').ItemPreview>} itemObj - Array ricette normalizzate
    * @param {HTMLElement} container - Container target per rendering
    * @param {Array<Object>} userNotesArray - Array note utente con text property
    * @returns {void}
    * 
    * @description
    * Strategia display per ricette con note testuali dell'utente.
    * - Matching 1:1 tra preview e note tramite indice array
    * - Rendering note come paragrafi semplici nel card-body
    * - Assume corrispondenza ordinata tra array input
    * 
    * @example
    * const notes = [{text: "Ricetta facile"}, {text: "Troppo salata"}];
    * DisplayPreviews.displayWithNote(recipes, container, notes);
    * 
    * @todo Validare lunghezza array per mismatch preview/note
    * @todo Aggiungere formatting HTML per note (bold, italic, links)
    * 
    * @since 1.0.0
    */
   withNotes: function (itemObj) {
      const notesContainer = document.createElement("ul");

      LoggedUser.getRecipeNotes(itemObj.id).forEach(note => {
         const noteDOMObj = document.createElement("li");
         const noteInner = document.createElement("span");
         noteInner.classList.add("text-truncate", "d-block");
         noteInner.innerText = note.text;
         noteDOMObj.appendChild(noteInner);
         notesContainer.appendChild(noteDOMObj);
      });

      return notesContainer;
   }
};

// ================================================================================================
// PUBLIC API - CAROUSEL MANAGEMENT
// ================================================================================================

/**
 * Popola carousel Bootstrap con array di slide da ItemPreview
 * 
 * @function populateCarousel
 * @param {Array<import('./data-models.js').ItemPreview>} recipesObj - Array oggetti normalizzati
 * @param {HTMLElement} carouselInner - Elemento .carousel-inner di Bootstrap
 * @returns {void}
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
 * populateCarousel(randomRecipes, document.querySelector(".carousel-inner"), GlobalRatingFunctions);
 * // Attivazione manuale primo slide
 * document.querySelector(".carousel-item").classList.add("active");
 * 
 * @todo Aggiungere opzione auto-activate primo slide
 * @todo Implementare lazy loading per immagini slide
 * 
 * @since 1.0.0
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
 * @function populateNotesContainer
 * @param {Array<Object>} userNotesArray - Array note utente
 * @param {HTMLElement} container - Container target per note
 * @returns {void}
 * 
 * @description
 * Popolamento specializzato per container note con gestione visibilità.
 * - Array vuoto → container nascosto (.d-none)
 * - Array popolato → container visibile + note cards
 * - Card note con pulsanti rimozione
 * 
 * @example
 * // Container nascosto se nessuna nota
 * populateNotesContainer([], notesContainer);
 * 
 * // Container visibile con note
 * populateNotesContainer(userNotes, notesContainer);
 * 
 * @todo Aggiungere animazioni show/hide
 * @todo Implementare paginazione per molte note
 * 
 * @since 1.0.0
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
 * @function favBtnDisplay
 * @param {HTMLElement} btn - Elemento icona Bootstrap (bi-heart/bi-heart-fill)
 * @param {string} recipeId - ID ricetta per verifica stato
 * @returns {void}
 * 
 * @description
 * State management per icona toggle preferiti con classi Bootstrap Icons.
 * - UserStatus.isLogged() && RecipeStatus.isFavourite(recipeId) → bi-heart-fill (pieno)
 * - Altri casi → bi-heart (vuoto)
 * - Gestione automatica aggiunta/rimozione classi CSS
 * 
 * @example
 * favBtnDisplay(iconElement, "52772");
 * 
 * @todo Aggiungere state icons/loading indicators
 * @todo Implementare animazioni transizioni stato
 * 
 * @since 1.0.0
 */
export function favBtnDisplay(btn, recipeId) { 
   if(LoggedUser.isLogged() && Recipe.isFavourite(recipeId)){
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
 * @function revBtnDisplay
 * @param {HTMLButtonElement} btn - Pulsante recensione da aggiornare
 * @param {string} recipeId - ID ricetta per verifica stato recensione
 * @returns {void}
 * 
 * @description
 * State management per pulsante toggle recensione.
 * - UserStatus.isLogged() && RecipeStatus.isReviewed(recipeId) → "Rimuovi recensione"
 * - Altri casi → "Aggiungi recensione"
 * 
 * @example
 * revBtnDisplay(reviewButton, "52772");
 * 
 * @todo Aggiungere preview rating nel button state
 * 
 * @since 1.0.0
 */
export function revBtnDisplay(btn, recipeId) { 
   if(LoggedUser.isLogged() && Recipe.isReviewed(recipeId)){
      btn.innerText = "Delete review";
   }else{
      btn.innerText = "Add review";
   }
};


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
   cardRevBtn.id = "revBtn";
   cardRevBtn.dataset.bsToggle = "modal";
   cardRevBtn.dataset.bsTarget = "#reviewDialog";

   overviewCard.appendChild(cardRevBtn);

   revBtnDisplay(cardRevBtn, recipeObj.id);

   return overviewCard;
};

export function initializeNavbar(bodyDOMObject, navBarDOMObject){
   let linkPrefix = "./";
   const userLogged = LoggedUser.isLogged();

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
      settingPageLink.addEventListener("click", () => window.location.href = linkPrefix + "modifUser.html");
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
      navBarDOMObject.querySelector("#searchBtn").addEventListener("click", () => {
         // Naviga a search.html con parametro query per ricerca automatica
         window.location.href = `${linkPrefix}search.html?q=${String(navBarDOMObject.querySelector("#searchBar").value)}`;
      });
   }

   if(userLogged){
      const logoutLink = navBarDOMObject.querySelector("#logout-link"); 
      logoutLink.addEventListener("click", () => {
         LoggedUser.endSession();
         if(bodyDOMObject.id != "index-page" && bodyDOMObject.id != "search-page"){
            window.location.href = "../index.html";
         }else{
            window.location.reload();
         }
      });
      logoutLink.classList.remove("d-none");
   }
};


// ================================================================================================
// ARCHITECTURE NOTES
// ================================================================================================

/*
DESIGN PATTERNS IMPLEMENTATI:

1. **Factory Pattern**:
   - createPreviewCard() e createCarouselItem() sono factory per elementi DOM
   - Input standardizzato (ItemPreview) → Output consistente (HTMLElement)
   - Incapsulano logica di creazione e struttura HTML

2. **Strategy Pattern**:
   - DisplayPreviews namespace con strategie multiple
   - displayWithRating, displayWithNote, displayCategories
   - Interfaccia comune, implementazione specializzata

3. **Separation of Concerns**:
   - Funzioni private per creazione, pubbliche per orchestrazione
   - Layout responsive delegato a CSS Grid/Bootstrap
   - Event handling delegato al codice chiamante

4. **Data Attributes Strategy**:
   - dataset.itemId per identificazione senza inquinare proprietà DOM
   - Permette event delegation efficiente nel codice chiamante
   - Type conversion esplicita (String()) per consistenza

ARCHITETTURA MODULARE:

- **Private Utilities**: Funzioni base per creazione elementi
- **Public API Display**: Strategie specializzate per contenuto
- **Public API Specialized**: Container e button management
- **No Layout Logic**: Responsabilità delegata a CSS/Bootstrap
*/