import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Messaggio from '@/components/Messaggio'
import Paginazione from '@/components/Paginazione'
import { api } from '@/lib/api'
import { cilindrata, euro, km, potenza } from '@/lib/formato'

const AUTO_VUOTA = {
  telaio: '', marcaId: '', modello: '', annoImmatricolazione: '', chilometraggio: '',
  alimentazione: 'BENZINA', cilindrata: '', potenza: '', prezzo: '', prezzoAcquisto: '', descrizione: '',
}

const ALIMENTAZIONI = ['BENZINA', 'DIESEL', 'GPL', 'METANO', 'IBRIDA', 'ELETTRICA']

// L'ordine e' quello del ciclo di vita naturale di un'auto: bozza -> pubblicata
// (nuovo o disponibile) -> venduta. Nuovo e disponibile non sono in sequenza
// tra loro: e' l'amministratore a scegliere quando un'auto non e' piu' "nuovo".
const STATI = ['BOZZA', 'NUOVO', 'DISPONIBILE', 'VENDUTA']
const ETICHETTE_STATO = { BOZZA: 'Bozza', NUOVO: 'Nuovo', DISPONIBILE: 'Disponibile', VENDUTA: 'Venduta' }
const BADGE_STATO = {
  BOZZA: 'bg-amber-100 text-amber-800',
  NUOVO: 'bg-red-100 text-red-800',
  DISPONIBILE: 'bg-emerald-100 text-emerald-800',
  VENDUTA: 'bg-slate-200 text-slate-600',
}

export default function AdminAuto() {
  const [pagina, setPagina] = useState(0)
  const [risultato, setRisultato] = useState(null)
  const [marche, setMarche] = useState([])
  const [errore, setErrore] = useState(null)
  const [esito, setEsito] = useState(null)
  const [nuova, setNuova] = useState(AUTO_VUOTA)
  const [mostraForm, setMostraForm] = useState(false)
  const [nuovaMarca, setNuovaMarca] = useState('')
  const [prezzi, setPrezzi] = useState({})

  const carica = useCallback(() => {
    api
      .catalogoAdmin({ page: pagina, size: 20, sort: 'createdAt,desc' })
      .then((d) => {
        setRisultato(d)
        setErrore(null)
      })
      .catch((e) => setErrore(e.message))
  }, [pagina])

  useEffect(carica, [carica])

  useEffect(() => {
    api.marche().then(setMarche).catch(() => setMarche([]))
  }, [])

  async function creaMarca(e) {
    e.preventDefault()
    try {
      await api.nuovaMarca(nuovaMarca)
      setNuovaMarca('')
      setMarche(await api.marche())
      setEsito({ tipo: 'ok', testo: 'Marca aggiunta.' })
    } catch (err) {
      setEsito({ tipo: 'errore', testo: err.stato === 409 ? 'Marca già esistente.' : err.message })
    }
  }

  async function creaAuto(e) {
    e.preventDefault()
    try {
      await api.nuovaAuto({
        ...nuova,
        annoImmatricolazione: Number(nuova.annoImmatricolazione),
        chilometraggio: Number(nuova.chilometraggio),
        // Cilindrata facoltativa: le elettriche restano senza
        cilindrata: nuova.cilindrata === '' ? null : Number(nuova.cilindrata),
        potenza: Number(nuova.potenza),
        prezzo: Number(nuova.prezzo),
        prezzoAcquisto: nuova.prezzoAcquisto === '' ? null : Number(nuova.prezzoAcquisto),
      })
      setNuova(AUTO_VUOTA)
      setMostraForm(false)
      setEsito({ tipo: 'ok', testo: 'Auto creata come bozza. Cambia lo stato quando è pronta.' })
      carica()
    } catch (err) {
      setEsito({ tipo: 'errore', testo: err.stato === 409 ? 'Telaio già presente.' : err.message })
    }
  }

  async function cambiaStato(auto, stato) {
    try {
      await api.modificaAuto(auto.id, { stato })
      carica()
    } catch (err) {
      setEsito({ tipo: 'errore', testo: err.message })
    }
  }

  async function salvaPrezzo(auto) {
    const valore = Number(prezzi[auto.id])
    if (!valore) return
    try {
      await api.cambiaPrezzo(auto.id, valore)
      setPrezzi((p) => ({ ...p, [auto.id]: '' }))
      setEsito({
        tipo: 'ok',
        testo:
          valore < auto.prezzo
            ? 'Prezzo abbassato. Chi aveva una soglia sopra questo valore riceverà una mail.'
            : 'Prezzo aggiornato.',
      })
      carica()
    } catch (err) {
      setEsito({ tipo: 'errore', testo: err.message })
    }
  }

  const campo = (nome) => (e) => setNuova((n) => ({ ...n, [nome]: e.target.value }))
  // Passando a elettrica si svuota anche la cilindrata: il campo si disabilita
  // nel form, ma senza questo il valore scritto prima resterebbe in memoria e
  // finirebbe comunque inviato.
  const cambiaAlimentazione = (e) => {
    const valore = e.target.value
    setNuova((n) => ({ ...n, alimentazione: valore, cilindrata: valore === 'ELETTRICA' ? '' : n.cilindrata }))
  }
  const input = 'rounded-md border border-slate-300 px-3 py-2 text-sm'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Gestione catalogo</h1>
        <button
          onClick={() => setMostraForm((v) => !v)}
          className="ml-auto rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700"
        >
          {mostraForm ? 'Chiudi' : 'Nuova auto'}
        </button>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Qui vedi ogni stato (bozza, nuovo, disponibile, venduta) e il prezzo di acquisto: nel
        catalogo pubblico restano solo le auto nuove o disponibili, senza il prezzo di acquisto.
      </p>

      <div className="mt-4">{esito && <Messaggio tipo={esito.tipo}>{esito.testo}</Messaggio>}</div>
      <div className="mt-2">
        <Messaggio>{errore}</Messaggio>
      </div>

      <form
        onSubmit={creaMarca}
        className="mt-4 flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-4"
      >
        <input
          className={`${input} min-w-48 flex-1`}
          placeholder="Nuova marca (es. Volkswagen)"
          value={nuovaMarca}
          onChange={(e) => setNuovaMarca(e.target.value)}
          required
        />
        <button className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
          Aggiungi marca
        </button>
      </form>

      {mostraForm && (
        <form
          onSubmit={creaAuto}
          className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          <input
            className={input}
            placeholder="Telaio (11-17 caratteri)"
            value={nuova.telaio}
            onChange={campo('telaio')}
            required
            minLength={11}
            maxLength={17}
          />
          <select className={input} value={nuova.marcaId} onChange={campo('marcaId')} required>
            <option value="">Scegli la marca</option>
            {marche.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
          <input
            className={input}
            placeholder="Modello"
            value={nuova.modello}
            onChange={campo('modello')}
            required
          />
          <input
            className={input}
            type="number"
            placeholder="Anno"
            min="1900"
            value={nuova.annoImmatricolazione}
            onChange={campo('annoImmatricolazione')}
            required
          />
          <input
            className={input}
            type="number"
            placeholder="Chilometri"
            min="0"
            value={nuova.chilometraggio}
            onChange={campo('chilometraggio')}
            required
          />
          <select className={input} value={nuova.alimentazione} onChange={cambiaAlimentazione}>
            {ALIMENTAZIONI.map((a) => (
              <option key={a} value={a}>
                {a.charAt(0) + a.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <input
            className={input}
            type="number"
            placeholder={nuova.alimentazione === 'ELETTRICA' ? 'Cilindrata (non applicabile)' : 'Cilindrata (cc)'}
            min="1"
            value={nuova.cilindrata}
            onChange={campo('cilindrata')}
            disabled={nuova.alimentazione === 'ELETTRICA'}
          />
          <input
            className={input}
            type="number"
            placeholder="Potenza (CV)"
            min="1"
            value={nuova.potenza}
            onChange={campo('potenza')}
            required
          />
          <input
            className={input}
            type="number"
            placeholder="Prezzo di vendita"
            min="1"
            value={nuova.prezzo}
            onChange={campo('prezzo')}
            required
          />
          <input
            className={input}
            type="number"
            placeholder="Prezzo di acquisto (interno)"
            min="0"
            value={nuova.prezzoAcquisto}
            onChange={campo('prezzoAcquisto')}
          />
          <textarea
            className={`${input} sm:col-span-2`}
            rows={3}
            placeholder="Descrizione"
            value={nuova.descrizione}
            onChange={campo('descrizione')}
            required
          />
          <button className="rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 sm:col-span-2">
            Crea come bozza
          </button>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {risultato?.content.map((auto) => (
          <div key={auto.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_STATO[auto.stato]}`}>
                    {ETICHETTE_STATO[auto.stato]}
                  </span>
                  <Link to={`/auto/${auto.id}`} className="font-medium hover:underline">
                    {auto.marca} {auto.modello}
                  </Link>
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {auto.annoImmatricolazione} · {km(auto.chilometraggio)}
                  {auto.potenza != null && ` · ${potenza(auto.potenza)}`}
                  {auto.cilindrata != null && ` (${cilindrata(auto.cilindrata)})`}
                  {' · telaio '}{auto.telaio}
                </div>
                <div className="mt-1 text-sm">
                  Vendita <strong>{euro(auto.prezzo)}</strong>
                  {auto.prezzoAcquisto != null && (
                    <span className="text-slate-500"> · acquisto {euro(auto.prezzoAcquisto)}</span>
                  )}
                </div>
              </div>
              <select
                value={auto.stato}
                onChange={(e) => cambiaStato(auto, e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                {STATI.map((s) => (
                  <option key={s} value={s}>
                    {ETICHETTE_STATO[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
              <input
                type="number"
                min="1"
                placeholder="Nuovo prezzo"
                value={prezzi[auto.id] ?? ''}
                onChange={(e) => setPrezzi((p) => ({ ...p, [auto.id]: e.target.value }))}
                className="w-40 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
              />
              <button
                onClick={() => salvaPrezzo(auto)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                Cambia prezzo
              </button>
            </div>
          </div>
        ))}
      </div>

      {risultato && (
        <Paginazione pagina={risultato.page} totalePagine={risultato.totalPages} onCambia={setPagina} />
      )}
    </div>
  )
}
