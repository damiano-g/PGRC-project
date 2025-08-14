const searchBar = document.getElementById("searchBar");
const searchStart = document.getElementById("searchStart");

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
            .then(response => {
                contentJSON = response;
                showResults(contentJSON);
            })
            .catch(() => alert("Impossibile effettuare la richiesta"));
    }
}

function showResults(dataJSON){

    let dataArray = dataJSON.results;

    const resultsContainer = document.getElementById("showResults");

    resultsContainer.innerHTML = "";

    dataArray.forEach(item => {
        //crea un elemento ed aggiunge la classe bootstrap .card
        const film = document.createElement("div");
        film.classList.add("card");

        film.innerHTML = `
            <h4>${item.original_title}</h4>
            <p>Anno: ${item.release_date}</p>
            <p>Valutazione: ${item.vote_average}</p>
            <img class="class-img-top" src="${`https://image.tmdb.org/t/p/w500${item.poster_path}`}" alt="Poster">
        `;

        resultsContainer.appendChild(film);
    })

}

searchBar.addEventListener("input", delaySearch);