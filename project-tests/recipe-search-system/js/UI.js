/**
 * Crea una card di anteprima da un ItemPreview.
 * @param {import('./data-models.js').ItemPreview} itemPreviewObj
 * @returns {HTMLElement} - Elemento card
 */
export function createPreviewCard(itemPreviewObj){
    const card = document.createElement("div");
    card.classList.add("card");
    card.classList.add("mb-1");
    card.classList.add("mt-1");
    card.dataset.itemId = itemPreviewObj.id;
    card.innerHTML = `
        <div class="row g-0">
            <div class="col-4">
                <img src="${itemPreviewObj.image}" alt="${itemPreviewObj.name}" class="img-fluid">
            </div>
            <div class="col-8">
                <div class="card-body d-flex align-items-center">
                    <h5 class="card-title mb-0">${itemPreviewObj.name}</h5>
                </div>
            </div>
        </div>
    `;

    return card;
};


export function populateContainer(previewItemsArray, container){
    container.innerHTML = "";
    previewItemsArray.forEach(element => {
        container.appendChild(createPreviewCard(element));
    });
};