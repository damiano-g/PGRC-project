const searchBar = document.getElementById("searchBar");
let searchContent;
let contentJSON;

let debounceTimeout;

function delaySearch(){

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(retrieveSearch);
}

function retrieveSearch(){

    if(String(searchBar.value) != ""){
        
        searchContent = String(searchBar.value);
        
        //encodeURIComponent evita caratteri che potrebbero compromettere la ricerca
        let url = `https://api.themoviedb.org/3/search/movie?api_key=571d7713f769aae024b522b1d9231927&query=${encodeURIComponent(searchContent)}&page=1`;

        fetch(url)
            .then(response => {
                if(!response.ok){
                    throw new Error("Errore nella risposta");
                }
                return response.json();
            })
            .then(response => contentJSON = response)
            .catch(() => alert("Impossibile effettuare la richiesta"));
    }
}

searchBar.addEventListener("input", delaySearch);