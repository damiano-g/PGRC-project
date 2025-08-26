// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Costruttore per errori personalizzati relativi alla gestione utenti.
 * 
 * Crea un oggetto errore che estende il comportamento di Error,
 * permettendo di distinguere e gestire in modo strutturato gli errori specifici
 * del modulo utenti (es. validazione, storage, autenticazione).
 * 
 * @param {string} type    - Categoria dell'errore ('VALIDATION', 'STORAGE', 'AUTH', 'NOT_FOUND', ecc.)
 * @param {string} message - Messaggio descrittivo dell'errore, utile per log e debugging
 * @param {any}    details - (Opzionale) Informazioni aggiuntive sull'errore (es. dati di input, stack trace, ecc.)
 * 
 * Proprietà aggiunte:
 *   - name:        Identificatore del tipo di errore ('UserManagementError')
 *   - type:        Categoria dell'errore per gestioni specifiche
 *   - message:     Messaggio descrittivo
 *   - details:     Informazioni extra per debugging o UI
 *   - timestamp:   Data e ora di creazione dell'errore (ISO string)
 * 
 * Il prototype viene impostato per ereditare da Error, così da mantenere
 * compatibilità con la gestione nativa degli errori JavaScript.
 */

function UserManagementError(type, message, details = null){
        this.name = "UserManagementError";
        this.type = type;
        this.message = message;
        this.details = details;
        this.timestamp = new Date().toISOString();
}

// - Crea un nuovo oggetto che ha come prototype Error.prototype.
// - In questo modo, tutte le istanze di UserManagementError avranno accesso ai metodi e proprietà di Error (come lo stack trace).
// - Permette di trattare UserManagementError come un vero errore JavaScript nei catch e nei log.
UserManagementError.prototype = Object.create(Error.prototype);

// Imposta la proprietà 'constructor' del prototype su UserManagementError.
// Quando si verifica il tipo di oggetto (ad esempio con instanceof), il costruttore risulta corretto.
// Utile per introspezione, serializzazione e per evitare ambiguità se si creano istanze con new.
UserManagementError.prototype.constructor = UserManagementError;



/**
 * Gestore centralizzato degli errori per la gestione utenti.
 *
 * Riceve un oggetto errore (idealmente istanza di UserManagementError o Error)
 * e mostra un messaggio di alert specifico in base alla categoria dell'errore (type).
 *
 * - Se l'errore è di tipo 'VALIDATION', mostra un alert con il messaggio di validazione.
 * - Se l'errore è di tipo 'STORAGE', mostra un alert relativo a problemi di storage.
 * - Se l'errore è di tipo 'AUTH', mostra un alert per errori di autenticazione.
 * - Per altri tipi o errori generici, mostra un alert con il messaggio generico.
 *
 * Parametri:
 *   @param {Error|UserManagementError} error - Oggetto errore da gestire. Deve avere almeno le proprietà 'type' e 'message'.
 *
 * Comportamento:
 *   - Verifica che l'oggetto sia un'istanza di Error.
 *   - In base alla proprietà 'type', seleziona il messaggio di alert più appropriato.
 *   - Permette di centralizzare la gestione degli errori UI, evitando duplicazione di codice nei vari moduli.
 *
 * Esempio d'uso:
 *   try {
 *     // ...logica che può generare errori...
 *   } catch (err) {
 *     handleUserError(err);
 *   }
 */
export function handleUserError(error) {

    if(error instanceof Error){
        switch(error.type){
            case 'VALIDATION':
            alert(`Errore di validazione: ${error.message}`);
            break;
        case 'STORAGE':
            alert(`Errore di storage: ${error.message}`);
            break;
        case 'AUTH':
            alert(`Errore di autenticazione: ${error.message}`);
            break;
        default:
            alert(`Errore: ${error.message}`);
        }
    }
}