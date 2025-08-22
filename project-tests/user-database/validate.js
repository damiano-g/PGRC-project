// Collezione di funzioni per la validazione di input utente e formattazione form


// Controlla che lo username abbia almeno 2 caratteri
export function validateUsername(inputObject) {

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
export function validateEmail(inputObject){

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
export function validatePassword(inputObject) {

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
                if(inputString.length < 1){
                        inputObject.inputStatus = 0;
                }else{
                        inputObject.inputStatus = -1;
                }
        }
}


// Valida il campo di conferma password: deve coincidere con la password e la password deve essere valida
export function validatePassConfirm(inputObject, referObject) {

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
export function validateBtn(inputFieldsArray, button){

    let ready = !inputFieldsArray.some(item => item.inputStatus != 1);

    if(ready) {
            button.disabled = false;
    }else{
            button.disabled = true;
    }
}

 
// Aggiorna le classi visive del campo in base allo stato di validità -> positiveNum: valid, negativeNum: invalid, else: not provided 
export function formatInputField(inputObject) {

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