import { RecipePreview, FullRecipe, } from "./temp.js";
import { fetchAllCategories, rndFetch, } from "./recipesAPI.js";

const slideshow = document.querySelector(".carousel-inner");
const catContainer = document.getElementById("categories");


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
    
    categoriesArray.forEach(item => {
        const catCol = document.createElement("div");
        catCol.classList.add("col-md-4");
        catCol.classList.add("text-center");
        catCol.innerHTML = `
            <a href="./pages/search.html">${item.strCategory}</a>
        `;
        catContainer.appendChild(catCol);
    });

});