const EURO = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const NUMERO = new Intl.NumberFormat('it-IT')

export const euro = (importo) => EURO.format(Number(importo))
export const km = (valore) => `${NUMERO.format(Number(valore))} km`

// BENZINA -> Benzina: gli enum arrivano in maiuscolo dal backend
export const alimentazione = (valore) =>
  valore ? valore.charAt(0) + valore.slice(1).toLowerCase() : ''

export const data = (iso) => (iso ? new Date(iso).toLocaleDateString('it-IT') : '')
