export default function Paginazione({ pagina, totalePagine, onCambia }) {
  if (totalePagine <= 1) return null

  return (
    <div className="mt-6 flex items-center justify-center gap-3 text-sm">
      <button
        disabled={pagina === 0}
        onClick={() => onCambia(pagina - 1)}
        className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
      >
        Precedente
      </button>
      <span className="text-slate-600">
        Pagina {pagina + 1} di {totalePagine}
      </span>
      <button
        disabled={pagina >= totalePagine - 1}
        onClick={() => onCambia(pagina + 1)}
        className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
      >
        Successiva
      </button>
    </div>
  )
}
