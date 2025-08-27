import { RecipePreview, FullRecipe, } from "./temp.js";
import { fetchAllCategories, rndFetch, } from "./recipesAPI.js";

const slideshow = document.querySelector(".carousel-inner");
const catContainer = document.getElementById("categories");
const homeSearchBtn = document.getElementById("searchBtn");
const homeSearchBar = document.getElementById("searchBar");


function createCarouselItem(recipe){

    const carouselItem = document.createElement("div");
    carouselItem.classList.add("carousel-item");

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
        recipesArray.push(new RecipePreview(recipes.meals[0]));
    }

    recipesArray.forEach(item => {
        const newItem = createCarouselItem(item);
        slideshow.appendChild(newItem);
    });

    document.querySelector(".carousel-inner .carousel-item").classList.add("active");

    const catObj = await fetchAllCategories();
    const categoriesArray = catObj.categories;

    console.log(categoriesArray);
    
    categoriesArray.forEach(item => {
        const catCol = document.createElement("div");
        catCol.classList.add("col-md-4");
        // catCol.classList.add("text-center");
        catCol.innerHTML = `
            <div class="card" data-category-name="${item.strCategory}">
                <div class="row g-0">
                    <div class="col-4">
                        <img src="${item.strCategoryThumb}" alt="${item.strCategory}" class="img-fluid">
                    </div>
                    <div class="col-8">
                        <div class="card-body d-flex align-items-center">
                            <h5 class="card-title mb-0">${item.strCategory}</h5>
                        </div>
                    </div>
                </div>
            </div>
        `;
        catContainer.appendChild(catCol);
    });

});

catContainer.addEventListener("click", (click) => {

    // Cattura evento click -> se il target e inserito in un elemento .card (o lo è) restituisce il primo elemento card incontrato nella gerarchia (event bubbling)
    const card = click.target.closest(".card");

    if(card){
        window.location.href = `./pages/search.html?cat=${card.dataset.categoryName}`;
    }
});

homeSearchBtn.addEventListener("click", () => {
    window.location.href = `./pages/search.html?q=${String(homeSearchBar.value)}`
});