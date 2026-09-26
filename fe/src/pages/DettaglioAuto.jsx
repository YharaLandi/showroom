import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Messaggio from '@/components/Messaggio'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { alimentazione, cilindrata, euro, km, potenza } from '@/lib/formato'
import { useImmagineAuto } from '@/lib/immagini'

export default function DettaglioAuto() {
  const { id } = useParams()
  const { collegato } = useAuth()
  const [auto, setAuto] = useState(null)
  const [errore, setErrore] = useState(null)
  const [esito, setEsito] = useState(null)
  const [soglia, setSoglia] = useState('')

  // Prima dei return anticipati qui sotto: gli hook non possono essere
  // condizionali. Con auto ancora null la guardia dentro cercaImmagineAuto
  // evita la chiamata di rete finche' non arriva davvero.
  const immagine = useImmagineAuto(auto?.marca, auto?.modello, auto?.haFoto ? api.urlFoto(auto.id) : null)

  useEffect(() => {
    api
      .auto(id)
      .then(setAuto)
      .catch((e) => setErrore(e.stato === 404 ? 'Auto non trovata.' : e.message))
  }, [id])

  async function aggiungiPreferito() {
    setEsito(null)
    try {
      await api.aggiungiPreferito(id)
      setEsito({ tipo: 'ok', testo: 'Aggiunta ai preferiti.' })
    } catch (e) {
      setEsito({ tipo: 'errore', testo: e.stato === 409 ? 'Era gia' + '’' + ' fra i preferiti.' : e.message })
    }
  }

  async function creaAvviso(evento) {
    evento.preventDefault()
    setEsito(null)
    try {
      await api.nuovoAvviso(id, Number(soglia))
      setEsito({ tipo: 'ok', testo: `Ti avviseremo quando il prezzo scende a ${euro(soglia)} o meno.` })
      setSoglia('')
    } catch (e) {
      setEsito({ tipo: 'errore', testo: e.stato === 409 ? 'Hai gia' + '’' + ' un avviso su questa auto.' : e.message })
    }
  }

  if (errore) {
    return (
      <div>
        <Messaggio>{errore}</Messaggio>
        <Link to="/" className="mt-4 inline-block text-sm text-app-muted hover:underline">
          Torna al catalogo
        </Link>
      </div>
    )
  }

  if (!auto) return <p className="text-sm text-app-muted">Caricamento...</p>

  return (
    <div className="max-w-3xl">
      <Link to="/" className="font-mono text-xs uppercase tracking-wider text-app-muted hover:text-app-fg">
        &larr; Torna al catalogo
      </Link>

      <div className="mt-3 aspect-[16/9] overflow-hidden rounded-lg bg-app-border/40">
        {immagine.caricamento ? (
          <div className="h-full w-full animate-pulse bg-app-border/60" />
        ) : immagine.src ? (
          <img
            src={immagine.src}
            alt={`${auto.marca} ${auto.modello}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-app-fg to-app-draft">
            <span className="font-mono text-sm font-medium uppercase tracking-wider text-white/70">
              {auto.marca} {auto.modello}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 font-mono text-xs uppercase tracking-wider text-app-muted">{auto.marca}</div>
      <h1 className="mt-1 font-display text-2xl font-black uppercase tracking-tight">{auto.modello}</h1>
      <p className="mt-1 font-display text-3xl font-bold">{euro(auto.prezzo)}</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-app-border bg-white p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Anno</dt>
          <dd className="mt-0.5 font-display font-bold">{auto.annoImmatricolazione}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Chilometri</dt>
          <dd className="mt-0.5 font-display font-bold">{km(auto.chilometraggio)}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Alimentazione</dt>
          <dd className="mt-0.5 font-display font-bold">{alimentazione(auto.alimentazione)}</dd>
        </div>
        {/* Assente per le elettriche: niente riquadro vuoto al posto della cilindrata */}
        {cilindrata(auto.cilindrata) && (
          <div>
            <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Cilindrata</dt>
            <dd className="mt-0.5 font-display font-bold">{cilindrata(auto.cilindrata)}</dd>
          </div>
        )}
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Potenza</dt>
          <dd className="mt-0.5 font-display font-bold">{potenza(auto.potenza)}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Telaio</dt>
          <dd className="mt-0.5 font-mono text-xs">{auto.telaio}</dd>
        </div>
      </dl>

      {/* Testo, non HTML: la descrizione la scrive un amministratore e resta tale */}
      <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-app-fg/80">{auto.descrizione}</p>

      <div className="mt-6">
        {esito && <Messaggio tipo={esito.tipo}>{esito.testo}</Messaggio>}
      </div>

      {collegato ? (
        <div className="mt-4 rounded-lg border border-app-border bg-white p-4">
          <button
            onClick={aggiungiPreferito}
            className="rounded-lg border border-app-border px-3 py-2 font-mono text-xs uppercase tracking-wider hover:border-app-fg"
          >
            Aggiungi ai preferiti
          </button>

          <form onSubmit={creaAvviso} className="mt-4 border-t border-app-border pt-4">
            <label className="block text-sm font-medium">Avvisami quando il prezzo scende sotto</label>
            <p className="mt-0.5 text-xs text-app-muted">
              Riceverai una sola mail, quando il prezzo attraversa la soglia.
            </p>
            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min="1"
                step="1"
                required
                value={soglia}
                onChange={(e) => setSoglia(e.target.value)}
                placeholder="es. 7000"
                className="w-40 rounded-lg border border-app-border px-3 py-2 font-mono text-sm"
              />
              <button className="rounded-lg bg-app-fg px-3 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-app-fg-hover">
                Imposta avviso
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-app-border bg-app-bg p-4 text-sm text-app-muted">
          <Link to="/accedi" className="font-medium text-app-fg underline">
            Accedi
          </Link>{' '}
          per salvarla fra i preferiti o farti avvisare quando il prezzo scende.
        </p>
      )}
    </div>
  )
}
