"use client";

import { useState, useRef, useEffect } from "react";

type Props = {
  apiPath: string;
  label: string;
  existingNames: string[];
  onCreated: (item: { id: number; nombre: string; creado_en?: string }) => void;
};

export default function InlineOptionAdd({ apiPath, label, existingNames, onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setNombre("");
        setError("");
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function handleAdd() {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Ya existe "${trimmed}"`);
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: trimmed }),
      });
      const data = await res.json();
      console.log("[InlineOptionAdd] POST", apiPath, "->", res.status, data);
      if (!res.ok) {
        setError(data.error || "Error al añadir");
        return;
      }
      onCreated({ id: data.id, nombre: data.nombre || trimmed });
      setNombre("");
      setOpen(false);
    } catch (err) {
      console.error("[InlineOptionAdd] POST falló:", err);
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="shrink-0 w-11 bg-surface border border-outline-variant text-primary rounded-lg flex items-center justify-center hover:bg-surface-container-high hover:border-primary transition-colors"
        aria-label={`Añadir ${label}`}
        title={`Añadir ${label}`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
          {open ? "remove" : "add"}
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-30 bg-surface border border-outline-variant rounded-lg p-3 shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col gap-2 w-64"
        >
          <label className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
            Nuevo {label}
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            placeholder={`Ej: ${label}...`}
            autoFocus
            className="w-full bg-surface-container border border-outline-variant rounded-lg px-3 py-2 text-on-background text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {error && (
            <div className="text-xs text-error bg-error-container/40 border border-error/30 rounded px-2 py-1">
              {error}
            </div>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={saving || !nombre.trim()}
            className="bg-primary text-on-primary-container rounded-lg px-3 py-2 font-headline font-semibold text-sm flex items-center justify-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="material-symbols-outlined animate-spin" style={{ fontSize: "18px" }}>
                progress_activity
              </span>
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                Añadir
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}