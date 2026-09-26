import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Messaggio from '@/components/Messaggio'
import Paginazione from '@/components/Paginazione'
import { api } from '@/lib/api'
import { alimentazione, euro, km } from '@/lib/formato'

export default function Preferiti() {
  const [pagina, setPagina] = useState(0)
  const [risultato, setRisultato] = useState(null)
  const [errore, setErrore] = useState(null)

  const carica = useCallback(() => {
    api
      .preferiti(pagina)
      .then((dati) => {
        setRisultato(dati)
        setErrore(null)
      })
      .catch((e) => setErrore(e.message))
  }, [pagina])

  useEffect(carica, [carica])

  async function rimuovi(id) {
    try {
      await api.rimuoviPreferito(id)
      carica()
    } catch (e) {
      setErrore(e.message)
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-black uppercase tracking-tight">I tuoi preferiti</h1>

      <div className="mt-4">
        <Messaggio>{errore}</Messaggio>
      </div>

      {risultato && risultato.content.length === 0 && (
        <p className="mt-6 rounded-lg border border-app-border bg-white p-6 text-center text-sm text-app-muted">
          Non hai ancora salvato nessuna auto.{' '}
          <Link to="/" className="font-medium text-app-fg underline">
            Vai al catalogo
          </Link>
          .
        </p>
      )}

      <div className="mt-6 space-y-3">
        {risultato?.content.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-app-border bg-white p-4"
          >
            <div className="min-w-0 flex-1">
              <Link to={`/auto/${p.auto.id}`} className="font-display font-bold hover:underline">
                {p.auto.marca} {p.auto.modello}
              </Link>
              <div className="mt-0.5 font-mono text-xs uppercase tracking-wider text-app-muted">
                {p.auto.annoImmatricolazione} · {km(p.auto.chilometraggio)} ·{' '}
                {alimentazione(p.auto.alimentazione)}
              </div>
            </div>
            <div className="font-display font-bold">{euro(p.auto.prezzo)}</div>
            <button
              onClick={() => rimuovi(p.id)}
              className="rounded-lg border border-app-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider hover:border-app-fg"
            >
              Rimuovi
            </button>
          </div>
        ))}
      </div>

      {risultato && (
        <Paginazione pagina={risultato.page} totalePagine={risultato.totalPages} onCambia={setPagina} />
      )}
    </div>
  )
}
