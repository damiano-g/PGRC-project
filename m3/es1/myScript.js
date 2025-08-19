const pageType = document.body.id;
const searchBar = document.getElementById("searchBar");
const searchStart = document.getElementById("searchStart");
const resultsContainer = document.getElementById("showResults");
const navButtons = document.getElementById("navButtons");
const prevPage = document.getElementById("prev");
const nextPage = document.getElementById("next");
const firstPage = document.getElementById("first");
const lastPage = document.getElementById("last");

const genresList = document.getElementById("genresList");
const yearFilter = document.getElementById("yearFilter");
const ratingFilter = document.getElementById("ratingFilter");

let filtersOn = false;

let bookmarkArray = [];

let currentSearch;
let savedSearch;
let searchPage;
let maxPage;

let debounceTimeout;

function fetchGenres() {

    fetch('https://api.themoviedb.org/3/genre/movie/list?api_key=571d7713f769aae024b522b1d9231927&language=en')
        .then(response => {
            if(!response.ok){
                throw new Error("Errore nella risposta");
            }
            return response.json();
        })
        .then(response => {
            response.genres.forEach(item => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    <div class="form-check">
                        <label class="form-check-label w-100"><input class="form-check-input" type="checkbox" value=${item.id}>${item.name}</label>
                    </div>
                `
                genresList.appendChild(listItem);
            })
        })
        .catch(() => alert("Impossibile effettuare la richiesta"));
}


function delaySearch(){

    clearTimeout(debounceTimeout);

    if(pageType === "home"){
        debounceTimeout = setTimeout(APISearch, 200);
    }
    if(pageType === "bookmarks"){
        debounceTimeout = setTimeout(bookmarksSearch, 200);
    }
}

function directSearch(){

    if(pageType === "home"){
        APISearch();
    }
    if(pageType === "bookmarks"){
        bookmarksSearch();
    }
}

function APISearch(){

    sessionStorage.setItem("homeSearchPage", searchPage);
    sessionStorage.setItem("homeSearchValue", searchBar.value);

    if(String(searchBar.value) != ""){
        
        currentSearch = String(searchBar.value);

        //encodeURIComponent evita caratteri che potrebbero compromettere la ricerca
        let url = `https://api.themoviedb.org/3/search/movie?api_key=571d7713f769aae024b522b1d9231927&query=${encodeURIComponent(currentSearch)}&page=${searchPage}`;

        fetch(url)
            .then(response => {
                if(!response.ok){
                    throw new Error("Errore nella risposta");
                }
                return response.json();
            })
            .then(response => {
                const contentJSON = response;
                maxPage = contentJSON.total_pages;
                sessionStorage.setItem("homeSearchResults", JSON.stringify(contentJSON.results));
                sessionStorage.setItem("homeMaxPage", maxPage);
                showResults(contentJSON.results);
            })
            .catch(() => alert("Impossibile effettuare la richiesta"));
    }else{
            resultsContainer.innerHTML = "";
            navButtons.classList.add("hidden");
    }
}

function bookmarksSearch(){
    
    sessionStorage.setItem("bookmarksSearchPage", searchPage);
    sessionStorage.setItem("bookmarksSearchValue", searchBar.value);

    currentSearch = String(searchBar.value);
    
    let filteredArray = [];

    if(currentSearch != ""){
        bookmarkArray.forEach(item => {
            if(String(item.original_title).toLocaleLowerCase().includes(currentSearch.toLocaleLowerCase())){
                filteredArray.push(item);
            }
        })
    }else{
        filteredArray = bookmarkArray;
    }

    sessionStorage.setItem("bookmarksSearchResults", JSON.stringify(filteredArray));   
    
    if(pageType === "bookmarks"){
        showResults(filteredArray);
    }
}

function showResults(dataArray){

    resultsContainer.innerHTML = "";

    if(filtersOn){
        dataArray = filterResults(dataArray);
    }
    
    if(dataArray.length < 1){
        const empty = document.createElement("p");
        empty.classList.add("text-center");
        if(pageType === "home" || (pageType === "bookmarks" && searchBar.value != "")){
            empty.innerText = "Nessun risultato";
        }
        if(pageType === "bookmarks" && searchBar.value === ""){
            empty.innerText = "Nessun preferito salvato";
        }
        resultsContainer.appendChild(empty);
    }else{
        if(pageType === "home"){
            dataArray.forEach(item => resultsContainer.appendChild(createCard(item)));
        }
        if(pageType === "bookmarks"){
            maxPage = Math.ceil(dataArray.length/20);
            sessionStorage.setItem("bookmarksMaxPage", maxPage);
            for(let i=20*(searchPage-1); i < (20*searchPage) && i < dataArray.length; i++){
                resultsContainer.appendChild(createCard(dataArray[i]));
            }
        }
        showPageControls();
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
            if(pageType === "home"){
                posterUrl = "./images/no_image.jpg";
            }else{
                posterUrl = "../images/no_image.jpg";
            }
        }

    let bookmarkString = "Rimuovi dai preferiti";

    if(pageType === "home" && bookmarkArray.findIndex(item => item.id === film.id) === -1){
        bookmarkString = "Aggiungi ai preferiti";
    }

    card.innerHTML = `
        <div class="card">
            <h4 class="card-title">${film.original_title}</h4>
            <img class="card-img-top mb-3" src="${posterUrl}" alt="Poster">
            <div class="card-body">
                <p class="card-text">Uscita: ${film.release_date}</p>
                <p class="card-text">Valutazione: ${film.vote_average}/10<br><progress class="w-100" value="${film.vote_average}" max="10"></progress></p>
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
        if(bookmarkArray.findIndex(item => item.id === film.id) != -1){
            card.querySelector(".bookmarkBtn").innerText = "Rimuovi dai preferiti"; 
        }else{
            card.querySelector(".bookmarkBtn").innerText = "Aggiungi ai preferiti";
        }   
    });

    return card;
}

function showPageControls(){
    
    if( maxPage > 0){

        document.getElementById("displayPage").innerText = String(searchPage);

        if(searchPage <= 1){
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

        if(searchPage >= maxPage){
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

    bookmarkArray = JSON.parse(localStorage.getItem("localBookmarks")) || [];

    const index = bookmarkArray.findIndex(item => item.id === thisFilm.id);
    
    if(index === -1){
        bookmarkArray.push(thisFilm);
    }else{
        bookmarkArray.splice(index, 1);
    }

    bookmarkArray.sort((a, b) => a.original_title.localeCompare(b.original_title));

    localStorage.setItem("localBookmarks", JSON.stringify(bookmarkArray));

    if(pageType === "bookmarks"){
        showResults(bookmarkArray);
    }else{
        bookmarksSearch();
    }
}


function filterResults(dataArray){

    let filteredArray = [];

    const checkedGenres = Array.from(document.querySelectorAll("#genresList input[type='checkbox']:checked")); 
    
    filteredArray = dataArray.filter(item => {

        if(yearFilter && Number(yearFilter.value) >= 1900 && Number(yearFilter.value) <= 2025){
            if(parseInt(item.release_date.split("-")[0]) != Number(yearFilter.value)){
                return false;
            } 
        }

        if(item.vote_average < ratingFilter.value){
            return false;
        }
        
        if(checkedGenres.length > 0 && !checkedGenres.some(checkbox => item.genre_ids.includes(Number(checkbox.value)))){
            return false;
        }

        return true;
    })
    
    return filteredArray;
}


//Events
searchBar.addEventListener("input", () => {
    searchPage = 1;
    delaySearch();
});

prevPage.addEventListener("click", () =>{
    searchPage--;
    delaySearch();
})

firstPage.addEventListener("click", () => {
    searchPage = 1;
    delaySearch();
})

nextPage.addEventListener("click", () => {
    searchPage++;
    delaySearch();
})

lastPage.addEventListener("click", () => {
    searchPage = maxPage;
    delaySearch();
})

yearFilter.addEventListener("input", () => {
    if(yearFilter.value != "" && (Number(yearFilter.value) < 1900 || Number(yearFilter.value) > 2025)){
        yearFilter.classList.add("is-invalid");
    }else{
        yearFilter.classList.remove("is-invalid");
    }
});

document.getElementById("showFilters").addEventListener("click", () => document.getElementById("filters").classList.toggle("d-none"));

document.getElementById("applyFilters").addEventListener("click", () => {
    filtersOn = true;
    showResults(JSON.parse(sessionStorage.getItem(pageType+"SearchResults")));
});

document.getElementById("resetFilters").addEventListener("click", () => {
    filtersOn = false;
    yearFilter.value = "";
    ratingFilter.value = "0";
    document.querySelectorAll("#genresList input[type='checkbox']").forEach(item => item.checked = false);
    showResults(JSON.parse(sessionStorage.getItem(pageType+"SearchResults")));
});


window.onload = function() {

    //console.log(JSON.parse(sessionStorage.getItem(pageType+"SearchResults")));
  
    if(!localStorage.getItem("localBookmarks")){
        bookmarkArray = [];
        localStorage.setItem("localBookmarks", JSON.stringify(bookmarkArray));
    }else{
        bookmarkArray = JSON.parse(localStorage.getItem("localBookmarks"));
    }

    fetchGenres();
    
    if(pageType === "home"){
        savedSearch = sessionStorage.getItem("homeSearchValue");
        searchPage = Number(sessionStorage.getItem("homeSearchPage"));
        maxPage = Number(sessionStorage.getItem("homeMaxPage"));
    }

    if(pageType === "bookmarks"){
        savedSearch = sessionStorage.getItem("bookmarksSearchValue");
        searchPage = Number(sessionStorage.getItem("bookmarksSearchPage"));
    }

    if(!searchPage || searchPage < 1){
        searchPage = 1;
    }
    searchBar.value = savedSearch;
    delaySearch();
}