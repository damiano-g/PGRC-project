# 📊 SSRI-PWM - Schemi Visuali Workflow & Dipendenze Tecniche

---

## 1️⃣ Workflow Utente (Flowchart semplificato)

```
[Homepage]
   |
   |--[Ricerca Ricetta]----------------------|
   |                                         |
   |                                         v
   |--[Categorie Ricette]---->[Landing]---->[Search]
   |                                         |
   |                                         v
   |--[Area Personale]-------------------->[Login/SignIn]
   |                                         |
   |                                         v
   |--[Dettaglio Ricetta]<----------------[Recipe-Details]
   |         |                                  |
   |         |--[Aggiungi/Rimuovi Preferiti]     |
   |         |--[Aggiungi/Rimuovi Recensione]    |
   |         |--[Aggiungi/Rimuovi Nota]          |
   |                                             v
   |--[Area Personale]<----------------------[Favourites]
   |         |                                  |
   |         |--[Visualizza Preferiti]           |
   |         |--[Visualizza Recensioni]          |
   |         |--[Visualizza Note]                |
   |                                             v
   |--[Modifica Profilo]<-------------------[settings]
```

---

## 2️⃣ Dipendenze Moduli JS (Modular Dependency Graph)

```
[data-models.js] <-----------------------------+
      |                                        |
      v                                        |
[usersManagement.js] <-----+                   |
      |                   |                    |
      v                   |                    |
[reviewsManagement.js]    |                    |
      |                   |                    |
      v                   |                    |
[UI.js] <-----------------+                    |
      |                                        |
      v                                        |
[pages-scripts/*.js]---------------------------+
      |                                        |
      v                                        |
[recipesAPI.js]                                |
      |                                        |
      v                                        |
[storageManagement.js]                         |
      |                                        |
      v                                        |
[validate.js]                                  |
      |                                        |
      v                                        |
[errorsManagement.js]--------------------------+
```

**Legenda:**  
Le frecce indicano "importa da" o "dipende da".  
I file in `pages-scripts/` orchestrano la logica delle singole pagine e usano i moduli business.

---

## 3️⃣ Flusso Tecnico Ricetta/Recensione/Preferito

```
[Utente Interagisce con UI]
        |
        v
[pages-scripts/recipe-details.js]
        |
        v
[usersManagement.js] <--- Gestione preferiti/notes
        |
        v
[reviewsManagement.js] <--- Gestione recensioni
        |
        v
[storageManagement.js] <--- Salvataggio locale
        |
        v
[data-models.js] <--- Normalizzazione dati
        |
        v
[UI.js] <--- Rendering card/progress bar/note
```

---

## 4️⃣ Relazioni Dati (Entity Relationship semplificato)

```
[User] 1---* [Review] *---1 [Recipe]
   |                |
   |                *---1 [Note]
   *---* [Favourite] (array di id ricette)
```

---

**Questi schemi riassumono i flussi di lavoro, le dipendenze tecniche e le relazioni tra dati del progetto SSRI-PWM.**