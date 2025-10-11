/**
 * @fileoverview Modulo per gestione errori custom
 * @description Definisce classi errore estese da Error con codici HTTP compliant e informazioni contestuali per error handling strutturato
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
// DESCRIZIONE DEL FILE
// ============================================================================

/**
 * @description errors.js
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
 * - **Dipendenze:** Nessuna dipendenza esterna - modulo self-contained basato su Error nativo.
 * 
 * **Interazioni con altri moduli:**
 * - **Business (users-service.js, recipes-service.js, reviews-service.js):** Lancio errori custom per validazione.
 * - **UI (ui.js, pagine):** Cattura errori per feedback utente (alert, form validation).
 * - **Storage (storage.js):** Gestione errori durante operazioni CRUD.
 * - **Session (session-service.js):** Propagazione errori da autenticazione e stato utente.
 * 
 * 
 * **Note tecniche:**
 * - **Estensione Error:** Mantiene stack trace nativo, aggiunge proprietà custom.
 * - **Codici HTTP:** Mappano errori business a standard web (404 not found, 409 conflict, ecc.).
 * - **Parametri opzionali:** Alcuni costruttori hanno parametri default (null) per flessibilità.
 * - **Messaggi dinamici:** Per contestualizzazione.
 * - **Limitazioni:** Nessun logging automatico (delegato a catch blocks), dipendenza da gestione upstream.
 */