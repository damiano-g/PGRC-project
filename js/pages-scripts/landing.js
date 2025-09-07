import { handleUserError, } from "../errorsManagement.js";
import { LoggedUser } from "../sessionControl.js";

// Riferimenti agli elementi DOM della pagina landing
const logoutBtn = document.getElementById("logoutBtn");
const confirmBtn = document.getElementById("confirmBtn");



// Gestisce l'eliminazione definitiva dell'account utente
// Cancella l'utente corrente dal database - da valutare controllo password
confirmBtn.addEventListener("click", () => {
    try {
        LoggedUser.deleteAccount();
        document.querySelector("body").classList.add("d-none");
        alert("Account eliminato");
        logoutBtn.click();
    } catch (error) {
        handleUserError(error);
    }
    
})

// Gestisce il logout dell'utente e reindirizza alla pagina principale
logoutBtn.addEventListener("click", () => {
    LoggedUser.endSession();
    window.location.href = "../../index.html";
});

// Verifica l'autenticazione dell'utente al caricamento della pagina
window.addEventListener("load", () => {
    if(!LoggedUser.isLogged()){
        window.location.href = "../../index.html"
    }else{
        document.querySelector("body").classList.remove("d-none");
    }
});