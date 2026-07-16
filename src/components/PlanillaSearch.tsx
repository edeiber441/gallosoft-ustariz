"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  initial: { placa?: string; candado?: string };
};

export default function PlanillaSearch({ initial }: Props) {
  const [placa, setPlaca] = useState(initial.placa || "");
  const [candado, setCandado] = useState(initial.candado || "");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (placa) params.set("placa", placa);
    if (candado) params.set("candado", candado);
    router.push(`/planillas?${params.toString()}`);
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
            router.push("/planillas");
          }}
          className="px-6 bg-surface border border-outline-variant text-on-surface rounded-lg py-2.5 font-headline font-semibold hover:bg-surface-container-high transition-colors"
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
