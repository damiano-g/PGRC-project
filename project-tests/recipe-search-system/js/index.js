import { ItemPreview, FullRecipe, } from "./data-models.js";
import { fetchAllCategories, rndFetch, } from "./recipesAPI.js";
import { createPreviewCard } from "./UI.js";

const slideshow = document.querySelector(".carousel-inner");
const catContainer = document.getElementById("categories");
const homeSearchBtn = document.getElementById("searchBtn");
const homeSearchBar = document.getElementById("searchBar");


function createCarouselItem(recipe){

    const carouselItem = document.createElement("div");
    carouselItem.classList.add("carousel-item");
    carouselItem.dataset.itemId = String(recipe.id);

    carouselItem.innerHTML = `
        <img src=${recipe.image} class="d-block w-100" alt=${recipe.name}> <!-- d-block and w-100 prevent browser default image alignement -->
        <div class="carousel-caption d-none d-md-block"> <!-- d-none and d-md-block hides captions in smaller viewports -->
            <h5>${recipe.name}</h5>
        </div>
    `;

    return carouselItem;
}

window.addEventListener("load", async () => {
    const recipesArray = [];

    for(let i=1; i<=5; i++){
        const recipes = await rndFetch();
        recipesArray.push(new ItemPreview(recipes.meals[0]));
    }

    recipesArray.forEach(item => {
        const newItem = createCarouselItem(item);
        slideshow.appendChild(newItem);
    });

    document.querySelector(".carousel-inner .carousel-item").classList.add("active");

    const catObj = await fetchAllCategories();
    
    // Uniforma la struttura dell'oggetto di preview e prepara per implementazione cache
    const categoriesArray = [];
    catObj.categories.forEach(element => {
        categoriesArray.push(new ItemPreview(element));
    });

    console.log(categoriesArray);

    categoriesArray.forEach(element => {
        const catCol = document.createElement("div");
        catCol.classList.add("col-md-4");
        catCol.appendChild(createPreviewCard(element));
        catContainer.appendChild(catCol);
    });

});

catContainer.addEventListener("click", (click) => {

    // Cattura evento click -> se il target e inserito in un elemento .card (o lo è) restituisce il primo elemento card incontrato nella gerarchia (event bubbling)
    const card = click.target.closest(".card");

    if(card){
        window.location.href = `./pages/search.html?cat=${card.dataset.itemId}`;
    }
});

slideshow.addEventListener("click", (click) => {
    const slide = click.target.closest(".carousel-item");
    if(slide){
        window.location.href = `./pages/recipe-details.html?id=${slide.dataset.itemId}`;
    }
});


homeSearchBtn.addEventListener("click", () => {
    window.location.href = `./pages/search.html?q=${String(homeSearchBar.value)}`
});
