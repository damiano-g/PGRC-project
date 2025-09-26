// ============================================================================
// LIBRERIA DI VALIDAZIONE INPUT UTENTE
// ============================================================================
// Collezione di funzioni per la validazione di input utente e formattazione form
// Gestisce la validazione lato client con feedback visivo in tempo reale

/**
 * Valida un campo username verificando la lunghezza minima
 * Aggiorna lo stato dell'oggetto input in base alla validità del contenuto
 * 
 * @param {Object} inputObject - Oggetto che rappresenta il campo di input username
 * @param {HTMLElement} inputObject.DOMelement - Elemento DOM del campo input
 * @param {number} inputObject.inputStatus - Stato di validazione (0: vuoto, 1: valido, -1: invalido)
 * 
 * @example
 * // Valida un campo username
 * const usernameInput = {
 *   DOMelement: document.getElementById("username"),
 *   inputStatus: 0
 * };
 * validateUsername(usernameInput);
 * // inputObject.inputStatus sarà 1 se valido, -1 se invalido, 0 se vuoto
 */
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

/**
 * Valida un campo email verificando il formato tramite regex
 * Controlla la presenza di @ e dominio valido, previene doppi punti consecutivi
 * 
 * @param {Object} inputObject - Oggetto che rappresenta il campo di input email
 * @param {HTMLElement} inputObject.DOMelement - Elemento DOM del campo input
 * @param {number} inputObject.inputStatus - Stato di validazione (0: vuoto, 1: valido, -1: invalido)
 * 
 * @example
 * // Valida un campo email
 * const emailInput = {
 *   DOMelement: document.getElementById("email"),
 *   inputStatus: 0
 * };
 * validateEmail(emailInput);
 * // inputObject.inputStatus sarà 1 per "user@domain.com", -1 per "invalid-email"
 */
export function validateEmail(inputObject){

        const inputString = String(inputObject.DOMelement.value);

        // Pattern regex per validazione email:
        // ^(?!.*\.\.) - Non doppi punti consecutivi
        // (?!.*\.\@) - Non punto prima di @
        // [\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$ - Formato standard email
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

/**
 * Valida un campo password verificando requisiti di sicurezza e aggiorna indicatori visivi
 * Controlla lunghezza minima, presenza di maiuscole, minuscole e numeri
 * Aggiorna dinamicamente le classi CSS degli indicatori di requisiti
 * 
 * @param {Object} inputObject - Oggetto che rappresenta il campo di input password
 * @param {HTMLElement} inputObject.DOMelement - Elemento DOM del campo input
 * @param {number} inputObject.inputStatus - Stato di validazione (0: vuoto, 1: valido, -1: invalido)
 * 
 * @example
 * // Valida un campo password con indicatori visivi
 * const passwordInput = {
 *   DOMelement: document.getElementById("password"),
 *   inputStatus: 0
 * };
 * validatePassword(passwordInput);
 * // Aggiorna gli elementi #upCase, #lowCase, #num, #passLen con classe "valid-text"
 * // inputObject.inputStatus sarà 1 solo se tutti i requisiti sono soddisfatti
 */
export function validatePassword(inputObject) {

        const inputString = String(inputObject.DOMelement.value);

        const upCase = /[A-Z]/;
        const lowCase = /[a-z]/;
        const num = /[0-9]/;
    
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


/**
 * Valida un campo di conferma password confrontandolo con la password principale
 * Abilita/disabilita il campo in base alla validità della password di riferimento
 * 
 * @param {Object} inputObject - Oggetto che rappresenta il campo di conferma password
 * @param {HTMLElement} inputObject.DOMelement - Elemento DOM del campo input
 * @param {number} inputObject.inputStatus - Stato di validazione (0: vuoto, 1: valido, -1: invalido)
 * @param {Object} referObject - Oggetto della password principale da confrontare
 * @param {HTMLElement} referObject.DOMelement - Elemento DOM della password principale
 * @param {number} referObject.inputStatus - Stato di validazione della password principale
 * 
 * @example
 * // Valida conferma password rispetto alla password principale
 * const passwordInput = { DOMelement: document.getElementById("password"), inputStatus: 1 };
 * const confirmInput = { DOMelement: document.getElementById("confirmPassword"), inputStatus: 0 };
 * 
 * validatePassConfirm(confirmInput, passwordInput);
 * // confirmInput.inputStatus sarà 1 solo se le password coincidono E la password principale è valida
 */
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


/**
 * Controlla la validità di tutti i campi richiesti e abilita/disabilita il pulsante submit
 * Implementa la logica di abilitazione condizionale basata sullo stato di tutti i campi
 * 
 * @param {Array<Object>} inputFieldsArray - Array di oggetti input da controllare
 * @param {HTMLElement} button - Elemento DOM del pulsante submit da abilitare/disabilitare
 * 
 * @example
 * // Controlla validità di tutti i campi e aggiorna pulsante submit
 * const allFields = [usernameInput, emailInput, passwordInput, confirmInput];
 * const submitButton = document.getElementById("submitBtn");
 * 
 * validateBtn(allFields, submitButton);
 * // submitButton.disabled sarà false solo se tutti i campi richiesti hanno inputStatus = 1
 */
export function validateBtn(inputFieldsArray, button){

    let ready = !inputFieldsArray.some(item => (item.inputStatus != 1 && item.DOMelement.required === true));

    if(ready) {
            button.disabled = false;
    }else{
            button.disabled = true;
    }
}

 
/**
 * Aggiorna le classi CSS di un campo input per fornire feedback visivo dello stato di validazione
 * Applica le classi Bootstrap "is-valid" e "is-invalid" in base allo stato del campo
 * 
 * @param {Object} inputObject - Oggetto che rappresenta il campo di input da formattare
 * @param {HTMLElement} inputObject.DOMelement - Elemento DOM del campo input
 * @param {number} inputObject.inputStatus - Stato di validazione (0: neutro, >0: valido, <0: invalido)
 * 
 * @example
 * // Aggiorna aspetto visivo del campo in base alla validazione
 * const inputField = {
 *   DOMelement: document.getElementById("username"),
 *   inputStatus: 1  // Campo valido
 * };
 * 
 * formatInputField(inputField);
 * // Aggiunge classe "is-valid" e rimuove "is-invalid"
 * 
 * @example
 * // Diversi stati di validazione
 * inputField.inputStatus = 1;   // Aggiunge "is-valid"
 * inputField.inputStatus = -1;  // Aggiunge "is-invalid" 
 * inputField.inputStatus = 0;   // Rimuove entrambe le classi (stato neutro)
 */
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