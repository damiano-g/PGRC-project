const searchBar = document.getElementById("searchBar");
const searchStart = document.getElementById("searchStart");
const resultsContainer = document.getElementById("showResults");
const navButtons =document.getElementById("navButtons");

let searchContent;
let contentJSON;
let currentPage;

let debounceTimeout;

function delaySearch(){

    clearTimeout(debounceTimeout);

    currentPage = 1;

    debounceTimeout = setTimeout(retrieveSearch, 500);
}

function retrieveSearch(){

    if(String(searchBar.value) != ""){
        
        searchContent = String(searchBar.value);

        //encodeURIComponent evita caratteri che potrebbero compromettere la ricerca
        let url = `https://api.themoviedb.org/3/search/movie?api_key=571d7713f769aae024b522b1d9231927&query=${encodeURIComponent(searchContent)}&page=${currentPage}`;

        fetch(url)
            .then(response => {
                if(!response.ok){
                    throw new Error("Errore nella risposta");
                }
                return response.json();
            })
            .then(response => {
                contentJSON = response;
                showResults(contentJSON);
                showPageControls();
            })
            .catch(() => alert("Impossibile effettuare la richiesta"));
    }else{
            resultsContainer.innerHTML = "";
    }
}

function showResults(dataJSON){

    let dataArray = dataJSON.results;

    resultsContainer.innerHTML = "";

    dataArray.forEach(item => {
        //crea un elemento ed aggiunge la classe bootstrap .card
        const film = document.createElement("div");
        film.classList.add("col-md-4");
        film.classList.add("mb-3");

        if (item.poster_path) {
            posterUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        } else {
                posterUrl = "./images/no_image.jpg";
            }

        film.innerHTML = `
            <div class="card">
                <h4 class="card-title">${item.original_title}</h4>
                <img class="card-img-top mb-3" src="${posterUrl}" alt="Poster">
                <div class="card-body>
                    <p class="card-text">Uscita: ${item.release_date}</p>
                    <p class="card-text">Valutazione: ${item.vote_average}</p>
                </div>
            </div>
        `;

        resultsContainer.appendChild(film);
    })
}

function showPageControls(){
    
    if(String(searchBar.value) != ""){
        navButtons.classList.remove("hidden");
    }else{
        navButtons.classList.add("hidden");
    }
}

searchBar.addEventListener("input", delaySearch);