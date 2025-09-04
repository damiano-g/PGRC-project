# 📚 SSRI-PWM - Schemi Tecnici Dettagliati per Script di Pagina e Moduli JS

---

## 🗂️ **Moduli Business e Utility: Dipendenze e Interazioni**

```mermaid
graph TD
    DM[data-models.js]
    UM[usersManagement.js]
    RM[reviewsManagement.js]
    RA[recipesAPI.js]
    SM[storageManagement.js]
    UI[UI.js]
    VA[validate.js]
    EM[errorsManagement.js]

    DM --> UM
    DM --> RM
    DM --> UI
    UM --> SM
    RM --> SM
    RA --> SM
    UI --> VA
    VA --> EM
```
**Legenda:**  
- Le frecce indicano dipendenze dirette (import/require).
- `data-models.js` fornisce le classi dati a tutti i moduli principali.
- `usersManagement.js`, `reviewsManagement.js`, `recipesAPI.js` gestiscono la logica business e interagiscono con `storageManagement.js`.
- `UI.js` si occupa del rendering e usa la validazione.
- `validate.js` e `errorsManagement.js` sono utility trasversali.

---

## 🗂️ **Script di Pagina: Flusso Tecnico Dettagliato**

---

### 1️⃣ **favourites.js**

```mermaid
flowchart TD
    A[onLoad]
    B>Verifica autenticazione utente]
    C[getLoggedUser]
    D{Utente autenticato?}
    E[Recupera preferiti: getUserFavourites]
    F[Recupera recensioni: getUserReviews]
    G[Recupera note: getUserNotes]
    H((Loop su preferiti))
    I[renderCards]
    J{Click su card?}
    K[Gestione evento: handleCardClick]
    L[Fine]

    A --> B --> C --> D
    D -- No --> L
    D -- Yes --> E --> F --> G --> H
    H --> I
    I --> J
    J -- Yes --> K --> I
    J -- No --> L
```
**Moduli usati:**  
- `usersManagement.js`, `reviewsManagement.js`, `UI.js`, `storageManagement.js`

---

### 2️⃣ **index.js**

```mermaid
flowchart TD
    A[onLoad]
    B[fetchRandomRecipes]
    C[fetchCategories]
    D((Loop su ricette random))
    E[renderCarousel]
    F((Loop su categorie))
    G[renderCategories]
    H{Input ricerca?}
    I[Gestione ricerca: handleSearchInput]
    J[Redirect a search.html]
    K[Fine]

    A --> B --> D --> E
    A --> C --> F --> G
    E --> H
    G --> H
    H -- Yes --> I --> J --> K
    H -- No --> K
```
**Moduli usati:**  
- `recipesAPI.js`, `UI.js`

---

### 3️⃣ **landing.js**

```mermaid
flowchart TD
    A[onLoad]
    B[fetchCategories]
    C((Loop su categorie))
    D[renderCategories]
    E{Selezione categoria?}
    F[fetchRecipesByCategory]
    G((Loop su ricette))
    H[renderRecipes]
    I{Click su ricetta?}
    J[Gestione evento: handleRecipeClick]
    K[Fine]

    A --> B --> C --> D
    D --> E
    E -- Yes --> F --> G --> H
    H --> I
    I -- Yes --> J --> K
    I -- No --> K
    E -- No --> K
```
**Moduli usati:**  
- `recipesAPI.js`, `UI.js`

---

### 4️⃣ **login.js**

```mermaid
flowchart TD
    A[onLoad]
    B{Input credenziali}
    C[validateLoginForm]
    D{Credenziali valide?}
    E[admitUser]
    F{Autenticazione OK?}
    G[Redirect area personale]
    H[handleUserError]
    I[Fine]

    A --> B --> C --> D
    D -- No --> H --> I
    D -- Yes --> E --> F
    F -- Yes --> G --> I
    F -- No --> H --> I
```
**Moduli usati:**  
- `usersManagement.js`, `validate.js`, `errorsManagement.js`

---

### 5️⃣ **modif.js**

```mermaid
flowchart TD
    A[onLoad]
    B[searchUserById]
    C[Carica dati utente]
    D{Abilita sezione modifica?}
    E[validateModifForm]
    F{Submit modifiche?}
    G{Sezione username/email/password?}
    H[updateUserUsername]
    I[updateUserEmail]
    J[updateUserPassword]
    K[handleUserError]
    L[Ricarica pagina]
    M[Fine]

    A --> B --> C --> D
    D -- Yes --> E --> F
    F -- Yes --> G
    G -- Username --> H --> L --> M
    G -- Email --> I --> L --> M
    G -- Password --> J --> L --> M
    F -- No --> M
    D -- No --> M
    H --> K
    I --> K
    J --> K
    K --> M
```
**Moduli usati:**  
- `usersManagement.js`, `validate.js`, `errorsManagement.js`

---

### 6️⃣ **recipe-details.js**

```mermaid
flowchart TD
    A[onLoad]
    B[fetchRecipeById]
    C[renderRecipeDetails]
    D{Azione utente?}
    E[Aggiungi/Rimuovi preferiti: addFavourite]
    F[Aggiungi/Rimuovi recensione: addReview]
    G[Aggiungi/Rimuovi nota: addNote]
    H[handleUserError]
    I[Aggiorna UI: renderRecipeDetails]
    J[Fine]

    A --> B --> C --> D
    D -- Preferiti --> E --> I
    D -- Recensione --> F --> I
    D -- Nota --> G --> I
    E --> H
    F --> H
    G --> H
    I --> J
    H --> J
    D -- Nessuna azione --> J
```
**Moduli usati:**  
- `recipesAPI.js`, `usersManagement.js`, `reviewsManagement.js`, `UI.js`, `errorsManagement.js`

---

### 7️⃣ **search.js**

```mermaid
flowchart TD
    A[onLoad]
    B{Input ricerca}
    C[validateSearchForm]
    D{Input valido?}
    E[searchRecipes]
    F((Loop su risultati))
    G[renderSearchResults]
    H{Selezione ricetta?}
    I[Redirect a recipe-details.html]
    J[handleUserError]
    K[Fine]

    A --> B --> C --> D
    D -- No --> J --> K
    D -- Yes --> E --> F --> G --> H
    H -- Yes --> I --> K
    H -- No --> K
```
**Moduli usati:**  
- `recipesAPI.js`, `UI.js`, `validate.js`, `errorsManagement.js`

---

### 8️⃣ **singin.js**

```mermaid
flowchart TD
    A[onLoad]
    B{Input dati utente}
    C[validateSignInForm()]
    D{Dati validi?}
    E[createUser()]
    F{Creazione OK?}
    G[Redirect area personale]
    H[handleUserError()]
    I[Fine]

    A --> B --> C --> D
    D -- No --> H --> I
    D -- Yes --> E --> F
    F -- Yes --> G --> I
    F -- No --> H --> I
```
**Moduli usati:**  
- `usersManagement.js`, `validate.js`, `errorsManagement.js`

---

## 🗂️ **Schema di Interazione Moduli e Script di Pagina**

```mermaid
flowchart LR
    subgraph Pages
        Favourites[favourites.js]
        Index[index.js]
        Landing[landing.js]
        Login[login.js]
        Modif[modif.js]
        RecipeDetails[recipe-details.js]
        Search[search.js]
        Singin[singin.js]
    end
    subgraph Business
        UM[usersManagement.js]
        RM[reviewsManagement.js]
        RA[recipesAPI.js]
        SM[storageManagement.js]
        DM[data-models.js]
    end
    subgraph UI_Utils
        UI[UI.js]
        VA[validate.js]
        EM[errorsManagement.js]
    end

    Favourites -->|getLoggedUser, getUserFavourites| UM
    Favourites -->|getUserReviews| RM
    Favourites -->|renderCards| UI
    Index -->|fetchRandomRecipes, fetchCategories| RA
    Index -->|renderCarousel, renderCategories| UI
    Landing -->|fetchCategories, fetchRecipesByCategory| RA
    Landing -->|renderCategories, renderRecipes| UI
    Login -->|admitUser| UM
    Login -->|validateLoginForm| VA
    Login -->|handleUserError| EM
    Modif -->|searchUserById, updateUserUsername, updateUserEmail, updateUserPassword| UM
    Modif -->|validateModifForm| VA
    Modif -->|handleUserError| EM
    RecipeDetails -->|fetchRecipeById| RA
    RecipeDetails -->|addFavourite, addReview, addNote| UM
    RecipeDetails -->|addReview| RM
    RecipeDetails -->|renderRecipeDetails| UI
    RecipeDetails -->|handleUserError| EM
    Search -->|searchRecipes| RA
    Search -->|renderSearchResults| UI
    Search -->|validateSearchForm| VA
    Search -->|handleUserError| EM
    Singin -->|createUser| UM
    Singin -->|validateSignInForm| VA
    Singin -->|handleUserError| EM

    UM --> SM
    RM --> SM
    RA --> SM
    UM --> DM
    RM --> DM
    RA --> DM
    UI --> VA
    VA --> EM
```

---

**Questi schemi documentano in modo dettagliato e tecnico il workflow e le dipendenze di ogni script di pagina e dei moduli JS principali del progetto SSRI-PWM. Puoi copiarli direttamente in un file `.md` e visualizzarli con editor compatibili con Mermaid o importarli singolarmente in draw.io.**