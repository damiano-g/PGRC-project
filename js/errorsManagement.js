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
 * @property {string} itemType - Tipo di oggetto non trovato
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
