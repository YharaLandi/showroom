// Riquadro per errori e conferme. Il testo arriva sempre come stringa,
// mai come HTML da interpretare.
export default function Messaggio({ tipo = 'errore', children }) {
  if (!children) return null
  const stile =
    tipo === 'ok'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-red-200 bg-red-50 text-red-700'
  return <p className={`rounded-lg border p-3 text-sm ${stile}`}>{children}</p>
}
