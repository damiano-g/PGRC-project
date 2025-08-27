export function RecipePreview(rawRecipeObj){
    this.id = rawRecipeObj.idMeal,
    this.name = rawRecipeObj.strMeal,
    this.image = rawRecipeObj.strMealThumb || ""
}

export function FullRecipe(rawRecipeObj){
    this.id = rawRecipeObj.idMeal,
    this.name = rawRecipeObj.strMeal,
    this.image = rawRecipeObj.strMealThumb || "",
    this.instructions = rawRecipeObj.strInstructions || "",
    this.dateAdded = new Date().toISOString(),
    this.ingredients = FullRecipe.prototype.getIngredients.call(this, rawRecipeObj)
}

FullRecipe.prototype.getIngredients = function (rawRecipeObj){
    const array = [];
    for(let i=1; i<=20; i++){
        const name = (rawRecipeObj["strIngredient"+i] || "").trim();
        if(name){
            const measure = (rawRecipeObj["strMeasure"+i] || "").trim();
            array.push({name, measure}); //js costruisce l'oggetto con key->nome variabile value->valore variabile
        }
    }
    return array;
}