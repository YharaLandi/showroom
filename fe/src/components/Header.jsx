import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

const voce = ({ isActive }) =>
  `px-3 py-2 text-xs font-medium uppercase tracking-wide transition ${
    isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'
  }`

export default function Header() {
  const { collegato, amministratore, utente, esci, caricamento } = useAuth()

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-4">
        <Link to="/" className="mr-6 text-lg font-bold tracking-tight">
          SHOWROOM<span className="text-red-600">.</span>
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
              <Link
                to="/profilo"
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium uppercase tracking-wide hover:bg-slate-50"
              >
                {utente.nome}
              </Link>
              <button
                onClick={esci}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium uppercase tracking-wide hover:bg-slate-50"
              >
                Esci
              </button>
            </>
          ) : (
            <>
              <Link
                to="/accedi"
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium uppercase tracking-wide hover:bg-slate-50"
              >
                Accedi
              </Link>
              <Link
                to="/registrati"
                className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-white hover:bg-slate-700"
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
