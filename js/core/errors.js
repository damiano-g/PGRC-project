/**
 * @fileoverview Modulo per gestione errori custom del progetto PGRC
 * @description Definisce classi errore estese da Error con codici HTTP e informazioni contestuali per error handling strutturato
 */

/**
 * Errore custom per risorsa non trovata.
 * Estende Error e aggiunge informazioni contestuali e codice HTTP standard.
 *
 * @class
 * @extends Error
 
 *
 * @property {string} itemType - Tipo di oggetto non trovato
 * @property {string} fieldType - Campo di ricerca
 * @property {string} fieldValue - Valore cercato
 * @property {number} code - Codice errore HTTP (404)
 *
 * @example
 * throw new NotFound("User", "username", "john_doe");
 */
export class NotFound extends Error{
    /**
    * @param {"User"|"Review"|"Recipe"|"Note"|"Category"} itemType - Tipo di oggetto cercato (es. "User", "Recipe")
    * @param {"id"|"name"|"username"|"email"} fieldType - Campo usato per la ricerca (es. "id", "username")
    * @param {string} fieldValue - Valore del campo cercato 
    */
    constructor(itemType, fieldType, fieldValue){
        super(`${itemType} not found for provided ${fieldType}`);
        this.itemType = itemType;
        this.fieldType = fieldType;
        this.fieldValue = fieldValue;
        this.code = 404;
    }
};


/**
 * Errore custom per risorsa duplicata.
 * Estende Error e aggiunge informazioni contestuali e codice HTTP standard.
 *
 * @class
 * @extends Error
 *
 * @property {string} itemType - Tipo di oggetto duplicato
 * @property {string} fieldType - Campo di ricerca
 * @property {string} fieldValue - Valore cercato
 * @property {number} code - Codice errore HTTP (409)
 *
 * @example
 * throw new Duplicated("User", "username", "john_doe");
 */
export class Duplicated extends Error{
    /**
    * @param {"User"|"Review"|"Recipe"|"Note"|"Category"} itemType - Tipo di oggetto cercato (es. "User", "Recipe")
    * @param {string} fieldType - Campo usato per la ricerca (es. "id", "username")
    * @param {string} fieldValue - Valore del campo cercato 
    */
    constructor(itemType, fieldType = null, fieldValue = null){
        super(`${itemType} duplicated`);
        this.itemType = itemType;
        this.fieldType = fieldType;
        this.fieldValue = fieldValue;
        this.code = 409;
    }
};

/**
 * Errore custom per formato dati invalido.
 * Estende Error e aggiunge informazioni contestuali e codice HTTP standard.
 *
 * @class
 * @extends Error
 *
 * @property {string} dataType - Tipo di dato con formato invalido
 * @property {string} dataValue - Valore del dato invalido
 * @property {number} code - Codice errore HTTP (422)
 *
 * @example
 * throw new InvalidFormat("email", "invalid-email");
 */
export class InvalidFormat extends Error{

    /**
    * @param {string} dataType - Tipo di dato da validare
    * @param {string} dataValue - Valore del dato invalido
    */

    constructor(dataType, dataValue){
        super(`Invalid ${dataType} format`);
        this.dataType = dataType;
        this.dataValue = dataValue;
        this.code = 422;
    }
};


/**
 * Errore custom per richiesta non valida.
 * Estende Error e aggiunge codice HTTP standard.
 *
 * @class
 * @extends Error
 *
 * @property {number} code - Codice errore HTTP (400)
 *
 * @example
 * throw new BadRequest();
 */
export class BadRequest extends Error{

    constructor(){
        super("Unsupported data format");
        this.code = 400;
    }
}


// ============================================================================
// ANALISI E DESCRIZIONE DEL FILE
// ============================================================================

/**
 * @description Analisi e descrizione del file errors.js
 * 
 * **Scopo e ruolo nel progetto:**
 * Modulo core per la gestione degli errori custom.
 * Fornisce classi di errore estese da `Error` con informazioni contestuali e codici HTTP standard,
 * facilitando la propagazione di errori strutturati attraverso i moduli business e UI.
 * Implementa un sistema di error handling consistente per graceful degradation e debugging.
 * 
 * **Architettura e struttura:**
 * - **Error classes:** Classi che estendono `Error` con proprietà aggiuntive (itemType, fieldType, code, ecc.).
 * - **HTTP codes:** Codici standard (404, 409, 422, 400) per mappare errori business a risposte HTTP.
 * - **Pattern utilizzati:** Custom error classes con costruttori parametrici, estensione di Error nativo.
 * - **Dipendenze:** Nessuna dipendenza esterna - modulo self-contained basato su Error nativo.
 * 
 * **Interazioni con altri moduli:**
 * - **Business (usersManagement.js, recipesManagement.js):** Lancio errori custom per validazione e lookup.
 * - **UI (ui.js, pagine):** Cattura errori per feedback utente (alert, form validation).
 * - **Storage (storage.js):** Gestione errori durante operazioni CRUD.
 * - **Session (session-service.js):** Propagazione errori da autenticazione e stato utente.
 * 
 * **Flusso di esecuzione documentato:**
 * 
 * 1. **Import e setup:**
 *    - Nessun import esterno - modulo autonomo.
 * 
 * 2. **Definizione classi errore:**
 *    - NotFound: Per risorse non esistenti (es. utente non trovato per username).
 *    - Duplicated: Per risorse duplicate (es. username già esistente).
 *    - InvalidFormat: Per dati con formato invalido (es. email malformata).
 *    - BadRequest: Per richieste con formato dati non supportato.
 * 
 * 3. **Costruzione errori:**
 *    - Istanziamento con parametri contestuali (itemType, fieldType, ecc.).
 *    - Assegnamento codice HTTP e messaggio dinamico.
 * 
 * 4. **Propagazione e gestione:**
 *    - Lancio (`throw`) nei moduli business per condizioni di errore.
 *    - Cattura (`catch`) nei moduli UI per feedback specifico (es. alert, form invalid).
 *    - Logging console per debug, graceful degradation per UX.
 * 
 * **Note tecniche:**
 * - **Estensione Error:** Mantiene stack trace nativo, aggiunge proprietà custom.
 * - **Codici HTTP:** Mappano errori business a standard web (404 not found, 409 conflict, ecc.).
 * - **Parametri opzionali:** Alcuni costruttori hanno parametri default (null) per flessibilità.
 * - **Messaggi dinamici:** Costruiti con template literals per contestualizzazione.
 * - **Type safety:** JSDoc specifica tipi parametri per IDE support.
 * - **Scalabilità:** Facile aggiunta nuove classi errore seguendo pattern esistente.
 * - **Limitazioni:** Nessun logging automatico (delegato a catch blocks), dipendenza da gestione upstream.
 * 
 * @note Questo modulo è cruciale per error handling: errori mal gestiti impattano UX e debugging.
 * @note Compatibilità: Usa solo Error nativo, compatibile con tutti gli ambienti JavaScript.
 */