import { usernameInput, passwordInput, registeredUsers, hashString, subBtn, clearBtn } from "./common.js";

const requiredInputFields = [usernameInput, passwordInput];


function searchUser(providedUsername) {

    const index = registeredUsers.findIndex(item => item.username === providedUsername);

    if(index < 0) return null;
    return registeredUsers[index].id;
}

async function admitUser(userId, providedPassword){

    const index = registeredUsers.findIndex(item => item.id === userId);
    const userHash = registeredUsers[index].password;

    const providedHash = await hashString(providedPassword);

    return userHash === providedHash;
}



subBtn.addEventListener("click", async () => {

    subBtn.disabled = true;
    clearBtn.disabled = true;
    requiredInputFields.forEach(item => item.DOMelement.disabled = true);

    try{
        const currentUsername = usernameInput.DOMelement.value;
        const currentPassword = passwordInput.DOMelement.value;
        const foundId = searchUser(currentUsername);
        if(!foundId){
            alert("Nome utente non trovato");
        }else{
            const admitted = await admitUser(foundId, currentPassword);
            if(admitted){
                alert("Login effettuato");
            }else{
                alert("Password errata");
            }
        }
    }finally{
        clearBtn.disabled = false;
        requiredInputFields.forEach(item => item.DOMelement.disabled = false);
        clearBtn.click();
        subBtn.disabled = false;
    }
});

