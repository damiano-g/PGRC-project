
// Script per la validazione e gestione del form di registrazione utente

// Dichiarazione variabili
export const usernameInput = {
        DOMelement: document.getElementById("username"),
        inputStatus: 0,
}

export const emailInput = {
        DOMelement: document.getElementById("email"),
        inputStatus: 0,
} 

export const passwordInput = {
        DOMelement: document.getElementById("password"),
        inputStatus: 0,
}

const confirmPassInput = {
        DOMelement: document.getElementById("confirmPassword"),
        inputStatus: 0,
} 

export const clearBtn = document.getElementById("clear");
export const subBtn = document.getElementById("submit");

export const requiredInputFields = [usernameInput, emailInput, passwordInput, confirmPassInput];


// Dichiarazione funzioni

// Controlla che lo username abbia almeno 2 caratteri
function validateUsername(inputObject) {

        const inputString = String(inputObject.DOMelement.value);

        if(inputString.length >= 2){
                inputObject.inputStatus = 1;
        }else{
                if(inputString.length < 1){
                        inputObject.inputStatus = 0;
                }else{
                        inputObject.inputStatus = -1;
                }
        }
}

// Valida il campo email: controlla che sia nel formato corretto
function validateEmail(inputObject){

        const inputString = String(inputObject.DOMelement.value);

        const pattern = /^(?!.*\.\.)(?!.*\.\@)[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/

        if(pattern.test(inputString)){
                inputObject.inputStatus = 1;
        }else{
                if(inputString.length < 1){
                        inputObject.inputStatus = 0;
                }else{
                        inputObject.inputStatus = -1;
                }
        }
}

// Valida il campo password: verifica lunghezza, presenza di maiuscole, minuscole e numeri
function validatePassword(inputObject) {

        const inputString = String(inputObject.DOMelement.value);

        const upCase = /[A-Z]/g;
        const lowCase = /[a-z]/g;
        const num = /[0-9]/g;
    
        if(inputString.match(upCase)){
                document.getElementById("upCase").classList.add("valid-text");
        }else{
                document.getElementById("upCase").classList.remove("valid-text");
        }

        if(inputString.match(lowCase)){
                document.getElementById("lowCase").classList.add("valid-text");
        }else{
                document.getElementById("lowCase").classList.remove("valid-text");
        }

        if(inputString.match(num)){
                document.getElementById("num").classList.add("valid-text");
        }else{
                document.getElementById("num").classList.remove("valid-text");
        }

        if(inputString.length >= 8){
                document.getElementById("passLen").classList.add("valid-text");
        }else{
                document.getElementById("passLen").classList.remove("valid-text");
        }

        if(inputString.length >= 8 && inputString.match(lowCase) && inputString.match(upCase) && inputString.match(num)){
                inputObject.inputStatus = 1;
        }else{
                if(inputObject.length < 1){
                        inputObject.inputStatus = 0;
                }else{
                        inputObject.inputStatus = -1;
                }
        }
}

// Valida il campo di conferma password: deve coincidere con la password e la password deve essere valida
function validatePassConfirm(inputObject, referObject) {

        const inputString = String(inputObject.DOMelement.value);
        const referString = String(referObject.DOMelement.value);

        if(referObject.inputStatus === 1){

                inputObject.DOMelement.disabled = false;

                if(inputString === referString){
                    inputObject.inputStatus = 1;
                }else{
                    if(inputString.length < 1){
                            inputObject.inputStatus = 0;
                    }else{
                            inputObject.inputStatus = -1;
                    }
                }   
        }else{  
                inputObject.DOMelement.value = "";
                inputObject.inputStatus = 0;
                inputObject.DOMelement.disabled = true;
        }
}


// Abilita/disabilita il submit in base alla validità di tutti i campi
function validateSub(inputFieldsArray){

    let ready = !inputFieldsArray.some(item => item.inputStatus != 1);

    if(ready) {
            subBtn.disabled = false;
    }else{
            subBtn.disabled = true;
    }
}

 
// Aggiorna le classi visive del campo in base allo stato di validità -> positiveNum: valid, negativeNum: invalid, else: not provided 
function formatInputField(inputObject) {

        const validity = Number(inputObject.inputStatus);

        if(Number.isNaN(validity) || validity === 0){
                inputObject.DOMelement.classList.remove("is-valid");
                inputObject.DOMelement.classList.remove("is-invalid");
        }else{
                if(validity > 0){
                        inputObject.DOMelement.classList.add("is-valid");
                        inputObject.DOMelement.classList.remove("is-invalid");
                }else{
                        inputObject.DOMelement.classList.remove("is-valid");
                        inputObject.DOMelement.classList.add("is-invalid");
                }
        }
}



// Event listeners

// Attiva la validazione del campo username ad ogni input
usernameInput.DOMelement.addEventListener("input", () => validateUsername(usernameInput));

// Attiva la validazione del campo email ad ogni input
emailInput.DOMelement.addEventListener("input", () => validateEmail(emailInput));

// Attiva la validazione del campo password ad ogni input (agisce anche su classi visive di conferma password)
passwordInput.DOMelement.addEventListener("input", () => validatePassword(passwordInput));
passwordInput.DOMelement.addEventListener("input", () => validatePassConfirm(confirmPassInput, passwordInput));
passwordInput.DOMelement.addEventListener("input", () => formatInputField(confirmPassInput));

// Attiva la validazione del campo conferma password ad ogni input
confirmPassInput.DOMelement.addEventListener("input", () => validatePassConfirm(confirmPassInput, passwordInput));

// Controlla lo stato di tutti i campi ad ogni input per abilitare/disabilitare il submit
requiredInputFields.forEach(inputObject => inputObject.DOMelement.addEventListener("input", () => validateSub(requiredInputFields)));
requiredInputFields.forEach(inputObject => inputObject.DOMelement.addEventListener("input", () => formatInputField(inputObject)));

//Resetta tutto alla condizione iniziale
clearBtn.addEventListener("click", () => {
        requiredInputFields.forEach(item => {
                item.inputStatus = 0;
                formatInputField(item);
        });
        confirmPassInput.DOMelement.disabled = true;
        validateSub(requiredInputFields);       
});