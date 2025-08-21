
// Script per la validazione e gestione del form di registrazione utente
const inBox = document.querySelectorAll(".form-control");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPassInput = document.getElementById("confirmPassword");
const subBtn = document.getElementById("submit");

// Valida il campo username: deve avere almeno 2 caratteri
function validateUsername() {
        
    if(String(usernameInput.value).length >= 2){
            usernameInput.classList.add("is-valid");
            usernameInput.classList.remove("is-invalid");        
    }else{
            if(String(usernameInput.value).length > 0){
                    usernameInput.classList.add("is-invalid");
                    usernameInput.classList.remove("is-valid");
            }else{
                    usernameInput.classList.remove("is-invalid");
                    usernameInput.classList.remove("is-valid");
            }
    }
}

// Valida il campo email: controlla che sia nel formato corretto
function validateEmail(){

    const pattern = /^(?!.*\.\.)(?!.*\.\@)[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/

    if(pattern.test(emailInput.value)){
            emailInput.classList.add("is-valid");
            emailInput.classList.remove("is-invalid");
    }else{
            if(String(emailInput.value).length > 0){
                    emailInput.classList.add("is-invalid");
                    emailInput.classList.remove("is-valid");
            }else{
                    emailInput.classList.remove("is-invalid");
                    emailInput.classList.remove("is-valid");
            }
    }
}

// Valida il campo password: verifica lunghezza, presenza di maiuscole, minuscole e numeri
function validatePassword() {

    const upCase = /[A-Z]/g;
    const lowCase = /[a-z]/g;
    const num = /[0-9]/g;
    
    if(String(passwordInput.value).match(upCase)){
            document.getElementById("upCase").classList.add("valid-text");
    }else{
            document.getElementById("upCase").classList.remove("valid-text");
    }

    if(String(passwordInput.value).match(lowCase)){
            document.getElementById("lowCase").classList.add("valid-text");
    }else{
            document.getElementById("lowCase").classList.remove("valid-text");
    }

    if(String(passwordInput.value).match(num)){
            document.getElementById("num").classList.add("valid-text");
    }else{
            document.getElementById("num").classList.remove("valid-text");
    }

    if(String(passwordInput.value).length >= 8){
            document.getElementById("passLen").classList.add("valid-text");
    }else{
            document.getElementById("passLen").classList.remove("valid-text");
    }

    if( String(passwordInput.value).length >= 8 && String(passwordInput.value).match(lowCase) && String(passwordInput.value).match(upCase) && String(passwordInput.value).match(num) ){
            passwordInput.classList.add("is-valid");
            passwordInput.classList.remove("is-invalid");
            confirmPassInput.disabled = false;
    }else{
            confirmPassInput.disabled = true;

            if(String(passwordInput.value).length > 0){
                    passwordInput.classList.add("is-invalid");
                    passwordInput.classList.remove("is-valid");
            }else{
                    passwordInput.classList.remove("is-invalid");
                    passwordInput.classList.remove("is-valid");
            }
    }
}

// Valida il campo di conferma password: deve coincidere con la password e la password deve essere valida
function validatePassConfirm() {

    if(passwordInput.classList.contains("is-valid") && passwordInput.value === confirmPassInput.value){
            confirmPassInput.classList.add("is-valid");
            confirmPassInput.classList.remove("is-invalid");
    }else{
            if(String(confirmPassInput.value).length > 0){
                    confirmPassInput.classList.add("is-invalid");
                    confirmPassInput.classList.remove("is-valid");
            }else{
                    confirmPassInput.classList.remove("is-invalid");
                    confirmPassInput.classList.remove("is-valid");
            }
    }
}

// Controlla se tutti i campi sono validi e abilita/disabilita il pulsante di submit
function validateSub(){

    let ready = true;

    for(let i=0; i < inBox.length; i++){
            if(!inBox[i].classList.contains("is-valid")) ready = false;
    }

    if(ready) {
            subBtn.disabled = false;
    }else{
            subBtn.disabled = true;
    }
}


// Attiva la validazione del campo username ad ogni input
usernameInput.addEventListener("input", validateUsername);

// Attiva la validazione del campo email ad ogni input
emailInput.addEventListener("input", validateEmail);

// Attiva la validazione del campo password ad ogni input
passwordInput.addEventListener("input", validatePassword);

// Attiva la validazione del campo conferma password ad ogni input
confirmPassInput.addEventListener("input", validatePassConfirm);

// Controlla lo stato di tutti i campi ad ogni input per abilitare/disabilitare il submit
inBox.forEach(input => input.addEventListener("input", validateSub));