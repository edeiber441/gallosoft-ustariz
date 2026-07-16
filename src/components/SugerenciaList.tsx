"use client";

import { useState } from "react";
import Link from "next/link";
import type { Sugerencia } from "@/lib/types";

type Props = {
  sugerencias: Sugerencia[];
  isAdmin: boolean;
};

const FIELD_LABELS: Record<string, string> = {
  placa: "Placa",
  candado: "Candado",
  color: "Color",
  libras: "Libras",
  onzas: "Onzas",
  cresta: "Cresta",
  patas: "Patas",
  pico: "Pico",
  mama: "Mama",
  papa: "Papa",
  marca_mes: "Marca (mes)",
  marca_anio: "Marca (año)",
  imagen: "Imagen",
};

export default function SugerenciaList({ sugerencias, isAdmin }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleReview(id: number, accion: "aceptar" | "rechazar") {
    if (busyId) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch(`/api/sugerencias/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Error al procesar");
      } else {
        window.location.reload();
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setBusyId(null);
    }
  }

  if (sugerencias.length === 0) {
    return (
      <div className="bg-surface border border-surface-variant rounded-lg p-6 text-center text-on-surface-variant">
        No hay sugerencias.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="text-sm text-error bg-error-container/40 border border-error/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}
      {sugerencias.map((s) => {
        const payload = s.payload as Record<string, unknown>;
        const galloLabel = s.gallo_placa != null
          ? `Placa ${s.gallo_placa}`
          : s.gallo_candado != null
            ? `Candado ${s.gallo_candado}`
            : "Sin llave";

        return (
          <div
            key={s.id}
            className={`bg-surface border rounded-lg p-4 flex flex-col gap-3 ${
              s.estado === "pendiente"
                ? "border-primary/40"
                : s.estado === "aceptada"
                  ? "border-success/30 opacity-75"
                  : "border-error/30 opacity-75"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <Link
                  href={`/gallos/${s.gallo_id}`}
                  className="font-headline font-semibold text-lg text-primary hover:underline"
                >
                  {galloLabel}
                </Link>
                <div className="font-mono text-xs text-on-surface-variant mt-1">
                  {s.gallo_color || "Sin color"} • Sugerido por {s.usuario_nombre || "desconocido"}
                </div>
                <div className="font-mono text-xs text-on-surface-variant">
                  {new Date(s.creado_en).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                </div>
              </div>
              <span
                className={`shrink-0 text-xs px-3 py-1 rounded-full font-semibold ${
                  s.estado === "pendiente"
                    ? "bg-primary/20 text-primary"
                    : s.estado === "aceptada"
                      ? "bg-success/20 text-success"
                      : "bg-error/20 text-error"
                }`}
              >
                {s.estado}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-surface-container rounded-lg p-3">
              {Object.entries(FIELD_LABELS).map(([key, label]) => {
                if (!(key in payload)) return null;
                const val = payload[key];
                const display = val == null || val === ""
                  ? "—"
                  : key === "imagen"
                    ? val ? "Con imagen" : "Sin imagen"
                    : String(val);
                return (
                  <div key={key} className="flex flex-col">
                    <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
                      {label}
                    </span>
                    <span className="text-on-background text-sm truncate">
                      {display}
                    </span>
                  </div>
                );
              })}
            </div>

            {isAdmin && s.estado === "pendiente" && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleReview(s.id, "aceptar")}
                  disabled={busyId === s.id}
                  className="flex-1 bg-success text-on-success-container rounded-lg px-4 py-2.5 font-headline font-semibold text-sm flex items-center justify-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>check</span>
                  Aceptar
                </button>
                <button
                  type="button"
                  onClick={() => handleReview(s.id, "rechazar")}
                  disabled={busyId === s.id}
                  className="flex-1 bg-error text-on-error-container rounded-lg px-4 py-2.5 font-headline font-semibold text-sm flex items-center justify-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                  Rechazar
                </button>
              </div>
            )}

            {s.estado !== "pendiente" && s.revisado_en && (
              <div className="font-mono text-xs text-on-surface-variant">
                Revisada el {new Date(s.revisado_en).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
