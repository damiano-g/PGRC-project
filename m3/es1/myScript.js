const searchBar = document.getElementById("searchBar");
const searchStart = document.getElementById("searchStart");
const resultsContainer = document.getElementById("showResults");
const navButtons = document.getElementById("navButtons");
const prevPage = document.getElementById("prev");
const nextPage = document.getElementById("next");
const firstPage = document.getElementById("first");
const lastPage = document.getElementById("last");

let searchContent;
let contentJSON;
let currentPage;

let debounceTimeout;

function delaySearch(){

    clearTimeout(debounceTimeout);

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
                console.log(contentJSON.total_pages);
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