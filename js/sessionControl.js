/**
 * @fileoverview Gestione sessione utente e stato ricette
 * @description Modulo per controllo autenticazione, gestione sessione e query stato ricette.
 * Fornisce interfacce per login/logout, operazioni utente e verifica stato ricette.
 * @author damia
 * @version 1.0.0
 * @since 2025-08-28
 * @requires ./business/reviewsManagement.js - Gestione recensioni
 * @requires ./business/usersManagement.js - Gestione utenti
 * @requires ./storageManagement.js - Gestione storage
 */

import * as ReviewsManagement from "./business/reviewsManagement.js";
import * as UsersManagement from "./business/usersManagement.js";
import { StorageManagement } from "./storageManagement.js";

/** @type {string} Chiave sessionStorage per ID utente correntemente loggato */
const LOGGED_USER_KEY = "loggedUser";

let loggedUserId = "";

/**
 * Aggiorna ID utente loggato in storage e cache locale
 * @private
 * @param {string} userId - ID utente da salvare
 * @throws {UsersManagementError} Se errore storage
 */
function updateLoggedUser(userId){
    try{
        StorageManagement.set(LOGGED_USER_KEY, userId, {storageLocation: "session", dataType: "string"});
        loggedUserId = userId; // Aggiorna cache locale
    }catch(error){
        throw new UsersManagementError("STORAGE", "Errore aggiornamento sessione", error);
    }
}

/**
 * Namespace per operazioni utenti non autenticati (registrazione/login)
 * @namespace NewUser
 */
export const NewUser = {

    /**
     * Avvia sessione utente con credenziali fornite
     * @async
     * @param {string} username - Nome utente
     * @param {string} password - Password
     * @returns {Promise<boolean>} True se login riuscito
     * @throws {Error} Se errore autenticazione
     */
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

    /**
     * Aggiunge nuovo utente al database
     * @async
     * @param {string} username - Nome utente
     * @param {string} email - Email utente
     * @param {string} password - Password
     * @returns {Promise<Object>} Dati utente creato
     * @throws {Error} Se errore creazione utente
     */
    addToDB: async (username, email, password) => { // Solo wrapper
        try {
            return await UsersManagement.addNewUser(username, email, password);
        } catch (error) {
            throw error;
        };
    }
};

/**
 * Namespace per operazioni utente autenticato
 * @namespace LoggedUser
 */
export const LoggedUser = {
    
    /**
     * Recupera ID utente loggato da storage
     * @returns {string} ID utente o stringa vuota
     * @throws {Error} Se errore recupero storage
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

    /**
     * Verifica se utente è attualmente loggato
     * @returns {boolean} True se utente loggato valido
     * @throws {Error} Se errore verifica
     */
    isLogged: () => {
        try {
            const loggedUserId = LoggedUser.getId();
            return Boolean(loggedUserId && UsersManagement.getRegisteredUsers().some(item => item.id === loggedUserId));
        } catch (error) {
            throw error;
        };
    },
    
    /**
     * Recupera dati completi utente loggato
     * @returns {Object} Dati utente
     * @throws {Error} Se errore recupero
     */
    getData: () => {
        try {
            UsersManagement.searchUserById(LoggedUser.getId());
        } catch (error) {
            throw error;
        }
    },
    
    /**
     * Recupera note utente per ricetta specifica o tutte
     * @param {string} [recipeId] - ID ricetta opzionale per filtro
     * @returns {Array<Object>} Array note filtrate
     * @throws {Error} Se errore recupero
     */
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

    /**
     * Recupera recensioni utente
     * @returns {Array<Object>} Array recensioni utente
     * @throws {Error} Se errore recupero
     */
    getReviews: () => {
        try {
            return getStoredReviews().filter(element => RecipeStatus.isReviewed(element.recipeId)) || [];      
        } catch (error) {
            throw error;
        }
    },
    
    /**
     * Aggiorna username utente
     * @param {string} newUsername - Nuovo username
     * @throws {Error} Se errore aggiornamento
     */
    changeUsername: (newUsername) => {
        try {
            UsersManagement.updateUserUsername(LoggedUser.getId(), newUsername);
        } catch (error) {
            throw error;
        };
    },

    /**
     * Aggiorna email utente
     * @param {string} newEmail - Nuova email
     * @throws {Error} Se errore aggiornamento
     */
    changeEmail: (newEmail) => {
        try {
            UsersManagement.updateUserEmail(LoggedUser.getId(), newEmail);
        } catch (error) {
            throw error;
        };
    },
    
    /**
     * Aggiorna password utente
     * @async
     * @param {string} newPassword - Nuova password
     * @returns {Promise<boolean>} True se aggiornamento riuscito
     * @throws {Error} Se errore aggiornamento
     */
    changePassword: async (newPassword) => {
        try {
            await UsersManagement.updateUserPassword(LoggedUser.getId(), newPassword);
            return true;
        } catch (error) {
            throw error;
        };
    },

    /**
     * Aggiorna lista preferiti utente
     * @param {string} recipeId - ID ricetta da aggiungere/rimuovere
     * @throws {Error} Se errore aggiornamento
     */
    updateFavourites: (recipeId) => {
        try {
            UsersManagement.updateUserFavourites(LoggedUser.getId(), recipeId);
        } catch (error) {
            throw error;
        };
    }, 

    /**
     * Aggiunge nota per ricetta
     * @param {string} recipeId - ID ricetta
     * @param {string} text - Testo nota
     * @throws {Error} Se errore aggiunta
     */
    addNote: (recipeId, text) => {
        try {
            UsersManagement.updateUserNotes(LoggedUser.getId(), recipeId, text);
        } catch (error) {
            throw error;
        };
    },

    /**
     * Elimina nota specifica
     * @param {string} recipeId - ID ricetta
     * @param {string} noteId - ID nota da eliminare
     * @throws {Error} Se errore eliminazione
     */
    deleteNote: (noteId) => {
        try {
            UsersManagement.updateUserNotes(LoggedUser.getId(), null, null, noteId);
        } catch (error) {
            throw error;
        };
    },

    /**
     * Elimina account utente
     * @throws {Error} Se errore eliminazione
     */
    deleteAccount: () => {
        try {
            UsersManagement.deleteUser(LoggedUser.getId());
        } catch (error) {
            throw error;
        }
    },

    /**
     * Operazioni di autenticazione con password
     * @async
     * @param {string} password - Password fornita
     * @returns {Promise<boolean>} True se autenticazione riuscita
     * @throws {Error} Se errore autenticazione
     */
    authOperations: async (password) => {
        try {
            return await UsersManagement.admitUser(LoggedUser.getData().id, providedPassword);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Termina sessione utente
     * @returns {boolean} True se logout riuscito
     * @throws {UsersManagementError} Se errore storage
     */
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

/**
 * Namespace per query stato ricette
 * @namespace RecipeStatus
 */
export const RecipeStatus = {

    /**
     * Verifica se ricetta è nei preferiti utente
     * @param {string} recipeId - ID ricetta
     * @returns {boolean} True se nei preferiti
     * @throws {Error} Se errore verifica
     */
    isFavourite: (recipeId) => {
        try {
            const loggedUserId = LoggedUser.getId();
            return Boolean(loggedUserId && UsersManagement.searchUserById(loggedUserId).favourites.some(element => element === recipeId));
        } catch (error) {
            throw error;
        }
    },

    /**
     * Verifica se utente ha recensito ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {boolean} True se recensita
     * @throws {Error} Se errore verifica
     */
    isReviewed: (recipeId) => {
        try {
            const loggedUserId = LoggedUser.getId();
            const actualStoredReviews = ReviewsManagement.getStoredReviews(); 
            return Boolean(loggedUserId && actualStoredReviews && actualStoredReviews.some(element => (element.userId === loggedUserId) && (element.recipeId === recipeId))); 
        } catch (error) {
            throw error;
        }
    },
    
    /**
     * Recupera rating gusto utente per ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {number} Rating gusto (0-5)
     */
    userTasteRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeUserRate(recipeId, LoggedUser.getId(), "tasteRate");
        } catch (error) {
            console.error(error);
        };
    },

    /**
     * Recupera rating difficoltà utente per ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {number} Rating difficoltà (0-5)
     */
    userDifficulyRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeUserRate(recipeId, userId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    },

    /**
     * Calcola rating gusto medio ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {number} Rating medio gusto
     */
    avgTasteRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeAvgRate(recipeId, "tasteRate");
        } catch (error) {
            console.error(error);
            // @todo Valutare se rethrow errori critici
        }
    },

    /**
     * Calcola rating difficoltà medio ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {number} Rating medio difficoltà
     */
    avgDifficultyRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeAvgRate(recipeId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    },

    /**
     * Aggiunge recensione utente per ricetta
     * @param {string} recipeId - ID ricetta
     * @param {number} tasteRate - Rating gusto (0-5)
     * @param {number} difficultyRate - Rating difficoltà (0-5)
     * @returns {boolean} True se aggiunta riuscita
     * @throws {Error} Se errore aggiunta
     */
    addUserReview: (recipeId, tasteRate, difficultyRate) => {
        try {
            ReviewsManagement.updateRecipeReviews(LoggedUser.getId(), recipeId, tasteRate, difficultyRate);
            return true;
        } catch (error) {
            console.error(error);
            throw error;
        };
    },

    /**
     * Elimina recensione utente per ricetta
     * @param {string} recipeId - ID ricetta
     * @throws {Error} Se errore eliminazione
     */
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