import { getStoredReviews, recipeUserRate, getStoredReviews, isReviewedBy  } from "./business/reviewsManagement.js";
import { currentUserFavourite, getLoggedUserId, searchUserById } from "./business/usersManagement.js";

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

    currentLoggedData: () => searchUserById(getLoggedUserId())
}

/**
 * Namespace per funzioni rating aggregate globali
 * 
 * @namespace GlobalRatingFunctions
 * @description
 * Raccolta funzioni per calcolo rating medi su tutte le recensioni.
 * Utilizzato per display statistiche globali nelle card preview.
 * 
 * @since 1.0.0
 */
export const GlobalRatingFunctions = {
   
    /**
     * Calcola rating medio gusto per ricetta specifica
     * 
     * @function getTasteRate
     * @memberof GlobalRatingFunctions
     * @param {string} recipeId - ID ricetta per calcolo media
     * @returns {number|undefined} Media rating gusto o undefined se errore
     * 
     * @description
     * Wrapper per recipeAvgRate() specializzato su "tasteRate".
     * - Calcola media aritmetica su tutte le recensioni ricetta
     * - Gestione errori silente con log (returns undefined)
     * 
     * @example
     * const avgTaste = GlobalRatingFunctions.getTasteRate("52772");
     * if(avgTaste) {
     *     progressBar.value = avgTaste;
     * } else {
     *     progressBar.style.display = "none";
     * }
     * 
     * @todo Decidere comportamento per ricette senza recensioni (0 vs undefined)
     * @todo Aggiungere rethrow errori critici invece di silent fail
     * 
     * @since 1.0.0
     */
    taste: function getTasteRate(recipeId){
        try {
            return recipeAvgRate(recipeId, "tasteRate");
        } catch (error) {
            console.error(error);
            // @todo Valutare se rethrow errori critici
        }
    },

    /**
     * Calcola rating medio difficoltà per ricetta specifica
     * 
     * @function getDifficultyRate
     * @memberof GlobalRatingFunctions
     * @param {string} recipeId - ID ricetta per calcolo media
     * @returns {number|undefined} Media rating difficoltà o undefined se errore
     * 
     * @description
     * Wrapper per recipeAvgRate() specializzato su "difficultyRate".
     * - Calcola media aritmetica su tutte le recensioni ricetta
     * - Gestione errori silente con log (returns undefined)
     * 
     * @example
     * const avgDifficulty = GlobalRatingFunctions.getDifficultyRate("52772");
     * if(avgDifficulty) {
     *     difficultyBar.value = avgDifficulty;
     * }
     * 
     * @todo Decidere comportamento per ricette senza recensioni (0 vs undefined)
     * 
     * @since 1.0.0
     */
    difficulty: function getDifficultyRate(recipeId){
        try {
            return recipeAvgRate(recipeId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    }
};

/**
 * Namespace per funzioni rating specifiche utente
 * 
 * @namespace UserRatingFunctions
 * @description
 * Raccolta funzioni per recupero rating di un utente specifico.
 * Utilizzato per display "le mie recensioni" nelle pagine personali.
 * 
 * @since 1.0.0
 */
export const UserRatingFunctions = {

    /**
     * Recupera rating gusto specifico utente per ricetta
     * 
     * @function getTasteRate
     * @memberof UserRatingFunctions
     * @param {string} recipeId - ID ricetta target
     * @param {string} userId - ID utente proprietario rating
     * @returns {number|undefined} Rating gusto utente o undefined se non recensita/errore
     * 
     * @description
     * Wrapper per recipeUserRate() specializzato su "tasteRate".
     * - Recupera rating specifico senza aggregazione
     * - undefined se utente non ha recensito ricetta
     * 
     * @example
     * const myTasteRating = UserRatingFunctions.getTasteRate("52772", currentUserId);
     * if(myTasteRating) {
     *     myRatingBar.value = myTasteRating;
     * } else {
     *     showMessage("Non hai ancora recensito questa ricetta");
     * }
     * 
     * @since 1.0.0
     */
    taste: function getTasteRate(recipeId, userId){
        try {
            return recipeUserRate(recipeId, userId, "tasteRate");
        } catch (error) {
            console.error(error);
        }
    },
    
    /**
     * Recupera rating difficoltà specifico utente per ricetta
     * 
     * @function getDifficultyRate
     * @memberof UserRatingFunctions
     * @param {string} recipeId - ID ricetta target
     * @param {string} userId - ID utente proprietario rating
     * @returns {number|undefined} Rating difficoltà utente o undefined se non recensita/errore
     * 
     * @description
     * Wrapper per recipeUserRate() specializzato su "difficultyRate".
     * - Recupera rating specifico senza aggregazione
     * - undefined se utente non ha recensito ricetta
     * 
     * @example
     * const myDifficultyRating = UserRatingFunctions.getDifficultyRate("52772", currentUserId);
     * 
     * @since 1.0.0
     */
    difficulty: function getDifficultyRate(recipeId, userId){
        try {
            return recipeUserRate(recipeId, userId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    }
};
