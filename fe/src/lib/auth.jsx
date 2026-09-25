import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, dimenticaToken, leggiToken, salvaToken } from '@/lib/api'

const ContestoAuth = createContext(null)

export function AuthProvider({ children }) {
  const [utente, setUtente] = useState(null)
  const [caricamento, setCaricamento] = useState(true)

  // All'avvio si chiede al server chi siamo: il token nel localStorage puo'
  // essere scaduto o revocato con un logout fatto altrove, e solo il backend
  // lo sa. Il ruolo arriva da qui, non da una lettura del JWT lato browser.
  useEffect(() => {
    if (!leggiToken()) {
      setCaricamento(false)
      return
    }
    api
      .me()
      .then(setUtente)
      .catch(() => {
        dimenticaToken()
        setUtente(null)
      })
      .finally(() => setCaricamento(false))
  }, [])

  const entra = useCallback(async (username, password) => {
    const risposta = await api.login(username, password)
    salvaToken(risposta.token)
    const profilo = await api.me()
    setUtente(profilo)
    return profilo
  }, [])

  const esci = useCallback(async () => {
    try {
      await api.logout()
    } catch {
      // Il token poteva essere gia' scaduto: l'uscita vale lo stesso
    }
    dimenticaToken()
    setUtente(null)
  }, [])

  const valore = useMemo(
    () => ({
      utente,
      caricamento,
      entra,
      esci,
      collegato: utente !== null,
      amministratore: utente?.ruoli?.some((r) => r === 'Admin' || r === 'SuperUser') ?? false,
    }),
    [utente, caricamento, entra, esci],
  )

  return <ContestoAuth.Provider value={valore}>{children}</ContestoAuth.Provider>
}

export function useAuth() {
  const contesto = useContext(ContestoAuth)
  if (!contesto) throw new Error('useAuth va usato dentro AuthProvider')
  return contesto
}
