
import * as UsersManagement from "../js/services/users-service.js"
import * as ReviewsManagement from "../js/services/reviews-service.js"
import * as RecipesManagement from "../js/services/recipes-service.js"

export async function createUsers(){

    const recipes_db = await RecipesManagement.getData("recipes"); 

    for(let i=0; i < 50; i++){
        let newUser = await UsersManagement.addNewUser(`User${i}`, `user${i}@mail.com`, `Password${i}`, `Password${i}`);
        let next;
        let picked = [];
        // Init favourites
        for(let i=0; i < (Math.floor(Math.random() * (30 + 1))); i++){
            do {
                next = Math.floor(Math.random() * (300 + 1));
            } while (picked.includes(next));
            picked.push(next);
            await UsersManagement.updateUserFavourites(newUser.id, recipes_db[next].id)
        }
        picked = [];
        // Init reviews
        for(let i=0; i < (Math.floor(Math.random() * (30 + 1))); i++){
            do {
                next = Math.floor(Math.random() * (300 + 1));
            } while (picked.includes(next));
            picked.push(next);
            ReviewsManagement.updateRecipeReviews(newUser.id, recipes_db[next].id, (Math.floor(Math.random() * (5))+1), (Math.floor(Math.random() * (5))+1));
        }
        picked = [];
        // Init notes
        for(let i=0; i < (Math.floor(Math.random() * (30 + 1))); i++){
            next = Math.floor(Math.random() * (300 + 1));
            picked.push(next);
            UsersManagement.updateUserNotes(newUser.id, recipes_db[next].id, `Note ${i}, recipe ${recipes_db[next].name}`);
        }
    }
}
