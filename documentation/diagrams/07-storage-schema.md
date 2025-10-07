# Database Schema localStorage - PGRC

## Storage Structure Overview

```mermaid
erDiagram
    USERS {
        string id PK
        string firstName
        string lastName
        string email UK
        string hashedPassword
        array favouriteRecipes
        array notes
        date creationDate
    }
    
    RECIPES {
        string idMeal PK
        string strMeal
        string strCategory
        string strArea
        string strInstructions
        string strMealThumb
        array ingredients
        date creationDate
    }
    
    REVIEWS {
        string id PK
        string userId FK
        string recipeId FK
        number tasteRate
        number difficultyRate
        date creationDate
    }
    
    NOTES {
        string id PK
        string userId FK
        string recipeId FK
        string content
        date creationDate
        date lastModified
    }
    
    CATEGORIES {
        string idCategory PK
        string strCategory
        string strCategoryThumb
        string strCategoryDescription
        date creationDate
    }
    
    USERS ||--o{ REVIEWS : "creates"
    USERS ||--o{ NOTES : "writes"
    RECIPES ||--o{ REVIEWS : "receives"
    RECIPES ||--o{ NOTES : "annotated"
    USERS }|--|| RECIPES : "favorites"
```

## localStorage Keys Structure

```
localStorage
├── users                    # Array of User objects
├── recipes                  # Array of FullRecipe objects  
├── reviews                  # Array of Review objects
├── categories               # Array of Category objects
└── userNotes               # Array of Note objects

sessionStorage
├── currentUser             # Current logged user ID
├── searchCache             # Temporary search results
└── uiState                 # Temporary UI state
```

## Data Flow Diagram

```mermaid
flowchart LR
    subgraph "Application Layer"
        UI[UI Components]
        SS[Session Service]
    end
    
    subgraph "Storage Operations"
        GET[get key with options]
        SET[set key with data]
        PARSE[JSON parse]
        STRINGIFY[JSON stringify]
    end
    
    subgraph "localStorage"
        USERS_DB[(users)]
        RECIPES_DB[(recipes)]
        REVIEWS_DB[(reviews)]
        CATEGORIES_DB[(categories)]
        NOTES_DB[(userNotes)]
    end
    
    subgraph "sessionStorage"
        CURRENT_USER[(currentUser)]
        SEARCH_CACHE[(searchCache)]
        UI_STATE[(uiState)]
    end
    
    UI --> SS
    SS --> GET
    SS --> SET
    GET --> PARSE
    SET --> STRINGIFY
    
    PARSE --> USERS_DB
    PARSE --> RECIPES_DB
    PARSE --> REVIEWS_DB
    PARSE --> CATEGORIES_DB
    PARSE --> NOTES_DB
    
    STRINGIFY --> USERS_DB
    STRINGIFY --> RECIPES_DB
    STRINGIFY --> REVIEWS_DB
    STRINGIFY --> CATEGORIES_DB
    STRINGIFY --> NOTES_DB
    
    PARSE --> CURRENT_USER
    PARSE --> SEARCH_CACHE
    PARSE --> UI_STATE
    
    STRINGIFY --> CURRENT_USER
    STRINGIFY --> SEARCH_CACHE
    STRINGIFY --> UI_STATE
    
    classDef app fill:#e3f2fd
    classDef storage fill:#e8f5e8
    classDef local fill:#fff3e0
    classDef session fill:#f3e5f5
    
    class UI,SS app
    class GET,SET,PARSE,STRINGIFY storage
    class USERS_DB,RECIPES_DB,REVIEWS_DB,CATEGORIES_DB,NOTES_DB local
    class CURRENT_USER,SEARCH_CACHE,UI_STATE session
```

## Storage Optimization Strategy

```mermaid
graph TB
    subgraph "Data Optimization"
        NORM[Data Normalization]
        COMP[Compression Strategy]
        INDEX[Indexing for Performance]
    end
    
    subgraph "Cache Management"
        TTL[Time To Live]
        VALID[Validation Logic]
        REFRESH[Auto Refresh]
    end
    
    subgraph "Error Handling"
        QUOTA[Quota Exceeded]
        CORRUPT[Data Corruption]
        FALLBACK[Fallback Strategy]
    end
    
    NORM --> COMP
    COMP --> INDEX
    
    TTL --> VALID
    VALID --> REFRESH
    
    QUOTA --> FALLBACK
    CORRUPT --> FALLBACK
    
    classDef optimization fill:#e8f5e8
    classDef cache fill:#e3f2fd
    classDef error fill:#ffebee
    
    class NORM,COMP,INDEX optimization
    class TTL,VALID,REFRESH cache
    class QUOTA,CORRUPT,FALLBACK error
```