import { createPreviewArray } from "../data-models.js";
import { fetchById } from "../recipesAPI.js";
import { getStoredReviews, isReviewed, RatingFunctions } from "../reviewsManagement.js";
import { populatePreviewContainer } from "../UI.js";
import { getRegisteredUsers, getLoggedUserId, searchUserById } from "../usersManagement.js";

/** @type {HTMLButtonElement} Pulsante ricerca nella home */
const favSearchBtn = document.getElementById("searchBtn");

/** @type {HTMLInputElement} Campo input ricerca nella home */
const favSearchBar = document.getElementById("searchBar");

const personalFavsContainer = document.getElementById("fav-recipes");
const presonalRevsContainer = document.getElementById("rev-recipes");
const PersonalNotesContainer = document.getElementById("noted-recipes");

const personalPageBody = document.querySelector("body");

personalPageBody.addEventListener("click", (click) => {

    const card = click.target.closest(".card");

    if(card){
        // Naviga alla pagina dettagli passando l'ID della ricetta come query parameter
        window.location.href = `../../pages/recipe-details.html?id=${card.dataset.itemId}`;
    }
});


// Verifica l'autenticazione dell'utente al caricamento della pagina
window.addEventListener("load", async () => {
    
    const currentUser = searchUserById(getLoggedUserId());
    
    if(!getRegisteredUsers().some(item => item.id === currentUser.id)){
        window.location.href = "./login.html"
    }else{
        document.querySelector("body").classList.remove("d-none");
    }

    const tempArray = [];
    const currentUserRevs = getStoredReviews().filter(element => isReviewed(element.recipeId, currentUser.id));

    for(let i=0; i < currentUser.favourites.length; i++){
        const response = await fetchById(currentUser.favourites[i]);
        tempArray.push(response.meals[0]);
    }

    populatePreviewContainer(createPreviewArray(tempArray, "none"), personalFavsContainer, RatingFunctions);

    tempArray.splice(0, tempArray.length);

    for(let i=0; i < currentUserRevs.length; i++){
        const response = await fetchById(currentUserRevs[i].recipeId);
        tempArray.push(response.meals[0]);
    }

    populatePreviewContainer(createPreviewArray(tempArray, "none"), presonalRevsContainer, RatingFunctions);

    tempArray.splice(0, tempArray.length);

    for(let i=0; i < currentUser.notes.length; i++){
        const response = await fetchById(currentUser.notes[i].recipeId);
        tempArray.push(response.meals[0]);
    }

    populatePreviewContainer(createPreviewArray(tempArray, "none"), PersonalNotesContainer, RatingFunctions);
});