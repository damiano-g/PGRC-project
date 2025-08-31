import { Review } from "./data-models.js";
import { ReviewsManagementError } from "./errorsManagement.js";

/**
 * Key used to store and retrieve reviews data from local storage.
 * @constant {string}
 */
const REVIEWS_DB_KEY = "reviews";

const storedReviews = [];


function retrieveStoredReviews() {
    try{
        const JSONFile = localStorage.getItem(REVIEWS_DB_KEY);
        return JSONFile ? JSON.parse(JSONFile) : [];
    }catch(error){
        throw new ReviewsManagementError("STORAGE", "Errore di lettura database recensioni", error);
    }
}


function updateReviewsDB(reviewsArray){
    try{
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(usersArray));
    }catch(error){
        throw new UsersManagementError("STORAGE", "Errore di scrittura database utenti", error);
    }
}