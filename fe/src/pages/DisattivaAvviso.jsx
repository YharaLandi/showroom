import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '@/lib/api'

/**
 * Pagina di arrivo del link nella mail.
 *
 * Non serve essere collegati: chi apre la mail puo' benissimo non esserlo, e a
 * proteggere l'operazione e' il token casuale, che vale una volta sola.
 */
export default function DisattivaAvviso() {
  const [parametri] = useSearchParams()
  const token = parametri.get('token')
  const [esito, setEsito] = useState('attesa')
  const giaChiamato = useRef(false)

  useEffect(() => {
    if (!token) {
      setEsito('mancante')
      return
    }
    // Il token vale una volta sola: in sviluppo StrictMode monta due volte il
    // componente, e senza questa guardia la seconda chiamata troverebbe un
    // token gia' consumato e mostrerebbe un errore a torto.
    if (giaChiamato.current) return
    giaChiamato.current = true

    api
      .disattivaAvviso(token)
      .then(() => setEsito('ok'))
      .catch(() => setEsito('nonValido'))
  }, [token])

  const messaggi = {
    attesa: { titolo: 'Un momento...', testo: 'Stiamo disattivando l' + '\u2019' + 'avviso.' },
    ok: {
      titolo: 'Avviso disattivato',
      testo: 'Non riceverai piu' + '\u2019' + ' mail per questa auto. Puoi sempre impostarne uno nuovo dal catalogo.',
    },
    nonValido: {
      titolo: 'Link non valido',
      testo: 'Questo link e' + '\u2019' + ' gia' + '\u2019' + ' stato usato oppure non e' + '\u2019' + ' piu' + '\u2019' + ' valido. Se vuoi, gestisci i tuoi avvisi dal tuo profilo.',
    },
    mancante: { titolo: 'Link incompleto', testo: 'Manca il codice di disattivazione.' },
  }

  const m = messaggi[esito]

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{m.titolo}</h1>
      <p className="mt-2 text-sm text-slate-600">{m.testo}</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
      >
        Vai al catalogo
      </Link>
    </div>
  )
}
