export default function Loading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse" aria-busy="true" aria-live="polite">
      <div className="flex justify-between items-center">
        <div className="h-8 w-48 rounded-lg bg-surface-container-high" />
        <div className="h-10 w-24 rounded-lg bg-surface-container-high" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="h-12 rounded-lg bg-surface-container-high" />
        <div className="h-12 rounded-lg bg-surface-container-high" />
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <div className="h-20 rounded-lg bg-surface-container-high border border-surface-variant" />
        <div className="h-20 rounded-lg bg-surface-container-high border border-surface-variant" />
        <div className="h-20 rounded-lg bg-surface-container-high border border-surface-variant" />
      </div>

      <span className="sr-only">Cargando…</span>
    </div>
  );
}
