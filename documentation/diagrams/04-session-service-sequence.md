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
        ST-->>SS: processedData
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
    US->>US: searchUser("id", userId)
    US->>US: findIndex(favourites, recipeId)
    alt Recipe not in favorites
        US->>US: userFavourites.unshift(recipeId)
    else Recipe in favorites
        US->>US: userFavourites.splice(index, 1)
    end
    US->>US: updateUserData(userId, "favourites", userFavourites)
    US->>ST: set('users', updatedData, {storageLocation: 'local'})
    ST-->>US: processedData
    US-->>SS: userFavourites
    SS-->>UI: userFavourites
```

## 3. Review System Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant RVS as Reviews Service
    participant ST as Storage
    
    Note over UI,ST: Add Recipe Review
    UI->>SS: Recipe.addUserReview(recipeId, tasteRate, difficultyRate)
    SS->>SS: LoggedUser.getId()
    SS->>RVS: updateRecipeReviews(userId, recipeId, tasteRate, difficultyRate)
    RVS->>ST: get('reviews', {storageLocation: 'local'})
    ST-->>RVS: reviewsData[]
    RVS->>RVS: checkIfReviewExists(userId, recipeId)
    alt Review does not exist
        RVS->>RVS: new Review(recipeId, userId, tasteRate, difficultyRate)
        RVS->>RVS: recipeReviewsArray.unshift(updatedReview)
        RVS->>ST: set('reviews', updatedReviews, {storageLocation: 'local'})
        ST-->>RVS: processedData
        RVS-->>SS: updatedReview
        SS-->>UI: updatedReview
    else Review already exists
        RVS-->>SS: throw Duplicated("Review")
        SS-->>UI: Error (Duplicated)
    end
    
    Note over UI,ST: Delete User Review
    UI->>SS: Recipe.deleteUserReview(recipeId)
    SS->>SS: LoggedUser.getId()
    SS->>RVS: updateRecipeReviews(userId, recipeId, null, null)
    RVS->>ST: get('reviews', {storageLocation: 'local'})
    ST-->>RVS: reviewsData[]
    RVS->>RVS: findIndex(recipeReviewsArray, userId, recipeId)
    alt Review exists
        RVS->>RVS: recipeReviewsArray.splice(index, 1)
        RVS->>ST: set('reviews', updatedReviews, {storageLocation: 'local'})
        ST-->>RVS: processedData
        RVS-->>SS: processedData
        SS-->>UI: processedData
    else Review not found
        RVS-->>SS: throw NotFound("Review", "id", userId)
        SS-->>UI: Error (NotFound)
    end
    
    Note over UI,ST: Get User Review Rates
    UI->>SS: Recipe.userTasteRate(recipeId)
    SS->>SS: LoggedUser.getId()
    SS->>RVS: recipeUserRate(recipeId, userId, "tasteRate")
    RVS->>ST: get('reviews', {storageLocation: 'local'})
    ST-->>RVS: reviewsData[]
    RVS->>RVS: getStoredReviews().find(element => element.recipeId === recipeId && element.userId === userId)
    RVS->>RVS: review ? Number(review[ratingType]).toFixed(1) : 0
    RVS-->>SS: string (rate value)
    SS-->>UI: string (tasteRate)
    
    Note over UI,ST: Get Average Recipe Rates
    UI->>SS: Recipe.avgTasteRate(recipeId)
    SS->>RVS: recipeAvgRate(recipeId, "tasteRate")
    RVS->>ST: get('reviews', {storageLocation: 'local'})
    ST-->>RVS: reviewsData[]
    RVS->>RVS: getStoredReviews().forEach(review => if recipeId matches)
    RVS->>RVS: sum += review[ratingType], totalReviews++
    RVS->>RVS: avgRate = (sum/totalReviews).toFixed(1)
    RVS-->>SS: string (average rate)
    SS-->>UI: string (avgTasteRate)
```

## 5. Profile Update Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant US as Users Service
    participant ST as Storage
    
    Note over UI,ST: Update Username/Email (Generic Flow)
    UI->>SS: LoggedUser.changeUsername(newValue) / changeEmail(newValue)
    SS->>SS: LoggedUser.getId()
    SS->>US: updateUserUsername(userId, newValue) / updateUserEmail(userId, newValue)
    US->>US: authUsername(newValue) / authEmail(newValue)
    alt Field is unique
        US->>US: updateUserData(userId, field, newValue)
        US->>ST: get('users', {storageLocation: 'local'})
        ST-->>US: userData[]
        US->>US: findIndex(users, userId)
        US->>US: registeredUsers[index][field] = newValue
        US->>ST: set('users', updatedData, {storageLocation: 'local'})
        ST-->>US: processedData
        US-->>SS: newValue
        SS-->>UI: newValue
    else Field already exists
        US-->>SS: throw Duplicated(fieldType)
        SS-->>UI: Error (Duplicated)
    end
    
    Note over UI,ST: Update Password
    UI->>SS: LoggedUser.changePassword(newPassword, passConfirm)
    SS->>SS: LoggedUser.getId()
    SS->>US: updateUserPassword(userId, newPassword, passConfirm)
    US->>US: authPassword(newPassword, passConfirm)
    alt Passwords match
        US->>US: updateUserData(userId, "password", newPassword, true)
        US->>US: hashString(newPassword)
        US->>ST: get('users', {storageLocation: 'local'})
        ST-->>US: userData[]
        US->>US: registeredUsers[index]["password"] = hashedPassword
        US->>ST: set('users', updatedData, {storageLocation: 'local'})
        ST-->>US: processedData
        US-->>SS: hashedPassword
        SS-->>UI: hashedPassword
    else Passwords don't match
        US-->>SS: throw InvalidFormat("password confirmation")
        SS-->>UI: Error (InvalidFormat)
    end
```

## 6. Logout Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant ST as Storage
    
    Note over UI,ST: User Logout
    UI->>SS: LoggedUser.endSession()
    SS->>ST: set('loggedUser', "", {storageLocation: 'session'})
    ST-->>SS: processedData
    SS-->>UI: void
```

## 7. Delete Account Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant US as Users Service
    participant RVS as Reviews Service
    participant DM as Data Models
    
    Note over UI,RVS: Delete User Account with Reviews Transfer
    UI->>SS: LoggedUser.deleteAccount()
    SS->>SS: LoggedUser.getId()
    SS->>DM: generateItemId("deleted-user")
    DM-->>SS: deletedUserId
    
    Note over SS,RVS: Get User Reviews to Transfer
    SS->>RVS: getStoredReviews()
    RVS-->>SS: allReviews
    SS->>SS: currentUserReviews = allReviews.filter(review => review.userId === currentUserId)
    
    loop For each user review
        Note over SS,RVS: Delete original review
        SS->>RVS: updateRecipeReviews(currentUserId, recipeId, null, null)
        RVS-->>SS: deletedReview
        
        Note over SS,RVS: Create review with deleted user ID
        SS->>RVS: updateRecipeReviews(deletedUserId, recipeId, tasteRate, difficultyRate)
        RVS-->>SS: updatedReviewsDB
    end
    
    Note over SS,US: Delete User Account
    SS->>US: deleteUser(currentUserId)
    US-->>SS: updatedUsersDB
    
    Note over SS: End Session
    SS->>SS: LoggedUser.endSession()
    SS-->>UI: {updatedUsersDB, updatedReviewsDB}
```

## 4. Notes Management Flow

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant SS as Session Service
    participant US as Users Service
    participant ST as Storage
    
    Note over UI,ST: Add Note to Recipe
    UI->>SS: LoggedUser.addNote(recipeId, text)
    SS->>SS: LoggedUser.getId()
    SS->>US: updateUserNotes(userId, recipeId, text, null)
    US->>US: searchUser("id", userId)
    US->>US: userNotes = user.notes
    alt Valid parameters (text && recipeId && !noteId)
        US->>US: new Note(recipeId, text)
        US->>US: userNotes.unshift(newNote)
        US->>US: updateUserData(userId, "notes", userNotes)
        US->>ST: get('users', {storageLocation: 'local'})
        ST-->>US: userData[]
        US->>ST: set('users', updatedData, {storageLocation: 'local'})
        ST-->>US: processedData
        US-->>SS: userNotes
        SS-->>UI: userNotes
    else Invalid parameters
        US-->>SS: throw Error("Wrong data format")
        SS-->>UI: Error (Wrong data format)
    end
    
    Note over UI,ST: Delete Note
    UI->>SS: LoggedUser.deleteNote(noteId)
    SS->>SS: LoggedUser.getId()
    SS->>US: updateUserNotes(userId, null, null, noteId)
    US->>US: searchUser("id", userId)
    US->>US: userNotes = user.notes
    alt Valid parameters (!text && !recipeId && noteId)
        US->>US: findIndex(userNotes, noteId)
        US->>US: userNotes.splice(index, 1)
        US->>US: updateUserData(userId, "notes", userNotes)
        US->>ST: get('users', {storageLocation: 'local'})
        ST-->>US: userData[]
        US->>ST: set('users', updatedData, {storageLocation: 'local'})
        ST-->>US: processedData
        US-->>SS: userNotes
        SS-->>UI: userNotes
    else Invalid parameters
        US-->>SS: throw Error("Wrong data format")
        SS-->>UI: Error (Wrong data format)
    end
    Note over UI,ST: Get User Notes for Recipe
    UI->>SS: LoggedUser.getRecipeNotes(recipeId)
    SS->>SS: LoggedUser.getId()
    SS->>US: searchUser("id", userId)
    US->>ST: get('users', {storageLocation: 'local'})
    ST-->>US: userData[]
    US-->>SS: userObject
    SS->>SS: userObject.notes.filter(note => note.recipeId === recipeId)
    SS-->>UI: Array (filtered notes)
    
    Note over UI,ST: Get All User Reviews
    UI->>SS: LoggedUser.getReviews()
    SS->>SS: LoggedUser.getId()
    SS->>SS: ReviewsManagement.getStoredReviews()
    SS->>SS: allReviews.filter(element => element.userId === LoggedUser.getId())
    SS-->>UI: Array (user reviews)
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
        LU4[getRecipeNotes]
        LU5[getReviews]
        LU6[changeUsername]
        LU7[changeEmail]
        LU8[changePassword]
        LU9[updateFavourites]
        LU10[addNote]
        LU11[deleteNote]
        LU12[deleteAccount]
        LU13[endSession]
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
    LU5 --> RVS
    LU6 --> US
    LU7 --> US
    LU8 --> US
    LU9 --> US
    LU10 --> US
    LU11 --> US
    LU12 --> US
    LU12 --> RVS
    LU13 --> SS
    
    classDef operation fill:#e8f5e8
    classDef service fill:#fff3cd
    
    class LU1,LU2,LU3,LU4,LU5,LU6,LU7,LU8,LU9,LU10,LU11,LU12,LU13 operation
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