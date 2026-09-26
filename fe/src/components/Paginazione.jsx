export default function Paginazione({ pagina, totalePagine, onCambia }) {
  if (totalePagine <= 1) return null

  return (
    <div className="mt-6 flex items-center justify-center gap-3 font-mono text-xs uppercase tracking-wider">
      <button
        disabled={pagina === 0}
        onClick={() => onCambia(pagina - 1)}
        className="rounded-lg border border-app-border px-3 py-1.5 hover:border-app-fg disabled:opacity-40"
      >
        Precedente
      </button>
      <span className="text-app-muted">
        Pagina {pagina + 1} di {totalePagine}
      </span>
      <button
        disabled={pagina >= totalePagine - 1}
        onClick={() => onCambia(pagina + 1)}
        className="rounded-lg border border-app-border px-3 py-1.5 hover:border-app-fg disabled:opacity-40"
      >
        Successiva
      </button>
    </div>
  )
}
