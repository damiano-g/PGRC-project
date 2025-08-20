
// Script per la validazione e gestione del form di registrazione utente
const inBox = document.querySelectorAll(".form-control");
const username = document.getElementById("username");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const subBtn = document.getElementById("submit");

// Valida il campo username: deve avere almeno 2 caratteri
function validateUsername() {
        
    if(String(username.value).length >= 2){
            username.classList.add("is-valid");
            username.classList.remove("is-invalid");        
    }else{
            if(String(username.value).length > 0){
                    username.classList.add("is-invalid");
                    username.classList.remove("is-valid");
            }else{
                    username.classList.remove("is-invalid");
                    username.classList.remove("is-valid");
            }
    }
}

// Valida il campo email: controlla che sia nel formato corretto
function validateEmail(){

    const pattern = /^(?!.*\.\.)(?!.*\.\@)[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/

    if(pattern.test(email.value)){
            email.classList.add("is-valid");
            email.classList.remove("is-invalid");
    }else{
            if(String(email.value).length > 0){
                    email.classList.add("is-invalid");
                    email.classList.remove("is-valid");
            }else{
                    email.classList.remove("is-invalid");
                    email.classList.remove("is-valid");
            }
    }
}

// Valida il campo password: verifica lunghezza, presenza di maiuscole, minuscole e numeri
function validatePassword() {

    const upCase = /[A-Z]/g;
    const lowCase = /[a-z]/g;
    const num = /[0-9]/g;
    
    if(String(password.value).match(upCase)){
            document.getElementById("upCase").classList.add("valid-text");
    }else{
            document.getElementById("upCase").classList.remove("valid-text");
    }

    if(String(password.value).match(lowCase)){
            document.getElementById("lowCase").classList.add("valid-text");
    }else{
            document.getElementById("lowCase").classList.remove("valid-text");
    }

    if(String(password.value).match(num)){
            document.getElementById("num").classList.add("valid-text");
    }else{
            document.getElementById("num").classList.remove("valid-text");
    }

    if(String(password.value).length >= 8){
            document.getElementById("passLen").classList.add("valid-text");
    }else{
            document.getElementById("passLen").classList.remove("valid-text");
    }

    if( String(password.value).length >= 8 && String(password.value).match(lowCase) && String(password.value).match(upCase) && String(password.value).match(num) ){
            password.classList.add("is-valid");
            password.classList.remove("is-invalid");
            confirmPassword.disabled = false;
    }else{
            confirmPassword.disabled = true;

            if(String(password.value).length > 0){
                    password.classList.add("is-invalid");
                    password.classList.remove("is-valid");
            }else{
                    password.classList.remove("is-invalid");
                    password.classList.remove("is-valid");
            }
    }
}

// Valida il campo di conferma password: deve coincidere con la password e la password deve essere valida
function validatePassConfirm() {

    if(password.classList.contains("is-valid") && password.value === confirmPassword.value){
            confirmPassword.classList.add("is-valid");
            confirmPassword.classList.remove("is-invalid");
    }else{
            if(String(confirmPassword.value).length > 0){
                    confirmPassword.classList.add("is-invalid");
                    confirmPassword.classList.remove("is-valid");
            }else{
                    confirmPassword.classList.remove("is-invalid");
                    confirmPassword.classList.remove("is-valid");
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
username.addEventListener("input", validateUsername);

// Attiva la validazione del campo email ad ogni input
email.addEventListener("input", validateEmail);

// Attiva la validazione del campo password ad ogni input
password.addEventListener("input", validatePassword);

// Attiva la validazione del campo conferma password ad ogni input
confirmPassword.addEventListener("input", validatePassConfirm);

// Controlla lo stato di tutti i campi ad ogni input per abilitare/disabilitare il submit
inBox.forEach(input => input.addEventListener("input", validateSub));