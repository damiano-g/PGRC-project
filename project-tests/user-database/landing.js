import { updateLoggedUser, deleteUser, getLoggedUserId, getRegisteredUsers, } from "./common.js";

const logoutBtn = document.getElementById("logoutBtn");
const confirmBtn = document.getElementById("confirmBtn");



// Cancella l'utente corrente dal database - da valutare controllo password
confirmBtn.addEventListener("click", () => {
    deleteUser(getLoggedUserId());
    document.querySelector("body").classList.add("d-none");
    alert("Account eliminato");
    logoutBtn.click();
})

logoutBtn.addEventListener("click", () => {
    updateLoggedUser("");
    window.location.href = "../index.html";
});

window.addEventListener("load", () => {
    
    if(!getRegisteredUsers().some(item => item.id === getLoggedUserId())){
        window.location.href = "../index.html"
    }else{
        document.querySelector("body").classList.remove("d-none");
    }
});