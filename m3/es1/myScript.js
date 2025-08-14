const searchBar = document.getElementById("searchBar");
let searchContent;

let debounceTimeout;

function delaySearch(){

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(retrieveSearch);
}

function retrieveSearch(){

    if(String(searchBar.value) != ""){
        searchContent = String(searchBar.value);
    }
}

searchBar.addEventListener("input", delaySearch);