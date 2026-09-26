import { Link } from 'react-router-dom'

// Descrive questa applicazione, non una qualsiasi: ogni riga corrisponde a una
// colonna che esiste davvero nel database. Se si aggiunge un dato, si aggiunge qui.
export default function Privacy() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-black uppercase tracking-tight">Privacy Policy</h1>
      <p className="mt-1 text-sm text-app-muted">ShowRoom &mdash; salone di automobili</p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Che cosa raccogliamo</h2>
        <p className="mt-2 text-sm text-app-fg">
          Se sfogli il catalogo senza registrarti non raccogliamo nulla su di te: niente account,
          niente profilazione, nessuna statistica di navigazione.
        </p>
        <p className="mt-3 text-sm text-app-fg">Se ti registri conserviamo:</p>
        <ul className="mt-2 space-y-2 text-sm text-app-fg">
          <li>
            <strong>Nome e cognome</strong> &mdash; per rivolgerci a te nelle pagine e nelle mail.
          </li>
          <li>
            <strong>Indirizzo email</strong> &mdash; è il tuo identificativo di accesso, ed è dove
            mandiamo gli avvisi di prezzo.
          </li>
          <li>
            <strong>Password</strong> &mdash; mai in chiaro. Conserviamo solo un{'’'}impronta
            calcolata con BCrypt, dalla quale la password originale non si ricava.
          </li>
          <li>
            <strong>Ruolo</strong> (utente o amministratore) &mdash; determina che cosa puoi fare.
          </li>
          <li>
            <strong>Data di iscrizione.</strong>
          </li>
          <li>
            <strong>Preferiti</strong> &mdash; quali auto hai salvato e quando.
          </li>
          <li>
            <strong>Avvisi di prezzo</strong> &mdash; per quale auto, quale soglia hai indicato, se
            la mail è già partita e se l{'’'}avviso è ancora attivo.
          </li>
          <li>
            <strong>Sessioni di accesso</strong> &mdash; un{'’'}impronta del token di accesso,
            con data di creazione e di scadenza. Serve a poterlo invalidare quando esci.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Che cosa non raccogliamo</h2>
        <p className="mt-2 text-sm text-app-fg">
          Non chiediamo né conserviamo indirizzo di casa, data di nascita, numero di telefono o dati
          di pagamento. Non usiamo strumenti di statistica o pubblicità, non registriamo il tuo
          indirizzo IP per profilarti e non cediamo i tuoi dati a nessuno.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Per quanto li teniamo</h2>
        <p className="mt-2 text-sm text-app-fg">
          Finché tieni l{'’'}account. I token di accesso scadono da soli dopo un{'’'}ora.
          Quando elimini l{'’'}account spariscono profilo, preferiti, avvisi e sessioni: da quel
          momento al tuo indirizzo non parte più nessuna mail.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Le mail che riceverai</h2>
        <p className="mt-2 text-sm text-app-fg">
          Solo quelle che hai chiesto tu: un messaggio quando il prezzo di un{'’'}auto che segui
          scende sotto la soglia che hai indicato. Una sola mail per avviso. In fondo a ogni
          messaggio c{'’'}è un link per disattivarlo senza dover accedere. Non mandiamo
          newsletter né comunicazioni commerciali.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">I tuoi diritti</h2>
        <ul className="mt-2 space-y-2 text-sm text-app-fg">
          <li>
            <strong>Vedere i tuoi dati:</strong> la pagina{' '}
            <Link to="/profilo" className="underline">
              Profilo
            </Link>{' '}
            mostra tutto quello che conserviamo su di te, e le pagine Preferiti e Avvisi mostrano il
            resto.
          </li>
          <li>
            <strong>Cancellarli:</strong> dal Profilo, con &laquo;Elimina il mio account&raquo;.
            È immediato e definitivo.
          </li>
          <li>
            <strong>Correggerli:</strong> questa versione non permette ancora di modificare nome ed
            email da sola. Per farlo, scrivi all{'’'}indirizzo qui sotto.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Contatti</h2>
        <p className="mt-2 text-sm text-app-fg">
          Per qualsiasi richiesta sui tuoi dati: <strong>privacy@showroom.example</strong>
        </p>
      </section>

      <p className="mt-8 text-sm text-app-muted">
        Vedi anche la{' '}
        <Link to="/cookie" className="underline">
          Cookie Policy
        </Link>
        .
      </p>
    </div>
  )
}
