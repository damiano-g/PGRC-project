/**
 * @fileoverview Componenti UI per rendering card e popolamento container
 * @description Fornisce funzioni per creare elementi DOM delle card preview
 * e gestire il popolamento dei container con layout Bootstrap
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
 * @requires data-models - ItemPreview objects per input standardizzato
 */

import { LoggedUser, RecipeStatus } from "./sessionControl.js";

// ================================================================================================
// PRIVATE UTILITY FUNCTIONS
// ================================================================================================

/**
 * Crea una singola card preview da oggetto ItemPreview normalizzato
 * 
 * @function createPreviewCard
 * @private
 * @param {import('./data-models.js').ItemPreview} itemPreviewObj - Oggetto dati normalizzato
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
function createPreviewCard (itemPreviewObj, bodyElement = null) { 
   const card = document.createElement("div");
   card.classList.add("card");
   card.classList.add("mb-1");
   card.classList.add("mt-1");

   // Aggiunge data attribute per identificazione durante event delegation
   card.dataset.itemId = itemPreviewObj.id;
   card.innerHTML = `
      <div class="row g-0">
         <div class="col-5">
               <img src="${itemPreviewObj.image}" alt="${itemPreviewObj.name}" class="img-fluid">
         </div>
         <div class="col-7 card-body">
            <h5 class="card-title mb-3">${itemPreviewObj.name}</h5>
         </div>
      </div>
   `;

   if(bodyElement){
      const cardBody = card.querySelector(".card-body");
      cardBody.appendChild(bodyElement);

      const cardFavBtn = document.createElement("button");
      cardFavBtn.classList.add("btn", "position-absolute", "bottom-0", "end-0", "fav-button");
      const cardFavIcon = document.createElement("i");
      cardFavIcon.classList.add("bi", "bi-heart", "fav-icon");
      cardFavBtn.appendChild(cardFavIcon);
      cardBody.appendChild(cardFavBtn);
      favBtnDisplay(cardFavIcon, itemPreviewObj.id);
   }

   return card;
 }

/**
 * Utility generica per popolamento container con array di card
 * 
 * @function populatePreviewContainer
 * @private
 * @param {Array<import('./data-models.js').ItemPreview>} previewItemsArray - Array oggetti normalizzati
 * @param {HTMLElement} container - Container target per inserimento card
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
function populatePreviewContainer (previewItemsArray, container, bodyElementsArray = null) { 
   container.innerHTML = "";

   for(let i=0; i < previewItemsArray.length; i++){
      let relatedBodyElement = null;
      if(bodyElementsArray){
         relatedBodyElement = bodyElementsArray[i];
      }
      container.appendChild(createPreviewCard(previewItemsArray[i], relatedBodyElement));
   }
}

/**
 * Crea elemento slide per carousel Bootstrap da oggetto ItemPreview
 * 
 * @function createCarouselItem
 * @private
 * @param {import('./data-models.js').ItemPreview} itemPreviewObj - Oggetto dati normalizzato
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
function createCarouselItem(itemPreviewObj) { 
   const carouselItem = document.createElement("div");
   carouselItem.classList.add("carousel-item");

   // Data attribute per identificazione (conversione esplicita a stringa)
   const tasteAvg = RecipeStatus.avgTasteRate(itemPreviewObj.id)
   const difficultyAvg = RecipeStatus.avgDifficultyRate(itemPreviewObj.id);
   carouselItem.dataset.itemId = String(itemPreviewObj.id);

   const image = document.createElement("img");
   image.src = itemPreviewObj.image;
   image.alt = itemPreviewObj.name;
   image.classList.add("d-block", "w-100");
   carouselItem.appendChild(image);

   const captionContainer = document.createElement("div");
   captionContainer.classList.add("carousel-caption", "d-none", "d-md-block");
   const recipeTitle = document.createElement("h5");
   recipeTitle.innerText = itemPreviewObj.name;
   captionContainer.appendChild(recipeTitle);
   const slideFavBtn = document.createElement("i");
   slideFavBtn.classList.add("bi", "bi-4x", "bi-heart", "fav-icon");
   captionContainer.appendChild(slideFavBtn);
   carouselItem.appendChild(captionContainer);

   favBtnDisplay(slideFavBtn, itemPreviewObj.id);

   // carouselItem.innerHTML = `
   //    <img src=${itemPreviewObj.image} class="d-block w-100" alt=${itemPreviewObj.name}> <!-- d-block and w-100 prevent browser default image alignement -->
   //    <div class="carousel-caption d-none d-md-block"> <!-- d-none and d-md-block hides captions in smaller viewports -->
   //       <h5>${itemPreviewObj.name}</h5>
   //       <button class="btn btn-lg position-absolute top-0 end-0"><i class="bi bi-2x bi-heart"></i></button>
   //       <div class="row">
   //          <span>Gusto</span><progress class="w-50 mb-1" max="5" value="${tasteAvg}"></progress>
   //       </div>
   //       <div class="row">
   //          <span>Difficoltà di preparazione</span><progress class="w-50 mb-1" max="5" value="${difficultyAvg}"></progress>
   //       </div>
   //    </div>
   // `;

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
   noteCard.classList.add("mb-2");
   noteCard.classList.add("mt-2");

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
 * @namespace DisplayPreviews
 * @description
 * Raccolta di metodi specializzati per rendering preview con contenuto aggiuntivo.
 * Ogni metodo implementa una strategia specifica per tipo di dati e layout.
 * 
 * @since 1.0.0
 */
export const DisplayPreviews = {

   /**
    * Display preview con rating progress bars (globali o utente)
    * 
    * @function displayWithRating
    * @memberof DisplayPreviews
    * @param {Array<import('./data-models.js').ItemPreview>} previewItemsArray - Array ricette normalizzate
    * @param {HTMLElement} container - Container target per rendering
    * @returns {void}
    * 
    * @description
    * Strategia display per ricette con visualizzazione rating via progress bars.
    * - element.type === "reviews" → "La mia recensione" con UserRatingFunctions
    * - Altri casi → "Recensioni globali" con GlobalRatingFunctions
    * - Fallback "Ancora nessuna recensione" per rating mancanti (taste/difficulty = 0)
    * - Progress bars HTML5 con max=5 e value dinamico
    * - Container con classi Bootstrap (container, ps-4)
    * 
    * @example
    * // Array con tipo meals → rating globali
    * DisplayPreviews.displayWithRating(recipesArray, container);
    * 
    * // Array con tipo reviews → rating utente
    * DisplayPreviews.displayWithRating(reviewsArray, container);
    * 
    * @todo Aggiungere validazione range rating (0-5)
    * @todo Implementare color coding per progress bars
    * 
    * @since 1.0.0
    */
   displayWithRating: function (previewItemsArray, container) { 
      const bodyElementsArray = [];

      previewItemsArray.forEach(element => {
         const taste = previewItemsArray.type === "reviews" ? RecipeStatus.userTasteRate(previewItemsArray.id) : RecipeStatus.avgTasteRate(previewItemsArray.id);
         const difficulty = previewItemsArray.type === "reviews" ? RecipeStatus.userDifficulyRate(previewItemsArray.id) : RecipeStatus.avgDifficultyRate(previewItemsArray.id);
         
         const title = element.type === "meals" ? "Recensioni globali" : "La mia recensione";
         
         const reviews = document.createElement("div");
         reviews.classList.add("container");
         reviews.classList.add("ps-4");
         
         let content = `<h6>${title}</h6>`;
         
         if(Number(taste) > 0 && Number(difficulty) > 0){
            content += `
            <div class="row">
            <span class="ps-0">Gusto</span><progress class="w-50 mb-1" max="5" value="${taste}"></progress></progress>
            </div>
            <div class="row">
            <span class="ps-0">Difficoltà di preparazione</span><progress class="w-50 mb-1" max="5" value="${difficulty}"></progress></progress>
            </div>
            `;
         }else{
            content += "Ancora nessuna recensione";
         }
         
         reviews.innerHTML = content; 
         bodyElementsArray.push(reviews);
      });
      
      populatePreviewContainer(previewItemsArray, container, bodyElementsArray);
   },

   /**
    * Display preview con note testuali utente
    * 
    * @function displayWithNote
    * @memberof DisplayPreviews
    * @param {Array<import('./data-models.js').ItemPreview>} previewItemsArray - Array ricette normalizzate
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
   displayWithNote: function (previewItemsArray, container, userNotesArray) { 
      const bodyElementsArray = [];

      userNotesArray.forEach(element => {
         const note = document.createElement("p");
         note.innerText = element.text;
         bodyElementsArray.push(note);
      });

      populatePreviewContainer(previewItemsArray, container, bodyElementsArray);
   },

   /**
    * Display semplice preview senza contenuto aggiuntivo
    * 
    * @function displayCategories
    * @memberof DisplayPreviews
    * @param {Array<import('./data-models.js').ItemPreview>} previewItemsArray - Array categorie normalizzate
    * @param {HTMLElement} container - Container target per rendering
    * @returns {void}
    * 
    * @description
    * Strategia display minimale per categorie o contenuto senza metadati.
    * - Solo card base con immagine e titolo
    * - Nessun contenuto aggiuntivo nel card-body
    * - Layout ottimizzato per griglie di navigazione
    * 
    * @example
    * // Display categorie ricette
    * DisplayPreviews.displayCategories(categories, categoriesContainer);
    * 
    * @since 1.0.0
    */
   displayCategories: function (previewItemsArray, container) { 
      populatePreviewContainer(previewItemsArray, container);
   }
};

// ================================================================================================
// PUBLIC API - CAROUSEL MANAGEMENT
// ================================================================================================

/**
 * Popola carousel Bootstrap con array di slide da ItemPreview
 * 
 * @function populateCarousel
 * @param {Array<import('./data-models.js').ItemPreview>} itemPreviewArray - Array oggetti normalizzati
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
export function populateCarousel(itemPreviewArray, carouselInner) { 
  carouselInner.innerHTML = "";

   itemPreviewArray.forEach(element => {
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
export function populateNotesContainer(userNotesArray, container) { 
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
   if(LoggedUser.isLogged() && RecipeStatus.isFavourite(recipeId)){
      btn.classList.remove("bi-heart");
      btn.classList.add("bi-heart-fill");
      //btn.innerText = "Rimuovi dai preferiti";
   }else{
      btn.classList.remove("bi-heart-fill");
      btn.classList.add("bi-heart");
      //btn.innerText = "Aggiungi ai preferiti";
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
   if(LoggedUser.isLogged() && RecipeStatus.isReviewed(recipeId)){
      btn.innerText = "Rimuovi recensione";
   }else{
      btn.innerText = "Aggiungi recensione";
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