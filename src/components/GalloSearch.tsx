"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Criador } from "@/lib/types";

type Props = {
  initial: { placa?: string; candado?: string; criador_id?: string };
  criadores: Criador[];
};

export default function GalloSearch({ initial, criadores }: Props) {
  const [placa, setPlaca] = useState(initial.placa || "");
  const [candado, setCandado] = useState(initial.candado || "");
  const [criadorId, setCriadorId] = useState(initial.criador_id || "");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (placa) params.set("placa", placa);
    if (candado) params.set("candado", candado);
    if (criadorId) params.set("criador_id", criadorId);
    router.push(`/gallos?${params.toString()}`);
  }

  const inputClass =
    "w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-background text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const labelClass =
    "font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1 block";

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Placa</label>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={placa}
            onChange={(e) => setPlaca(e.target.value)}
            className={inputClass}
            placeholder="Solo números"
          />
        </div>
        <div>
          <label className={labelClass}>Candado</label>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={candado}
            onChange={(e) => setCandado(e.target.value)}
            className={inputClass}
            placeholder="Solo números"
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Criador</label>
        <select
          value={criadorId}
          onChange={(e) => setCriadorId(e.target.value)}
          className={inputClass}
        >
          <option value="">Todos los criadores</option>
          {criadores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-primary text-on-primary-container rounded-lg px-4 py-2.5 font-headline font-semibold flex items-center justify-center gap-1 hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>search</span>
          Buscar
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaca("");
            setCandado("");
            setCriadorId("");
            router.push("/gallos");
          }}
          className="px-6 bg-surface border border-outline-variant text-on-surface rounded-lg py-2.5 font-headline font-semibold hover:bg-surface-container-high transition-colors"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}