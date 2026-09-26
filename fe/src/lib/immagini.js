import { useEffect, useState } from 'react'

/**
 * Foto di un'auto: Unsplash se c'e' una chiave configurata (foto editoriali
 * curate, meglio inquadrate), Wikipedia sempre come ripiego (funziona senza
 * chiave, ma capita di trovare musei o sfondi a caso). Nessuna delle due
 * mostra l'esemplare vero in vendita: sono entrambe una foto generica di
 * quel modello, non la tua auto specifica.
 *
 * Si cerca sempre "marca modello" insieme, mai il modello da solo: "Punto"
 * da solo trova pagine a caso, "Fiat Punto" trova l'auto giusta.
 *
 * Quando nessuna delle due trova niente, si torna null e chi chiama mostra
 * un segnaposto: mai un'immagine rotta.
 */
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_KEY
const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php'
const cache = new Map()

async function cercaSuUnsplash(query) {
  if (!UNSPLASH_KEY) {
    return null
  }
  const parametri = new URLSearchParams({
    query: `${query} car`,
    per_page: '1',
    orientation: 'landscape',
  })
  try {
    const risposta = await fetch(`https://api.unsplash.com/search/photos?${parametri}`, {
      headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
    })
    if (!risposta.ok) {
      return null
    }
    const dati = await risposta.json()
    return dati.results?.[0]?.urls?.small ?? null
  } catch {
    return null
  }
}

// generator=search + prop=pageimages fa ricerca sfocata e miniatura in
// un'unica chiamata: un admin che scrive "Panda 1.2" o "M4 Competition" trova
// comunque la pagina giusta, anche se il titolo esatto su Wikipedia e' diverso.
async function cercaSuWikipedia(query) {
  const parametri = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '800',
    format: 'json',
    origin: '*', // richiesto dall'API di MediaWiki per il CORS da browser
  })
  try {
    const risposta = await fetch(`${WIKIPEDIA_API}?${parametri}`)
    if (!risposta.ok) {
      return null
    }
    const dati = await risposta.json()
    const pagine = Object.values(dati.query?.pages ?? {})
    return pagine[0]?.thumbnail?.source ?? null
  } catch {
    return null
  }
}

export async function cercaImmagineAuto(marca, modello) {
  if (!marca || !modello) {
    return null
  }
  const chiave = `${marca} ${modello}`.trim().toLowerCase()
  if (cache.has(chiave)) {
    return cache.get(chiave)
  }

  const query = `${marca} ${modello}`
  const url = (await cercaSuUnsplash(query)) ?? (await cercaSuWikipedia(query))

  cache.set(chiave, url)
  return url
}

// Hook di comodo: usa lo stesso ciclo cerca/mostra in ogni pagina che serve
// un'immagine auto (catalogo, dettaglio, hero), senza ripetere la logica.
//
// urlCaricata (opzionale): quando l'amministratore ha caricato una foto vera
// dell'esemplare, ha sempre la precedenza e non si cerca nient'altro.
export function useImmagineAuto(marca, modello, urlCaricata) {
  const [stato, setStato] = useState({ src: urlCaricata ?? null, caricamento: !urlCaricata })

  useEffect(() => {
    if (urlCaricata) {
      setStato({ src: urlCaricata, caricamento: false })
      return
    }
    let annullato = false
    setStato({ src: null, caricamento: true })
    cercaImmagineAuto(marca, modello).then((src) => {
      if (!annullato) {
        setStato({ src, caricamento: false })
      }
    })
    return () => {
      annullato = true
    }
  }, [marca, modello, urlCaricata])

  return stato
}
