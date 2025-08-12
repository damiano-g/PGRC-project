const inBox = document.querySelectorAll("input[type='text']");
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
                event.target.classList.add("invalid");
                event.target.classList.remove("valid");
        }
}

function validMail(){

        const pattern = /^(?!.*\.\.)(?!.*\.\@)[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/

        if(pattern.test(email.value)){
                email.classList.add("valid");
                email.classList.remove("invalid");
        }else{
                email.classList.add("invalid");
                email.classList.remove("valid");
        }
}

function validPass() {

        const lowCase = /[a-z]/g;
        const upCase = /[A-Z]/g;
        const num = /[0-9]/g; 

        if( String(pass.value).length >= 8 && String(pass.value).match(lowCase) && String(pass.value).match(upCase) && String(pass.value).match(num) ){
                pass.classList.add("valid");
                pass.classList.remove("invalid");
        }else{
                pass.classList.add("invalid");
                pass.classList.remove("valid");
        }
}

function validConfirm() {

        if(pass.classList.contains("valid") && pass.value === confirmPass.value){
                confirmPass.classList.add("valid");
                confirmPass.classList.remove("invalid");
        }else{
                confirmPass.classList.add("invalid");
                confirmPass.classList.remove("valid");
        }
}

function validateSub(){

        let ready = true;

        for(let i=0; i < inBox.length; i++){
                if(!inBox[i].classList.contains("valid")) ready = false;
        }

        if(ready) subBtn.disabled = false;
}


naming.forEach(input => input.addEventListener("input", validNaming));
firstName.addEventListener("focus", () => document.getElementById("fnameCheck").classList.remove("hidden"));
firstName.addEventListener("blur", () => document.getElementById("fnameCheck").classList.add("hidden"));
lastName.addEventListener("focus", () => document.getElementById("lnameCheck").classList.remove("hidden"));
lastName.addEventListener("blur", () => document.getElementById("lnameCheck").classList.add("hidden"));

pass.addEventListener("input", validPass);
pass.addEventListener("focus", () => document.getElementById("passCheck").classList.remove("hidden"));
pass.addEventListener("blur", () => document.getElementById("passCheck").classList.add("hidden"));

confirmPass.addEventListener("input", validConfirm);

email.addEventListener("input", validMail);

inBox.forEach(input => input.addEventListener("input", validateSub));