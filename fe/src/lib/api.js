// In sviluppo BASE e' vuota e il proxy di Vite inoltra /api alla 8080.
// In produzione arriva da VITE_API_URL, iniettata durante la build.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

const CHIAVE_TOKEN = 'showroom.token'

export function leggiToken() {
  return localStorage.getItem(CHIAVE_TOKEN)
}

export function salvaToken(token) {
  localStorage.setItem(CHIAVE_TOKEN, token)
}

export function dimenticaToken() {
  localStorage.removeItem(CHIAVE_TOKEN)
}

export class ErroreApi extends Error {
  constructor(stato, messaggio, campi) {
    super(messaggio)
    this.stato = stato
    this.campi = campi
  }
}

async function chiama(percorso, opzioni = {}, giaRiprovato = false) {
  const token = leggiToken()
  // Con un body FormData (upload file) niente Content-Type: lo imposta il
  // browser da solo, con il boundary giusto. Impostarlo a mano rompe il parsing.
  const isFormData = opzioni.body instanceof FormData
  const risposta = await fetch(`${BASE}${percorso}`, {
    ...opzioni,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opzioni.headers,
    },
  })

  // Un token scaduto o revocato non deve bloccare la sfoglia anonima: lo
  // buttiamo e riproviamo una volta sola senza, cosi' /api/auto (pubblico)
  // torna a rispondere anche a chi ha una sessione morta in localStorage.
  // Se la richiesta era verso un endpoint che l'accesso lo richiede davvero,
  // il secondo tentativo fallisce comunque e l'errore prosegue normale.
  if (risposta.status === 401 && token && !giaRiprovato) {
    dimenticaToken()
    return chiama(percorso, opzioni, true)
  }

  if (!risposta.ok) {
    let messaggio = `${risposta.status} ${risposta.statusText}`
    let campi
    try {
      const corpo = await risposta.json()
      // GlobalExceptionHandler risponde { status, errors: { campo: motivo } }
      if (corpo.errors) {
        campi = corpo.errors
        messaggio = 'Controlla i campi segnalati'
      } else if (corpo.message) {
        messaggio = corpo.message
      }
    } catch {
      // corpo non JSON: resta il messaggio di stato
    }
    throw new ErroreApi(risposta.status, messaggio, campi)
  }

  // Non ci si affida allo status per sapere se c'e' un corpo: 200 e 201 di
  // questa API a volte non ne hanno (register, logout, crea ruolo...), non
  // solo 204. .json() su un corpo vuoto lancia "Unexpected end of JSON input"
  // anche quando la richiesta e' andata a buon fine.
  const testo = await risposta.text()
  return testo ? JSON.parse(testo) : undefined
}

const corpo = (dati) => ({ body: JSON.stringify(dati) })

// I filtri vuoti non finiscono nella query string, cosi' l'indirizzo resta leggibile
function query(parametri) {
  const q = new URLSearchParams()
  Object.entries(parametri).forEach(([chiave, valore]) => {
    if (valore !== '' && valore !== null && valore !== undefined) q.append(chiave, valore)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

export const api = {
  indirizzo: BASE || '(stessa origine, proxy di Vite)',
  stato: () => chiama('/api/stato'),

  // ---------- accesso ----------
  login: (username, password) => chiama('/api/user/login', { method: 'POST', ...corpo({ username, password }) }),
  registra: (dati) => chiama('/api/user/register', { method: 'POST', ...corpo(dati) }),
  logout: () => chiama('/api/user/logout', { method: 'POST' }),
  me: () => chiama('/api/user/me'),
  eliminaAccount: () => chiama('/api/user/me', { method: 'DELETE' }),

  // ---------- catalogo ----------
  marche: () => chiama('/api/marche'),
  catalogo: (filtri) => chiama(`/api/auto${query(filtri)}`),
  auto: (id) => chiama(`/api/auto/${id}`),

  // ---------- area amministrativa ----------
  catalogoAdmin: (filtri) => chiama(`/api/auto/admin${query(filtri)}`),
  nuovaAuto: (dati) => chiama('/api/auto', { method: 'POST', ...corpo(dati) }),
  modificaAuto: (id, dati) => chiama(`/api/auto/${id}`, { method: 'PATCH', ...corpo(dati) }),
  cambiaPrezzo: (id, prezzo) => chiama(`/api/auto/${id}/prezzo`, { method: 'PATCH', ...corpo({ prezzo }) }),
  nuovaMarca: (nome) => chiama('/api/marche', { method: 'POST', ...corpo({ nome }) }),
  caricaFotoAuto: (id, file) => {
    const dati = new FormData()
    dati.append('file', file)
    return chiama(`/api/auto/${id}/foto`, { method: 'POST', body: dati })
  },
  urlFoto: (id) => `${BASE}/api/auto/${id}/foto`,

  // ---------- preferiti ----------
  preferiti: (pagina = 0) => chiama(`/api/preferiti?page=${pagina}&size=20`),
  aggiungiPreferito: (autoId) => chiama('/api/preferiti', { method: 'POST', ...corpo({ autoId }) }),
  rimuoviPreferito: (id) => chiama(`/api/preferiti/${id}`, { method: 'DELETE' }),

  // ---------- avvisi ----------
  avvisi: (pagina = 0) => chiama(`/api/avvisi?page=${pagina}&size=20`),
  nuovoAvviso: (autoId, soglia) => chiama('/api/avvisi', { method: 'POST', ...corpo({ autoId, soglia }) }),
  modificaAvviso: (id, soglia) => chiama(`/api/avvisi/${id}`, { method: 'PATCH', ...corpo({ soglia }) }),
  eliminaAvviso: (id) => chiama(`/api/avvisi/${id}`, { method: 'DELETE' }),
  disattivaAvviso: (token) =>
    chiama(`/api/avvisi/disattiva?token=${encodeURIComponent(token)}`, { method: 'POST' }),
}
