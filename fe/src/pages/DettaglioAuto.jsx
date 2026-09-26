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
  const immagine = useImmagineAuto(auto?.marca, auto?.modello)

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
      setEsito({ tipo: 'errore', testo: e.stato === 409 ? 'Era gia' + '\u2019' + ' fra i preferiti.' : e.message })
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
      setEsito({ tipo: 'errore', testo: e.stato === 409 ? 'Hai gia' + '\u2019' + ' un avviso su questa auto.' : e.message })
    }
  }

  if (errore) {
    return (
      <div>
        <Messaggio>{errore}</Messaggio>
        <Link to="/" className="mt-4 inline-block text-sm text-slate-600 hover:underline">
          Torna al catalogo
        </Link>
      </div>
    )
  }

  if (!auto) return <p className="text-sm text-slate-500">Caricamento...</p>

  return (
    <div className="max-w-3xl">
      <Link to="/" className="text-sm text-slate-600 hover:underline">
        Torna al catalogo
      </Link>

      <div className="mt-3 aspect-[16/9] overflow-hidden rounded-lg bg-slate-100">
        {immagine.caricamento ? (
          <div className="h-full w-full animate-pulse bg-slate-200" />
        ) : immagine.src ? (
          <img
            src={immagine.src}
            alt={`${auto.marca} ${auto.modello}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
            <span className="text-sm font-medium uppercase tracking-wide text-slate-300">
              {auto.marca} {auto.modello}
            </span>
          </div>
        )}
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {auto.marca} {auto.modello}
      </h1>
      <p className="mt-1 text-3xl font-semibold">{euro(auto.prezzo)}</p>

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500">Anno</dt>
          <dd className="mt-0.5 font-medium">{auto.annoImmatricolazione}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Chilometri</dt>
          <dd className="mt-0.5 font-medium">{km(auto.chilometraggio)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Alimentazione</dt>
          <dd className="mt-0.5 font-medium">{alimentazione(auto.alimentazione)}</dd>
        </div>
        {/* Assente per le elettriche: niente riquadro vuoto al posto della cilindrata */}
        {cilindrata(auto.cilindrata) && (
          <div>
            <dt className="text-slate-500">Cilindrata</dt>
            <dd className="mt-0.5 font-medium">{cilindrata(auto.cilindrata)}</dd>
          </div>
        )}
        <div>
          <dt className="text-slate-500">Potenza</dt>
          <dd className="mt-0.5 font-medium">{potenza(auto.potenza)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Telaio</dt>
          <dd className="mt-0.5 font-mono text-xs">{auto.telaio}</dd>
        </div>
      </dl>

      {/* Testo, non HTML: la descrizione la scrive un amministratore e resta tale */}
      <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-700">{auto.descrizione}</p>

      <div className="mt-6">
        {esito && <Messaggio tipo={esito.tipo}>{esito.testo}</Messaggio>}
      </div>

      {collegato ? (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <button
            onClick={aggiungiPreferito}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Aggiungi ai preferiti
          </button>

          <form onSubmit={creaAvviso} className="mt-4 border-t border-slate-200 pt-4">
            <label className="block text-sm font-medium">Avvisami quando il prezzo scende sotto</label>
            <p className="mt-0.5 text-xs text-slate-500">
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
                className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700">
                Imposta avviso
              </button>
            </div>
          </form>
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <Link to="/accedi" className="font-medium underline">
            Accedi
          </Link>{' '}
          per salvarla fra i preferiti o farti avvisare quando il prezzo scende.
        </p>
      )}
    </div>
  )
}
