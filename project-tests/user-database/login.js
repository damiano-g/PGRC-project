import { getRegisteredUsers, updateLoggedUser, searchUserbyName, admitUser, } from "./usersManagement.js"; 
import { validateBtn, } from "./validate.js";

// Oggetti DOM per gli input del form di login con stato di validazione
const loginUsernameInput = {
        DOMelement: document.getElementById("username"),
        inputStatus: 0,
}

const loginPasswordInput = {
        DOMelement: document.getElementById("password"),
        inputStatus: 0,
}

// Array degli input richiesti per la validazione del form
const loginRequiredInputs = [loginUsernameInput, loginPasswordInput];

// Riferimenti ai pulsanti del form di login
const loginCLearBtn = document.getElementById("clear");
const loginSubBtn = document.getElementById("submit");



// Gestione eventi degli input e validazione form

// Aggiorna lo stato dell'input username in base al contenuto
loginUsernameInput.DOMelement.addEventListener("input", () => {
    if(loginUsernameInput.DOMelement.value.length > 0){
        loginUsernameInput.inputStatus = 1;
    }else{
        loginUsernameInput.inputStatus = 0;
    }
});

// Aggiorna lo stato dell'input password in base al contenuto
loginPasswordInput.DOMelement.addEventListener("input", () => {
    if(loginPasswordInput.DOMelement.value.length > 0){
        loginPasswordInput.inputStatus = 1;
    }else{
        loginPasswordInput.inputStatus = 0;
    }
});

// Valida il form ad ogni input per abilitare/disabilitare il pulsante submit
loginRequiredInputs.forEach(inputObject => inputObject.DOMelement.addEventListener("input", () => validateBtn(loginRequiredInputs, loginSubBtn)));

// Gestisce il processo di login completo con autenticazione
loginSubBtn.addEventListener("click", async () => {

    loginSubBtn.disabled = true;
    loginCLearBtn.disabled = true;
    loginRequiredInputs.forEach(item => item.DOMelement.disabled = true);

    try{
        const currentUsername = loginUsernameInput.DOMelement.value;
        const currentPassword = loginPasswordInput.DOMelement.value;
        const foundId = searchUserbyName(currentUsername, getRegisteredUsers());
        loginRequiredInputs.forEach(item => item.DOMelement.disabled = false);
        loginPasswordInput.DOMelement.value = "";
        loginPasswordInput.inputStatus = 0;
        if(!foundId){
            alert("Nome utente non trovato");
        }else{
            const admitted = await admitUser(foundId, currentPassword, getRegisteredUsers());
            if(admitted){
                updateLoggedUser(foundId);
                alert("Login effettuato");
                window.location.href = "./pages/landing.html";
            }else{
                alert("Password errata");
            }
        }
    }finally{
        loginCLearBtn.disabled = false;
    }
});

