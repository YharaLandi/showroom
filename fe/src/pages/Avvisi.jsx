import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Messaggio from '@/components/Messaggio'
import Paginazione from '@/components/Paginazione'
import { api } from '@/lib/api'
import { euro } from '@/lib/formato'

export default function Avvisi() {
  const [pagina, setPagina] = useState(0)
  const [risultato, setRisultato] = useState(null)
  const [errore, setErrore] = useState(null)
  const [inModifica, setInModifica] = useState(null)
  const [nuovaSoglia, setNuovaSoglia] = useState('')

  const carica = useCallback(() => {
    api
      .avvisi(pagina)
      .then((dati) => {
        setRisultato(dati)
        setErrore(null)
      })
      .catch((e) => setErrore(e.message))
  }, [pagina])

  useEffect(carica, [carica])

  async function salvaSoglia(id) {
    try {
      await api.modificaAvviso(id, Number(nuovaSoglia))
      setInModifica(null)
      setNuovaSoglia('')
      carica()
    } catch (e) {
      setErrore(e.message)
    }
  }

  async function elimina(id) {
    try {
      await api.eliminaAvviso(id)
      carica()
    } catch (e) {
      setErrore(e.message)
    }
  }

  // L'ordine conta: venduta e disattivato sono stati definitivi e vincono su
  // tutto il resto; soglia raggiunta e' piu' avanti di "vicino alla soglia".
  function stato(a) {
    if (a.auto.stato === 'VENDUTA') return { testo: 'Venduta', classe: 'bg-app-border text-app-muted' }
    if (!a.attivo) return { testo: 'Disattivato', classe: 'bg-app-border text-app-muted' }
    if (a.inviato) return { testo: 'Soglia raggiunta', classe: 'bg-emerald-100 text-emerald-800' }
    if (a.fasciaInviata) return { testo: 'Vicino alla soglia', classe: 'bg-amber-100 text-amber-800' }
    return { testo: 'In attesa', classe: 'bg-app-accent/10 text-app-accent' }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-black uppercase tracking-tight">I tuoi avvisi di prezzo</h1>
      <p className="mt-1 text-sm text-app-muted">
        Ricevi una mail quando il prezzo entra nella fascia di mille della tua soglia, un{'’'}altra
        quando raggiunge esattamente la soglia, e una se l{'’'}auto viene venduta. Cambiare la soglia
        rimette l{'’'}avviso in attesa.
      </p>

      <div className="mt-4">
        <Messaggio>{errore}</Messaggio>
      </div>

      {risultato && risultato.content.length === 0 && (
        <p className="mt-6 rounded-lg border border-app-border bg-white p-6 text-center text-sm text-app-muted">
          Non hai avvisi attivi.{' '}
          <Link to="/" className="font-medium text-app-fg underline">
            Scegli un{'’'}auto dal catalogo
          </Link>
          .
        </p>
      )}

      <div className="mt-6 space-y-3">
        {risultato?.content.map((a) => {
          const s = stato(a)
          return (
            <div key={a.id} className="rounded-lg border border-app-border bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/auto/${a.auto.id}`} className="font-display font-bold hover:underline">
                    {a.auto.marca} {a.auto.modello}
                  </Link>
                  <div className="mt-0.5 font-mono text-xs uppercase tracking-wider text-app-muted">
                    Prezzo attuale {euro(a.auto.prezzo)} · soglia {euro(a.soglia)}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wider ${s.classe}`}
                >
                  {s.testo}
                </span>
              </div>

              {inModifica === a.id ? (
                <div className="mt-3 flex gap-2 border-t border-app-border pt-3">
                  <input
                    type="number"
                    min="1"
                    value={nuovaSoglia}
                    onChange={(e) => setNuovaSoglia(e.target.value)}
                    className="w-40 rounded-lg border border-app-border px-3 py-1.5 font-mono text-sm"
                  />
                  <button
                    onClick={() => salvaSoglia(a.id)}
                    className="rounded-lg bg-app-fg px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-white hover:bg-app-fg-hover"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => setInModifica(null)}
                    className="rounded-lg border border-app-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider hover:border-app-fg"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2 border-t border-app-border pt-3">
                  <button
                    onClick={() => {
                      setInModifica(a.id)
                      setNuovaSoglia(String(a.soglia))
                    }}
                    className="rounded-lg border border-app-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider hover:border-app-fg"
                  >
                    Cambia soglia
                  </button>
                  <button
                    onClick={() => elimina(a.id)}
                    className="rounded-lg border border-app-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider hover:border-app-fg"
                  >
                    Elimina
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {risultato && (
        <Paginazione pagina={risultato.page} totalePagine={risultato.totalPages} onCambia={setPagina} />
      )}
    </div>
  )
}
