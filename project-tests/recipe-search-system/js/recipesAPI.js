import { RecipePreview, FullRecipe } from "./temp.js";

// Ricette casuali (per dashboard)
const rndFetchURL = 'https://www.themealdb.com/api/json/v1/1/random.php';

// Ricerca per nome
const fetchByNameURL = 'https://www.themealdb.com/api/json/v1/1/search.php?s=' ;

// Filtro per categoria
const fetchByCategoryURL = 'https://www.themealdb.com/api/json/v1/1/filter.php?c=';

// Filtro per ingrediente
const fetchByIngredientURL = 'https://www.themealdb.com/api/json/v1/1/filter.php?i=';

// Dettagli per ID
const fetchByIdURL = 'https://www.themealdb.com/api/json/v1/1/lookup.php?i=';

// Metadata
const fetchAllCategoriesURL = 'https://www.themealdb.com/api/json/v1/1/categories.php';
const fetchAllIngredientsURL = 'https://www.themealdb.com/api/json/v1/1/list.php?i=list';

const fetchOptions = {
    method: 'GET',
    redirect: 'follow',
}

async function fetchRecipes(URL, options, specifier = null){
    try {
        if(!specifier){
            specifier = "";
        }
        const completeURL = URL+specifier;
        const response = await fetch(completeURL, options);
        const JSONFile = await response.json();
        return JSONFile;
    } catch (error) {
        console.error(error);
        alert("Fetch error");
    }
}

export async function rndFetch() {
    return fetchRecipes(rndFetchURL, fetchOptions);
}

export async function fetchByName(recipeName){
    return fetchRecipes(fetchByNameURL, fetchOptions, recipeName);
}

export async function fetchByCategory(category){
    return fetchRecipes(fetchByCategoryURL, fetchOptions, category);
}

export async function fetchAllCategories(){
    return fetchRecipes(fetchAllCategoriesURL, fetchOptions);
}

export async function fetchAllIngredients(){
    return fetchRecipes(fetchAllIngredientsURL, fetchOptions);
}


window.addEventListener("load", async () => {
    
    // const fullObject = await rndFetch();
    // const recipe = fullObject.meals[0];

    // const prev = new RecipePreview(recipe);
    // const full = new FullRecipe(recipe);

    // console.log(fetchByName("pa"));
    
    // console.log("Random:", await rndFetch());
    // console.log("Name:", await fetchByName("Pasta"));
    // console.log("Category:", await fetchByCategory("Beef"));
});