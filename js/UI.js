/**
 * @fileoverview Componenti UI per rendering card e popolamento container
 * @description Fornisce funzioni per creare elementi DOM delle card preview
 * e gestire il popolamento dei contenuti nelle pagine
 * @requires sessionControl
 */

import { LoggedUser, Recipe } from "./sessionControl.js";

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
      content += "Ancora nessuna recensione";
   }

   reviews.innerHTML = content;

   return reviews;
}

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
               throw new Error("Wrong data format");
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
 * @see {@link populatePreviewContainer}
 */
export function addPreviewToContainer(itemsObj, displayContainer){
   populatePreviewContainer(itemsObj, displayContainer, "add");
};

/**
 * Aggiunge preview al container esistente senza reset
 * 
 * @function addPreviewToContainer
 * @param {Object} itemsObj - Oggetto con type e array items
 * @param {HTMLElement} displayContainer - Container target
 * 
 * @see {@link populatePreviewContainer} 
 */
export function removePreviewFromArray(itemsObj, displayContainer){
   populatePreviewContainer(itemsObj, displayContainer, "remove");
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

   // Data attribute per identificazione (conversione esplicita a stringa)
   const tasteAvg = Recipe.avgTasteRate(recipeObj.id)
   const difficultyAvg = Recipe.avgDifficultyRate(recipeObj.id);
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
    * 
    * @example
    * const ratingElement = CardDisplayStrategy.withGlobalRating(recipeObj);
    * card.appendChild(ratingElement);
    */
   withGlobalRating: function (itemObj) {
      return cardRatingContent(Recipe.avgTasteRate(itemObj.id), Recipe.avgDifficultyRate(itemObj.id), "Global ratings");
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
    * @see {@link Recipe.userDifficulyRate} Per recupero rating difficoltà utente
    * 
    * @description
    * Strategia display per ricette con rating personale dell'utente.
    * - Recupero rating tramite Recipe.userTasteRate e userDifficulyRate
    * - Rendering con icone stella e forchetta
    * 
    * @example
    * const ratingElement = CardDisplayStrategy.withUserRating(recipeObj);
    * card.appendChild(ratingElement);
    */
   withUserRating: function (itemObj) {
      return cardRatingContent(Recipe.userTasteRate(itemObj.id), Recipe.userDifficulyRate(itemObj.id), "Your rating");
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
    * 
    * @example
    * const notesElement = CardDisplayStrategy.withNotes(recipeObj);
    * card.appendChild(notesElement);
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
 * Intercetta e gestisce eventuali errori provenienti dai moduli downstream
 * senza interrompere il flusso delle funzioni chiamanti.
 * 
 * @example
 * favBtnDisplay(iconElement, "52772");
 */
export function favBtnDisplay(btn, recipeId) {
   try {
      if(LoggedUser.isLogged() && Recipe.isFavourite(recipeId)){
         btn.classList.remove("bi-heart");
         btn.classList.add("bi-heart-fill");
      }else{
         btn.classList.remove("bi-heart-fill");
         btn.classList.add("bi-heart");
      }
   } catch (error) {
      // NB -> log di eventuali errori gestito downstream
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
 * Intercetta e gestisce eventuali errori provenienti dai moduli downstream
 * senza interrompere il flusso delle funzioni chiamanti.
 * 
 * @example
 * revBtnDisplay(reviewButton, "52772");
 */
export function revBtnDisplay(btn, recipeId) {
   try {
      if(LoggedUser.isLogged() && Recipe.isReviewed(recipeId)){
         btn.innerText = "Delete review";
      }else{
         btn.innerText = "Add review";
      }
   } catch (error) {
      // Gestione log errori downstream
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
   cardRevBtn.id = "revBtn";
   cardRevBtn.dataset.bsToggle = "modal";
   cardRevBtn.dataset.bsTarget = "#reviewDialog";

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
 * 
 * @example
 * initializeNavbar(document.body, document.querySelector("nav"));
 */
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