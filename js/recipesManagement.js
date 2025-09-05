import { getStoredReviews, isReviewedBy } from "./reviewsManagement.js";
import { currentUserFavourite, getLoggedUserId } from "./usersManagement.js";


export const RecipeState = {
    isFavourite: (recipeId) => currentUserFavourite(recipeId),

    isReviewed: (recipeId, userId = getLoggedUserId()) => isReviewedBy(recipeId, userId),  

    hasReviews: (recipeId) => getStoredReviews().includes(recipeId)
}