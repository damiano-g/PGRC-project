import { Review } from "./data-models.js";
import { ReviewsManagementError } from "./errorsManagement.js";
import { StorageManagement } from "./storageManagement.js";

/**
 * Key used to store and retrieve reviews data from local storage.
 * @constant {string}
 */
const REVIEWS_DB_KEY = "reviews";

let storedReviews = [];

export function getStoredReviews(){
    try{
        storedReviews = StorageManagement.get(REVIEWS_DB_KEY, {storageLocation: "local", dataType: "array"});
        return structuredClone(storedReviews);
    }catch(error){
        console.error("Errore recupero recensioni:", error);
        storedReviews = [];
        throw error;
    }
}

function getReviewId(recipeId, userId){
    try {
        const actualStoredReviews = getStoredReviews();
        return actualStoredReviews.filter(element => element.recipeId === recipeId && element.userId === userId);
    } catch (error) {
        
    }
}

function updateRecipeReviews(recipeId, userId, tasteRate = null, difficultyRate = null){
    try {
        const recipeReviewsArray = getStoredReviews();
 
        if(recipeId && userId && tasteRate && difficultyRate){
            recipeReviewsArray.push(new Review(recipeId, userId, tasteRate, difficultyRate));
        }else{
            if(recipeId && userId && !(tasteRate || difficultyRate)){
                const index = recipeReviewsArray.findIndex(element => (element.recipeId === recipeId) && (element.userId === userId));
                if(index < 0){
                    throw new ReviewsManagementError("NOT_FOUND", "Recensione non trovata");
                }else{
                    recipeReviewsArray.splice(index, 1);
                }
            }else{
                throw new ReviewsManagementError("VALIDATION", "Wrong data format"); 
            }
        }
        
        StorageManagement.set(REVIEWS_DB_KEY, recipeReviewsArray, {storageLocation: "local", dataType: "array"});
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }    
}

export function addReview(recipeId, userId, tasteRate, difficultyRate){
    try {
        updateRecipeReviews(recipeId, userId, tasteRate, difficultyRate);
        return true;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export function deleteReview(recipeId, userId){
    try {
        updateRecipeReviews(recipeId, userId)
    } catch (error) {
        console.error(error);
        throw error;
    }
}

function recipeAvgRate (recipeId, ratingType) {
    try {
        let sum = 0;
        let totalReviews = 0;
        getStoredReviews().forEach(element => {
            if(element.recipeId === recipeId){
                sum += element[ratingType];
                totalReviews++;
            }
        });
        return sum/totalReviews;
    } catch (error) {
        console.error(error);
        throw error;
    }
};

function recipeUserRate(recipeId, userId, ratingType) {
    try {
        const review = getStoredReviews().find(element => element.recipeId === recipeId && element.userId === userId);
        return review ? review[ratingType] : undefined;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const GlobalRatingFunctions = {
   
    getTasteRate: function(recipeId){
        try {
            return recipeAvgRate(recipeId, "tasteRate");
        } catch (error) {
            console.error(error);
        }
    },

    getDifficultyRate: function(recipeId){
        try {
            return recipeAvgRate(recipeId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    }
};

export const UserRatingFunctions = {
    getTasteRate: function(recipeId, userId){
        try {
            return recipeUserRate(recipeId, userId, "tasteRate");
        } catch (error) {
            console.error(error);
        }
    },
    
    getDifficultyRate: function(recipeId, userId){
        try {
            return recipeUserRate(recipeId, userId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    }
};


export function isReviewed(recipeId, userId){
    try {
        const loggedUserId = userId;
        const actualStoredReviews = getStoredReviews(); 
        return Boolean(loggedUserId && actualStoredReviews && actualStoredReviews.some(element => (element.userId === loggedUserId) && (element.recipeId === recipeId))); 
    } catch (error) {
        throw error;
    }
}