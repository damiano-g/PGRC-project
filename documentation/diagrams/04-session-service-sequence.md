# Diagramma Session Service - PGRC

## 1. Login Flow Sequence

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant US as Users Service
    participant ST as Storage
    
    Note over UI,ST: User Authentication Flow
    UI->>SS: NewUser.startSession(username, password)
    SS->>US: admitUser("username", username, password)
    US->>ST: get('users', {storageLocation: 'local'})
    ST-->>US: userData[]
    US-->>SS: boolean (admitted)
    alt Authentication Success
        SS->>US: searchUser("username", username)
        US-->>SS: userObject
        SS->>ST: set('loggedUser', userId, {storageLocation: 'session'})
        ST-->>SS: success
        SS-->>UI: true
    else Authentication Failed
        SS-->>UI: false
    end
```

## 2. Recipe Operations Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant US as Users Service
    participant ST as Storage
    
    Note over UI,ST: Check if Recipe is Favorite
    UI->>SS: Recipe.isFavourite(recipeId)
    SS->>SS: LoggedUser.getId()
    SS->>US: searchUser("id", userId)
    US->>ST: get('users', {storageLocation: 'local'})
    ST-->>US: userData[]
    US-->>SS: userObject.favourites
    SS-->>UI: boolean (isFavorite)
    
    Note over UI,ST: Toggle Favorite Recipe
    UI->>SS: LoggedUser.updateFavourites(recipeId)
    SS->>SS: LoggedUser.getId()
    SS->>US: updateUserFavourites(userId, recipeId)
    US->>ST: get('users', {storageLocation: 'local'})
    ST-->>US: userData[]
    US->>US: toggleRecipeInFavorites(userId, recipeId)
    US->>ST: set('users', updatedData, {storageLocation: 'local'})
    ST-->>US: success
    US-->>SS: void
    SS-->>UI: void
```

## 3. Review System Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant RVS as Reviews Service
    participant ST as Storage
    
    Note over UI,ST: Add/Update Recipe Review
    UI->>SS: Recipe.addUserReview(recipeId, tasteRate, difficultyRate)
    SS->>SS: LoggedUser.getId()
    SS->>RVS: updateRecipeReviews(userId, recipeId, tasteRate, difficultyRate)
    RVS->>ST: get('reviews', {storageLocation: 'local'})
    ST-->>RVS: reviewsData[]
    RVS->>RVS: addOrUpdateReview(userId, recipeId, rates)
    RVS->>ST: set('reviews', updatedReviews, {storageLocation: 'local'})
    ST-->>RVS: success
    RVS-->>SS: void
    SS-->>UI: true
    
    Note over UI,ST: Delete User Review
    UI->>SS: Recipe.deleteUserReview(recipeId)
    SS->>RVS: updateRecipeReviews(userId, recipeId)
    RVS-->>SS: result
    SS-->>UI: result
    
    Note over UI,ST: Get User Review Rates
    UI->>SS: Recipe.userTasteRate(recipeId)
    SS->>RVS: recipeUserRate(recipeId, userId, "tasteRate")
    RVS-->>SS: number (0-5)
    SS-->>UI: tasteRate
```

## 5. Logout Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant ST as Storage
    
    Note over UI,ST: User Logout
    UI->>SS: LoggedUser.endSession()
    SS->>ST: set('loggedUser', "", {storageLocation: 'session'})
    ST-->>SS: success
    SS-->>UI: void
```

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant US as Users Service
    participant ST as Storage
    
    Note over UI,ST: Add Note to Recipe
    UI->>SS: LoggedUser.addNote(recipeId, noteText)
    SS->>SS: LoggedUser.getId()
    SS->>US: updateUserNotes(userId, recipeId, noteText)
    US->>ST: get('users', {storageLocation: 'local'})
    ST-->>US: userData[]
    US->>US: createNoteAndAddToUser(userId, recipeId, noteText)
    US->>ST: set('users', updatedData, {storageLocation: 'local'})
    ST-->>US: success
    US-->>SS: void
    SS-->>UI: void
    
    Note over UI,ST: Delete Note
    UI->>SS: LoggedUser.deleteNote(noteId)
    SS->>SS: LoggedUser.getId()
    SS->>US: updateUserNotes(userId, null, null, noteId)
    US->>ST: get('users', {storageLocation: 'local'})
    ST-->>US: userData[]
    US->>US: removeNoteFromUser(userId, noteId)
    US->>ST: set('users', updatedData, {storageLocation: 'local'})
    ST-->>US: success
    US-->>SS: void
    SS-->>UI: void
    
    Note over UI,ST: Get User Notes
    UI->>SS: LoggedUser.getNotes(recipeId)
    SS->>SS: LoggedUser.getId()
    SS->>US: searchUser("id", userId)
    US-->>SS: userObject.notes
    SS->>SS: filterNotesByRecipe(notes, recipeId)
    SS-->>UI: filteredNotes[]
```

## Session Service Architecture

### NewUser Namespace Operations

```mermaid
graph TB
    subgraph "NewUser Operations"
        NU1[startSession]
        NU2[addToDB]
    end
    
    subgraph "Dependencies"
        US[Users Service]
        ST[Storage Management]
    end
    
    NU1 --> US
    NU1 --> ST
    NU2 --> US
    
    classDef operation fill:#e8f5e8
    classDef service fill:#fff3cd
    
    class NU1,NU2 operation
    class US,ST service
```

### LoggedUser Namespace Operations

```mermaid
graph TB
    subgraph "LoggedUser Operations"
        LU1[getId]
        LU2[isLogged]
        LU3[getData]
        LU4[getNotes]
        LU5[updateFavourites]
        LU6[addNote]
        LU7[deleteNote]
        LU8[deleteAccount]
        LU9[endSession]
    end
    
    subgraph "Dependencies"
        US[Users Service]
        RVS[Reviews Service]
        ST[Storage Management]
        SS[Session Storage]
    end
    
    LU1 --> SS
    LU2 --> US
    LU2 --> SS
    LU3 --> US
    LU4 --> US
    LU5 --> US
    LU6 --> US
    LU7 --> US
    LU8 --> US
    LU8 --> RVS
    LU9 --> SS
    
    classDef operation fill:#e8f5e8
    classDef service fill:#fff3cd
    
    class LU1,LU2,LU3,LU4,LU5,LU6,LU7,LU8,LU9 operation
    class US,RVS,ST,SS service
```

### Recipe Namespace Operations

```mermaid
graph TB
    subgraph "Recipe Operations"
        R1[isFavourite]
        R2[isReviewed]
        R3[addUserReview]
        R4[deleteUserReview]
        R5[userTasteRate]
        R6[userDifficultyRate]
        R7[avgTasteRate]
        R8[avgDifficultyRate]
        R9[getFullData]
    end
    
    subgraph "Dependencies"
        US[Users Service]
        RVS[Reviews Service]
        RS[Recipes Service]
        ST[Storage Management]
    end
    
    R1 --> US
    R2 --> RVS
    R3 --> RVS
    R4 --> RVS
    R5 --> RVS
    R6 --> RVS
    R7 --> RVS
    R8 --> RVS
    R9 --> RS
    
    classDef operation fill:#e8f5e8
    classDef service fill:#fff3cd
    
    class R1,R2,R3,R4,R5,R6,R7,R8,R9 operation
    class US,RVS,RS,ST service
```

### PreviewArray Namespace Operations

```mermaid
graph TB
    subgraph "PreviewArray Generation"
        PA1[categories]
        PA2[mealsByName]
        PA3[mealsByCategory]
        PA4[mealsById]
        PA5[rndMeals]
        PA6[favourites]
    end
    
    subgraph "Dependencies"
        RS[Recipes Service]
        US[Users Service]
        ST[Storage Management]
    end
    
    PA1 --> RS
    PA2 --> RS
    PA3 --> RS
    PA4 --> RS
    PA5 --> RS
    PA6 --> US
    PA6 --> ST
    
    classDef operation fill:#e8f5e8
    classDef service fill:#fff3cd
    
    class PA1,PA2,PA3,PA4,PA5,PA6 operation
    class RS,US,ST service
```