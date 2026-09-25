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

  function stato(a) {
    if (!a.attivo) return { testo: 'Disattivato', classe: 'bg-slate-100 text-slate-600' }
    if (a.inviato) return { testo: 'Gia' + '\u2019' + ' avvisato', classe: 'bg-emerald-100 text-emerald-800' }
    return { testo: 'In attesa', classe: 'bg-amber-100 text-amber-800' }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">I tuoi avvisi di prezzo</h1>
      <p className="mt-1 text-sm text-slate-600">
        Per ogni auto ricevi una sola mail, quando il prezzo scende sotto la soglia. Cambiare la
        soglia rimette l{'\u2019'}avviso in attesa.
      </p>

      <div className="mt-4">
        <Messaggio>{errore}</Messaggio>
      </div>

      {risultato && risultato.content.length === 0 && (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          Non hai avvisi attivi.{' '}
          <Link to="/" className="font-medium underline">
            Scegli un{'\u2019'}auto dal catalogo
          </Link>
          .
        </p>
      )}

      <div className="mt-6 space-y-3">
        {risultato?.content.map((a) => {
          const s = stato(a)
          return (
            <div key={a.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/auto/${a.auto.id}`} className="font-medium hover:underline">
                    {a.auto.marca} {a.auto.modello}
                  </Link>
                  <div className="mt-0.5 text-sm text-slate-600">
                    Prezzo attuale {euro(a.auto.prezzo)} · soglia {euro(a.soglia)}
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.classe}`}>{s.testo}</span>
              </div>

              {inModifica === a.id ? (
                <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3">
                  <input
                    type="number"
                    min="1"
                    value={nuovaSoglia}
                    onChange={(e) => setNuovaSoglia(e.target.value)}
                    className="w-40 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => salvaSoglia(a.id)}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => setInModifica(null)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3">
                  <button
                    onClick={() => {
                      setInModifica(a.id)
                      setNuovaSoglia(String(a.soglia))
                    }}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                  >
                    Cambia soglia
                  </button>
                  <button
                    onClick={() => elimina(a.id)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
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
