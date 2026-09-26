import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

const voce = ({ isActive }) =>
  `px-3 py-2 font-mono text-xs font-medium uppercase tracking-wider transition ${
    isActive ? 'text-app-fg' : 'text-app-muted hover:text-app-fg'
  }`

const pulsante =
  'rounded-lg border border-app-border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider hover:border-app-fg'

export default function Header() {
  const { collegato, amministratore, utente, esci, caricamento } = useAuth()

  return (
    <header className="sticky top-0 z-10 border-b border-app-border bg-app-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-4">
        <Link to="/" className="mr-6 font-display text-lg font-black tracking-tight">
          SHOWROOM<span className="text-app-accent">.</span>
        </Link>

        <nav className="flex flex-wrap items-center">
          <NavLink to="/" end className={voce}>
            Catalogo
          </NavLink>
          {collegato && (
            <>
              <NavLink to="/preferiti" className={voce}>
                Preferiti
              </NavLink>
              <NavLink to="/avvisi" className={voce}>
                Avvisi
              </NavLink>
            </>
          )}
          {amministratore && (
            <NavLink to="/admin" className={voce}>
              Gestione
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Finche' non sappiamo chi siamo non si mostra niente: altrimenti a ogni
              caricamento comparirebbe "Accedi" per un istante anche a chi e' gia' entrato. */}
          {caricamento ? null : collegato ? (
            <>
              <Link to="/profilo" className={pulsante}>
                {utente.nome}
              </Link>
              <button onClick={esci} className={pulsante}>
                Esci
              </button>
            </>
          ) : (
            <>
              <Link to="/accedi" className={pulsante}>
                Accedi
              </Link>
              <Link
                to="/registrati"
                className="rounded-lg bg-app-fg px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wider text-white hover:bg-app-fg-hover"
              >
                Registrati
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
