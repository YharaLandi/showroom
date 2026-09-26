import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Messaggio from '@/components/Messaggio'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'

export default function Registrazione() {
  const { entra } = useAuth()
  const navigate = useNavigate()
  const [dati, setDati] = useState({ nome: '', cognome: '', email: '', password: '' })
  const [errore, setErrore] = useState(null)
  const [campi, setCampi] = useState({})
  const [inCorso, setInCorso] = useState(false)

  const aggiorna = (campo) => (e) => setDati((d) => ({ ...d, [campo]: e.target.value }))

  async function invia(evento) {
    evento.preventDefault()
    setErrore(null)
    setCampi({})
    setInCorso(true)
    try {
      // Si manda solo quello che il server accetta: il ruolo lo decide lui
      await api.registra(dati)
      await entra(dati.email, dati.password)
      navigate('/')
    } catch (e) {
      setCampi(e.campi ?? {})
      setErrore(e.stato === 409 ? 'Questa email risulta gia' + '\u2019' + ' registrata.' : e.message)
    } finally {
      setInCorso(false)
    }
  }

  const stile = (campo) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm ${campi[campo] ? 'border-app-accent' : 'border-app-border'}`

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-2xl font-black uppercase tracking-tight">Registrati</h1>
      <p className="mt-1 text-sm text-app-muted">
        Servono solo nome, cognome ed email. Vedi la{' '}
        <Link to="/privacy" className="underline">
          Privacy Policy
        </Link>
        .
      </p>

      <form onSubmit={invia} className="mt-6 space-y-3 rounded-lg border border-app-border bg-white p-4">
        {[
          { campo: 'nome', etichetta: 'Nome', tipo: 'text' },
          { campo: 'cognome', etichetta: 'Cognome', tipo: 'text' },
          { campo: 'email', etichetta: 'Email', tipo: 'email' },
        ].map(({ campo, etichetta, tipo }) => (
          <div key={campo}>
            <label className="block text-sm font-medium">{etichetta}</label>
            <input type={tipo} required value={dati[campo]} onChange={aggiorna(campo)} className={stile(campo)} />
            {campi[campo] && <p className="mt-1 text-xs text-app-accent">{campi[campo]}</p>}
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={dati.password}
            onChange={aggiorna('password')}
            className={stile('password')}
          />
          <p className="mt-1 text-xs text-app-muted">Almeno 8 caratteri.</p>
          {campi.password && <p className="mt-1 text-xs text-app-accent">{campi.password}</p>}
        </div>

        <Messaggio>{errore}</Messaggio>

        <button
          disabled={inCorso}
          className="w-full rounded-lg bg-app-fg px-3 py-2 font-mono text-xs uppercase tracking-wider text-white hover:bg-app-fg-hover disabled:opacity-50"
        >
          {inCorso ? 'Registrazione...' : 'Crea account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-app-muted">
        Hai gia{'\u2019'} un account?{' '}
        <Link to="/accedi" className="font-medium text-app-fg underline">
          Accedi
        </Link>
      </p>
    </div>
  )
}
