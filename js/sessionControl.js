import * as ReviewsManagement from "./business/reviewsManagement.js";
import * as UsersManagement from "./business/usersManagement.js";
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

export const NewUser = {

    startSession: async (username, password) => {
        try {
            const foundId = UsersManagement.searchUserbyName(username).id;
            const admitted = await UsersManagement.admitUser(foundId, password);

            if(admitted){
                updateLoggedUser(foundId);
                return true;
            }else{
                return false;
            };
        } catch (error) {
            throw error;
        };
    },

    addToDB: async (username, email, password) => { // Solo wrapper
        try {
            return await UsersManagement.addNewUser(username, email, password);
        } catch (error) {
            throw error;
        };
    }
};

export const LoggedUser = {
    
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
            return Boolean(loggedUserId && UsersManagement.getRegisteredUsers().some(item => item.id === loggedUserId));
        } catch (error) {
            throw error;
        };
    },
    
    getData: () => {
        try {
            UsersManagement.searchUserById(LoggedUser.getId());
        } catch (error) {
            throw error;
        }
    },
    
    getRecipeNotes: (recipeId) => {
        try{
            const notesaArray = UsersManagement.searchUserById(LoggedUser.getId()).notes || [];
            if(recipeId){
                notesaArray.filter(element => element.recipeId === recipeId) || [];
            }
            return notesaArray;
        }catch(error){
            console.error(error);
            throw error;
        }
    },

    getReviews: () => {
        try {
            return getStoredReviews().filter(element => RecipeStatus.isReviewed(element.recipeId)) || [];      
        } catch (error) {
            throw error;
        }
    },
    
    changeUsername: (newUsername) => {
        try {
            UsersManagement.updateUserUsername(LoggedUser.getId(), newUsername);
        } catch (error) {
            throw error;
        };
    },

    changeEmail: (newEmail) => {
        try {
            UsersManagement.updateUserEmail(LoggedUser.getId(), newEmail);
        } catch (error) {
            throw error;
        };
    },
    
    changePassword: async (newPassword) => {
        try {
            await UsersManagement.updateUserPassword(LoggedUser.getId(), newPassword);
            return true;
        } catch (error) {
            throw error;
        };
    },

    updateFavourites: (recipeId) => {
        try {
            UsersManagement.updateUserFavourites(LoggedUser.getId(), recipeId);
        } catch (error) {
            throw error;
        };
    }, 

    addNote: (recipeId, text) => {
        try {
            UsersManagement.updateUserNotes(LoggedUser.getId(), recipeId, text);
        } catch (error) {
            throw error;
        };
    },

    deleteNote: (recipeId, noteId) => {
        try {
            UsersManagement.updateUserNotes(LoggedUser.getId(), null, null, noteId);
        } catch (error) {
            throw error;
        };
    },

    deleteAccount: () => {
        try {
            UsersManagement.deleteUser(LoggedUser.getId());
        } catch (error) {
            throw error;
        }
    },

    authOperations: async (password) => {
        try {
            return await UsersManagement.admitUser(LoggedUser.getData().id, providedPassword);
        } catch (error) {
            throw error;
        }
    },

    endSession: () => {
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
    }
};


export const RecipeStatus = {

    isFavourite: (recipeId) => {
        try {
            const loggedUserId = LoggedUser.getId();
            return Boolean(loggedUserId && UsersManagement.searchUserById(loggedUserId).favourites.some(element => element === recipeId));
        } catch (error) {
            throw error;
        }
    },

    isReviewed: (recipeId) => {
        try {
            const loggedUserId = LoggedUser.getId();
            const actualStoredReviews = ReviewsManagement.getStoredReviews(); 
            return Boolean(loggedUserId && actualStoredReviews && actualStoredReviews.some(element => (element.userId === loggedUserId) && (element.recipeId === recipeId))); 
        } catch (error) {
            throw error;
        }
    },
    
    userTasteRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeUserRate(recipeId, LoggedUser.getId(), "tasteRate");
        } catch (error) {
            console.error(error);
        };
    },

    userDifficulyRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeUserRate(recipeId, userId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    },

    avgTasteRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeAvgRate(recipeId, "tasteRate");
        } catch (error) {
            console.error(error);
            // @todo Valutare se rethrow errori critici
        }
    },

    avgDifficultyRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeAvgRate(recipeId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    },

    addUserReview: (recipeId, tasteRate, difficultyRate) => {
        try {
            ReviewsManagement.updateRecipeReviews(LoggedUser.getId(), recipeId, tasteRate, difficultyRate);
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        };
    },

    deleteUserReview: (recipeId) => {
        try {
            ReviewsManagement.updateRecipeReviews(LoggedUser.getId(), recipeId)
            // @todo Aggiungere return true esplicito
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
};