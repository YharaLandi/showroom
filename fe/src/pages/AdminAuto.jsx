import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Messaggio from '@/components/Messaggio'
import Paginazione from '@/components/Paginazione'
import { api } from '@/lib/api'
import { euro, km } from '@/lib/formato'

const AUTO_VUOTA = {
  telaio: '', marcaId: '', modello: '', annoImmatricolazione: '', chilometraggio: '',
  alimentazione: 'BENZINA', prezzo: '', prezzoAcquisto: '', descrizione: '',
}

const ALIMENTAZIONI = ['BENZINA', 'DIESEL', 'GPL', 'METANO', 'IBRIDA', 'ELETTRICA']

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
        prezzo: Number(nuova.prezzo),
        prezzoAcquisto: nuova.prezzoAcquisto === '' ? null : Number(nuova.prezzoAcquisto),
      })
      setNuova(AUTO_VUOTA)
      setMostraForm(false)
      setEsito({ tipo: 'ok', testo: 'Auto creata come bozza. Pubblicala quando è pronta.' })
      carica()
    } catch (err) {
      setEsito({ tipo: 'errore', testo: err.stato === 409 ? 'Telaio già presente.' : err.message })
    }
  }

  async function cambiaPubblicazione(auto) {
    try {
      await api.modificaAuto(auto.id, { bozza: !auto.bozza })
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
        Qui vedi anche le bozze e il prezzo di acquisto, che nel catalogo pubblico non compaiono.
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
          <select className={input} value={nuova.alimentazione} onChange={campo('alimentazione')}>
            {ALIMENTAZIONI.map((a) => (
              <option key={a} value={a}>
                {a.charAt(0) + a.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
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
                  {auto.bozza ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Bozza
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                      In catalogo
                    </span>
                  )}
                  <Link to={`/auto/${auto.id}`} className="font-medium hover:underline">
                    {auto.marca} {auto.modello}
                  </Link>
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {auto.annoImmatricolazione} · {km(auto.chilometraggio)} · telaio {auto.telaio}
                </div>
                <div className="mt-1 text-sm">
                  Vendita <strong>{euro(auto.prezzo)}</strong>
                  {auto.prezzoAcquisto != null && (
                    <span className="text-slate-500"> · acquisto {euro(auto.prezzoAcquisto)}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => cambiaPubblicazione(auto)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
              >
                {auto.bozza ? 'Pubblica' : 'Riporta in bozza'}
              </button>
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
