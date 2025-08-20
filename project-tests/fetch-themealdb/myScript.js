function modelShape(rawMeal) {

    if(!rawMeal) return null;

    /*
    costruisce un nuovo oggetto filtrando i campi di interesse dall'oggetto originale
    l'oggetto originale viene estratto dall'array di ricette contenuto all'interno dell'oggetto json fecthato dell'API
    */

    const mappedMeal = {
        id: Number(rawMeal.idMeal),
        title: rawMeal.strMeal,
        category: rawMeal.strCategory,
        instructions: rawMeal.strInstructions || "",
        thumb: rawMeal.strMealThumb || "",
        ingredients: [],
        dateAdded: new Date().toISOString(),
        reviews: [],
        notes: "",
    }
    
    /* costruisce l'array di ingredients */
    for(let i=1; i<=20; i++){
        const name = (rawMeal["strIngredient"+i] || "").trim();
        if(name){
            const measure = (rawMeal["strMeasure"+i] || "").trim();
            mappedMeal.ingredients.push({name, measure}); //js costruisce l'oggetto con key->nome variabile value->valore variabile
        }
    }

    return mappedMeal;
}

function storeLocal(newMeal) {

    const key = "initial_data";
    const localData = localStorage.getItem(key);

    let unique = true;

    let array = [];

    if(localData){
        array = JSON.parse(localData);
    }
    
    array.forEach(item => {
        if(item.id === newMeal.id){
            unique = false;
        }
    })
    
    if(unique){
        array.push(newMeal);
    }

    localStorage.setItem(key, JSON.stringify(array));
}

// window.onload = function() {

//     fetch("https://www.themealdb.com/api/json/v1/1/search.php?f=0")
//         .then(response => response.json())
//         .then(jsonFile => {
//             console.log("Fetch ok: ", jsonFile)
//             const originalJSON = jsonFile;
//             const mappedMeal = modelShape(originalJSON.meals[0]);
//             storeLocal(mappedMeal);
//             console.log(JSON.stringify(mappedMeal));
//             console.log(localStorage.getItem("initial_data"));   
//         })
//         .catch(err => console.error("Fetch error: ", err));
// }

window.addEventListener("load", () => {

    fetch("https://www.themealdb.com/api/json/v1/1/search.php?f=a")
        .then(response => response.json())
        .then(jsonFile => {
            const originalJSON = jsonFile;
            const mappedMeal = modelShape(originalJSON.meals[0]);
            storeLocal(mappedMeal);
            console.log(mappedMeal);
            console.log(localStorage.getItem("initial_data"));   
        })
        .catch(err => console.error("Fetch error: ", err));
});