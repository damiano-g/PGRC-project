================================================================================
                          FLOW CHIAMATE INTERNE - usersManagement.js
================================================================================

API PUBBLICA (Punti di Ingresso Esterni)
├── getRegisteredUsers()
│   ├── [EXT] StorageManagement.get() → Lettura array utenti da localStorage
│   ├── [EXT] structuredClone() → API nativa JS per deep copy sicura
│   └── Returns: Array<User> (deep copy utenti registrati)
├── searchUserbyName(username)
│   ├── searchUser("username", username)
│   └── Returns: User (deep copy utente trovato)
├── searchUserById(userId)
│   ├── searchUser("id", userId)
│   └── Returns: User (deep copy utente trovato)
├── addNewUser(chosenUsername, chosenEmail, chosenPassword)
│   ├── authUsername(chosenUsername) → [EXT] StorageManagement.get()
│   ├── authEmail(chosenEmail) → [EXT] StorageManagement.get()
│   ├── createUserObject(...) → [EXT] hashString()
│   ├── [EXT] StorageManagement.get() → Lettura per atomicità
│   ├── [EXT] StorageManagement.set() → Salvataggio nuovo utente
│   └── Returns: Promise<User> (nuovo utente creato e salvato)
├── deleteUser(userId)
│   ├── getRegisteredUsers()
│   ├── [EXT] StorageManagement.set() → Salvataggio array aggiornato
│   └── Returns: void (nessun valore, operazione completata)
├── updateUserUsername(userId, newUsername)
│   ├── authUsername(newUsername) → [EXT] StorageManagement.get()
│   ├── updateUserData(userId, "username", newUsername) → [EXT] StorageManagement.set()
│   └── Returns: Promise<boolean> (true se aggiornato)
├── updateUserEmail(userId, newEmail)
│   ├── authEmail(newEmail) → [EXT] StorageManagement.get()
│   ├── updateUserData(userId, "email", newEmail) → [EXT] StorageManagement.set()
│   └── Returns: Promise<boolean> (true se aggiornato)
├── updateUserPassword(userId, newPassword)
│   ├── updateUserData(userId, "password", newPassword, true) → [EXT] hashString(), [EXT] StorageManagement.set()
│   └── Returns: Promise<boolean> (true se aggiornato)
├── updateUserFavourites(userId, recipeId)
│   ├── searchUserById(userId) → searchUser()
│   ├── updateUserData(userId, "favourites", userFavouritesArray) → [EXT] StorageManagement.set()
│   └── Returns: Promise<boolean> (true se operazione completata)
├── admitUser(userId, providedPassword)
│   ├── [EXT] StorageManagement.get() → Lettura per verifica
│   ├── [EXT] hashString(providedPassword) → Hashing per confronto
│   └── Returns: Promise<boolean> (true se autenticato, false altrimenti)
├── hashString(originalString)
│   ├── [EXT] Web Crypto API (crypto.subtle.digest) → Calcolo hash SHA-256
│   └── Returns: Promise<string> (hash SHA-256 esadecimale, 64 caratteri)
└── updateUserNotes(userId, recipeId, text, noteId)
    ├── searchUserById(userId) → searchUser()
    ├── updateUserData(userId, "notes", userNotesArray) → [EXT] StorageManagement.set()
    └── Returns: Promise<boolean> (true se operazione completata)

FUNZIONI PRIVATE (Utility Interne)
├── authUsername(chosenUsername)
│   ├── [EXT] StorageManagement.get() → Controllo duplicati username
│   └── Returns: boolean (true se disponibile, throw se duplicato)
├── authEmail(chosenEmail)
│   ├── [EXT] StorageManagement.get() → Controllo duplicati email
│   └── Returns: boolean (true se disponibile, throw se duplicato)
├── createUserObject(chosenUsername, chosenEmail, chosenPassword)
│   ├── [EXT] hashString(chosenPassword) → Hashing password
│   └── Returns: Promise<User> (nuova istanza User con password hashata)
├── searchUser(searchField, searchValue)
│   ├── getRegisteredUsers()
│   ├── [EXT] structuredClone() → Deep copy sicura
│   └── Returns: User (deep copy utente trovato)
└── updateUserData(userId, field, newValue, needsHashing)
    ├── getRegisteredUsers()
    ├── [EXT] hashString(newValue) [se needsHashing=true] → Hashing condizionale
    ├── [EXT] StorageManagement.set() → Salvataggio aggiornamenti
    └── Returns: Promise<void> (nessun valore, operazione completata)

================================================================================
DIPENDENZE ESTERNE EVIDENZIATE [EXT]
================================================================================
- StorageManagement (da storageManagement.js):
  ├── .get(key, options) → Lettura dati da localStorage (array/object)
  └── .set(key, data, options) → Salvataggio dati in localStorage

- structuredClone(obj) → API nativa JS (da global) per deep copy oggetti/array

- hashString(str) → Funzione interna esportata, usa Web Crypto API per SHA-256

- Web Crypto API (crypto.subtle.digest) → API nativa browser per crittografia sicura

- UsersManagementError (da errorsManagement.js) → Classe per errori tipizzati (usata in throw)

- User, Note (da data-models.js) → Classi per costruzione oggetti (new User(), new Note())

================================================================================
LEGEND:
- API PUBBLICA: Funzioni esportate, chiamate da altri moduli
- FUNZIONI PRIVATE: Utility interne, non esportate
- [EXT]: Dipendenza esterna evidenziata con descrizione
- → : Chiamata diretta
- [se ...]: Condizionale
- Returns: Tipo/valore di ritorno (Promise per async)
================================================================================