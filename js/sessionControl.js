import * as ReviewsManage from "./business/reviewsManagement.js";
import * as UsersManage from "./business/usersManagement.js";
import { StorageManagement } from "./storageManagement.js";

/** @type {string} Chiave sessionStorage per ID utente correntemente loggato */
const LOGGED_USER_KEY = "loggedUser";

let loggedUserId = "";

function updateLoggedUser(userId){
    try{
        StorageManagement.set(LOGGED_USER_KEY, userId, {storageLocation: "session", dataType: "string"});
        loggedUserId = userId; // Aggiorna cache locale
    }catch(error){
        throw new UsersManagementError("STORAGE", "Errore aggiornamento sessione", error);
    }
}

export function startSession(username, password) {
    try {
        const foundId = UsersManage.searchUserbyName(username).id;
        const admitted = await admitUser(foundId, password);

        if(admitted){
            updateLoggedUser(foundId);
            return true;
        }else{
            return false;
        };
    } catch (error) {
        throw error;
    };
};

export function endSession() {
    try{
        StorageManagement.set(LOGGED_USER_KEY, "", {storageLocation: "session", dataType: "string"});
        loggedUserId = userId; // Aggiorna cache locale
        if(LoggedUser.getId === ""){
            return true;
        }else{
            return false;
        }
    }catch(error){
        throw new UsersManagementError("STORAGE", "Errore aggiornamento sessione", error);
    }
};


export const LoggedUser = {
    
    /**
     * Recupera ID utente attualmente loggato con gestione errori automatica
     * API pubblica per controllo stato login cross-page
     *
     * @returns {string} ID utente loggato o stringa vuota se non presente/errori
     * 
     * @example
     * // Check stato login
     * const currentUserId = getLoggedUserId();
     * if (currentUserId) {
     *   console.log("Utente loggato:", currentUserId);
     *   // Mostra UI autenticata
     * } else {
     *   // Redirect a login page
     *   window.location.href = "./login.html";
     * }
    */
    getId: () => {
        try {
            loggedUserId = StorageManagement.get(LOGGED_USER_KEY, {storageLocation: "session", dataType: "string"});
            return loggedUserId;
        } catch (error) {
            console.error("Errore recupero sessione:", error);
            loggedUserId = "";
            throw error;
        } 
    },

    isLogged: () => {
        try {
            const loggedUserId = LoggedUser.getId();
            return Boolean(loggedUserId && UsersManage.getRegisteredUsers().some(item => item.id === loggedUserId));
        } catch (error) {
            throw error;
        };
    },
    
    getData: () => UsersManage.searchUserById(LoggedUser.getId()),
    
    getRecipeNotes: (recipeId) => {
        try{
            const notesaArray = UsersManage.searchUserById(LoggedUser.getId()).notes || [];
            if(recipeId){
                notesaArray.filter(element => element.recipeId === recipeId) || [];
            }
            return notesaArray;
        }catch(error){
            console.error(error);
            throw error;
        }
    },
    
    changeUsername: (newUsername) => {
        try {
            UsersManage.updateUserUsername(LoggedUser.getId(), newUsername);
        } catch (error) {
            throw error;
        };
    },

    changeEmail: (newEmail) => {
        try {
            UsersManage.updateUserEmail(LoggedUser.getId(), newEmail);
        } catch (error) {
            throw error;
        };
    },
    
    changePassword: async (newPassword) => {
        try {
            await UsersManage.updateUserPassword(LoggedUser.getId(), newPassword);
            return true;
        } catch (error) {
            throw error;
        };
    },

    updateFavourites: (recipeId) => {
        try {
            UsersManage.updateUserFavourites(LoggedUser.getId(), recipeId);
        } catch (error) {
            throw error;
        };
    }, 

    addNote: (recipeId, text) => {
        try {
            UsersManage.updateUserNotes(LoggedUser.getId(), recipeId, text);
        } catch (error) {
            throw error;
        };
    },

    deleteNote: (recipeId, noteId) => {
        try {
            UsersManage.updateUserNotes(LoggedUser.getId(), null, null, noteId);
        } catch (error) {
            throw error;
        };
    },

    deleteAccount: () => UsersManage.deleteUser(LoggedUser.getId()),
};


export const RecipeStatus = {

    isFavourite: (recipeId) => {
        try {
            const loggedUserId = LoggedUser.getId();
            return Boolean(loggedUserId && UsersManage.searchUserById(loggedUserId).favourites.some(element => element === recipeId));
        } catch (error) {
            throw error;
        }
    },

    isReviewed: (recipeId) => {
        try {
            const loggedUserId = LoggedUser.getId();
            const actualStoredReviews = ReviewsManage.getStoredReviews(); 
            return Boolean(loggedUserId && actualStoredReviews && actualStoredReviews.some(element => (element.userId === loggedUserId) && (element.recipeId === recipeId))); 
        } catch (error) {
            throw error;
        }
    },
    
    userTasteRate: (recipeId) => {
        try {
            return ReviewsManage.recipeUserRate(recipeId, LoggedUser.getId(), "tasteRate");
        } catch (error) {
            console.error(error);
        };
    },

    userDifficulyRate: (recipeId) => {
        try {
            return recipeUserRate(recipeId, userId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    },

    avgTasteRate: (recipeId) => {
        try {
            return ReviewsManage.recipeAvgRate(recipeId, "tasteRate");
        } catch (error) {
            console.error(error);
            // @todo Valutare se rethrow errori critici
        }
    },

    avgDifficultyRate: (recipeId) => {
        try {
            return ReviewsManage.recipeAvgRate(recipeId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    },

    addUserReview: (recipeId, tasteRate, difficultyRate) => {
        try {
            ReviewsManage.updateRecipeReviews(LoggedUser.getId(), recipeId, tasteRate, difficultyRate);
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        };
    },

    deleteUserReview: (recipeId) => {
        try {
            ReviewsManage.updateRecipeReviews(LoggedUser.getId(), recipeId)
            // @todo Aggiungere return true esplicito
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
};