import { getRegisteredUsers, updateLoggedUser, } from "./common.js";
import { searchUserbyName, admitUser, } from "./auth.js";
import { validateBtn, } from "./validate.js";

// DOM objects
const loginUsernameInput = {
        DOMelement: document.getElementById("username"),
        inputStatus: 0,
}

const loginPasswordInput = {
        DOMelement: document.getElementById("password"),
        inputStatus: 0,
}

const loginRequiredInputs = [loginUsernameInput, loginPasswordInput];

const loginCLearBtn = document.getElementById("clear");
const loginSubBtn = document.getElementById("submit");



// Events management

loginUsernameInput.DOMelement.addEventListener("input", () => {
    if(loginUsernameInput.DOMelement.value.length > 0){
        loginUsernameInput.inputStatus = 1;
    }else{
        loginUsernameInput.inputStatus = 0;
    }
});

loginPasswordInput.DOMelement.addEventListener("input", () => {
    if(loginPasswordInput.DOMelement.value.length > 0){
        loginPasswordInput.inputStatus = 1;
    }else{
        loginPasswordInput.inputStatus = 0;
    }
});

loginRequiredInputs.forEach(inputObject => inputObject.DOMelement.addEventListener("input", () => validateBtn(loginRequiredInputs, loginSubBtn)));

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

