const inBox = document.querySelectorAll(".inBox");
const naming = document.querySelectorAll(".fullName");
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const email = document.querySelector("#email");
const pass = document.querySelector("#pass");
const confirmPass = document.querySelector("#confirmPass");
const subBtn = document.querySelector("input[type='submit']");

function validNaming(event) {
        
        if(String(event.target.value).length >= 2){
                event.target.classList.add("valid");
                event.target.classList.remove("invalid");        
        }else{
                if(String(event.target.value).length > 0){
                        event.target.classList.add("invalid");
                        event.target.classList.remove("valid");
                }else{
                        event.target.classList.remove("invalid");
                        event.target.classList.remove("valid");
                }
        }
}

function validMail(){

        const pattern = /^(?!.*\.\.)(?!.*\.\@)[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/

        if(pattern.test(email.value)){
                email.classList.add("valid");
                email.classList.remove("invalid");
        }else{
                if(String(email.value).length > 0){
                        email.classList.add("invalid");
                        email.classList.remove("valid");
                }else{
                        email.classList.remove("invalid");
                        email.classList.remove("valid");
                }
        }
}

function validPass() {

        const upCase = /[A-Z]/g;
        const lowCase = /[a-z]/g;
        const num = /[0-9]/g;
        
        if(String(pass.value).match(upCase)){
                document.getElementById("upCase").classList.add("valid");
        }else{
                document.getElementById("upCase").classList.remove("valid");
        }

        if(String(pass.value).match(lowCase)){
                document.getElementById("lowCase").classList.add("valid");
        }else{
                document.getElementById("lowCase").classList.remove("valid");
        }

        if(String(pass.value).match(num)){
                document.getElementById("num").classList.add("valid");
        }else{
                document.getElementById("num").classList.remove("valid");
        }

        if(String(pass.value).length >= 8){
                document.getElementById("passLen").classList.add("valid");
        }else{
                document.getElementById("passLen").classList.remove("valid");
        }

        if( String(pass.value).length >= 8 && String(pass.value).match(lowCase) && String(pass.value).match(upCase) && String(pass.value).match(num) ){
                pass.classList.add("valid");
                pass.classList.remove("invalid");
        }else{
                if(String(pass.value).length > 0){
                        pass.classList.add("invalid");
                        pass.classList.remove("valid");
                }else{
                        pass.classList.remove("invalid");
                        pass.classList.remove("valid");
                }
        }
}

function validConfirm() {

        if(pass.classList.contains("valid") && pass.value === confirmPass.value){
                confirmPass.classList.add("valid");
                confirmPass.classList.remove("invalid");
        }else{
                if(String(confirmPass.value).length > 0){
                        confirmPass.classList.add("invalid");
                        confirmPass.classList.remove("valid");
                }else{
                        confirmPass.classList.remove("invalid");
                        confirmPass.classList.remove("valid");
                }
        }
}

function displayErrors(event){

        if(!event.target.classList.contains("valid")){
                document.getElementById(String(event.target.id)+"Check").classList.remove("hidden");
        }else{
                document.getElementById(String(event.target.id)+"Check").classList.add("hidden");
        }
}

function validateSub(){

        let ready = true;

        for(let i=0; i < inBox.length; i++){
                if(!inBox[i].classList.contains("valid")) ready = false;
        }

        if(ready) {
                subBtn.disabled = false;
        }else{
                subBtn.disabled = true;
        }
}


naming.forEach(input => input.addEventListener("input", validNaming));

email.addEventListener("input", validMail);

pass.addEventListener("input", validPass);

confirmPass.addEventListener("input", validConfirm);

inBox.forEach(input => input.addEventListener("focus", displayErrors));
inBox.forEach(input => input.addEventListener("input", displayErrors));
inBox.forEach(input => input.addEventListener("blur", event => document.getElementById(String(event.target.id)+"Check").classList.add("hidden")));
inBox.forEach(input => input.addEventListener("input", validateSub));