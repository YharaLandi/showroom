import { useEffect, useState } from 'react'
import AutoCard from '@/components/AutoCard'
import Messaggio from '@/components/Messaggio'
import Paginazione from '@/components/Paginazione'
import { api } from '@/lib/api'

// Gli stessi nomi che il backend accetta in SORT_CONSENTITI: qualunque altro
// valore riceverebbe 400, quindi qui si scelgono da un elenco chiuso.
const ORDINAMENTI = [
  { valore: 'createdAt,desc', etichetta: 'Ultime arrivate' },
  { valore: 'prezzo,asc', etichetta: 'Prezzo crescente' },
  { valore: 'prezzo,desc', etichetta: 'Prezzo decrescente' },
  { valore: 'chilometraggio,asc', etichetta: 'Meno chilometri' },
  { valore: 'annoImmatricolazione,desc', etichetta: 'Piu' + '\u2019' + ' recenti' },
  { valore: 'marca,asc', etichetta: 'Marca (A-Z)' },
]

const FILTRI_VUOTI = { q: '', marcaId: '', alimentazione: '', prezzoMax: '', kmMax: '' }

export default function Catalogo() {
  const [filtri, setFiltri] = useState(FILTRI_VUOTI)
  const [ordine, setOrdine] = useState('createdAt,desc')
  const [pagina, setPagina] = useState(0)
  const [risultato, setRisultato] = useState(null)
  const [marche, setMarche] = useState([])
  const [errore, setErrore] = useState(null)
  const [caricamento, setCaricamento] = useState(true)

  useEffect(() => {
    api.marche().then(setMarche).catch(() => setMarche([]))
  }, [])

  useEffect(() => {
    setCaricamento(true)
    api
      .catalogo({ ...filtri, sort: ordine, page: pagina, size: 12 })
      .then((dati) => {
        setRisultato(dati)
        setErrore(null)
      })
      .catch((e) => setErrore(e.message))
      .finally(() => setCaricamento(false))
  }, [filtri, ordine, pagina])

  // Cambiare un filtro riporta alla prima pagina: restare alla pagina 5 di un
  // risultato che ora ne ha 2 mostrerebbe una griglia vuota.
  function aggiorna(campo, valore) {
    setFiltri((f) => ({ ...f, [campo]: valore }))
    setPagina(0)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Le nostre auto</h1>
      <p className="mt-1 text-sm text-slate-600">
        Cerca fra le auto disponibili. Con un account puoi salvarle fra i preferiti e farti avvisare
        quando il prezzo scende.
      </p>

      <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm lg:col-span-2"
          placeholder="Marca, modello o descrizione"
          value={filtri.q}
          onChange={(e) => aggiorna('q', e.target.value)}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filtri.marcaId}
          onChange={(e) => aggiorna('marcaId', e.target.value)}
        >
          <option value="">Tutte le marche</option>
          {marche.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={filtri.alimentazione}
          onChange={(e) => aggiorna('alimentazione', e.target.value)}
        >
          <option value="">Ogni alimentazione</option>
          {['BENZINA', 'DIESEL', 'GPL', 'METANO', 'IBRIDA', 'ELETTRICA'].map((a) => (
            <option key={a} value={a}>
              {a.charAt(0) + a.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Prezzo max"
          value={filtri.prezzoMax}
          onChange={(e) => aggiorna('prezzoMax', e.target.value)}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={ordine}
          onChange={(e) => {
            setOrdine(e.target.value)
            setPagina(0)
          }}
        >
          {ORDINAMENTI.map((o) => (
            <option key={o.valore} value={o.valore}>
              {o.etichetta}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <Messaggio>{errore}</Messaggio>
      </div>

      {caricamento && <p className="mt-6 text-sm text-slate-500">Caricamento...</p>}

      {!caricamento && risultato && risultato.content.length === 0 && (
        <p className="mt-6 rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
          Nessuna auto corrisponde a questa ricerca.
        </p>
      )}

      {!caricamento && risultato && risultato.content.length > 0 && (
        <>
          <p className="mt-6 text-sm text-slate-500">
            {risultato.totalElements} auto in catalogo
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {risultato.content.map((auto) => (
              <AutoCard key={auto.id} auto={auto} />
            ))}
          </div>
          <Paginazione pagina={risultato.page} totalePagine={risultato.totalPages} onCambia={setPagina} />
        </>
      )}
    </div>
  )
}
