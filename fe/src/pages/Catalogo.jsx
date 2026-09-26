import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AutoCard from '@/components/AutoCard'
import Messaggio from '@/components/Messaggio'
import Paginazione from '@/components/Paginazione'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { alimentazione as etichettaAlimentazione, euro, km, potenza as formatoPotenza } from '@/lib/formato'
import { useImmagineAuto } from '@/lib/immagini'

// Gli stessi nomi che il backend accetta in SORT_CONSENTITI: qualunque altro
// valore riceverebbe 400, quindi qui si scelgono da un elenco chiuso.
const ORDINAMENTI = [
  { valore: 'createdAt,desc', etichetta: 'Ultime arrivate' },
  { valore: 'prezzo,asc', etichetta: 'Prezzo crescente' },
  { valore: 'prezzo,desc', etichetta: 'Prezzo decrescente' },
  { valore: 'chilometraggio,asc', etichetta: 'Meno chilometri' },
  { valore: 'annoImmatricolazione,desc', etichetta: 'Piu' + '’' + ' recenti' },
  { valore: 'marca,asc', etichetta: 'Marca (A-Z)' },
]

const FILTRI_VUOTI = { q: '', marcaId: '', alimentazione: '', prezzoMax: '', kmMax: '' }

export default function Catalogo() {
  const { collegato } = useAuth()
  const navigate = useNavigate()

  const [filtri, setFiltri] = useState(FILTRI_VUOTI)
  const [ordine, setOrdine] = useState('createdAt,desc')
  const [pagina, setPagina] = useState(0)
  const [risultato, setRisultato] = useState(null)
  const [marche, setMarche] = useState([])
  const [errore, setErrore] = useState(null)
  const [caricamento, setCaricamento] = useState(true)

  const [inEvidenza, setInEvidenza] = useState(null)
  const [preferiti, setPreferiti] = useState({}) // { autoId: preferitoId }

  // Chiamato sempre, anche prima che inEvidenza arrivi: la guardia sta dentro
  // cercaImmagineAuto, che con marca/modello vuoti torna null senza chiamare la rete.
  const immagineHero = useImmagineAuto(inEvidenza?.marca, inEvidenza?.modello)

  useEffect(() => {
    api.marche().then(setMarche).catch(() => setMarche([]))
  }, [])

  // L'auto in evidenza e' sempre l'ultima arrivata, indipendente da filtri e
  // pagina: cosi' l'hero non salta quando si cerca o si cambia pagina sotto.
  useEffect(() => {
    api
      .catalogo({ sort: 'createdAt,desc', page: 0, size: 1 })
      .then((d) => setInEvidenza(d.content[0] ?? null))
      .catch(() => setInEvidenza(null))
  }, [])

  // Solo per sapere quali cuori mostrare pieni: prende la prima pagina dei
  // preferiti. Con piu' di 20 preferiti quelli oltre non risultano pieni qui,
  // ma restano comunque nella pagina Preferiti.
  useEffect(() => {
    if (!collegato) {
      setPreferiti({})
      return
    }
    api
      .preferiti(0)
      .then((r) => {
        const mappa = {}
        r.content.forEach((p) => {
          mappa[p.auto.id] = p.id
        })
        setPreferiti(mappa)
      })
      .catch(() => setPreferiti({}))
  }, [collegato])

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

  async function alternaPreferito(auto) {
    if (!collegato) {
      navigate('/accedi')
      return
    }
    const idPreferito = preferiti[auto.id]
    try {
      if (idPreferito) {
        await api.rimuoviPreferito(idPreferito)
        setPreferiti((p) => {
          const nuovi = { ...p }
          delete nuovi[auto.id]
          return nuovi
        })
      } else {
        const creato = await api.aggiungiPreferito(auto.id)
        setPreferiti((p) => ({ ...p, [auto.id]: creato.id }))
      }
    } catch (e) {
      setErrore(e.message)
    }
  }

  return (
    <div>
      {inEvidenza && (
        <section
          onClick={() => navigate(`/auto/${inEvidenza.id}`)}
          className="relative -mx-4 mb-10 cursor-pointer overflow-hidden sm:-mx-4"
        >
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-app-border/40 sm:aspect-[21/9]">
            {immagineHero.caricamento ? (
              <div className="h-full w-full animate-pulse bg-app-border/60" />
            ) : immagineHero.src ? (
              <img
                src={immagineHero.src}
                alt={`${inEvidenza.marca} ${inEvidenza.modello}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-app-fg to-app-draft">
                <span className="font-mono text-lg font-medium uppercase tracking-wider text-white/70">
                  {inEvidenza.marca} {inEvidenza.modello}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/40 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 sm:px-8 sm:pb-8">
            <div className="font-mono text-xs font-medium uppercase tracking-wider text-app-accent">
              {inEvidenza.stato === 'NUOVO' ? 'Nuovo arrivo' : 'In evidenza'} / {inEvidenza.annoImmatricolazione}
            </div>
            <h1 className="mt-1 font-display text-3xl font-black uppercase leading-none tracking-tight sm:text-5xl">
              {inEvidenza.marca} {inEvidenza.modello}
            </h1>

            <div className="mt-4 flex flex-wrap gap-8 border-t border-app-border pt-4 text-sm">
              {inEvidenza.potenza != null && (
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-app-muted">Potenza</div>
                  <div className="mt-0.5 font-display font-bold">{formatoPotenza(inEvidenza.potenza)}</div>
                </div>
              )}
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-app-muted">Anno</div>
                <div className="mt-0.5 font-display font-bold">{inEvidenza.annoImmatricolazione}</div>
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-app-muted">Chilometri</div>
                <div className="mt-0.5 font-display font-bold">{km(inEvidenza.chilometraggio)}</div>
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-app-muted">Alimentazione</div>
                <div className="mt-0.5 font-display font-bold">{etichettaAlimentazione(inEvidenza.alimentazione)}</div>
              </div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-app-muted">Prezzo</div>
                <div className="mt-0.5 font-display font-bold">{euro(inEvidenza.prezzo)}</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="font-mono text-xs font-medium uppercase tracking-wider text-app-accent">Collezione</div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Le nostre auto</h2>
          <p className="mt-1 text-sm text-app-muted">
            Cerca fra le auto disponibili. Con un account puoi salvarle fra i preferiti e farti avvisare
            quando il prezzo scende.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-lg border border-app-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-app-muted"
            fill="none"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path strokeLinecap="round" d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="w-full rounded-lg border border-app-border py-2 pl-9 pr-3 font-mono text-sm"
            placeholder="Marca, modello o descrizione"
            value={filtri.q}
            onChange={(e) => aggiorna('q', e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-app-border px-3 py-2 font-mono text-sm uppercase tracking-wide"
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
          className="rounded-lg border border-app-border px-3 py-2 font-mono text-sm uppercase tracking-wide"
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
          className="rounded-lg border border-app-border px-3 py-2 font-mono text-sm"
          placeholder="Prezzo max"
          value={filtri.prezzoMax}
          onChange={(e) => aggiorna('prezzoMax', e.target.value)}
        />
        <select
          className="rounded-lg border border-app-border px-3 py-2 font-mono text-sm uppercase tracking-wide"
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

      {caricamento && <p className="mt-6 text-sm text-app-muted">Caricamento...</p>}

      {!caricamento && risultato && risultato.content.length === 0 && (
        <p className="mt-6 rounded-lg border border-app-border bg-white p-6 text-center text-sm text-app-muted">
          Nessuna auto corrisponde a questa ricerca.
        </p>
      )}

      {!caricamento && risultato && risultato.content.length > 0 && (
        <>
          <p className="mt-6 font-mono text-xs uppercase tracking-wider text-app-muted">
            {risultato.totalElements} auto in catalogo
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {risultato.content.map((auto) => (
              <AutoCard
                key={auto.id}
                auto={auto}
                preferito={Boolean(preferiti[auto.id])}
                onToggleFavorite={alternaPreferito}
              />
            ))}
          </div>
          <Paginazione pagina={risultato.page} totalePagine={risultato.totalPages} onCambia={setPagina} />
        </>
      )}
    </div>
  )
}
