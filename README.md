# ShowRoom - BE + FE (JSX) + PostgreSQL

Mini salone di automobili. Struttura e impostazioni riprese dal progetto base Biblioteca.

| Parte | Tecnologia | In locale | Su Render |
|---|---|---|---|
| Backend | Spring Boot 4.1.1, Java 25, Maven wrapper | `be` sulla 8080 | Web Service (Docker) |
| Frontend | React 19, Vite, JavaScript (JSX), Tailwind 4 | `fe` sulla 5173 | Static Site |
| Database | PostgreSQL | locale sulla 5432 | Render PostgreSQL |

## Endpoint

| Metodo | Percorso | Cosa fa |
|---|---|---|
| GET | `/api/stato` | nome del database collegato e ora del server |
| GET | `/actuator/health` | health check per Render |
| POST | `/api/user/login` | credenziali -> JWT |
| POST | `/api/user/register` | registrazione (ruolo User assegnato dal server) |
| POST | `/api/user/logout` | revoca il JWT della richiesta |
| POST | `/api/user/refresh` | revoca il JWT e ne emette uno nuovo |
| GET | `/api/user/me` | dati dell'utente del JWT, senza password |
| DELETE | `/api/user/me` | elimina l'account: avvisi, preferiti e sessioni spariscono con lui |

### Catalogo

| Metodo | Percorso | Chi | Cosa fa |
|---|---|---|---|
| GET | `/api/auto` | tutti | catalogo pubblico, filtri e ordinamento; le bozze restano fuori |
| GET | `/api/auto/{id}` | tutti | dettaglio; una bozza risponde 404 |
| GET | `/api/marche` | tutti | elenco marche per i filtri |
| GET | `/api/auto/admin` | Admin | come il catalogo, ma con bozze e prezzo d'acquisto |
| GET | `/api/auto/admin/{id}` | Admin | dettaglio con prezzo d'acquisto |
| POST | `/api/auto` | Admin | nuova auto, nasce sempre come bozza |
| PATCH | `/api/auto/{id}` | Admin | modifica, compreso pubblicare (`bozza: false`) |
| PATCH | `/api/auto/{id}/prezzo` | Admin | cambia il prezzo; se scende puo' far partire gli avvisi |
| POST | `/api/marche` | Admin | nuova marca |

Filtri di `/api/auto`: `q`, `modello`, `marcaId`, `alimentazione`, `annoDa`, `annoA`,
`prezzoMin`, `prezzoMax`, `kmMax`. Ordinamento con `sort=<campo>,<asc|desc>` scelto
fra `prezzo`, `modello`, `marca`, `annoImmatricolazione`, `chilometraggio`,
`alimentazione`, `createdAt`: qualsiasi altro campo risponde 400.

### Preferiti e avvisi

| Metodo | Percorso | Chi | Cosa fa |
|---|---|---|---|
| GET | `/api/preferiti` | utente | i propri preferiti |
| POST | `/api/preferiti` | utente | aggiunge un'auto ai preferiti |
| DELETE | `/api/preferiti/{id}` | utente | toglie un preferito |
| GET | `/api/avvisi` | utente | i propri avvisi di prezzo |
| GET | `/api/avvisi/{id}` | utente | dettaglio di un proprio avviso |
| POST | `/api/avvisi` | utente | fissa una soglia su un'auto |
| PATCH | `/api/avvisi/{id}` | utente | cambia la soglia e rimette l'avviso in attesa |
| DELETE | `/api/avvisi/{id}` | utente | elimina un avviso |
| POST | `/api/avvisi/disattiva?token=` | tutti | link della mail, token monouso |

Preferiti e avvisi si cercano per identificativo **e** proprietario: quello di un
altro utente risponde 404, non 403.

## Come parte una mail di avviso

Un avviso ha **tre traguardi indipendenti**, ciascuno con il suo segno "gia'
inviato" e la sua mail: la fascia di mille che contiene la soglia, la soglia
esatta, e la vendita dell'auto. Ogni segno si alza una volta sola e non torna
mai indietro.

1. L'amministratore salva un prezzo piu' basso. `AutoService` pubblica
   `PrezzoRibassatoEvent` e la richiesta HTTP si chiude subito.
2. `AvvisoListener` lo riceve con `@TransactionalEventListener(AFTER_COMMIT)` e
   `@Async`: **dopo** il commit, e su un thread suo. Se il salvataggio fallisce
   non parte niente, e chi ha salvato non resta ad aspettare Gmail.
3. Due query indipendenti cercano gli avvisi attraversati:
   - `daNotificare`: `soglia < prezzoVecchio AND soglia >= prezzoNuovo`
     (soglia esatta raggiunta);
   - `daNotificarePerFascia`: `FLOOR(soglia / 1000) * 1000 + 1000 <
     prezzoVecchio AND ... >= prezzoNuovo` (il prezzo e' appena entrato nella
     fascia di mille della soglia, es. soglia 4500 -> avviso anticipato appena
     si scende sotto 5000). La fascia e' fissa rispetto alla soglia scelta, non
     al prezzo di partenza dell'auto, e non si ricalcola scendendo attraverso
     piu' fasce.
   Chi era gia' sotto la fascia o la soglia non rientra, quindi riabbassare
   ancora il prezzo non manda una seconda mail per lo stesso traguardo; le due
   mail (fascia e soglia) restano pero' indipendenti fra loro.
4. Il segno si prende con un solo UPDATE condizionato per traguardo:
   `SET inviato = true WHERE id = ? AND inviato = false` (idem per
   `fascia_inviata`). Fra due modifiche ravvicinate, solo la richiesta che
   aggiorna davvero la riga ottiene 1 e spedisce; l'altra ottiene 0 e si ferma.
5. Quando l'amministratore segna un'auto come `VENDUTA`, `AutoService` pubblica
   `AutoVendutaEvent` (solo se lo stato precedente non era gia' `VENDUTA`).
   `AvvisoListener.allaVendita` prende in carico chi ha ancora un avviso attivo
   su quell'auto (`venduta_inviata = false`) e lo avvisa che non e' piu'
   disponibile, cosi' non resta ad aspettare un ribasso che non arrivera' piu'.
6. Nel link c'e' un token casuale di 32 byte, non l'id dell'avviso, e a database
   ne resta solo l'hash. Vale una volta sola: dopo l'uso viene cancellato.

**Se Gmail non risponde, l'avviso torna da inviare** (`rimettiInAttesa`, per il
solo traguardo che ha fallito: soglia, fascia o vendita). Fra perdere la mail e
rischiare un doppione si e' scelto il doppione: una soglia di prezzo serve a
non lasciarsi sfuggire l'occasione, e un avviso consumato da un invio fallito
non avviserebbe mai piu' nessuno, in silenzio. Il doppione capita solo se
Gmail ha accettato il messaggio ma ha risposto con un errore, ed e' un
fastidio, non un danno.

Cambiare la soglia di un avviso rimette in attesa sia `inviato` che
`fascia_inviata` (la fascia dipende dalla soglia scelta). `venduta_inviata`
invece non si tocca mai in quel punto: non dipende dal prezzo, dipende solo
dall'auto essere stata venduta o no.

Con `MAIL_USERNAME` vuoto l'invio e' disattivato e gli avvisi **non** vengono
consumati: restano in attesa di una configurazione valida.

Nel corpo HTML della mail ogni valore passa da `Html.escape`: nome dell'utente e
modello dell'auto sono testo scritto da qualcuno. L'oggetto no, perche' non e'
HTML e scaparlo mostrerebbe `&lt;` al destinatario.

### Limite noto: SMTP sul piano gratuito di Render

In locale l'invio funziona ed e' stato verificato con una mail vera ricevuta
davvero. Sul piano gratuito di Render, lo stesso codice fallisce sempre con
`MailConnectException: Couldn't connect to host, port: smtp.gmail.com, 587`:
il traffico SMTP in uscita (porte 25/587/465) e' bloccato a livello di rete
dall'hosting gratuito, una misura comune contro lo spam sui piani free di
diverse piattaforme cloud. Non e' un problema di credenziali ne' di codice:
la connessione fallisce prima ancora che parta un tentativo di autenticazione,
e lo stesso identico codice funziona senza modifiche appena c'e' una rete che
non blocca quelle porte (in locale, o su un piano Render a pagamento).

Il meccanismo di sicurezza descritto sopra (`rimettiInAttesa`) e' proprio
quello che tiene l'avviso "in attesa" invece di perderlo quando questo accade:
appena l'invio torna possibile, il primo ribasso di prezzo successivo lo
consegna.

### Lista di marche curata invece di un'API esterna

Per far scegliere una marca gia' nota all'amministratore, senza pero' impedirgli
di aggiungerne una nuova, si era valutata un'API esterna con l'elenco completo
delle marche automobilistiche. Il registro americano NHTSA vPIC, filtrato sui
soli veicoli di tipo "car" (`GetMakesForVehicleType/car`), e' gratuito e senza
chiave, ma resta un registro di immatricolazioni USA: mancano marche europee
comuni per un salone italiano (Skoda, SEAT, Citroen, Land Rover, Jeep), mentre
compaiono decine di voci irrilevanti (piccoli produttori di kit-car, carrozzerie
artigianali americane).

Per questo si e' scelto un elenco statico e curato (`fe/src/lib/marcheNote.js`,
circa 70 marche), usato solo come suggerimento nel campo "Nuova marca" tramite
un `<datalist>` HTML. Il campo resta di testo libero: l'amministratore puo'
sempre scrivere una marca non presente in elenco, per quando ne esce una nuova
sul mercato. Niente dipendenza da un servizio esterno che puo' sparire o
cambiare condizioni, come gia' successo con altre API di terze parti valutate
per il progetto (ricerca immagini: diversi servizi gratuiti provati erano
morti, con filigrana, o non coprivano i modelli europei).

### Foto dell'auto salvata nel database, non su disco

L'amministratore puo' caricare una foto vera dell'auto (`POST /api/auto/{id}/foto`,
PNG/JPEG/WEBP, max 30MB). Il formato si riconosce dai primi byte del file (il
"magic number", es. `0x89 PNG` per un PNG), non dal `Content-Type` dichiarato
dal client: quello lo decide il browser che manda la richiesta, e si falsifica
banalmente.

La foto e' salvata come `bytea` direttamente nel database (colonne `foto` e
`foto_content_type` su `Auto`), non su disco: su Render il filesystem del
container e' effimero e viene ricreato a ogni deploy (nessun volume persistente
in `render.yaml`), quindi un file scritto su disco andrebbe perso al primo
riavvio. Il database invece persiste, senza introdurre ne' un servizio di
storage esterno ne' un disco a pagamento.

Se l'amministratore non carica nulla, `AutoResponse`/`AutoAdminResponse`
restituiscono `haFoto: false` e il frontend mostra comunque una foto generica
del modello, cercata in automatico (vedi sopra). Appena una foto vera viene
caricata ha sempre la precedenza (`fe/src/lib/immagini.js`).

## Avvio in locale

1. PostgreSQL sulla 5432 e database creato:
   ```
   createdb -U postgres showroom
   ```
   Credenziali diverse da `postgres` / `postgres`: copiare `be/.env.example` in `be/.env`
   e compilare `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `SUPERUSER_*`.
2. Doppio clic su `avvia.cmd`, oppure:
   ```
   cd be && .\mvnw.cmd spring-boot:run
   cd fe && npm install && npm run dev
   ```
3. http://localhost:5173 - il riquadro deve mostrare `showroom`.

## Deploy su Render

1. Repository Git con `be/`, `fe/`, `render.yaml` nella radice.
2. **New > Blueprint**, si sceglie la repo: nascono `showroom-db`, `showroom-be`, `showroom-fe`.
3. Dopo la prima build si impostano le variabili `sync: false` (URL senza `/` finale):

   | Servizio | Variabile | Valore |
   |---|---|---|
   | `showroom-be` | `ALLOWED_ORIGIN` | `https://showroom-fe.onrender.com` |
   | `showroom-be` | `FRONTEND_URL` | `https://showroom-fe.onrender.com` (link nelle mail) |
   | `showroom-be` | `SUPERUSER_EMAIL` | email del SuperUser |
   | `showroom-be` | `SUPERUSER_PASSWORD` | password del SuperUser |
   | `showroom-be` | `MAIL_USERNAME` | indirizzo Gmail che spedisce gli avvisi |
   | `showroom-be` | `MAIL_PASSWORD` | password per le app di Gmail (16 caratteri) |
   | `showroom-fe` | `VITE_API_URL` | `https://showroom-be.onrender.com` |

   `JWT_SECRET` e' generata da Render. `MAIL_PASSWORD` non va mai scritta in
   `application.properties`, neanche come valore di ripiego.

4. **Manual Deploy** di entrambi (`VITE_API_URL` e' letta in fase di build).

## Struttura

```
render.yaml                 blueprint: database + backend + frontend
avvia.cmd                   avvio locale
be/
  Dockerfile                usato solo da Render
  .env.example              variabili locali (copiare in .env)
  src/main/java/org/example/showroom/
    ShowRoomApplication.java
    config/DatabaseUrl.java      DATABASE_URL -> formato JDBC
    config/DataInitializer.java  ruoli e SuperUser all'avvio
    config/PasswordConfig.java   BCrypt
    security/SecurityConfig.java JWT + CORS (origini da ALLOWED_ORIGIN)
    security/TokenHasher.java    nel DB solo l'hash del JWT
    security/TokenRevocationValidator.java
    controllers/                 UserController + StatoController (prova)
    services/ repositories/ entities/ dto/ exceptions/
  src/main/resources/application.properties
fe/
  src/lib/api.js            base delle fetch e token, da VITE_API_URL
  src/lib/auth.jsx          chi e' collegato; il ruolo lo dice /api/user/me
  src/App.jsx               percorsi + piede con Privacy e Cookie
  src/components/           Header, AutoCard, Paginazione, Messaggio
  src/pages/
    Catalogo.jsx            ricerca, filtri, ordinamento da elenco chiuso
    DettaglioAuto.jsx       scheda, preferito, soglia di prezzo
    Login.jsx  Registrazione.jsx  Profilo.jsx
    Preferiti.jsx  Avvisi.jsx
    DisattivaAvviso.jsx     arrivo del link nella mail, senza accesso
    AdminAuto.jsx           bozze, prezzo d'acquisto, cambio prezzo
    Privacy.jsx  Cookie.jsx
  .env.example
```

Nessun valore viene reso come HTML: niente `dangerouslySetInnerHTML`, nemmeno per
la descrizione dell'auto. JSX fa l'escape da solo e si lascia che lo faccia.

Le pagine protette (`Protetta` in `App.jsx`) sono una comodita' per chi naviga,
non una difesa: a decidere chi puo' fare che cosa e' `@PreAuthorize` sul backend.
