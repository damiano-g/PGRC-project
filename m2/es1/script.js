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

subBtn.disabled = true;

naming.forEach(input => input.addEventListener("input", validNaming));