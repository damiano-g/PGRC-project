import { getStoredReviews, isReviewedBy } from "./reviewsManagement.js";
import { currentUserFavourite, getLoggedUserId, searchUserById } from "./usersManagement.js";


export const RecipeStatus = {
    isFavourite: (recipeId) => currentUserFavourite(recipeId),

    isReviewed: (recipeId, userId = getLoggedUserId()) => isReviewedBy(recipeId, userId),  

    hasReviews: (recipeId) => getStoredReviews().includes(recipeId)
}

export const UserStatus = {
    isLogged: () => {
        const loggedUserId = getLoggedUserId();
        return Boolean(loggedUserId && getRegisteredUsers().some(item => item.id === loggedUserId));
    },

    currentLoggedData: () => searchUserById(getLoggedUserId()),
}