"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Gallo, Criador, Color, Cresta, Pata, Pico } from "@/lib/types";
import InlineOptionAdd from "@/components/InlineOptionAdd";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

type Props = {
  gallo?: Gallo | null;
};

type FormState = {
  tipoId: "placa" | "candado";
  placa: string;
  candado: string;
  criador_id: string;
  color: string;
  imagen: string | null;
  cresta: string;
  patas: string;
  pico: string;
};

async function compressImage(file: File, maxSize: number = 1024, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > height) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas context"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function GalloForm({ gallo }: Props) {
  const [form, setForm] = useState<FormState>(() =>
    gallo
      ? {
          tipoId: gallo.placa != null ? "placa" : gallo.candado != null ? "candado" : "placa",
          placa: gallo.placa != null ? String(gallo.placa) : "",
          candado: gallo.candado != null ? String(gallo.candado) : "",
          criador_id: gallo.criador_id ? String(gallo.criador_id) : "",
          color: gallo.color,
          imagen: gallo.imagen,
          cresta: gallo.cresta || "",
          patas: gallo.patas || "",
          pico: gallo.pico || "",
        }
      : {
          tipoId: "placa",
          placa: "",
          candado: "",
          criador_id: "",
          color: "",
          imagen: null,
          cresta: "",
          patas: "",
          pico: "",
        }
  );
  const [criadores, setCriadores] = useState<Criador[]>([]);
  const [colores, setColores] = useState<Color[]>([]);
  const [crestas, setCrestas] = useState<Cresta[]>([]);
  const [patasList, setPatasList] = useState<Pata[]>([]);
  const [picosList, setPicosList] = useState<Pico[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/criadores")
      .then((r) => r.json())
      .then((data) => { if (!cancelled && Array.isArray(data)) setCriadores(data); })
      .catch(() => {});
    fetch("/api/colores")
      .then((r) => r.json())
      .then((data) => { if (!cancelled && Array.isArray(data)) setColores(data); })
      .catch(() => {});
    fetch("/api/crestas")
      .then((r) => r.json())
      .then((data) => { if (!cancelled && Array.isArray(data)) setCrestas(data); })
      .catch(() => {});
    fetch("/api/patas")
      .then((r) => r.json())
      .then((data) => { if (!cancelled && Array.isArray(data)) setPatasList(data); })
      .catch(() => {});
    fetch("/api/picos")
      .then((r) => r.json())
      .then((data) => { if (!cancelled && Array.isArray(data)) setPicosList(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError("La imagen supera los 20MB. Selecciona una más pequeña.");
      return;
    }
    setImageProcessing(true);
    setError("");
    try {
      const compressed = await compressImage(file);
      update("imagen", compressed);
    } catch {
      setError("Error al procesar la imagen");
    } finally {
      setImageProcessing(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const idValue = form.tipoId === "placa" ? form.placa : form.candado;
    if (!idValue || !/^\d+$/.test(idValue)) {
      setError(`${form.tipoId === "placa" ? "Placa" : "Candado"} es obligatorio y debe ser solo números`);
      setSaving(false);
      return;
    }
    if (!form.color.trim()) {
      setError("El color es obligatorio");
      setSaving(false);
      return;
    }

    try {
      const url = gallo ? `/api/gallos/${gallo.id}` : "/api/gallos";
      const method = gallo ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          placa: form.tipoId === "placa" ? parseInt(form.placa) : null,
          candado: form.tipoId === "candado" ? parseInt(form.candado) : null,
          criador_id: form.criador_id ? parseInt(form.criador_id) : null,
          color: form.color.trim(),
          imagen: form.imagen,
          cresta: form.cresta.trim() || null,
          patas: form.patas.trim() || null,
          pico: form.pico.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al guardar");
        return;
      }

      router.push("/gallos");
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!gallo) return;
    if (!confirm("¿Eliminar este gallo? Esta acción no se puede deshacer.")) return;
    setSaving(true);
    try {
      await fetch(`/api/gallos/${gallo.id}`, { method: "DELETE" });
      router.push("/gallos");
      router.refresh();
    } catch {
      setError("Error al eliminar");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-background text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const selectWrapClass = "flex gap-2";
  const selectClass =
    "flex-1 bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-background text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors appearance-none";
  const labelClass =
    "font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1 block";
  const segActive = "bg-primary text-on-primary-container border-primary";
  const segInactive = "bg-surface border border-outline-variant text-on-surface hover:bg-surface-container-high";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="text-sm text-error bg-error-container/40 border border-error/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      {/* Selector placa / candado + input */}
      <div>
        <label className={labelClass}>Tipo de llave *</label>
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => update("tipoId", "placa")}
            className={`flex-1 rounded-lg px-4 py-2.5 font-headline font-semibold text-sm transition-colors ${form.tipoId === "placa" ? segActive : segInactive}`}
          >
            Placa
          </button>
          <button
            type="button"
            onClick={() => update("tipoId", "candado")}
            className={`flex-1 rounded-lg px-4 py-2.5 font-headline font-semibold text-sm transition-colors ${form.tipoId === "candado" ? segActive : segInactive}`}
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
            onChange={(e) => update("placa", e.target.value)}
            required
            className={inputClass}
            placeholder="Ej: 100"
          />
        ) : (
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            value={form.candado}
            onChange={(e) => update("candado", e.target.value)}
            required
            className={inputClass}
            placeholder="Ej: 50"
          />
        )}
      </div>

      {/* Criador */}
      <div>
        <label className={labelClass}>Criador</label>
        <div className={selectWrapClass}>
          <select
            value={form.criador_id}
            onChange={(e) => update("criador_id", e.target.value)}
            className={selectClass}
          >
            <option value="">Seleccionar criador...</option>
            {criadores.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/criadores"
            label="criador"
            existingNames={criadores.map((c) => c.nombre)}
            onCreated={(nombre) => {
              setCriadores((prev) => [...prev, { id: -Math.floor(Math.random() * 100000), nombre, creado_en: "" }]
                .sort((a, b) => a.nombre.localeCompare(b.nombre)));
            }}
          />
        </div>
      </div>

      {/* Color */}
      <div>
        <label className={labelClass}>Color *</label>
        <div className={selectWrapClass}>
          <select
            value={form.color}
            onChange={(e) => update("color", e.target.value)}
            required
            className={selectClass}
          >
            <option value="">Seleccionar color...</option>
            {colores.map((c) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/colores"
            label="color"
            existingNames={colores.map((c) => c.nombre)}
            onCreated={(nombre) => {
              setColores((prev) => [...prev, { id: -Math.floor(Math.random() * 100000), nombre, creado_en: "" }]
                .sort((a, b) => a.nombre.localeCompare(b.nombre)));
            }}
          />
        </div>
      </div>

      {/* Imagen */}
      <div>
        <label className={labelClass}>Imagen del gallo (máx. 20MB)</label>
        <div className="flex flex-col items-center gap-3">
          {form.imagen && (
            <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border border-outline-variant bg-surface-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imagen} alt="Gallo" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => update("imagen", null)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 text-on-background flex items-center justify-center"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>close</span>
              </button>
            </div>
          )}
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute("capture", "environment");
                  fileInputRef.current.click();
                }
              }}
              disabled={imageProcessing}
              className="flex-1 bg-surface border border-outline-variant text-primary rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>photo_camera</span>
              Cámara
            </button>
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                }
              }}
              disabled={imageProcessing}
              className="flex-1 bg-surface border border-outline-variant text-primary rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>photo_library</span>
              Galería
            </button>
          </div>
          {imageProcessing && (
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Procesando imagen...
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Cresta */}
      <div>
        <label className={labelClass}>Cresta (opcional)</label>
        <div className={selectWrapClass}>
          <select
            value={form.cresta}
            onChange={(e) => update("cresta", e.target.value)}
            className={selectClass}
          >
            <option value="">Seleccionar cresta...</option>
            {crestas.map((c) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/crestas"
            label="cresta"
            existingNames={crestas.map((c) => c.nombre)}
            onCreated={(nombre) => {
              setCrestas((prev) => [...prev, { id: -Math.floor(Math.random() * 100000), nombre, creado_en: "" }]
                .sort((a, b) => a.nombre.localeCompare(b.nombre)));
            }}
          />
        </div>
      </div>

      {/* Patas */}
      <div>
        <label className={labelClass}>Patas (opcional)</label>
        <div className={selectWrapClass}>
          <select
            value={form.patas}
            onChange={(e) => update("patas", e.target.value)}
            className={selectClass}
          >
            <option value="">Seleccionar patas...</option>
            {patasList.map((c) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/patas"
            label="patas"
            existingNames={patasList.map((c) => c.nombre)}
            onCreated={(nombre) => {
              setPatasList((prev) => [...prev, { id: -Math.floor(Math.random() * 100000), nombre, creado_en: "" }]
                .sort((a, b) => a.nombre.localeCompare(b.nombre)));
            }}
          />
        </div>
      </div>

      {/* Pico */}
      <div>
        <label className={labelClass}>Pico (opcional)</label>
        <div className={selectWrapClass}>
          <select
            value={form.pico}
            onChange={(e) => update("pico", e.target.value)}
            className={selectClass}
          >
            <option value="">Seleccionar pico...</option>
            {picosList.map((c) => (
              <option key={c.id} value={c.nombre}>{c.nombre}</option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/picos"
            label="pico"
            existingNames={picosList.map((c) => c.nombre)}
            onCreated={(nombre) => {
              setPicosList((prev) => [...prev, { id: -Math.floor(Math.random() * 100000), nombre, creado_en: "" }]
                .sort((a, b) => a.nombre.localeCompare(b.nombre)));
            }}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 mt-3">
        <button
          type="submit"
          disabled={saving || imageProcessing}
          className="flex-1 bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-lg px-4 py-3 font-headline font-semibold text-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <>
              <span className="material-symbols-outlined">save</span>
              {gallo ? "Actualizar" : "Registrar"}
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 bg-surface border border-outline-variant text-on-surface rounded-lg py-3 font-headline font-semibold text-lg hover:bg-surface-container-high transition-colors"
        >
          Cancelar
        </button>
      </div>

      {gallo && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="text-error border border-error/30 rounded-lg px-4 py-3 font-medium hover:bg-error-container/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">delete</span>
          Eliminar gallo
        </button>
      )}
    </form>
  );
}