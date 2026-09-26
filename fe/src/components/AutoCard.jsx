import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { alimentazione, euro, km } from '@/lib/formato'
import { useImmagineAuto } from '@/lib/immagini'
import { useState } from 'react'

// Il catalogo pubblico restituisce solo NUOVO o DISPONIBILE (il backend filtra
// prima), quindi qui basta distinguere questi due: "nuovo" e' una scelta
// dell'amministratore, non piu' un calcolo sulla data di creazione.
const ETICHETTE = { NUOVO: 'Nuovo', DISPONIBILE: 'Disponibile' }

// Foto vera se l'admin l'ha caricata, altrimenti una generica del modello
// cercata in automatico (vedi lib/immagini.js). Mai un'immagine rotta.
export default function AutoCard({ auto, preferito, onToggleFavorite }) {
  const { src, caricamento } = useImmagineAuto(auto.marca, auto.modello, auto.haFoto ? api.urlFoto(auto.id) : null)
  const [immagineFallita, setImmagineFallita] = useState(false)

  return (
    <Link
      to={`/auto/${auto.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-app-border bg-white transition hover:border-app-fg hover:shadow-sm"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-app-border/40">
        {caricamento ? (
          <div className="h-full w-full animate-pulse bg-app-border/60" />
        ) : src && !immagineFallita ? (
          <img
            src={src}
            alt={`${auto.marca} ${auto.modello}`}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={() => setImmagineFallita(true)}
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-app-fg to-app-draft px-4 text-center">
            <span className="font-mono text-sm font-medium uppercase tracking-wider text-white/70">
              {auto.marca} {auto.modello}
            </span>
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-sm bg-app-bg/90 px-2 py-1 font-mono text-[11px] font-medium uppercase tracking-wider text-app-fg">
          {ETICHETTE[auto.stato] ?? auto.stato}
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
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-app-bg/90 text-app-muted transition hover:bg-app-bg"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${preferito ? 'fill-app-accent stroke-app-accent' : 'fill-none stroke-current'}`}
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
        <div className="font-mono text-xs uppercase tracking-wider text-app-muted">{auto.marca}</div>
        <div className="mt-0.5 flex items-baseline justify-between gap-2">
          <span className="font-display font-bold">{auto.modello}</span>
          <span className="whitespace-nowrap font-display text-lg font-bold">{euro(auto.prezzo)}</span>
        </div>
        <div className="mt-2 font-mono text-xs uppercase tracking-wider text-app-muted">
          {auto.annoImmatricolazione} / {alimentazione(auto.alimentazione)} · {km(auto.chilometraggio)}
        </div>
      </div>
    </Link>
  )
}
