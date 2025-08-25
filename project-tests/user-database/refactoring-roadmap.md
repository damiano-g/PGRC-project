# Roadmap Refactoring - Sistema Gestione Utenti

> **Documento di pianificazione per miglioramenti architetturali**  
> Versione: 1.0 | Data: 2025-08-25 | Autore: damia

## 📋 **Overview**

Questo documento raccoglie tutte le **criticità architetturali identificate** nel sistema di gestione utenti e fornisce una roadmap strutturata per il refactoring. Il sistema attuale è **production-ready** per il suo scope, ma presenta aree di miglioramento per evoluzione enterprise.

**Stato Attuale**: Sistema maturo con architettura solida  
**Obiettivo**: Eliminare duplicazioni, standardizzare error handling, migliorare manutenibilità

---

## 🚨 **Criticità Priorità ALTA - Refactoring Necessario**

### **1. Error Handling Inconsistente**

#### **Problema Attuale**
```javascript
// Mix di strategie di gestione errori
updateUsersDB(array);          // Lancia eccezioni
updateUserUsername(username);  // Non gestisce errori di validazione  
retrieveRegisteredUsers();     // Usa alert() direttamente
```

#### **Impatto**
- Debugging difficile e inconsistente
- UX frammentata per l'utente finale  
- Testing automatico problematico
- Tight coupling business logic ↔ UI

#### **Soluzione Proposta**
```javascript
// Implementare classe custom per errori
export class UserManagerError extends Error {
    constructor(type, message, details = null) {
        super(message);
        this.name = 'UserManagerError';
        this.type = type; // 'VALIDATION', 'STORAGE', 'AUTH', 'NOT_FOUND'
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

// Standardizzare pattern di ritorno
export function updateUserUsername(newUsername) {
    try {
        if (!authUsername(newUsername)) {
            throw new UserManagerError('VALIDATION', 'Username already in use', {username: newUsername});
        }
        // ... logica di update
        return { success: true, data: updatedUser };
    } catch (error) {
        return { success: false, error: error.message, type: error.type };
    }
}

// Delegate error display to UI layer
function handleUserError(error) {
    switch(error.type) {
        case 'VALIDATION': alert(`Errore di validazione: ${error.message}`); break;
        case 'STORAGE': alert(`Errore di storage: ${error.message}`); break;
        default: alert(`Errore: ${error.message}`);
    }
}
```

#### **Files da Modificare**
- `usersManagement.js` - Implementare UserManagerError e standardizzare returns
- `modif.js`, `login.js`, `singin.js` - Aggiornare handling degli errori
- `validate.js` - Opzionale: integrare con nuovo sistema errori

---

### **2. Duplicazione Codice Boilerplate**

#### **Problema Attuale**
```javascript
// Pattern ripetuto in TUTTE le funzioni di update
export function updateUserUsername(newUsername) {
    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.id === getLoggedUserId());
    if(index > -1) { actualRegUsersArray[index].username = newUsername; }
    updateUsersDB(actualRegUsersArray);
}

export function updateUserEmail(newEmail) {
    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.id === getLoggedUserId());
    if(index > -1) { actualRegUsersArray[index].email = newEmail; }
    updateUsersDB(actualRegUsersArray);
}
// ... stesso pattern per updateUserPassword
```

#### **Impatto**
- **Manutenibilità ridotta**: modifiche vanno replicate in N funzioni
- **Rischio bug**: inconsistenze tra implementazioni simili  
- **Violazione DRY principle**: codice duplicato ovunque

#### **Soluzione Proposta**
```javascript
// Funzione generica per update campi utente
function updateCurrentUserField(fieldName, newValue, validator = null, preprocessor = null) {
    try {
        // Validazione opzionale
        if (validator && !validator(newValue)) {
            throw new UserManagerError('VALIDATION', `Invalid ${fieldName}: already in use`);
        }

        // Preprocessing opzionale (es. hashing password)
        const finalValue = preprocessor ? await preprocessor(newValue) : newValue;

        // Pattern atomico centralizzato
        const actualRegUsersArray = retrieveRegisteredUsers() || [];
        const index = actualRegUsersArray.findIndex(item => item.id === getLoggedUserId());
        
        if (index === -1) {
            throw new UserManagerError('NOT_FOUND', 'Current user not found in database');
        }

        actualRegUsersArray[index][fieldName] = finalValue;
        updateUsersDB(actualRegUsersArray);
        
        return { success: true, data: actualRegUsersArray[index] };
    } catch (error) {
        throw error; // Re-throw per handling upstream
    }
}

// Funzioni specifiche semplificate
export async function updateUserUsername(newUsername) {
    return updateCurrentUserField('username', newUsername, authUsername);
}

export async function updateUserEmail(newEmail) {
    return updateCurrentUserField('email', newEmail, authEmail);
}

export async function updateUserPassword(newPassword) {
    return updateCurrentUserField('password', newPassword, null, hashString);
}
```

#### **Benefici**
- **Singolo punto di manutenzione** per logica di update
- **Consistenza garantita** tra tutte le operazioni
- **Estendibilità facile** per nuovi campi utente
- **Testing centralizzato** della logica core

---

### **3. Breaking Changes nell'API**

#### **Problema Attuale**
```javascript
// PRIMA della refactor:
const foundId = searchUserbyName(username); // Restituiva string|null (ID)

// DOPO la refactor:
const foundUser = searchUserbyName(username); // Restituisce object|null
const foundId = foundUser.id; // Richiede step aggiuntivo
```

#### **Impatto**
- **Codice esistente deve essere aggiornato** in tutti i punti di chiamata
- **Rischio regressioni** se alcuni aggiornamenti vengono dimenticati
- **API inconsistente** con pattern precedenti

#### **Soluzione Proposta**
```javascript
// Mantenere retrocompatibilità con versioning delle API
export function searchUserbyName(username) {
    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    const index = actualRegUsersArray.findIndex(item => item.username === username);
    
    if (index < 0) return null;
    return structuredClone(actualRegUsersArray[index]);
}

// Aggiungere funzione specifica per ID (backward compatibility)
export function searchUserIdByName(username) {
    const user = searchUserbyName(username);
    return user ? user.id : null;
}

// Oppure: Pattern uniforme per tutte le funzioni di ricerca
export function findUser({ username, email, id }) {
    const actualRegUsersArray = retrieveRegisteredUsers() || [];
    
    let user = null;
    if (username) user = actualRegUsersArray.find(item => item.username === username);
    else if (email) user = actualRegUsersArray.find(item => item.email === email);
    else if (id) user = actualRegUsersArray.find(item => item.id === id);
    
    return user ? structuredClone(user) : null;
}
```

---

## ⚠️ **Criticità Priorità MEDIA - Miglioramenti Architetturali**

### **4. Tight Coupling Business-UI**

#### **Problema**
```javascript
// usersManagement.js NON dovrebbe sapere dell'esistenza di alert()
function retrieveRegisteredUsers() {
    try {
        // ... logica
    } catch(err) {
        alert("Errore di lettura nel database: " + err.message); // ❌ Tight coupling
    }
}
```

#### **Soluzione**
```javascript
// Event-based error reporting
class UserManagerEventEmitter extends EventTarget {
    emitError(error) {
        this.dispatchEvent(new CustomEvent('user-error', { detail: error }));
    }
}

export const userManager = new UserManagerEventEmitter();

// In UI files:
userManager.addEventListener('user-error', (event) => {
    alert(`Errore: ${event.detail.message}`);
});
```

### **5. State Management Subottimale**

#### **Problema**
```javascript
// Variabile cache mai utilizzata efficacemente
let registeredUsers = []; // Complessità aggiunta senza benefici reali
```

#### **Soluzioni Alternative**
1. **Rimuovere completamente** la cache per semplificare
2. **Implementare vera cache** con invalidation mechanisms
3. **Lazy loading** con time-based expiration

---

## 🔄 **Priorità BASSA - Ottimizzazioni Future**

### **6. Performance vs Consistency Trade-off**
- Valutare cache intelligente per dataset grandi
- Implementare batching per operazioni multiple
- Considerare Web Workers per operazioni pesanti

### **7. API Consistency**
- Standardizzare naming conventions
- Pattern uniforme per tutti i return values
- TypeScript definitions per robustezza

---

## 📅 **Piano di Implementazione Suggerito**

### **Fase 1: Error Handling (1-2 giorni)**
1. Implementare `UserManagerError` class
2. Refactor `updateUsersDB` e funzioni storage
3. Aggiornare UI layer per nuovo error handling

### **Fase 2: DRY Refactoring (1 giorno)**
1. Implementare `updateCurrentUserField` generica
2. Refactor funzioni di update esistenti
3. Testing delle nuove implementazioni

### **Fase 3: API Cleanup (mezza giornata)**
1. Aggiungere funzioni di compatibilità
2. Documentare breaking changes
3. Opzionale: implementare `findUser` unificata

### **Fase 4: Decoupling (opzionale)**
1. Event-based error system
2. Rimozione/ottimizzazione cache
3. Performance improvements

---

## 🧪 **Testing Checklist**

Dopo ogni fase di refactoring, verificare:

- [ ] **Registrazione utente** funziona correttamente
- [ ] **Login/logout** mantiene comportamento originale  
- [ ] **Modifica profilo** (username, email, password) operativa
- [ ] **Eliminazione account** funziona
- [ ] **Gestione errori** consistente e user-friendly
- [ ] **Validazione form** invariata
- [ ] **Persistenza localStorage** preservata

---

## 💡 **Note Finali**

- **Il sistema attuale è già production-ready** - questi sono miglioramenti di qualità
- **Prioritizzare in base al tempo disponibile** - Fase 1 e 2 danno il massimo beneficio
- **Mantenere backup** prima di iniziare refactoring sostanziali  
- **Testing incrementale** dopo ogni modifica per evitare regressioni

**Prossimo step**: Scegliere una criticità da priorità ALTA e iniziare con piccole modifiche incrementali.
