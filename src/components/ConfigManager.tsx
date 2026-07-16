"use client";

import { useState, useEffect } from "react";
import type { Criador, Color, Cresta, Pata, Pico, Mama, Papa } from "@/lib/types";

type Props = {
  initialCriadores: Criador[];
  initialColores: Color[];
  initialCrestas: Cresta[];
  initialPatas: Pata[];
  initialPicos: Pico[];
  initialMamas: Mama[];
  initialPapas: Papa[];
};

type TabKey = "criadores" | "colores" | "crestas" | "patas" | "picos" | "mamas" | "papas";

export default function ConfigManager({ initialCriadores, initialColores, initialCrestas, initialPatas, initialPicos, initialMamas, initialPapas }: Props) {
  const [tab, setTab] = useState<TabKey>("criadores");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "criadores", label: "Criadores" },
    { key: "colores", label: "Colores" },
    { key: "crestas", label: "Crestas" },
    { key: "patas", label: "Patas" },
    { key: "picos", label: "Picos" },
    { key: "mamas", label: "Mamas" },
    { key: "papas", label: "Papas" },
  ];

  const config: Record<TabKey, { items: { id: number; nombre: string }[]; apiPath: string; placeholder: string; emptyText: string; addError: string }> = {
    criadores: { items: initialCriadores, apiPath: "/api/criadores", placeholder: "Nombre del criador", emptyText: "No hay criadores registrados.", addError: "El criador ya existe" },
    colores: { items: initialColores, apiPath: "/api/colores", placeholder: "Nombre del color", emptyText: "No hay colores registrados.", addError: "El color ya existe" },
    crestas: { items: initialCrestas, apiPath: "/api/crestas", placeholder: "Nombre de la cresta", emptyText: "No hay crestas registradas.", addError: "La cresta ya existe" },
    patas: { items: initialPatas, apiPath: "/api/patas", placeholder: "Tipo de patas", emptyText: "No hay patas registradas.", addError: "Las patas ya existen" },
    picos: { items: initialPicos, apiPath: "/api/picos", placeholder: "Tipo de pico", emptyText: "No hay picos registrados.", addError: "El pico ya existe" },
    mamas: { items: initialMamas, apiPath: "/api/mamas", placeholder: "Nombre de la mama", emptyText: "No hay mamas registradas.", addError: "La mama ya existe" },
    papas: { items: initialPapas, apiPath: "/api/papas", placeholder: "Nombre del papa", emptyText: "No hay papas registrados.", addError: "El papa ya existe" },
  };

  const current = config[tab];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-2 py-2.5 font-headline font-semibold text-xs sm:text-sm transition-colors ${
              tab === t.key
                ? "bg-primary text-on-primary-container"
                : "bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-high"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ItemList
        items={current.items}
        apiPath={current.apiPath}
        placeholder={current.placeholder}
        emptyText={current.emptyText}
        addError={current.addError}
      />
    </div>
  );
}

type Item = { id: number; nombre: string };

function ItemList({
  items: initialItems,
  apiPath,
  placeholder,
  emptyText,
  addError,
}: {
  items: Item[];
  apiPath: string;
  placeholder: string;
  emptyText: string;
  addError: string;
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<{ id: number; nombre: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(apiPath)
      .then((r) => r.json())
      .then((d) => { if (!cancelled && Array.isArray(d)) setItems(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [apiPath]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setError("");
    setBusy(true);

    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      const data = await res.json();
      console.log("[ConfigManager] POST", apiPath, "->", res.status, data);
      if (!res.ok) {
        setError(data.error || addError);
        setBusy(false);
        return;
      }
      setItems((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNombre("");
    } catch (err) {
      console.error("[ConfigManager] POST falló:", err);
      setError("Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(id: number, newName: string) {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`${apiPath}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: newName.trim() }),
      });
      if (res.ok) {
        setItems(items.map((c) => (c.id === id ? { ...c, nombre: newName.trim() } : c)).sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setEditing(null);
      }
    } catch {}
  }

  async function handleDelete(id: number) {
    if (!confirm("¿Eliminar?")) return;
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`${apiPath}/${id}`, { method: "DELETE" });
      setItems(items.filter((c) => c.id !== id));
    } catch {}
    finally {
      setBusy(false);
    }
  }

  const inputClass =
    "flex-1 bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-background text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="submit"
          className="bg-primary text-on-primary-container rounded-lg px-4 py-3 font-headline font-semibold flex items-center gap-1 hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined">add</span>
        </button>
      </form>

      {error && (
        <div className="text-sm text-error bg-error-container/40 border border-error/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {items.length === 0 && (
          <div className="bg-surface border border-surface-variant rounded-lg p-4 text-center text-on-surface-variant">
            {emptyText}
          </div>
        )}
        {items.map((c) => (
          <div
            key={c.id}
            className="bg-surface border border-surface-variant rounded-lg p-3 flex items-center gap-3"
          >
            {editing?.id === c.id ? (
              <>
                <input
                  type="text"
                  value={editing.nombre}
                  onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                  className="flex-1 bg-surface-container border border-primary rounded-lg px-3 py-2 text-on-background"
                  autoFocus
                />
                <button onClick={() => handleUpdate(c.id, editing.nombre)} className="text-primary p-2">
                  <span className="material-symbols-outlined">check</span>
                </button>
                <button onClick={() => setEditing(null)} className="text-on-surface-variant p-2">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 text-on-background text-base">{c.nombre}</span>
                <button
                  onClick={() => setEditing({ id: c.id, nombre: c.nombre })}
                  className="text-primary p-2"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>edit</span>
                </button>
                <button onClick={() => handleDelete(c.id)} className="text-error p-2">
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}