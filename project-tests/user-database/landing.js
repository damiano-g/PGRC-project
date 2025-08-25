import { updateLoggedUser, deleteUser, getLoggedUserId, getRegisteredUsers, } from "./usersManagement.js";

// Riferimenti agli elementi DOM della pagina landing
const logoutBtn = document.getElementById("logoutBtn");
const confirmBtn = document.getElementById("confirmBtn");



// Gestisce l'eliminazione definitiva dell'account utente
// Cancella l'utente corrente dal database - da valutare controllo password
confirmBtn.addEventListener("click", () => {
    deleteUser(getLoggedUserId());
    document.querySelector("body").classList.add("d-none");
    alert("Account eliminato");
    logoutBtn.click();
})

// Gestisce il logout dell'utente e reindirizza alla pagina principale
logoutBtn.addEventListener("click", () => {
    updateLoggedUser("");
    window.location.href = "../index.html";
});

// Verifica l'autenticazione dell'utente al caricamento della pagina
window.addEventListener("load", () => {
    
    if(!getRegisteredUsers().some(item => item.id === getLoggedUserId())){
        window.location.href = "../index.html"
    }else{
        document.querySelector("body").classList.remove("d-none");
    }
});