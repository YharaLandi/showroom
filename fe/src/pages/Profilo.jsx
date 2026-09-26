import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Messaggio from '@/components/Messaggio'
import { api, dimenticaToken } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { data } from '@/lib/formato'

export default function Profilo() {
  const { utente } = useAuth()
  const navigate = useNavigate()
  const [conferma, setConferma] = useState(false)
  const [errore, setErrore] = useState(null)
  const [inCorso, setInCorso] = useState(false)

  async function elimina() {
    setErrore(null)
    setInCorso(true)
    try {
      await api.eliminaAccount()
      // Il token e' appena stato invalidato insieme all'account: si butta
      // e si ricarica la pagina, cosi' non resta niente in memoria.
      dimenticaToken()
      window.location.assign('/')
    } catch (e) {
      setErrore(e.message)
      setInCorso(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-black uppercase tracking-tight">Il tuo profilo</h1>

      <dl className="mt-6 space-y-3 rounded-lg border border-app-border bg-white p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Nome</dt>
          <dd className="font-medium">
            {utente.nome} {utente.cognome}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Email</dt>
          <dd className="font-medium">{utente.email}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Ruolo</dt>
          <dd className="font-medium">{utente.ruoli.join(', ')}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-mono text-xs uppercase tracking-wider text-app-muted">Iscritto dal</dt>
          <dd className="font-medium">{data(utente.createdAt)}</dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-app-muted">
        Questi sono tutti i dati che conserviamo su di te, oltre a preferiti e soglie. Il dettaglio
        completo e{'\u2019'} nella{' '}
        <Link to="/privacy" className="text-app-fg underline">
          Privacy Policy
        </Link>
        .
      </p>

      <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4">
        <h2 className="font-medium text-red-800">Elimina il mio account</h2>
        <p className="mt-1 text-sm text-red-700">
          Spariscono profilo, preferiti e avvisi. Da quel momento a questo indirizzo non parte
          piu{'\u2019'} nessuna mail. L{'\u2019'}operazione non si puo{'\u2019'} annullare.
        </p>

        <div className="mt-3">
          <Messaggio>{errore}</Messaggio>
        </div>

        {conferma ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={elimina}
              disabled={inCorso}
              className="rounded-lg bg-red-600 px-3 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50"
            >
              {inCorso ? 'Eliminazione...' : 'Si' + '\u2019' + ', elimina tutto'}
            </button>
            <button
              onClick={() => setConferma(false)}
              className="rounded-lg border border-app-border bg-white px-3 py-2 font-mono text-xs uppercase tracking-wider hover:bg-app-bg"
            >
              Annulla
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConferma(true)}
            className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 font-mono text-xs uppercase tracking-wider text-red-700 hover:bg-red-100"
          >
            Elimina il mio account
          </button>
        )}
      </div>
    </div>
  )
}
