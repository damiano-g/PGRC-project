function addClass(){

    let inputBoxes = document.querySelectorAll("input[type='text']");
    for(let i=0; i < inputBoxes.length; i++){
        inputBoxes[i].classList.add("valid");
    }
}

window.addEventListener("load", addClass);