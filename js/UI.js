/**
 * @fileoverview Componenti UI per rendering card e popolamento container
 * @description Fornisce funzioni per creare elementi DOM delle card preview
 * e gestire il popolamento dei container con layout Bootstrap
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
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
            <div class="col-7">
                <div class="row card-body d-flex align-items-center">
                    <h5 class="card-title mb-3">${itemPreviewObj.name}</h5>
                </div>
            </div>
        </div>
    `;

    if(bodyElement){
      card.querySelector(".card-body").appendChild(bodyElement);  
    }

    return card;
}

function populatePreviewContainer (previewItemsArray, container, bodyElementsArray = null) {
    container.innerHTML = "";

    for(let i=0; i < previewItemsArray.length; i++){
        let relatedBodyElement = null;
        if(bodyElementsArray){
            relatedBodyElement = bodyElementsArray[i];
        }
        container.appendChild(createPreviewCard(previewItemsArray[i], relatedBodyElement));
    }
};

export const DisplayPreviews = {

    displayWithRating: function (previewItemsArray, container, ratingFunctions, userId = null) {
        
        const bodyElementsArray = [];

        previewItemsArray.forEach(element => {
            const taste = ratingFunctions.getTasteRate(element.id, userId);
            const difficulty = ratingFunctions.getDifficultyRate(element.id, userId);
            
            const title = element.type === "meals" ? "Recensioni globali" : "La mia recensione";
            
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

            const reviews = document.createElement("div");
            reviews.classList.add("container");
            reviews.classList.add("ps-4");
            reviews.innerHTML = content; 

            bodyElementsArray.push(reviews);
        });
        
        populatePreviewContainer(previewItemsArray, container, bodyElementsArray);
    },

    displayWithNote: function (previewItemsArray, container, userNotesArray) {
        const bodyElementsArray = [];

        userNotesArray.forEach(element => {
            const note = document.createElement("p");
            note.innerText = element.text;
            bodyElementsArray.push(note);
        });

        populatePreviewContainer(previewItemsArray, container, bodyElementsArray);
    },

    displayCategories: function (previewItemsArray, container) {
        populatePreviewContainer(previewItemsArray, container);
    }
}


// ===============================
// CREAZIONE ELEMENTI CAROUSEL
// ===============================

/**
 * Crea un elemento slide per carousel Bootstrap da un oggetto ItemPreview
 * Include immagine full-width e caption overlay per desktop
 * 
 * @function createCarouselItem
 * @param {import('./data-models.js').ItemPreview} itemPreviewObj - Oggetto dati normalizzato
 * @param {string} itemPreviewObj.id - ID univoco per data attribute
 * @param {string} itemPreviewObj.name - Nome da mostrare nella caption
 * @param {string} itemPreviewObj.image - URL immagine per slide
 * @returns {HTMLElement} Elemento carousel-item pronto per inserimento nel carousel
 * 
 * @description
 * - Div con classe carousel-item per Bootstrap carousel
 * - Immagine responsive full-width (d-block w-100)
 * - Caption overlay nascosta su mobile (d-none d-md-block)
 * - Data attribute per identificazione durante click events
 * 
 * @example
 * const recipe = new ItemPreview({idMeal: "456", strMeal: "Pizza", strMealThumb: "url"});
 * const slideElement = createCarouselItem(recipe);
 * carouselInner.appendChild(slideElement);
 */
function createCarouselItem(itemPreviewObj, ratingFunctions){
    const carouselItem = document.createElement("div");
    carouselItem.classList.add("carousel-item");

    // Data attribute per identificazione (conversione esplicita a stringa)
    const tasteAvg = ratingFunctions.getTasteRate(itemPreviewObj.id);
    const difficultyAvg = ratingFunctions.getDifficultyRate(itemPreviewObj.id);
    carouselItem.dataset.itemId = String(itemPreviewObj.id);

    carouselItem.innerHTML = `
        <img src=${itemPreviewObj.image} class="d-block w-100" alt=${itemPreviewObj.name}> <!-- d-block and w-100 prevent browser default image alignement -->
        <div class="carousel-caption d-none d-md-block"> <!-- d-none and d-md-block hides captions in smaller viewports -->
            <h5>${itemPreviewObj.name}</h5>
            <div class="row">
                <span>Gusto</span><progress class="w-50 mb-1" max="5" value="${tasteAvg}"></progress></progress>
            </div>
            <div class="row">
                <span>Difficoltà di preparazione</span><progress class="w-50 mb-1" max="5" value="${difficultyAvg}"></progress></progress>
            </div>
        </div>
    `;

    return carouselItem;
};


// ===============================
// GESTIONE POPOLAZIONE CAROUSEL
// ===============================

/**
 * Popola un carousel Bootstrap con array di slide da ItemPreview
 * Rimuove slide precedenti e aggiunge tutti i nuovi elementi
 * 
 * @function populateCarousel
 * @param {Array<import('./data-models.js').ItemPreview>} itemPreviewArray - Array oggetti normalizzati
 * @param {HTMLElement} carouselInner - Elemento .carousel-inner di Bootstrap
 * @returns {void}
 * 
 * @description
 * Strategia di popolamento carousel:
 * 1. Svuota completamente il carousel-inner
 * 2. Crea un carousel-item per ogni elemento dell'array
 * 3. Appende ogni slide al carousel-inner
 * 
 * Note Bootstrap:
 * - Il primo slide deve essere attivato manualmente (.active)
 * - Gestione navigation e indicators delegata al codice chiamante
 * - Responsive behavior automatico tramite classi Bootstrap
 * 
 * @example
 * // Popola carousel homepage con ricette casuali
 * const randomRecipes = await get5RandomRecipes();
 * populateCarousel(randomRecipes, document.querySelector(".carousel-inner"));
 * // Attiva primo slide
 * document.querySelector(".carousel-item").classList.add("active");
 * 
 * @note
 * La funzione non attiva automaticamente il primo slide.
 * È responsabilità del codice chiamante aggiungere classe .active.
 */
export function populateCarousel(itemPreviewArray, carouselInner, ratingFunctions){
    carouselInner.innerHTML = "";

    itemPreviewArray.forEach(element => {
        carouselInner.appendChild(createCarouselItem(element, ratingFunctions));
    });
};


function createNoteCard(userNote){
    const noteCard = document.createElement("div");
    noteCard.classList.add("card");
    noteCard.classList.add("mb-2");
    noteCard.classList.add("mt-2");

    noteCard.innerHTML = `
        <div class="card-body">${userNote.text}</div>
        <div class="card-footer"><button class="btn btn-secondary btn-sm" data-note-id="${userNote.id}">Rimuovi nota</button></div>
    `

    return noteCard;
}


// NB -> funzione boilerplate -> unificare la logica di popolamento dei container
export function populateNotesContainer(userNotesArray, container){
    container.innerHTML = "";
    if(userNotesArray.length > 0){
        userNotesArray.forEach(element => {
            container.appendChild(createNoteCard(element));
        });
        container.classList.remove("d-none");
    }else{
        container.classList.add("d-none");
    }
}

export function favBtnDisplay(btn, userLogged, userFavourite){
    if(userLogged && userFavourite){
        btn.innerText = "Rimuovi dai preferiti";
    }else{
        btn.innerText = "Aggiungi ai preferiti";
    }
}

export function revBtnDisplay(btn, userLogged, userReviewed){
    if(userLogged && userReviewed){
        btn.innerText = "Rimuovi recensione";
    }else{
        btn.innerText = "Aggiungi recensione";
    }
}



// ===============================
// PATTERN E DESIGN DECISIONS
// ===============================

/*
DESIGN PATTERN UTILIZZATI:

1. **Factory Pattern**:
   - createPreviewCard() e createCarouselItem() sono factory per elementi DOM
   - Input standardizzato (ItemPreview) → Output consistente (HTMLElement)
   - Incapsulano logica di creazione e struttura HTML

2. **Separation of Concerns**:
   - Funzioni di creazione separate da funzioni di popolamento
   - Layout responsive delegato a CSS Grid/Bootstrap
   - Event handling delegato al codice chiamante

3. **Data Attributes Strategy**:
   - dataset.itemId per identificazione senza inquinare proprietà DOM
   - Permette event delegation efficiente nel codice chiamante
   - Type conversion esplicita (String()) per consistenza

4. **CSS-First Responsive Design**:
   - Card verticali compatibili con CSS Grid automatico
   - Bootstrap classes per responsive behavior
   - No layout logic in JavaScript

ARCHITETTURA MODULARE:

- **createPreviewCard**: Componente riusabile per liste/griglie
- **createCarouselItem**: Componente specializzato per carousel
- **populateContainer**: Utility generica per container qualsiasi
- **populateCarousel**: Utility specifica per carousel Bootstrap
*/