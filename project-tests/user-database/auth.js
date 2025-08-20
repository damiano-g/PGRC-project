const usersDBKey = "users";
let usersArray = [];

function retrieveList(localStorageKey) {

    const array = [];
    const JSONFile = localStorage.getItem(localStorageKey);

    if(JSONFile){
        array = JSON.parse(JSONFile);
    }

    return array;
}

function validateUserEntry(newUser, registeredUsersArray){

    if(registeredUsersArray.some(item => (item.username === newUser.username) || (item.email === newUser.email))){
        return false;
    }

    return true;
}

function addNewUser(newUser, registeredUsersArray, localStorageKey){

    registeredUsersArray.push(newUser);

    localStorage.setItem(localStorageKey, JSON.stringify(registeredUsersArray));

    return registeredUsersArray;
}

window.addEventListener("load", () => {
    usersArray = retrieveList(usersDBKey);
});