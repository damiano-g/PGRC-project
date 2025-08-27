import { fetchById } from "./recipesAPI.js";
import { FullRecipe } from "./data-models.js";

const recipeTitle = document.getElementById("recipe-title");
const imageBox = document.getElementById("image-box");
const ingredientsList = document.getElementById("ingredients-list");
const instructionsSteps = document.getElementById("instructions-steps");

window.addEventListener("load", async () => {
    
    // Estrae l'id della ricetta dalla query string dell'URL (?id=...)
    const recipeId = window.location.search.substring(4);

    // Effettua la fetch dei dettagli ricetta tramite l'ID
    const APIresponse = await fetchById(recipeId);

    // Crea un oggetto ricetta completo a partire dalla risposta API
    const recipeDetails = new FullRecipe(APIresponse.meals[0]);

    // Inserisce il titolo della ricetta nella pagina
    recipeTitle.innerText = recipeDetails.name;
    
    // Inserisce l'immagine della ricetta nella pagina
    imageBox.innerHTML = `
        <img src="${recipeDetails.image}" alt="${recipeDetails.name}">
    `;

    // Popola la lista degli ingredienti
    recipeDetails.ingredients.forEach(element => {
        const listItem = document.createElement("li");
        listItem.innerText = element.name+": "+element.measure;
        ingredientsList.appendChild(listItem);
    });

    // Inserisce le istruzioni di preparazione
    instructionsSteps.innerText = recipeDetails.instructions;

    console.log(window.location.search);
    console.log(recipeId);
    console.log(APIresponse);
    console.log(recipeDetails);
});