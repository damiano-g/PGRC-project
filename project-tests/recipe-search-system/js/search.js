import { fetchByName, } from "./recipesAPI.js";
import { RecipePreview } from "./temp.js";

const searchBtn = document.getElementById("searchBtn");
const searchBar = document.getElementById("searchBar");
const resultsContainer = document.getElementById("results-container");




searchBtn.addEventListener("click", async () => {
    const recipesObj = await fetchByName(String(searchBar.value));

    const resultsArray = [];

    // Per succesiva cache
    recipesObj.meals.forEach(element => {
        const recipe = new RecipePreview(element);
        resultsArray.push(recipe);
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("card");
        recipeCard.classList.add("recipe-card");
        recipeCard.classList.add("mb-3");
        recipeCard.classList.add("mt-3");
        recipeCard.innerHTML = `
            <div class="card">
                <div class="row g-0">
                    <div class="col-4">
                        <img src="${recipe.image}" alt="${recipe.name}" class="img-fluid">
                    </div>
                    <div class="col-8">
                        <div class="card-body d-flex align-items-center">
                            <h5 class="card-title mb-0">${recipe.name}</h5>
                        </div>
                    </div>
                </div>
            </div>
        `;
        resultsContainer.appendChild(recipeCard);
    });

    console.log(resultsArray);
})