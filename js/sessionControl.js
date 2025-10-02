/**
 * @fileoverview Gestione sessione utente e stato ricette
 * @description Modulo per controllo autenticazione, gestione sessione e query stato ricette.
 * Fornisce interfacce per login/logout, operazioni utente e verifica stato ricette.
 * @requires ./business/reviewsManagement.js - Gestione recensioni
 * @requires ./business/usersManagement.js - Gestione utenti
 * @requires ./business/recipesManagement.js - Gestione utenti
 * @requires ./storageManagement.js - Gestione storage
 */

import * as RecipesManagement from "./business/recipesManagement.js";
import * as ReviewsManagement from "./business/reviewsManagement.js";
import * as UsersManagement from "./business/usersManagement.js";
import * as ErrorsManagement from "./errorsManagement.js"
import { StorageOperations } from "./storageManagement.js";

/** @type {string} Chiave sessionStorage per ID utente correntemente loggato */
const LOGGED_USER_KEY = "loggedUser";

/**
 * Aggiorna ID utente loggato in storage e cache locale
 * @private
 * @param {string} userId - ID utente da salvare
 * @see {@link StorageOperations} Per aggiornamento session storage
 * @throws {Error} Rilancia errori di stroage
 */
function updateLoggedUser(userId){
    try{
        StorageOperations.set(LOGGED_USER_KEY, userId, {storageLocation: "session", dataType: "string"});
    }catch(error){
        throw error;
    }
}

/**
 * Accumula oggetti ricetta completi da array di ID ricette
 * Utility per recupero batch di ricette da lista ID
 * 
 * @private
 * @async
 * @param {Array<string>} idsArray - Array di ID ricette da recuperare
 * @returns {Promise<Array<FullRecipe>>} Array di oggetti ricetta completi
 * @see {@link RecipesManagement.searchRecipeById} Per ricerca ricetta
 * @throws {NotFound} Se ricetta non trovata
 * @throws {Error} Rilancia errori critici e di storage
 * 
 * @example
 * const ids = ["52772", "52773"];
 * const recipes = await recipesAccumulator(ids);
 * // recipes contiene array di oggetti FullRecipe per le ricette richieste
 */
async function recipesAccumulator(idsArray){
    try {
        const accumulatorArray = [];

        for(let i=0; i < idsArray.length; i++){
            const recipe = await RecipesManagement.searchRecipeById(idsArray[i]); 
            accumulatorArray.push(recipe);
        }
        return accumulatorArray;
    } catch (error) {
        throw error;
    }
}


/**
 * Namespace per operazioni utenti non autenticati (registrazione/login)
 * @namespace NewUser
 */
export const NewUser = {

    /**
     * Avvia sessione utente con credenziali fornite
     * 
     * @async
     * @param {string} username - Nome utente
     * @param {string} password - Password
     * @returns {Promise<boolean>} True se login riuscito
     * @see {@link UsersManagement.admitUser} per autenticazione utente
     * @see {@link UsersManagement.searchUser} per lettura dati utente
     * @see {@link updateLoggedUser}
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori critici e di storage
     * 
     */
    startSession: async (username, password) => {
        try {
            const admitted = await UsersManagement.admitUser("username", username, password);

            if(admitted){
                updateLoggedUser(UsersManagement.searchUser("username", username).id);
            }

            return admitted;
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
     * @param {string} passConfirm - Conferma password
     * @see {@link UsersManagement.addNewUser} Per aggiornamento database utenti
     * @returns {Promise<Object>} Dati utente creato
     * @throws {ErrorsManagement.Duplicated} Per parametri utente duplicati
     * @throws {ErrorsManagement.InvalidFormat} Per formato valori dei parametri non conformi 
     * @throws {Error} Rilancia errori di storage ed errori critici
     */
    addToDB: async (username, email, password, passConfirm) => { // Solo wrapper
        try {
            return await UsersManagement.addNewUser(username, email, password, passConfirm);
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
     * @see {@link StorageOperations} Per lettura dati utente
     * @throws {Error} Rilancia errori di storage
     */
    getId: () => {
        try {
            return StorageOperations.get(LOGGED_USER_KEY, {storageLocation: "session", dataType: "string"});
        } catch (error) {
            throw error;
        } 
    },

    /**
     * Verifica se utente è attualmente loggato
     * @returns {boolean} True se utente loggato valido
     * @see {@link LoggedUser.getId} Per lettura id utente loggato
     * @see {@link UsersManagement.getRegisteredUsers} Per lettura database utenti
     * @throws {Error} Rilancia errori di storage
     */
    isLogged: () => {
        try {
            const loggedUserId = LoggedUser.getId();
            return Boolean(loggedUserId && UsersManagement.getRegisteredUsers().some(item => item.id === loggedUserId));
        } catch (error) {
            throw error;
        }
    },
    
    /**
     * Recupera dati completi utente loggato - funzione wrapper
     * @returns {Object} Dati utente
     * @see {@link usersManagement.searchUser} per lettura dati utente
     * @throws {ErrorsManagement.NotFound} se utente non trovato
     * @throws {Error} Rilancia errori di storage 
     */
    getData: () => {
        try {
            return UsersManagement.searchUser("id", LoggedUser.getId());
        } catch (error) {
            throw error;
        }
    },
    
    /**
     * Recupera note utente per ricetta specifica o tutte
     * @param {string} [recipeId] - ID ricetta opzionale per filtro
     * @returns {Array<Object>} Array note filtrate
     * @throws {ErrorsManagement.NotFound} se utente non trovato
     * @throws {Error} Errori di storage o parametri errati 
     */
    getRecipeNotes: (recipeId) => {
        try{
            return UsersManagement.searchUser("id", LoggedUser.getId()).notes.filter(note => note.recipeId === recipeId) || [];
        }catch(error){
            console.error(error);
            throw error;
        }
    },

    /**
     * Recupera recensioni utente
     * @returns {Array<Object>} Array recensioni utente
     * @see {@link ReviewsManagement.getStoredReviews} Per lettura database ricette
     * @throws {Error} Rilancia errori di storage
     */
    getReviews: () => {
        try {
            return ReviewsManagement.getStoredReviews().filter(element => element.userId === LoggedUser.getId()) || [];      
        } catch (error) {
            throw error;
        }
    },
    
    /**
     * Aggiorna username utente - funzione wrapper
     * @param {string} newUsername - Nuovo username
     * @see {@link UsersManagement.updateUserUsername} Per aggiornamento dati utente
     * @throws {ErrorsManagement.Duplicated} Se username già in uso
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    changeUsername: (newUsername) => {
        try {
            UsersManagement.updateUserUsername(LoggedUser.getId(), newUsername);
        } catch (error) {
            throw error;
        };
    },

    /**
     * Aggiorna email utente - funzione wrapper
     * @param {string} newEmail - Nuova email
     * @see {@link UsersManagement.updateUserUsername} Per aggiornamento dati utente
     * @throws {ErrorsManagement.Duplicated} Se email già in uso
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    changeEmail: (newEmail) => {
        try {
            UsersManagement.updateUserEmail(LoggedUser.getId(), newEmail);
        } catch (error) {
            throw error;
        };
    },
    
    /**
     * Aggiorna password utente - funzione wrapper
     * @async
     * @param {string} newPassword - Nuova password
     * @see {@link UsersManagement.updateUserUsername} Per aggiornamento dati utente
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    changePassword: async (newPassword, passConfirm) => {
        try {
            await UsersManagement.updateUserPassword(LoggedUser.getId(), newPassword, passConfirm);
        } catch (error) {
            throw error;
        };
    },

    /**
     * Aggiorna lista preferiti utente - funzione wrapper
     * @param {string} recipeId - ID ricetta da aggiungere/rimuovere
     * @see {@link UsersManagement.updateUserUsername} Per aggiornamento dati utente
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    updateFavourites: (recipeId) => {
        try {
            UsersManagement.updateUserFavourites(LoggedUser.getId(), recipeId);
        } catch (error) {
            throw error;
        };
    }, 

    /**
     * Aggiunge nota per ricetta - funzione wrapper
     * @param {string} recipeId - ID ricetta
     * @param {string} text - Testo nota
     * @see {@link UsersManagement.updateUserUsername} Per aggiornamento dati utente
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    addNote: (recipeId, text) => {
        try {
            UsersManagement.updateUserNotes(LoggedUser.getId(), recipeId, text);
        } catch (error) {
            throw error;
        };
    },

    /**
     * Elimina nota specifica - funzione wrapper
     * @param {string} recipeId - ID ricetta
     * @see {@link UsersManagement.updateUserUsername} Per aggiornamento dati utente
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
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
     * @see {@link UsersManagement.deleteUser} Elimina account utente
     * @see {@link LoggedUser.endSession} Termina sessione per utente loggato
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    deleteAccount: () => {
        try {
            UsersManagement.deleteUser(LoggedUser.getId());
            LoggedUser.endSession();
        } catch (error) {
            throw error;
        }
    },

    /**
     * Operazioni di autenticazione con password - wrapper
     * @async
     * @param {string} password - Password fornita
     * @returns {Promise<boolean>} True se autenticazione riuscita
     * @see {@link UsersManagement.admitUser} Per autenticazione utente
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    authOperations: async (password) => {
        try {
            return await UsersManagement.admitUser(LoggedUser.getData().id, password);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Termina sessione utente
     * @see {@link StorageOperations.set} Per aggiornamento web storage
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    endSession: () => {
        try{
            StorageOperations.set(LOGGED_USER_KEY, "", {storageLocation: "session", dataType: "string"});
        }catch(error){
            throw error;
        }
    }
};

/**
 * Namespace per query stato ricette
 * @namespace Recipe
 */
export const Recipe = {

    /**
     * Verifica se ricetta è nei preferiti utente
     * @param {string} recipeId - ID ricetta
     * @returns {boolean} True se ricetta presente tra preferiti utente
     * @see {@link LoggedUser.getId} Per id utente loggato
     * @see {@link UsersManagement.searchUser} Per lettura dati utente
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    isFavourite: (recipeId) => {
        try {
            const loggedUserId = LoggedUser.getId();
            return Boolean(loggedUserId && UsersManagement.searchUser("id", loggedUserId).favourites.some(element => element === recipeId));
        } catch (error) {
            throw error;
        }
    },

    /**
     * Verifica se utente loggato ha recensito ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {boolean} True se ricetta recensita da utente loggato
     * @see {@link LoggedUser.getId} Per id utente loggato
     * @see {@link ReviewsManagement.getStoredReviews} Per lettura dati recensioni 
     * @throws {ErrorsManagement.NotFound} Se utente non trovato
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    isReviewed: (recipeId) => {
        try {
            const loggedUserId = LoggedUser.getId();
            const storedReviews = ReviewsManagement.getStoredReviews(); 
            return Boolean(loggedUserId && storedReviews && storedReviews.some(element => (element.userId === loggedUserId) && (element.recipeId === recipeId))); 
        } catch (error) {
            throw error;
        }
    },
    
    /**
     * Recupera rating utente loggato per gusto ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {number} Rating gusto (0-5)
     * @see {@link ReviewsManagement.recipeUserRate} Per lettura dati recensione utente
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    userTasteRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeUserRate(recipeId, LoggedUser.getId(), "tasteRate");
        } catch (error) {
            throw error;
        };
    },

    /**
     * Recupera rating difficoltà utente per ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {number} Rating difficoltà (0-5)
     * @see {@link ReviewsManagement.recipeUserRate} Per lettura dati recensione utente 
     * @throws {Error} Rilancia errori di storage o parametri errati 
     */
    userDifficulyRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeUserRate(recipeId, LoggedUser.getId(), "difficultyRate");
        } catch (error) {
            throw error;
        }
    },

    /**
     * Calcola rating gusto medio ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {number} Rating medio gusto
     * @see {@link ReviewsManagement.recipeAvgRate} Per calcolo media valutazioni ricetta 
     * @throws {Error} Rilancia errori di storage o parametri errati  
     */
    avgTasteRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeAvgRate(recipeId, "tasteRate");
        } catch (error) {
            throw error;
        }
    },

    /**
     * Calcola rating difficoltà medio ricetta
     * @param {string} recipeId - ID ricetta
     * @returns {number} Rating medio difficoltà
     * @see {@link ReviewsManagement.recipeAvgRate} Per calcolo media valutazioni ricetta 
     * @throws {Error} Rilancia errori di storage o parametri errati 
     */
    avgDifficultyRate: (recipeId) => {
        try {
            return ReviewsManagement.recipeAvgRate(recipeId, "difficultyRate");
        } catch (error) {
            console.error(error);
        }
    },

    /**
     * Aggiunge recensione utente loggato per ricetta
     * @param {string} recipeId - ID ricetta
     * @param {number} tasteRate - Rating gusto (0-5)
     * @param {number} difficultyRate - Rating difficoltà (0-5)
     * @see {@link ReviewsManagement.updateRecipeReviews} Per aggiunta recesnione utente
     * @throws {Error} Rilancia errori di storage o parametri errati
     */
    addUserReview: (recipeId, tasteRate, difficultyRate) => {
        try {
            ReviewsManagement.updateRecipeReviews(LoggedUser.getId(), recipeId, tasteRate, difficultyRate);
            return true;
        } catch (error) {
            throw error;
        };
    },

    /**
     * Elimina recensione utente loggato per ricetta
     * @param {string} recipeId - ID ricetta
     * @see {@link ReviewsManagement.updateRecipeReviews} Per rimozione recensione utente
     * @throws {Error} Rilancia errori di storage o parametri errati
     * @throws {ErrorsManagement.NotFound} Se recensione non trovata
     */
    deleteUserReview: (recipeId) => {
        try {
            ReviewsManagement.updateRecipeReviews(LoggedUser.getId(), recipeId);
        } catch (error) {
            throw error;
        }
    },

    /**
     * Recupera dati completi ricetta per ID fornito
     * @async
     * @param {string} recipeId - ID ricetta da recuperare
     * @returns {Promise<FullRecipe>} Oggetto ricetta completo
     * @see {@link RecipesManagement.searchRecipeById} Per ricerca ricetta
     * @throws {ErrorsManagement.NotFound} Se ricetta non trovata
     * @throws {Error} Rilancia errori critici e di storage
    */
    getFullData: async (recipeId) => {
        try {
            return RecipesManagement.searchRecipeById(recipeId);
        } catch (error) {
            throw error;
        }
    }
};

/**
 * Namespace per generazione array di preview ricette
 * Fornisce metodi per recuperare e organizzare dati ricette in formato preview
 * @namespace PreviewArray
*/
export const PreviewArray = {
    
    /**
     * Recupera categorie disponibili per navigazione
     * @async
     * @returns {Promise<Object>} Oggetto con type "categories" e array categorie
     * @see {@link RecipesManagement.getData} Per lettura categorie dal database
     * @throws {Error} Rilancia errori di storage o connessione
     */
    categories: async () => {
        try {
            return {type: "categories", items: await RecipesManagement.getData("categories")};
        } catch (error) {
            throw error;
        }
    },

    /**
     * Cerca ricette per nome fornito
     * @async
     * @param {string} searchedName - Nome ricetta da cercare
     * @returns {Promise<Object>} Oggetto con type "meals" e array ricette trovate
     * @see {@link RecipesManagement.searchRecipesByName} Per ricerca ricette
     * @throws {Error} Rilancia errori di storage o connessione
     */
    mealsByName: async (searchedName) => {
        try {
            return {type: "meals", items: await RecipesManagement.searchRecipesByName(searchedName)};
        } catch (error) {
            throw error;
        }
    },

    /**
     * Recupera ricette per categoria specifica
     * @async
     * @param {string} category - Nome categoria
     * @returns {Promise<Object>} Oggetto con type "meals" e array ricette categoria
     * @see {@link RecipesManagement.searchRecipesByCategory} Per ricerca per categoria
     * @throws {ErrorsManagement.NotFound} Se categoria non trovata
     * @throws {Error} Rilancia errori di storage o connessione
     */
    mealsByCategory: async (category) => {
        try {
            return {type: "meals", items: await RecipesManagement.searchRecipesByCategory(category)};
        } catch (error) {
            throw error;
        }
    },

    /**
     * Recupera ricette da array di ID forniti
     * @async
     * @param {Array<string>} idsArray - Array di ID ricette
     * @returns {Promise<Object>} Oggetto con type "meals" e array ricette complete
     * @see {@link recipesAccumulator} Per accumulo ricette da ID
     * @throws {ErrorsManagement.NotFound} Se ricetta non trovata
     * @throws {Error} Rilancia errori di storage o connessione
     */
    mealsById: async (idsArray) => {
        try {
            return {type: "meals", items: await recipesAccumulator(idsArray)};
        } catch (error) {
            throw error;
        }
    },

    /**
     * Recupera ricette casuali per quantità specificata
     * @async
     * @param {number} quantity - Numero ricette da recuperare
     * @returns {Promise<Object>} Oggetto con type "meals" e array ricette casuali
     * @see {@link RecipesManagement.rndSearch} Per ricerca casuale
     * @throws {Error} Rilancia errori di storage o connessione
     */
    rndMeals: async (quantity) => {
        try {
            return {type: "meals", items: await RecipesManagement.rndSearch(quantity)};
        } catch (error) {
            throw error;
        }
    },

    /**
     * Recupera ricette recensite dall'utente loggato
     * @async
     * @returns {Promise<Object>} Oggetto con type "reviews" e array ricette recensite
     * @see {@link LoggedUser.getReviews} Per lettura recensioni utente
     * @see {@link recipesAccumulator} Per accumulo ricette da ID
     * @throws {ErrorsManagement.NotFound} Se ricetta non trovata
     * @throws {Error} Rilancia errori di storage o connessione
     */
    fromUserReviews: async () => {
        try {
            const recipesIdsArray = [];

            LoggedUser.getReviews().forEach(review => recipesIdsArray.push(review.recipeId));

            return {type: "reviews", items: await recipesAccumulator(recipesIdsArray)};
        } catch (error) {
            throw error;
        }
    },

    /**
     * Recupera ricette preferite dall'utente loggato
     * @async
     * @returns {Promise<Object>} Oggetto con type "meals" e array ricette preferite
     * @see {@link LoggedUser.getData} Per lettura dati utente
     * @see {@link recipesAccumulator} Per accumulo ricette da ID
     * @throws {ErrorsManagement.NotFound} Se ricetta non trovata
     * @throws {Error} Rilancia errori di storage o connessione
     */
    fromUserFavourites: async () => {
        try {
            return {type: "meals", items: await recipesAccumulator(LoggedUser.getData().favourites)};
        } catch (error) {
            throw error;
        }
    },

    /**
     * Recupera ricette con note dall'utente loggato
     * @async
     * @returns {Promise<Object>} Oggetto con type "notes" e array ricette con note
     * @see {@link LoggedUser.getData} Per lettura dati utente
     * @see {@link recipesAccumulator} Per accumulo ricette da ID
     * @throws {ErrorsManagement.NotFound} Se ricetta non trovata
     * @throws {Error} Rilancia errori di storage o connessione
     */
    fromAllUserNotes: async () => {
        try {
            const recipesIdsArray = [];

            LoggedUser.getData().notes.forEach(note => {
                if(!recipesIdsArray.includes(note.recipeId)){
                    recipesIdsArray.push(note.recipeId);
                }
            });

            return {type: "notes", items: await recipesAccumulator(recipesIdsArray)};

        } catch (error) {
            throw error;
        }
    },

    /**
     * Recupera ricette più popolari per numero recensioni
     * @async
     * @param {number} quantity - Numero ricette da recuperare
     * @returns {Promise<Object>} Oggetto con type "meals" e array ricette ordinate per popolarità
     * @see {@link ReviewsManagement.getStoredReviews} Per lettura recensioni
     * @see {@link RecipesManagement.getData} Per lettura ricette
     * @throws {Error} Rilancia errori di storage o connessione
     */
    mostPopular: async (quantity) => {
        try {
            const allReviews = ReviewsManagement.getStoredReviews();
            const allRecipes = await RecipesManagement.getData("recipes");

            const revPerRecipe = [];

            allRecipes.forEach(recipe => {
                let reviewCount = 0;
                allReviews.forEach(review => {
                    if(review.recipeId === recipe.id){
                        reviewCount++;
                    }
                });
                revPerRecipe.push({obj: recipe, totalReviews: reviewCount});
            });

            revPerRecipe.sort((a,b) => b.totalReviews - a.totalReviews);

            revPerRecipe.length = quantity;

            return {type: "meals", items: revPerRecipe.map(recipe => recipe.obj)};

        } catch (error) {
            throw error;
        }
    }
};

/**
 * Valida input utente per tipo specificato
 * @param {"username"|"email"|"password"} inputType - Tipo di input da validare ("username", "email", "password")
 * @param {string} inputValue - Valore dell'input da validare
 * @param {string} [reference=null] - Valore di riferimento per confronto (usato per "confirm-password")
 * @throws {ErrorsManagement.InvalidFormat} Se formato input non valido o password non corrispondente
 * @throws {ErrorsManagement.Duplicated} Se valore già in uso (username/email)
 * @throws {ErrorsManagement.BadRequest} Se tipo input non supportato
 * @see {@link UsersManagement.authUsername} Per validazione username
 * @see {@link UsersManagement.authEmail} Per validazione email
 * @see {@link UsersManagement.authPassword} Per validazione password
 * @example
 * inputValidation("username", "john_doe");
 * inputValidation("email", "john@example.com");
 * inputValidation("confirm-password", "password123", "password123");
 */
export function inputValidation(inputType, inputValue, reference = null){
    try {
        switch(inputType){
            case "username":
                UsersManagement.authUsername(inputValue);
                break;
            case "email":
                UsersManagement.authEmail(inputValue);
                break;
            case "password":
                UsersManagement.authPassword(inputValue, inputValue);
                break;
            case "confirm-password":
                UsersManagement.authPassword(inputValue, reference);
                break;
            default:
                const badRequest = new ErrorsManagement.BadRequest();
                console.error(badRequest);
                throw badRequest;
        }
    } catch (error) {
        throw error;
    }
}

