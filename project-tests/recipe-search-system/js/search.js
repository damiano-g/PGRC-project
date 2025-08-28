import { fetchByCategory, fetchByName, } from "./recipesAPI.js";
import { ItemPreview, createPreviewArray } from "./data-models.js";
import { createPreviewCard, populateContainer } from "./UI.js";

const searchBtn = document.getElementById("searchBtn");
const searchBar = document.getElementById("searchBar");
const resultsContainer = document.getElementById("results-container");


searchBtn.addEventListener("click", async () => {
    const array = createPreviewArray(await fetchByName(String(searchBar.value)));
    history.pushState(null, "", `./search.html?q=${String(searchBar.value)}`);
    populateContainer(array, resultsContainer);
});


resultsContainer.addEventListener("click", (click) => {

    // Cattura evento click -> se il target e inserito in un elemento .card (o lo è) restituisce il primo elemento card incontrato nella gerarchia (event bubbling)
    const card = click.target.closest(".card");

    if(card){
        window.location.href = `recipe-details.html?id=${card.dataset.itemId}`;
    }
});


window.addEventListener("load", async () => {
    
    const query = window.location.search.substring(1).split("=");

    console.log(query[0], query[1]);
    
    if(query[0] === "q"){
        searchBar.value = query[1];
        searchBtn.click();
    }
    
    if(query[0] === "cat"){
        const array = createPreviewArray(await fetchByCategory(query[1]));
        populateContainer(array, resultsContainer);
    }
});

window.addEventListener("popstate", () => {
    window.location.reload();
});

