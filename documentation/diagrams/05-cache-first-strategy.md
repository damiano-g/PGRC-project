# Cache-First Strategy Flow - PGRC

## Cache-First Strategy per API TheMealDB

```mermaid
flowchart TD
    A[Request getData dataType] --> B{Cache exists?}
    B -->|No| C[createLocalDB]
    B -->|Yes| D{Cache valid today?}
    D -->|No| E[Cache expired]
    D -->|Yes| F[Return cached data]
    E --> C
    C --> G[Fetch from TheMealDB API]
    G --> H{API Response OK?}
    H -->|No| I[Handle API Error]
    H -->|Yes| J[Normalize data]
    J --> L[Add timestamp]
    L --> K[Store in localStorage]
    K --> M[Return fresh data]
    I --> N[Graceful degradation]
    
    subgraph "API Integration Details"
        G1[Categories endpoint]
        G2[Recipes A-Z endpoint]
    end
    
    G --> G1
    G --> G2
    
    classDef cache fill:#e8f5e8
    classDef api fill:#e3f2fd
    classDef error fill:#ffebee
    classDef process fill:#fff3e0
    
    class B,D,F,K,L cache
    class G,G1,G2,H api
    class E,I,N error
    class A,C,J,M process
```


## Cache Validation Logic

```mermaid
sequenceDiagram
    participant APP as Application
    participant RS as Recipes Service
    participant CACHE as localStorage
    participant API as TheMealDB API
    
    APP->>RS: getData('recipes')
    RS->>CACHE: get('recipes')
    CACHE-->>RS: cachedData | null
    
    alt Cache Miss
        RS->>API: fetchRecipes(A-Z)
        loop For each letter A-Z
            API-->>RS: recipes for letter
        end
        RS->>RS: normalizeData()
        RS->>CACHE: set('recipes', normalizedData)
        RS-->>APP: freshData
    else Cache Hit
        RS->>RS: validateTimestamp(cachedData[0].creationDate)
        alt Cache Valid (today)
            RS-->>APP: cachedData
        else Cache Expired
            RS->>API: fetchRecipes(A-Z)
            API-->>RS: updatedData
            RS->>CACHE: set('recipes', updatedData)
            RS-->>APP: updatedData
        end
    end
```