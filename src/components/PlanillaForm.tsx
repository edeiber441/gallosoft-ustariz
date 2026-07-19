"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Gallo } from "@/lib/types";

type FormState = {
  tipoId: "placa" | "candado";
  placa: string;
  candado: string;
  libras: string;
  onzas: string;
  salida: boolean;
  salida_cantidad: string;
  mona_muerta: boolean;
  mona_muerta_minutos: string;
  topa: boolean;
  topa_minutos: string;
  alas: boolean;
  alas_cantidad: string;
  pierna: boolean;
  pierna_cantidad: string;
  volteo: boolean;
  volteo_cantidad: string;
  correteo: boolean;
  correteo_tiempo: string;
  observaciones: string;
  vitamina: boolean;
  coccidia: boolean;
  purgante: boolean;
  enfermo_tipo: string;
};

const initialState: FormState = {
  tipoId: "placa",
  placa: "",
  candado: "",
  libras: "4",
  onzas: "0",
  salida: false,
  salida_cantidad: "",
  mona_muerta: false,
  mona_muerta_minutos: "",
  topa: false,
  topa_minutos: "",
  alas: false,
  alas_cantidad: "",
  pierna: false,
  pierna_cantidad: "",
  volteo: false,
  volteo_cantidad: "",
  correteo: false,
  correteo_tiempo: "",
  observaciones: "",
  vitamina: false,
  coccidia: false,
  purgante: false,
  enfermo_tipo: "",
};

const ENFERMO_OPCIONES: Array<{ value: string; label: string }> = [
  { value: "moquillo", label: "Moquillo" },
  { value: "viruela", label: "Viruela" },
  { value: "diarrea", label: "Diarrea" },
  { value: "descanso", label: "Descanso" },
  { value: "herido", label: "Herido" },
];

export default function PlanillaForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const fechaRef = useRef<HTMLSpanElement>(null);

  const [resultados, setResultados] = useState<Gallo[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [galloSel, setGalloSel] = useState<Gallo | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleString("es", {
        dateStyle: "full",
        timeStyle: "short",
      });
    const node = fechaRef.current;
    if (node) node.textContent = fmt();
    const t = setInterval(() => {
      if (node) node.textContent = fmt();
    }, 30000);
    return () => clearInterval(t);
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buscarGallo(tipo: "placa" | "candado", valor: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setGalloSel(null);
    const trimmed = valor.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      setResultados([]);
      setBuscando(false);
      return;
    }
    setBuscando(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `/api/gallos?${tipo}=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => []);
        setResultados(Array.isArray(data) ? (data as Gallo[]) : []);
      } catch {
        setResultados([]);
      } finally {
        setBuscando(false);
      }
    }, 350);
  }

  function validateClient(state: FormState, sel: Gallo | null): string | null {
    if (!sel) {
      return "Debes buscar y seleccionar un gallo de la lista";
    }
    const libras = Number(state.libras);
    if (!Number.isInteger(libras) || libras < 1 || libras > 6) {
      return "Las libras deben estar entre 1 y 6";
    }
    const onzas = Number(state.onzas);
    if (!Number.isInteger(onzas) || onzas < 0 || onzas > 15) {
      return "Las onzas deben estar entre 0 y 15";
    }
    const checkNum = (checked: boolean, val: string, label: string): string | null => {
      if (!checked) return null;
      if (!/^\d+$/.test(val.trim())) return `Si marca '${label}' debe indicar un número entero válido`;
      if (Number(val) < 0) return `El valor de '${label}' no puede ser negativo`;
      return null;
    };
    const e1 = checkNum(state.salida, state.salida_cantidad, "Salida");
    if (e1) return e1;
    const e2 = checkNum(state.mona_muerta, state.mona_muerta_minutos, "Mona muerta");
    if (e2) return e2;
    const e3 = checkNum(state.topa, state.topa_minutos, "Topa");
    if (e3) return e3;
    const e4 = checkNum(state.alas, state.alas_cantidad, "Alas");
    if (e4) return e4;
    const e5 = checkNum(state.pierna, state.pierna_cantidad, "Pierna");
    if (e5) return e5;
    const e6 = checkNum(state.volteo, state.volteo_cantidad, "Volteo");
    if (e6) return e6;
    const e7 = checkNum(state.correteo, state.correteo_tiempo, "Correteo");
    if (e7) return e7;
    if (state.observaciones.length > 1000) {
      return "Las observaciones no pueden superar los 1000 caracteres";
    }
    const enf = state.enfermo_tipo.trim();
    if (enf && !ENFERMO_OPCIONES.some((o) => o.value === enf)) {
      return "El estado de 'Enfermo' no es válido";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateClient(form, galloSel);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const payload = {
      gallo_id: galloSel?.id ?? null,
      placa: form.tipoId === "placa" ? Number(form.placa) : null,
      candado: form.tipoId === "candado" ? Number(form.candado) : null,
      libras: Number(form.libras),
      onzas: Number(form.onzas),
      salida: form.salida,
      salida_cantidad: form.salida ? Number(form.salida_cantidad) : null,
      mona_muerta: form.mona_muerta,
      mona_muerta_minutos: form.mona_muerta ? Number(form.mona_muerta_minutos) : null,
      topa: form.topa,
      topa_minutos: form.topa ? Number(form.topa_minutos) : null,
      alas: form.alas,
      alas_cantidad: form.alas ? Number(form.alas_cantidad) : null,
      pierna: form.pierna,
      pierna_cantidad: form.pierna ? Number(form.pierna_cantidad) : null,
      volteo: form.volteo,
      volteo_cantidad: form.volteo ? Number(form.volteo_cantidad) : null,
      correteo: form.correteo,
      correteo_tiempo: form.correteo ? Number(form.correteo_tiempo) : null,
      observaciones: form.observaciones.trim() || null,
      vitamina: form.vitamina,
      coccidia: form.coccidia,
      purgante: form.purgante,
      enfermo_tipo: form.enfermo_tipo.trim() || null,
    };

    try {
      const res = await fetch("/api/planillas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error || `Error ${res.status}`);
        setSaving(false);
        return;
      }
      router.push("/planillas");
      router.refresh();
    } catch (err) {
      console.error("[PlanillaForm] submit:", err);
      setError(
        err instanceof Error
          ? `No se pudo conectar con el servidor: ${err.message}`
          : "No se pudo conectar con el servidor"
      );
      setSaving(false);
    }
  }

  const inputClass =
    "w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-background text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const labelClass =
    "font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1 block";
  const segActive = "bg-primary text-on-primary-container border-primary";
  const segInactive =
    "bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-high";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error && (
        <div
          role="alert"
          className="text-sm text-error bg-error-container/40 border border-error/30 rounded-lg px-4 py-2"
        >
          {error}
        </div>
      )}

      <div>
        <label className={labelClass}>Tipo de llave *</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => {
              update("tipoId", "placa");
              setResultados([]);
              setGalloSel(null);
            }}
            className={`flex-1 rounded-lg px-4 py-2.5 font-headline font-semibold text-sm transition-colors ${
              form.tipoId === "placa" ? segActive : segInactive
            }`}
          >
            Placa
          </button>
          <button
            type="button"
            onClick={() => {
              update("tipoId", "candado");
              setResultados([]);
              setGalloSel(null);
            }}
            className={`flex-1 rounded-lg px-4 py-2.5 font-headline font-semibold text-sm transition-colors ${
              form.tipoId === "candado" ? segActive : segInactive
            }`}
          >
            Candado
          </button>
        </div>
        {form.tipoId === "placa" ? (
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.placa}
            onChange={(e) => {
              update("placa", e.target.value);
              buscarGallo("placa", e.target.value);
            }}
            className={inputClass}
            placeholder="Ej: 100"
            min={1}
          />
        ) : (
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.candado}
            onChange={(e) => {
              update("candado", e.target.value);
              buscarGallo("candado", e.target.value);
            }}
            className={inputClass}
            placeholder="Ej: 50"
            min={1}
          />
        )}
      </div>

      {buscando && (
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Buscando gallos...
        </div>
      )}

      {!buscando && resultados.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>
            {resultados.length === 1 ? "Gallo encontrado" : `${resultados.length} gallos encontrados`} — selecciona uno
          </span>
          {resultados.map((g) => (
            <GalloCard
              key={g.id}
              gallo={g}
              selected={galloSel?.id === g.id}
              onSelect={() => setGalloSel(g)}
            />
          ))}
        </div>
      )}

      {!buscando && galloSel && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2 text-sm text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">check_circle</span>
          Gallo seleccionado:{" "}
          <span className="font-headline font-semibold">
            {galloSel.placa != null ? `Placa ${galloSel.placa}` : `Candado ${galloSel.candado}`}
          </span>
        </div>
      )}

      <div>
        <label className={labelClass}>Fecha del trabajo (automática)</label>
        <div
          className={`${inputClass} opacity-70 cursor-not-allowed flex items-center gap-2`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>schedule</span>
          <span ref={fechaRef}>Cargando hora del sistema...</span>
        </div>
        <p className="font-mono text-xs text-on-surface-variant mt-1">
          Se registra con la fecha y hora actual del sistema al guardar.
        </p>
      </div>

      <div>
        <label className={labelClass}>Peso *</label>

        {galloSel && (
          <div className="mb-3 bg-surface-container border border-outline-variant rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">
              Peso registrado
            </span>
            <span className="font-headline font-semibold text-on-surface">
              {galloSel.libras} lb {galloSel.onzas} oz
            </span>
          </div>
        )}

        <span className={`${labelClass} normal-case tracking-normal`}>Peso actual (a registrar)</span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={`${labelClass} normal-case tracking-normal`}>Libras (1-6)</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={6}
              value={form.libras}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 6)) {
                  update("libras", v);
                }
              }}
              className={inputClass}
              placeholder="1-6"
            />
          </div>
          <div>
            <label className={`${labelClass} normal-case tracking-normal`}>Onzas (0-15)</label>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={15}
              value={form.onzas}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "" || (/^\d+$/.test(v) && Number(v) >= 0 && Number(v) <= 15)) {
                  update("onzas", v);
                }
              }}
              className={inputClass}
              placeholder="0-15"
            />
          </div>
        </div>
        <p className="font-mono text-xs text-on-surface-variant mt-1">
          El peso actual solo se registra en la planilla; no modifica el peso del gallo.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className={labelClass}>Items del trabajo</label>

        <ItemRow
          index={1}
          name="Salida"
          checked={form.salida}
          onToggle={(v) => update("salida", v)}
          value={form.salida_cantidad}
          onValue={(v) => update("salida_cantidad", v)}
          unitLabel="Cantidad"
          inputClass={inputClass}
        />

        <ItemRow
          index={2}
          name="Mona muerta"
          checked={form.mona_muerta}
          onToggle={(v) => update("mona_muerta", v)}
          value={form.mona_muerta_minutos}
          onValue={(v) => update("mona_muerta_minutos", v)}
          unitLabel="Minutos"
          inputClass={inputClass}
        />

        <ItemRow
          index={3}
          name="Topa"
          checked={form.topa}
          onToggle={(v) => update("topa", v)}
          value={form.topa_minutos}
          onValue={(v) => update("topa_minutos", v)}
          unitLabel="Minutos"
          inputClass={inputClass}
        />

        <ItemRow
          index={4}
          name="Alas"
          checked={form.alas}
          onToggle={(v) => update("alas", v)}
          value={form.alas_cantidad}
          onValue={(v) => update("alas_cantidad", v)}
          unitLabel="Cantidad"
          inputClass={inputClass}
        />

        <ItemRow
          index={5}
          name="Pierna"
          checked={form.pierna}
          onToggle={(v) => update("pierna", v)}
          value={form.pierna_cantidad}
          onValue={(v) => update("pierna_cantidad", v)}
          unitLabel="Cantidad"
          inputClass={inputClass}
        />

        <ItemRow
          index={6}
          name="Volteo"
          checked={form.volteo}
          onToggle={(v) => update("volteo", v)}
          value={form.volteo_cantidad}
          onValue={(v) => update("volteo_cantidad", v)}
          unitLabel="Cantidad"
          inputClass={inputClass}
        />

        <ItemRow
          index={7}
          name="Correteo"
          checked={form.correteo}
          onToggle={(v) => update("correteo", v)}
          value={form.correteo_tiempo}
          onValue={(v) => update("correteo_tiempo", v)}
          unitLabel="Tiempo"
          inputClass={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Observaciones</label>
        <textarea
          value={form.observaciones}
          onChange={(e) => update("observaciones", e.target.value.slice(0, 1000))}
          className={`${inputClass} min-h-[96px] resize-y`}
          placeholder="Notas del trabajo realizado (opcional, máx. 1000 caracteres)"
          maxLength={1000}
        />
        <p className="font-mono text-xs text-on-surface-variant mt-1 text-right">
          {form.observaciones.length}/1000
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className={labelClass}>Suministro (verificar que se le suministró al gallo)</label>
        <div className="bg-surface border border-outline-variant rounded-lg p-3 flex flex-wrap gap-4">
          <SuministroRow name="Vitamina" checked={form.vitamina} onToggle={(v) => update("vitamina", v)} />
          <SuministroRow name="Coccidia" checked={form.coccidia} onToggle={(v) => update("coccidia", v)} />
          <SuministroRow name="Purgante" checked={form.purgante} onToggle={(v) => update("purgante", v)} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className={labelClass}>Novedades</label>
        <div className="bg-surface border border-outline-variant rounded-lg p-3">
          <label className={`${labelClass} normal-case tracking-normal`}>Enfermo</label>
          <select
            value={form.enfermo_tipo}
            onChange={(e) => update("enfermo_tipo", e.target.value)}
            className={`${inputClass} appearance-none`}
          >
            <option value="">No / Sano</option>
            {ENFERMO_OPCIONES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="font-mono text-xs text-on-surface-variant mt-1">
            Toca el campo para desplegar el menú y seleccionar el estado del gallo.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-3">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-lg px-4 py-3 font-headline font-semibold text-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              Registrar planilla
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="px-6 bg-surface border border-outline-variant text-on-surface rounded-lg py-3 font-headline font-semibold text-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function GalloCard({
  gallo,
  selected,
  onSelect,
}: {
  gallo: Gallo;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left bg-surface border rounded-lg p-3 flex items-center gap-3 transition-all ${
        selected
          ? "border-primary gold-edge bg-primary/5"
          : "border-surface-variant hover:border-primary"
      }`}
    >
      <div className="w-14 h-14 shrink-0 rounded bg-surface-container-highest overflow-hidden border border-outline-variant/30 flex items-center justify-center">
        {gallo.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gallo.imagen} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="material-symbols-outlined text-on-surface-variant">image</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-headline font-semibold text-on-surface truncate">
          {gallo.placa != null ? `Placa ${gallo.placa}` : "Sin placa"}
          {gallo.candado != null ? ` · Candado ${gallo.candado}` : ""}
        </div>
        <div className="font-mono text-xs text-on-surface-variant mt-1 truncate">
          {gallo.criador_nombre || "Sin criador"} • {gallo.color}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1">
        <span className="px-2 py-1 rounded-full bg-surface-container-highest border border-surface-variant font-mono text-xs text-on-surface" style={{ fontSize: "10px" }}>
          {gallo.libras} lb {gallo.onzas} oz
        </span>
        {selected && (
          <span className="material-symbols-outlined text-primary">check_circle</span>
        )}
      </div>
    </button>
  );
}

type ItemRowProps = {
  index: number;
  name: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  value: string;
  onValue: (v: string) => void;
  unitLabel: string;
  inputClass: string;
};

function ItemRow({ index, name, checked, onToggle, value, onValue, unitLabel, inputClass }: ItemRowProps) {
  return (
    <div className="bg-surface border border-outline-variant rounded-lg p-3 flex items-center gap-3">
      <div className="shrink-0 w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center font-mono text-xs text-on-surface-variant">
        {index}
      </div>
      <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 min-w-[8rem]">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
        />
        <span className="font-headline font-semibold text-on-surface">{name}</span>
      </label>
      <div className="flex-1 flex items-center gap-2 justify-end">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d+$/.test(v)) onValue(v);
          }}
          disabled={!checked}
          className={`${inputClass} w-24 py-2 ${!checked ? "opacity-40" : ""}`}
          placeholder={unitLabel}
        />
        <span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider w-20">
          {unitLabel}
        </span>
      </div>
    </div>
  );
}

function SuministroRow({
  name,
  checked,
  onToggle,
}: {
  name: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
      />
      <span className="font-headline font-semibold text-on-surface">{name}</span>
    </label>
  );
}
