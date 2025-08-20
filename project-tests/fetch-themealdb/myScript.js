window.onload = function() {

    fetch("http://www.themealdb.com/api/json/v1/1/lookup.php?i=52772")
        .then(response => response.json())
        .then(jsonFile => console.log("Fetch ok: ", jsonFile))
        .catch(err => console.error("Fetch error: ", err));
}