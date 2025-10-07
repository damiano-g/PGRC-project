# Diagramma Architettura Three-Layer - PGRC

## Architettura Modulare a Tre Layer

```mermaid
graph TB
    subgraph "PRESENTATION LAYER"
        HTML[HTML Pages]
        CSS[CSS Styles]
        UI[UI Components]
        PS[Page Scripts]
    end
    
    subgraph "SERVICE LAYER"
        SS[Session Service]
        US[Users Service]
        RS[Recipes Service]
        RVS[Reviews Service]
    end
    
    subgraph "DATA LAYER"
        DM[Data Models]
        ST[Storage Operations]
        API[API Integration]
        ER[Error Classes]
    end
    
    HTML --> PS
    CSS --> HTML
    CSS --> UI
    UI --> PS
    UI --> SS
    PS --> SS
    
    SS --> US
    SS --> RS
    SS --> RVS
    
    US --> DM
    US --> ST
    US --> ER
    RS --> DM
    RS --> ST
    RS --> API
    RS --> ER
    RVS --> DM
    RVS --> ST
    RVS --> ER
    
    ST --> ER
    API --> ER
    SS --> ER
    PS --> ER
    
    classDef presentation fill:#e1f5fe
    classDef service fill:#f3e5f5
    classDef data fill:#e8f5e8
    
    class HTML,CSS,UI,PS presentation
    class SS,US,RS,RVS service
    class DM,ST,API,ER data
```

## Dettaglio Responsabilità

### Presentation Layer
- **HTML Pages**: Struttura semantica delle pagine
- **CSS Styles**: Presentazione e responsive design
- **UI Components**: Factory per elementi DOM dinamici
- **Page Scripts**: Logica specifica per ogni pagina

### Service Layer
- **Session Service**: Orchestratore centrale con pattern Facade
- **Users Service**: CRUD utenti + autenticazione
- **Recipes Service**: Integrazione API + cache management
- **Reviews Service**: Sistema rating duale con aggregazione

### Data Layer
- **Data Models**: Factory per entità business
- **Storage Operations**: Astrazione localStorage/sessionStorage
- **API Integration**: Wrapper chiamate HTTP
- **Error Classes**: Gestione errori tipizzati