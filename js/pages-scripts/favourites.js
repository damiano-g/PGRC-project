import { getRegisteredUsers, getLoggedUserId } from "../usersManagement.js";

/** @type {HTMLElement} Container griglia preferiti */
const favContainer = document.getElementById("favourites");

/** @type {HTMLButtonElement} Pulsante ricerca nella home */
const favSearchBtn = document.getElementById("searchBtn");

/** @type {HTMLInputElement} Campo input ricerca nella home */
const favSearchBar = document.getElementById("searchBar");





// Verifica l'autenticazione dell'utente al caricamento della pagina
window.addEventListener("load", () => {
    if(!getRegisteredUsers().some(item => item.id === getLoggedUserId())){
        window.location.href = "./login.html"
    }else{
        document.querySelector("body").classList.remove("d-none");
    }
});