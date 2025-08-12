const inBox = document.querySelectorAll("input[type='text']");
const naming = document.querySelectorAll(".fullName");
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

subBtn.disabled = true;

naming.forEach(input => input.addEventListener("input", validNaming));
pass.addEventListener("input", validPass);
confirmPass.addEventListener("input", validConfirm);
email.addEventListener("input", validMail);