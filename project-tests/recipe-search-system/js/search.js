import { fetchByCategory, fetchByName, } from "./recipesAPI.js";
import { RecipePreview } from "./temp.js";

const searchBtn = document.getElementById("searchBtn");
const searchBar = document.getElementById("searchBar");
const resultsContainer = document.getElementById("results-container");

function recipesPreviewArray(recipesObj){
    
    const resultsArray = [];

    recipesObj.meals.forEach(element => {
        const recipe = new RecipePreview(element);
        resultsArray.push(recipe);
    });

    return resultsArray;
}

function populateResults(recipesPreviewArray){

    resultsContainer.innerHTML = "";

    recipesPreviewArray.forEach(element => {
        const recipeCard = document.createElement("div");
        recipeCard.classList.add("card");
        recipeCard.classList.add("recipe-card");
        recipeCard.classList.add("mb-3");
        recipeCard.classList.add("mt-3");
        recipeCard.innerHTML = `
            <div class="card" data-recipe-id="${element.id}">
                <div class="row g-0">
                    <div class="col-4">
                        <img src="${element.image}" alt="${element.name}" class="img-fluid">
                    </div>
                    <div class="col-8">
                        <div class="card-body d-flex align-items-center">
                            <h5 class="card-title mb-0">${element.name}</h5>
                        </div>
                    </div>
                </div>
            </div>
        `;
        resultsContainer.appendChild(recipeCard);
    });
}

async function searchByName(string){
    const resposnseObj = await fetchByName(string);
    history.pushState(null, "", `./search.html?q=${string}`);
    const array = recipesPreviewArray(resposnseObj);
    populateResults(array);
}

async function searchByCategory(category){
    const resposnseObj = await fetchByCategory(category);
    const array = recipesPreviewArray(resposnseObj);
    populateResults(array);
}



searchBtn.addEventListener("click", () => {
    searchByName(String(searchBar.value))
});


resultsContainer.addEventListener("click", (click) => {

    // Cattura evento click -> se il target e inserito in un elemento .card (o lo è) restituisce il primo elemento card incontrato nella gerarchia (event bubbling)
    const card = click.target.closest(".card");

    if(card){
        window.location.href = `recipe-details.html?id=${card.dataset.recipeId}`;
    }
});


window.addEventListener("load", async () => {
    
    const query = window.location.search.substring(1).split("=");

    console.log(query[0], query[1]);
    
    if(query[0] === "q"){
        searchByName(query[1]);
    }
    
    if(query[0] === "cat"){
        searchByCategory(query[1]);
    }
});

window.addEventListener("popstate", () => {
    window.location.reload();
});

