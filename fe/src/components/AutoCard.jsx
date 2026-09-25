import { Link } from 'react-router-dom'
import { alimentazione, euro, km } from '@/lib/formato'
import { immagineAuto } from '@/lib/immagini'
import { useState } from 'react'

const QUATTORDICI_GIORNI_MS = 14 * 24 * 60 * 60 * 1000

/**
 * L'immagine arriva da imagin.studio: foto vera se conosce marca e modello,
 * la sua sagoma generica altrimenti. Il servizio risponde sempre 200 anche
 * quando non ha un'auto del genere, quindi onError qui copre solo i guasti di
 * rete veri, non l'assenza del modello.
 */
export default function AutoCard({ auto, preferito, onToggleFavorite }) {
  const [immagineFallita, setImmagineFallita] = useState(false)
  const nuova = auto.createdAt && Date.now() - new Date(auto.createdAt).getTime() < QUATTORDICI_GIORNI_MS

  return (
    <Link
      to={`/auto/${auto.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-slate-400 hover:shadow-sm"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {immagineFallita ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 px-4 text-center">
            <span className="text-sm font-medium uppercase tracking-wide text-slate-300">
              {auto.marca} {auto.modello}
            </span>
          </div>
        ) : (
          <img
            src={immagineAuto(auto.marca, auto.modello)}
            alt={`${auto.marca} ${auto.modello}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={() => setImmagineFallita(true)}
            loading="lazy"
          />
        )}

        <span className="absolute left-3 top-3 rounded-sm bg-white/90 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-900">
          {nuova ? 'Nuovo' : 'Disponibile'}
        </span>

        {/* preventDefault + stopPropagation: la card intera e' un Link, il cuore non deve aprirlo */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onToggleFavorite(auto)
          }}
          aria-label={preferito ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 transition hover:bg-white"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${preferito ? 'fill-red-600 stroke-red-600' : 'fill-none stroke-current'}`}
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21s-6.7-4.35-9.3-8.1C.8 9.8 1.9 6 5.4 5.2c2-.45 3.7.6 4.6 2.1.9-1.5 2.6-2.55 4.6-2.1 3.5.8 4.6 4.6 2.7 7.7C18.7 16.65 12 21 12 21z"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">{auto.marca}</div>
        <div className="mt-0.5 flex items-baseline justify-between gap-2">
          <span className="font-medium">{auto.modello}</span>
          <span className="whitespace-nowrap text-lg font-semibold">{euro(auto.prezzo)}</span>
        </div>
        <div className="mt-2 text-sm text-slate-500">
          {auto.annoImmatricolazione} · {km(auto.chilometraggio)} · {alimentazione(auto.alimentazione)}
        </div>
      </div>
    </Link>
  )
}
