"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Planilla } from "@/lib/types";

type Props = {
  planilla: Planilla;
  canDelete?: boolean;
};

function fmtFecha(s: string): string {
  try {
    return new Date(s).toLocaleString("es", { dateStyle: "full", timeStyle: "short" });
  } catch {
    return s;
  }
}

export default function PlanillaDetail({ planilla, canDelete = false }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm("¿Eliminar esta planilla? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/planillas/${planilla.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "No se pudo eliminar");
        setDeleting(false);
        return;
      }
      router.push("/planillas");
      router.refresh();
    } catch (err) {
      console.error("[PlanillaDetail] delete:", err);
      setError("Error al eliminar");
      setDeleting(false);
    }
  }

  const llave =
    planilla.gallo_placa != null
      ? `Placa ${planilla.gallo_placa}`
      : planilla.gallo_candado != null
        ? `Candado ${planilla.gallo_candado}`
        : "Sin llave";

  const labelClass = "font-mono text-xs text-on-surface-variant uppercase tracking-wider";
  const valueClass = "font-headline text-on-surface";

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div
          role="alert"
          className="text-sm text-error bg-error-container/40 border border-error/30 rounded-lg px-4 py-2"
        >
          {error}
        </div>
      )}

      <section className="bg-surface rounded-xl p-5 gold-edge shadow-[0_4px_16px_rgba(0,0,0,0.6)] flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <span className={`${labelClass}`}>Gallo</span>
          <span className="material-symbols-outlined text-primary">edit_note</span>
        </div>
        <div className={`${valueClass} text-2xl font-bold`}>{llave}</div>
        <div className="font-mono text-xs text-on-surface-variant">
          {planilla.gallo_color ?? "Sin color"}
        </div>
      </section>

      <section className="bg-surface border border-surface-variant rounded-lg p-5 flex flex-col gap-4">
        <div>
          <div className={labelClass}>Fecha del trabajo</div>
          <div className={`${valueClass} text-lg mt-1`}>{fmtFecha(planilla.fecha_trabajo)}</div>
        </div>

        <div>
          <div className={labelClass}>Peso</div>
          <div className={`${valueClass} text-lg mt-1`}>
            {planilla.libras} lb {planilla.onzas} oz
          </div>
        </div>
      </section>

      <section className="bg-surface border border-surface-variant rounded-lg p-5 flex flex-col gap-3">
        <div className={labelClass}>Items del trabajo</div>

        <ItemDisplay index={1} name="Salida" checked={planilla.salida} value={planilla.salida_cantidad} unit="Cantidad" />
        <ItemDisplay index={2} name="Mona muerta" checked={planilla.mona_muerta} value={planilla.mona_muerta_minutos} unit="Minutos" />
        <ItemDisplay index={3} name="Topa" checked={planilla.topa} value={planilla.topa_minutos} unit="Minutos" />
        <ItemDisplay index={4} name="Alas" checked={planilla.alas} value={planilla.alas_cantidad} unit="Cantidad" />
      </section>

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={() => router.push("/planillas")}
          className="flex-1 bg-surface border border-outline-variant text-on-surface rounded-lg px-4 py-3 font-headline font-semibold text-lg hover:bg-surface-container-high transition-colors"
        >
          Volver
        </button>
        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-error border border-error/30 rounded-lg px-4 py-3 font-medium hover:bg-error-container/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined">delete</span>
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

function ItemDisplay({
  index,
  name,
  checked,
  value,
  unit,
}: {
  index: number;
  name: string;
  checked: boolean;
  value: number | null;
  unit: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-outline-variant/40 last:border-0 pb-3 last:pb-0">
      <div className="shrink-0 w-7 h-7 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-mono text-xs text-on-surface-variant">
        {index}
      </div>
      <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: "20px" }}>
        {checked ? "check_box" : "check_box_outline_blank"}
      </span>
      <span className="font-headline font-semibold text-on-surface flex-1">{name}</span>
      <span className="font-mono text-sm text-on-surface-variant">
        {checked ? `${value ?? "-"} ${unit}` : "No"}
      </span>
    </div>
  );
}
