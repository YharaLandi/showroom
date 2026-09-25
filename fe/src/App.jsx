import { Link, Navigate, Route, Routes } from 'react-router-dom'
import Header from '@/components/Header'
import { useAuth } from '@/lib/auth'
import Avvisi from '@/pages/Avvisi'
import AdminAuto from '@/pages/AdminAuto'
import Catalogo from '@/pages/Catalogo'
import Cookie from '@/pages/Cookie'
import DettaglioAuto from '@/pages/DettaglioAuto'
import DisattivaAvviso from '@/pages/DisattivaAvviso'
import Login from '@/pages/Login'
import Preferiti from '@/pages/Preferiti'
import Privacy from '@/pages/Privacy'
import Profilo from '@/pages/Profilo'
import Registrazione from '@/pages/Registrazione'

/**
 * Nasconde le pagine di chi ha fatto l'accesso.
 *
 * E' comodita' per chi naviga, non sicurezza: a decidere chi puo' fare che cosa
 * e' il backend, con @PreAuthorize su ogni endpoint. Qui si evita solo di
 * mostrare una pagina che risponderebbe 401.
 */
function Protetta({ children, soloAdmin = false }) {
  const { collegato, amministratore, caricamento } = useAuth()

  if (caricamento) return <p className="text-sm text-slate-500">Caricamento...</p>
  if (!collegato) return <Navigate to="/accedi" replace />
  if (soloAdmin && !amministratore) return <Navigate to="/" replace />
  return children
}

function NonTrovata() {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Pagina non trovata</h1>
      <p className="mt-2 text-sm text-slate-600">L&rsquo;indirizzo che hai aperto non esiste.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
      >
        Vai al catalogo
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Routes>
          <Route path="/" element={<Catalogo />} />
          <Route path="/auto/:id" element={<DettaglioAuto />} />
          <Route path="/accedi" element={<Login />} />
          <Route path="/registrati" element={<Registrazione />} />

          {/* Prima di /avvisi, ed e' pubblica: chi apre la mail puo' non essere collegato */}
          <Route path="/avvisi/disattiva" element={<DisattivaAvviso />} />

          <Route
            path="/preferiti"
            element={
              <Protetta>
                <Preferiti />
              </Protetta>
            }
          />
          <Route
            path="/avvisi"
            element={
              <Protetta>
                <Avvisi />
              </Protetta>
            }
          />
          <Route
            path="/profilo"
            element={
              <Protetta>
                <Profilo />
              </Protetta>
            }
          />
          <Route
            path="/admin"
            element={
              <Protetta soloAdmin>
                <AdminAuto />
              </Protetta>
            }
          />

          <Route path="/privacy" element={<Privacy />} />
          <Route path="/cookie" element={<Cookie />} />
          <Route path="*" element={<NonTrovata />} />
        </Routes>
      </main>

      {/* Privacy e Cookie raggiungibili da ogni pagina */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-4 text-sm text-slate-600">
          <span>ShowRoom</span>
          <Link to="/privacy" className="hover:underline">
            Privacy Policy
          </Link>
          <Link to="/cookie" className="hover:underline">
            Cookie Policy
          </Link>
        </div>
      </footer>
    </div>
  )
}
