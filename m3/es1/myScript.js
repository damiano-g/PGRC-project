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
            navButtons.classList.add("hidden");
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

function showBookmarks(){

    bookmarksContainer.innerHTML = "";

    if(bookmarksArray.length < 1){
        const empty = document.createElement("p");
        empty.classList.add("text-center");
        empty.innerText = "Nessun preferito salvato";
        bookmarksContainer.appendChild(empty);
    }else{
        bookmarksArray.forEach(item => bookmarksContainer.appendChild(createCard(item)));
    }
}

function createCard(film){

    //crea un elemento ed aggiunge la classe bootstrap .card
    const card = document.createElement("div");
    card.classList.add("col-md-3");
    card.classList.add("mb-3");

    let posterUrl;

    if (film.poster_path) {
        posterUrl = `https://image.tmdb.org/t/p/w500${film.poster_path}`;
    } else {
        posterUrl = "./images/no_image.jpg";
        }

    let bookmarkString = "Rimuovi dai preferiti";

    if(resultsContainer && bookmarksArray.findIndex(item => item.id === film.id) === -1){
        bookmarkString = "Aggiungi ai preferiti";
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
                        <li class="nav-item"><button class="nav-link bookmarkBtn">${bookmarkString}</button></li>
                        <li class="nav-item"><button class="nav-link overview">Trama</button></li>
                    </ul>
                </nav>
                <p class="card-text film-details d-none float-start">${film.overview}</p>
            </div>
        </div>
    `;

    card.querySelector(".overview").addEventListener("click", () => card.querySelector(".film-details").classList.toggle("d-none"));
    card.querySelector(".bookmarkBtn").addEventListener("click", () => {
        toggleBookmark(film)
        if(bookmarksArray.findIndex(item => item.id === film.id) != -1){
            card.querySelector(".bookmarkBtn").innerText = "Rimuovi dai preferiti"; 
        }else{
            card.querySelector(".bookmarkBtn").innerText = "Aggiungi ai preferiti";
        }   
    });

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

    bookmarksArray = JSON.parse(localStorage.getItem("localBookmarks")) || [];

    const index = bookmarksArray.findIndex(item => item.id === thisFilm.id);
    
    if(index === -1){
        bookmarksArray.push(thisFilm);
    }else{
        bookmarksArray.splice(index, 1);
    }

    bookmarksArray.sort((a, b) => a.original_title.localeCompare(b.original_title));

    localStorage.setItem("localBookmarks", JSON.stringify(bookmarksArray));

    if(bookmarksContainer){
        showBookmarks();
    }
}


//Events
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

    if(!localStorage.getItem("localBookmarks")){
        bookmarksArray = [];
        localStorage.setItem("localBookmarks", JSON.stringify(bookmarksArray));
    }else{
        bookmarksArray = JSON.parse(localStorage.getItem("localBookmarks"));
    }
    
    if(resultsContainer){
        
        searchBar.addEventListener("input", () => {
            currentPage = 1;
            delaySearch();
        });

        //mantiene i dati della ricerca al refresh della pagina
        if(savedSearch){
            searchBar.value = savedSearch;
        }
        if(savedResults && savedSearch != ""){
            currentPage = Number(sessionStorage.getItem("searchPage"));
            contentJSON = JSON.parse(savedResults); 
            showResults(contentJSON);
            showPageControls();
        }
    }

    if(bookmarksContainer){
        showBookmarks();
    }
}