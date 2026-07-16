"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  nombre: string | null;
  username: string;
  rango: string;
};

export default function UserMenu({ nombre, username, rango }: Props) {
  const [open, setOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowForm(false);
        setError("");
        setOk(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOk(false);
    if (!actual || !nueva) {
      setError("Completa ambos campos");
      return;
    }
    if (nueva.length < 4) {
      setError("La nueva contraseña debe tener al menos 4 caracteres");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/cambiar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, nueva }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al cambiar contraseña");
        setBusy(false);
        return;
      }
      setOk(true);
      setActual("");
      setNueva("");
      setTimeout(() => {
        setShowForm(false);
        setOk(false);
        setOpen(false);
      }, 1500);
    } catch {
      setError("Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-surface-container-high transition-colors"
        title="Mi cuenta"
      >
        <span className="material-symbols-outlined text-primary" style={{ fontSize: "24px" }}>
          account_circle
        </span>
        <span className="hidden sm:block text-sm font-medium text-on-surface max-w-[120px] truncate">
          {nombre || username}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-surface border border-outline-variant rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] w-72 flex flex-col">
          <div className="px-4 py-3 border-b border-outline-variant">
            <div className="font-headline font-semibold text-on-background text-sm truncate">
              {nombre || "Sin nombre"}
            </div>
            <div className="font-mono text-xs text-on-surface-variant">
              C.C. {username}
            </div>
            <div className="mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                {rango === "admin" ? "Admin" : "Gallero"}
              </span>
            </div>
          </div>

          {showForm ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
              <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
                Contraseña actual
              </label>
              <input
                type="password"
                value={actual}
                onChange={(e) => setActual(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-background text-sm focus:outline-none focus:border-primary"
                autoFocus
              />
              <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
                Nueva contraseña
              </label>
              <input
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-background text-sm focus:outline-none focus:border-primary"
              />
              {error && (
                <div className="text-xs text-error bg-error-container/40 border border-error/30 rounded px-2 py-1">
                  {error}
                </div>
              )}
              {ok && (
                <div className="text-xs text-success bg-success-container/30 border border-success/30 rounded px-2 py-1">
                  Contraseña actualizada
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="bg-primary text-on-primary-container rounded-lg px-3 py-2 font-headline font-semibold text-sm flex items-center justify-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {busy ? (
                  <span className="material-symbols-outlined animate-spin" style={{ fontSize: "18px" }}>
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span>
                    Guardar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(""); setOk(false); setActual(""); setNueva(""); }}
                className="text-sm text-on-surface-variant hover:text-on-surface py-1"
              >
                Cancelar
              </button>
            </form>
          ) : (
            <div className="flex flex-col p-2">
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>key</span>
                Cambiar contraseña
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
