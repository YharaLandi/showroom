import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Messaggio from '@/components/Messaggio'
import { useAuth } from '@/lib/auth'

export default function Login() {
  const { entra } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errore, setErrore] = useState(null)
  const [inCorso, setInCorso] = useState(false)

  async function invia(evento) {
    evento.preventDefault()
    setErrore(null)
    setInCorso(true)
    try {
      await entra(email, password)
      navigate('/')
    } catch (e) {
      // Il backend non distingue fra email sconosciuta e password sbagliata,
      // e nemmeno noi: rivelarlo direbbe a chiunque quali email sono registrate.
      setErrore(e.stato === 401 ? 'Credenziali non valide.' : e.message)
    } finally {
      setInCorso(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Accedi</h1>

      <form onSubmit={invia} className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <Messaggio>{errore}</Messaggio>

        <button
          disabled={inCorso}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {inCorso ? 'Accesso...' : 'Accedi'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Non hai un account?{' '}
        <Link to="/registrati" className="font-medium underline">
          Registrati
        </Link>
      </p>
    </div>
  )
}
