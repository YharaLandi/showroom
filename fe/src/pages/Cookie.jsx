import { Link } from 'react-router-dom'

// Questo sito non usa cookie, ma usa il localStorage: e' comunque spazio sul
// dispositivo di chi naviga, quindi va dichiarato con lo stesso scrupolo.
export default function Cookie() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-black uppercase tracking-tight">Cookie Policy</h1>
      <p className="mt-1 text-sm text-app-muted">Che cosa resta nel tuo browser, e perché</p>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Questo sito non usa cookie</h2>
        <p className="mt-2 text-sm text-app-fg">
          Non impostiamo nessun cookie: né tecnici, né di statistica, né di profilazione. Non ci sono
          servizi di terze parti che ne impostino per conto nostro. Per questo non vedrai comparire
          nessun banner di consenso.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Usiamo però il localStorage</h2>
        <p className="mt-2 text-sm text-app-fg">
          Il localStorage è uno spazio del browser diverso dai cookie: non viene inviato
          automaticamente a ogni richiesta e resta sul tuo dispositivo. È comunque memoria che
          occupiamo sul tuo computer, quindi te la dichiariamo.
        </p>

        <div className="mt-4 overflow-hidden rounded-lg border border-app-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-app-border bg-app-bg text-app-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Voce</th>
                <th className="px-4 py-2 font-medium">A che serve</th>
                <th className="px-4 py-2 font-medium">Quanto dura</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-3 align-top font-mono text-xs">showroom.token</td>
                <td className="px-4 py-3 align-top text-app-fg">
                  Il token che dimostra chi sei dopo l{'’'}accesso. Senza, dovresti reinserire
                  la password a ogni pagina. Lo salviamo solo se ti registri e accedi.
                </td>
                <td className="px-4 py-3 align-top text-app-fg">
                  Finché non esci. Il token in sé scade comunque dopo un{'’'}ora.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Come liberartene</h2>
        <p className="mt-2 text-sm text-app-fg">
          Il modo più semplice è il pulsante <strong>Esci</strong>: cancella la voce dal browser e
          invalida il token anche sul nostro server, così non vale più nemmeno se qualcuno ne avesse
          una copia. In alternativa puoi cancellare i dati del sito dalle impostazioni del browser.
          Eliminando l{'’'}account sparisce tutto, da entrambe le parti.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-medium">Se non accedi</h2>
        <p className="mt-2 text-sm text-app-fg">
          Sfogliando il catalogo senza account non lasciamo nulla nel tuo browser.
        </p>
      </section>

      <p className="mt-8 text-sm text-app-muted">
        Vedi anche la{' '}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
