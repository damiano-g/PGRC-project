const searchBar = document.getElementById("searchBar");
const searchStart = document.getElementById("searchStart");
const resultsContainer = document.getElementById("showResults");
const bookmarksContainer = document.getElementById("showBookmarks");
const navButtons = document.getElementById("navButtons");
const prevPage = document.getElementById("prev");
const nextPage = document.getElementById("next");
const firstPage = document.getElementById("first");
const lastPage = document.getElementById("last");

let searchContent;
let contentJSON;
let currentPage;
let bookmarksArray = [];

let debounceTimeout;

function delaySearch(){

    clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(retrieveSearch, 500);
}

function retrieveSearch(){

    sessionStorage.setItem("searchPage", currentPage);
    sessionStorage.setItem("searchValue", searchBar.value);

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
                sessionStorage.setItem("searchResults", JSON.stringify(contentJSON));
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

    if(dataArray.length < 1){
        const empty = document.createElement("p");
        empty.classList.add("text-center");
        empty.innerText = "Nessun risultato";
        resultsContainer.appendChild(empty);
    }else{ 
        dataArray.forEach(item => resultsContainer.appendChild(createCard(item)));
    }
}

function createCard(film){

    //crea un elemento ed aggiunge la classe bootstrap .card
    const card = document.createElement("div");
    card.classList.add("col-md-4");
    card.classList.add("mb-3");

    let posterUrl;

    if (film.poster_path) {
        posterUrl = `https://image.tmdb.org/t/p/w500${film.poster_path}`;
    } else {
        posterUrl = "./images/no_image.jpg";
        }

    card.innerHTML = `
        <div class="card">
            <h4 class="card-title">${film.original_title}</h4>
            <img class="card-img-top mb-3" src="${posterUrl}" alt="Poster">
            <div class="card-body">
                <p class="card-text">Uscita: ${film.release_date}</p>
                <p class="card-text">Valutazione: ${film.vote_average}</p>
                <nav class="mb-3">
                    <ul class="nav float-end">
                        <li class="nav-item" id="bookmarkBtn"><button class="nav-link">Preferito</button></li>
                        <li class="nav-item" id="overview"><button class="nav-link">Trama</button></li>
                    </ul>
                </nav>
                <p class="card-text film-details d-none float-start">${film.overview}</p>
            </div>
        </div>
    `;

    card.querySelector("#overview").addEventListener("click", () => card.querySelector(".film-details").classList.toggle("d-none"));
    card.querySelector("#bookmarkBtn").addEventListener("click", () => toggleBookmark(film));

    return card;
}

function showPageControls(){
    
    if(String(searchBar.value) != "" && contentJSON.results.length > 0){

        document.getElementById("displayPage").innerText = String(currentPage);

        if(currentPage <= 1){
            prevPage.classList.add("disabled");
            firstPage.classList.add("disabled");
            prevPage.setAttribute("tabindex", "-1");
            firstPage.setAttribute("tabindex", "-1");
        }else{
            prevPage.classList.remove("disabled");
            firstPage.classList.remove("disabled");
            prevPage.setAttribute("tabindex", "1");
            firstPage.setAttribute("tabindex", "1");
        }

        if(currentPage >= contentJSON.total_pages){
            nextPage.classList.add("disabled");
            lastPage.classList.add("disabled");
            nextPage.setAttribute("tabindex", "-1");
            lastPage.setAttribute("tabindex", "-1");
        }else{
            nextPage.classList.remove("disabled");
            lastPage.classList.remove("disabled");
            nextPage.setAttribute("tabindex", "1");
            lastPage.setAttribute("tabindex", "1");
        }

        navButtons.classList.remove("hidden");
    }else{
        navButtons.classList.add("hidden");
    }
}

function toggleBookmark(thisFilm){

    if(!bookmarksArray.includes(thisFilm)){
        bookmarksArray.push(thisFilm);
    }else{
        bookmarksArray.splice(bookmarksArray.findIndex(item => item === thisFilm), 1);
    }

    bookmarksArray.sort((a, b) => a.original_title.localeCOmpare(b.original_title));
}


//Events
searchBar.addEventListener("input", () => {
    currentPage = 1;
    delaySearch();
});

prevPage.addEventListener("click", () =>{
    currentPage--;
    delaySearch();
})

firstPage.addEventListener("click", () => {
    currentPage = 1;
    delaySearch();
})

nextPage.addEventListener("click", () => {
    currentPage++;
    delaySearch();
})

lastPage.addEventListener("click", () => {
    currentPage = contentJSON.total_pages;
    delaySearch();
})

window.onload = function() {
    
    const savedSearch = sessionStorage.getItem("searchValue");
    const savedResults = sessionStorage.getItem("searchResults");
    
    if(savedSearch){
        searchBar.value = savedSearch;
    }
    if(savedResults){
        currentPage = sessionStorage.getItem("searchPage");
        contentJSON = JSON.parse(savedResults); 
        showResults(contentJSON);
        showPageControls();
    }
}