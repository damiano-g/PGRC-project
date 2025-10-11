# Dependency Diagram - PGRC Project JS Files

```mermaid
graph TD
    %% Core Data Layer
    DM[data-models.js<br/>User, Note, Review,<br/>Category, FullRecipe,<br/>generateItemId]
    ER[errors.js<br/>NotFound, Duplicated,<br/>InvalidFormat, BadRequest]
    ST[storage.js<br/>StorageOperations]

    %% Service Layer
    US[users-service.js<br/>getRegisteredUsers,<br/>addNewUser, admitUser,<br/>hashString, ...]
    RS[recipes-service.js<br/>getData, searchRecipeById,<br/>searchRecipesByName, ...]
    RV[reviews-service.js<br/>getStoredReviews,<br/>updateRecipeReviews,<br/>recipeAvgRate, ...]

    %% Session Management - Central Hub
    SS[session-service.js<br/>NewUser, LoggedUser,<br/>Recipe, PreviewArray,<br/>inputValidation]

    %% UI Layer
    UI[ui.js<br/>populatePreviewContainer,<br/>favBtnDisplay,<br/>initializeNavbar, ...]

    %% Page Modules
    IN[index.js]
    LO[login.js]
    SI[signin.js]
    SE[search.js]
    RD[recipe-details.js]
    FA[favourites.js]

    %% Dependencies
    US --> DM
    US --> ER
    US --> ST

    RS --> DM
    RS --> ER
    RS --> ST

    RV --> DM
    RV --> ER
    RV --> ST

    SS --> DM
    SS --> ER
    SS --> ST
    SS --> US
    SS --> RS
    SS --> RV

    UI --> SS

    IN --> SS
    IN --> UI

    LO --> SS
    LO --> UI

    SI --> SS
    SI --> UI

    SE --> SS
    SE --> UI

    RD --> SS
    RD --> UI

    FA --> SS
    FA --> UI

    %% Styling
    classDef core fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef service fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef hub fill:#fff3e0,stroke:#e65100,stroke-width:3px
    classDef ui fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef page fill:#fce4ec,stroke:#880e4f,stroke-width:2px

    class DM,ER,ST core
    class US,RS,RV service
    class SS hub
    class UI ui
    class IN,LO,SI,SE,RD,FA page
```</content>
<parameter name="filePath">c:\Users\damia\Documents\repos\ssri-pwm\dependency-diagram.md