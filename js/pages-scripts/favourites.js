



/** @type {HTMLElement} Container griglia preferiti */
const favContainer = document.getElementById("favourites");

/** @type {HTMLButtonElement} Pulsante ricerca nella home */
const favSearchBtn = document.getElementById("searchBtn");

/** @type {HTMLInputElement} Campo input ricerca nella home */
const favSearchBar = document.getElementById("searchBar");






// ===============================
// RICERCA DALLA PAGINA PREFERITI
// ===============================

/**
 * Event listener per pulsante ricerca principale
 * Naviga alla pagina ricerca con termine di ricerca preimpostato
 */
favSearchBtn.addEventListener("click", () => {
    // Naviga a search.html con parametro query per ricerca automatica
    window.location.href = `../pages/search.html?q=${String(favSearchBar.value)}`
});