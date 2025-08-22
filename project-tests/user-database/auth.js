// Collezione di funzioni per autorizzazioni di modifica database e login

import { hashString, } from "./common.js";

// Controlla se username o email sono già presenti nell'array utenti (restituisce true se non ci sono duplicati)
export function validateUserEntry(chosenUsername, chosenEmail, usersArray){
    
    if(usersArray.some(item => (item.username === chosenUsername))){
        return "username";
    }
    if(usersArray.some(item => (item.email === chosenEmail))){
        return "email";
    }
    return null;
}

// Crea un oggetto utente con i dati forniti e la password hashata
export async function createUserObject(chosenUsername, chosenEmail, chosenPassword){
    const hashPassword = await hashString(chosenPassword);
    const timestamp = Date.now();
    const rnd = String(Math.floor(Math.random()*10000)).padStart(4, "0"); 
    const userObject = {
        id: `user_${timestamp}_${rnd}`,
        username: chosenUsername,
        email: chosenEmail,
        password: hashPassword,
        favorites: [],
        creationDate: new Date().toISOString(),
    }
    return userObject;
}

export function searchUserbyName(providedUsername, usersArray) {

    const index = usersArray.findIndex(item => item.username === providedUsername);

    if(index < 0) return null;
    return usersArray[index].id;
}

export async function admitUser(userId, providedPassword, usersArray){

    const index = usersArray.findIndex(item => item.id === userId);
    const userHash = usersArray[index].password;

    const providedHash = await hashString(providedPassword);

    return userHash === providedHash;
}

