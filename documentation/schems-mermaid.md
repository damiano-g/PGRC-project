# 📊 SSRI-PWM - Schemi Visuali Avanzati (Mermaid + UML) & Flussi di Lavoro

---

## 1️⃣ **Workflow Utente (Flowchart semplificato e ordinato)**

```mermaid
flowchart TD
    Start((Start))
    Home[Homepage]
    Cat[Landing: Categorie]
    Search[Search: Ricerca]
    Login[Login]
    SignIn[SignIn]
    Favourites[Favourites: Area Personale]
    RecipeDetails[Recipe-Details: Dettaglio Ricetta]
    ModifUser[Modifica Profilo]
    End((End))

    Start --> Home
    Home --> Cat
    Home --> Search
    Home --> Login
    Home --> SignIn
    Cat --> Search
    Search --> RecipeDetails
    Login --> Favourites
    SignIn --> Favourites
    Favourites --> RecipeDetails
    Favourites --> ModifUser
    RecipeDetails --> Favourites
    RecipeDetails --> ModifUser
    ModifUser --> End
```

---

## 2️⃣ **Dipendenze Moduli JS (Modular Dependency Graph ordinato)**

```mermaid
graph LR
    subgraph Business Logic
        DM[data-models.js]
        UM[usersManagement.js]
        RM[reviewsManagement.js]
        RA[recipesAPI.js]
        SM[storageManagement.js]
    end
    subgraph UI & Validation
        UI[UI.js]
        VA[validate.js]
        EM[errorsManagement.js]
    end
    subgraph Pages
        PS[pages-scripts/*.js]
    end

    DM --> UM
    DM --> RM
    DM --> UI
    UM --> UI
    RM --> UI
    PS --> UM
    PS --> RM
    PS --> UI
    PS --> RA
    PS --> SM
    PS --> VA
    PS --> EM
    RA --> SM
    VA --> EM
```

---

## 3️⃣ **Flusso Tecnico Ricetta/Recensione/Preferito (Sequence Diagram)**

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant PageScript as pages-scripts/recipe-details.js
    participant UsersMgmt as usersManagement.js
    participant ReviewsMgmt as reviewsManagement.js
    participant Storage as storageManagement.js
    participant DataModels as data-models.js

    User->>UI: Interazione (click, input)
    UI->>PageScript: Evento inoltrato
    PageScript->>UsersMgmt: Gestione preferiti/notes
    PageScript->>ReviewsMgmt: Gestione recensioni
    UsersMgmt->>Storage: Aggiorna dati utente
    ReviewsMgmt->>Storage: Aggiorna recensioni
    Storage->>DataModels: Normalizza dati
    DataModels->>UI: Dati per rendering
    UI->>User: Aggiorna interfaccia
```

---

## 4️⃣ **UML - Entity Relationship (Class Diagram Unificato)**

```mermaid
classDiagram
    class User {
        +String id
        +String username
        +String email
        +String password
        +List~String~ favourites
        +List~Note~ notes
        +String creationDate
    }
    class Note {
        +String id
        +String recipeId
        +String text
        +String date
    }
    class Review {
        +String id
        +String recipeId
        +String userId
        +int tasteRate
        +int difficultyRate
        +String date
    }
    class Recipe {
        +String id
        +String name
        +String image
        +String instructions
        +String dateAdded
        +List~Ingredient~ ingredients
    }
    class Ingredient {
        +String name
        +String measure
    }

    User "1" o-- "*" Note : has
    User "1" o-- "*" Review : writes
    User "1" o-- "*" Recipe : favourites
    Recipe "1" o-- "*" Review : receives
    Recipe "1" o-- "*" Note : receives
    Recipe "1" o-- "*" Ingredient : contains
```

---

## 5️⃣ **Activity Diagram - Flusso Principale Utente (Sequence Diagram)**

```mermaid
flowchart TD
    Start((Start))
    Login[Login/SignIn]
    Home[Homepage]
    Search[Search Ricetta]
    Cat[Landing Categorie]
    Results[Visualizza Risultati]
    SelectRecipe[Seleziona Ricetta]
    Details[Dettaglio Ricetta]
    AddFav[Aggiungi/Rimuovi Preferiti]
    AddRev[Aggiungi/Rimuovi Recensione]
    AddNote[Aggiungi/Rimuovi Nota]
    Favourites[Area Personale]
    ModifUser[Modifica Profilo]
    Confirm[Conferma Modifica]
    Logout[Logout]
    End((End))

    Start --> Login
    Login --> Home
    Home --> Search
    Home --> Cat
    Search --> Results
    Cat --> Results
    Results --> SelectRecipe
    SelectRecipe --> Details
    Details --> AddFav
    Details --> AddRev
    Details --> AddNote
    AddFav --> Favourites
    AddRev --> Favourites
    AddNote --> Favourites
    Favourites --> ModifUser
    ModifUser --> Confirm
    Confirm --> Logout
    Logout --> End
```

---

**Questi schemi Mermaid e UML documentano i flussi di lavoro, le dipendenze tecniche e le relazioni tra dati del progetto SSRI-PWM. Puoi copiarli direttamente in un file `.md` e visualizzarli con editor compatibili con Mermaid o importarli singolarmente in draw.io.**