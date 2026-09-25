import { Link } from 'react-router-dom'
import { alimentazione, euro, km } from '@/lib/formato'

// Ogni valore finisce come testo dentro JSX, che fa l'escape da solo:
// niente dangerouslySetInnerHTML, nemmeno per la descrizione.
export default function AutoCard({ auto }) {
  return (
    <Link
      to={`/auto/${auto.id}`}
      className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-slate-400"
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">{auto.marca}</div>
      <div className="mt-0.5 font-medium">{auto.modello}</div>
      <div className="mt-2 text-sm text-slate-600">
        {auto.annoImmatricolazione} · {km(auto.chilometraggio)} · {alimentazione(auto.alimentazione)}
      </div>
      <div className="mt-3 text-lg font-semibold">{euro(auto.prezzo)}</div>
    </Link>
  )
}
