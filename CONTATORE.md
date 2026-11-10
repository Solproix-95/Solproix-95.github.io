# Come accendere il contatore degli iscritti

Il sito ha già tutto il codice per mostrare "**N persone si sono già iscritte**".
Resta spento finché non colleghi un progetto Firebase (basta il piano base, Spark). Servono circa 10 minuti.

## 1. Crea il progetto
1. Vai su <https://console.firebase.google.com> e premi **Aggiungi progetto** (es. `nexus-lista`). Google Analytics non serve.
2. Nel menu a sinistra: **Build → Firestore Database → Crea database**. Scegli una località in Europa (es. `eur3`) e la **modalità produzione**.

## 2. Incolla le regole
In **Firestore → Regole** sostituisci tutto con questo e premi **Pubblica**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /iscritti/{id} {
      // si può solo aggiungere un'impronta (64 caratteri esadecimali) con la data, niente altro
      allow create: if id.matches('^[0-9a-f]{64}$')
                    && request.resource.data.keys().hasOnly(['creato'])
                    && request.resource.data.creato is timestamp;
      // serve per contare quante impronte ci sono
      allow list: if true;
      allow get, update, delete: if false;
    }
  }
}
```

## 3. Copia i due valori nel sito
1. **Impostazioni progetto** (rotellina) → **Generali** → in fondo **Aggiungi app → Web** (`</>`). Dai un nome qualsiasi, l'hosting non serve.
2. Dalla configurazione che appare copia `projectId` e `apiKey`.
3. In `index.html` cerca queste righe e incollali:

```js
const FIREBASE_PROJECT_ID = "nexus-lista";
const FIREBASE_API_KEY = "AIza...";
```

La `apiKey` di Firebase per il web non è una password: è fatta per stare nelle pagine. A proteggere i dati sono le regole del punto 2.

## 4. Soglia
Il numero compare solo quando gli iscritti sono almeno `SOGLIA_CONTATORE` (50 di partenza, sempre in `index.html`).
Puoi abbassarla o alzarla come preferisci.

## Da sapere
- Il contatore salva un'**impronta** dell'email (SHA-256), non l'email. Chi conosce già un indirizzo potrebbe però verificare se è nella lista, quindi trattala comunque come un dato personale (la pagina `privacy.html` lo dice già).
- Conta solo le iscrizioni arrivate **dopo** l'attivazione. Chi si è iscritto prima è già in MailerLite ma non nel contatore.
- In teoria qualcuno potrebbe gonfiare il numero con richieste false: è un contatore di vetrina, non una statistica.
