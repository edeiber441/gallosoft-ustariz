"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Criador, Color, Cresta, Pata, Pico, Mama, Papa } from "@/lib/types";
import InlineOptionAdd from "@/components/InlineOptionAdd";

type Props = {
  gallo?: import("@/lib/types").Gallo | null;
};

type FormState = {
  tipoId: "placa" | "candado";
  placa: string;
  candado: string;
  usarSecundaria: boolean;
  criador_id: string;
  color: string;
  imagen: string | null;
  libras: string;
  onzas: string;
  cresta: string;
  patas: string;
  pico: string;
  mama: string;
  papa: string;
  marca_mes: string;
  marca_anio: string;
};

type CatalogState = {
  criadores: Criador[];
  colores: Color[];
  crestas: Cresta[];
  patas: Pata[];
  picos: Pico[];
  mamas: Mama[];
  papas: Papa[];
};

const EMPTY_CATALOG: CatalogState = {
  criadores: [],
  colores: [],
  crestas: [],
  patas: [],
  picos: [],
  mamas: [],
  papas: [],
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIM = 1024;
const IMAGE_QUALITY = 0.82;

const initialStateFromGallo = (gallo: import("@/lib/types").Gallo | null | undefined): FormState => {
  if (gallo) {
    const tienePlaca = gallo.placa != null;
    const tieneCandado = gallo.candado != null;
    return {
      tipoId: tienePlaca ? "placa" : "candado",
      placa: tienePlaca ? String(gallo.placa) : "",
      candado: tieneCandado ? String(gallo.candado) : "",
      usarSecundaria: tienePlaca && tieneCandado,
      criador_id: gallo.criador_id ? String(gallo.criador_id) : "",
      color: gallo.color ?? "",
      imagen: gallo.imagen ?? null,
      libras: String(gallo.libras ?? 4),
      onzas: String(gallo.onzas ?? 8),
      cresta: gallo.cresta ?? "",
      patas: gallo.patas ?? "",
      pico: gallo.pico ?? "",
      mama: gallo.mama ?? "",
      papa: gallo.papa ?? "",
      marca_mes: gallo.marca_mes != null ? String(gallo.marca_mes) : "",
      marca_anio: gallo.marca_anio != null ? String(gallo.marca_anio) : "",
    };
  }
  return {
    tipoId: "placa",
    placa: "",
    candado: "",
    usarSecundaria: false,
    criador_id: "",
    color: "",
    imagen: null,
    libras: "4",
    onzas: "8",
    cresta: "",
    patas: "",
    pico: "",
    mama: "",
    papa: "",
    marca_mes: "",
    marca_anio: "",
  };
};

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = (e) => {
      const dataUrl = e.target?.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("Lectura inválida"));
        return;
      }
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen inválida"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIM || height > MAX_IMAGE_DIM) {
          if (width >= height) {
            height = Math.max(1, Math.round((height * MAX_IMAGE_DIM) / width));
            width = MAX_IMAGE_DIM;
          } else {
            width = Math.max(1, Math.round((width * MAX_IMAGE_DIM) / height));
            height = MAX_IMAGE_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas no soportado"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export default function GalloForm({ gallo }: Props) {
  const [form, setForm] = useState<FormState>(() => initialStateFromGallo(gallo));
  const [catalog, setCatalog] = useState<CatalogState>(EMPTY_CATALOG);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/criadores").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/colores").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/crestas").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/patas").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/picos").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/mamas").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/papas").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([criadores, colores, crestas, patas, picos, mamas, papas]) => {
        if (cancelled) return;
        setCatalog({
          criadores: Array.isArray(criadores) ? criadores : [],
          colores: Array.isArray(colores) ? colores : [],
          crestas: Array.isArray(crestas) ? crestas : [],
          patas: Array.isArray(patas) ? patas : [],
          picos: Array.isArray(picos) ? picos : [],
          mamas: Array.isArray(mamas) ? mamas : [],
          papas: Array.isArray(papas) ? papas : [],
        });
      })
      .catch(() => {
        if (!cancelled) setCatalog(EMPTY_CATALOG);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateClient(state: FormState): string | null {
    const idValue = state.tipoId === "placa" ? state.placa : state.candado;
    if (!idValue || !/^\d+$/.test(idValue.trim())) {
      return state.tipoId === "placa"
        ? "La placa es obligatoria y debe ser solo números"
        : "El candado es obligatorio y debe ser solo números";
    }
    if (state.usarSecundaria) {
      const secValue = state.tipoId === "placa" ? state.candado : state.placa;
      const trimmed = secValue.trim();
      if (trimmed && !/^\d+$/.test(trimmed)) {
        return state.tipoId === "placa"
          ? "El candado secundario debe ser solo números"
          : "La placa secundaria debe ser solo números";
      }
    }
    if (!state.color.trim()) {
      return "El color es obligatorio";
    }
    // Marca: ambos vacíos o ambos llenos; mes 1-12, año 2000-2100.
    const mesTrim = state.marca_mes.trim();
    const anioTrim = state.marca_anio.trim();
    if ((mesTrim.length > 0) !== (anioTrim.length > 0)) {
      return "La marca debe tener mes y año completos, o ambos vacíos";
    }
    if (mesTrim) {
      if (!/^\d+$/.test(mesTrim)) return "El mes de la marca debe ser un número";
      const m = Number(mesTrim);
      if (m < 1 || m > 12) return "El mes de la marca debe estar entre 1 y 12";
      if (!/^\d+$/.test(anioTrim)) return "El año de la marca debe ser un número";
      const a = Number(anioTrim);
      if (a < 2000 || a > 2100) return "El año de la marca debe estar entre 2000 y 2100";
    }
    const libras = Number(state.libras);
    if (!Number.isInteger(libras) || libras < 1 || libras > 6) {
      return "Las libras deben estar entre 1 y 6";
    }
    const onzas = Number(state.onzas);
    if (!Number.isInteger(onzas) || onzas < 1 || onzas > 15) {
      return "Las onzas deben estar entre 1 y 15";
    }
    return null;
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("El archivo seleccionado no es una imagen");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError(`La imagen supera los ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}MB`);
      return;
    }

    setImageProcessing(true);
    setError(null);
    try {
      const dataUrl = await compressImage(file);
      update("imagen", dataUrl);
    } catch (err) {
      console.error("[GalloForm] compressImage:", err);
      setError(err instanceof Error ? err.message : "Error al procesar la imagen");
    } finally {
      setImageProcessing(false);
    }
  }

  function openCamera() {
    cameraInputRef.current?.click();
  }

  function openGallery() {
    fileInputRef.current?.click();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateClient(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const placaValue =
      form.tipoId === "placa"
        ? Number(form.placa)
        : form.usarSecundaria && form.placa.trim()
          ? Number(form.placa)
          : null;
    const candadoValue =
      form.tipoId === "candado"
        ? Number(form.candado)
        : form.usarSecundaria && form.candado.trim()
          ? Number(form.candado)
          : null;

    const marcaMes = form.marca_mes.trim();
    const marcaAnio = form.marca_anio.trim();

    const payload = {
      placa: placaValue,
      candado: candadoValue,
      criador_id: form.criador_id ? Number(form.criador_id) : null,
      color: form.color.trim(),
      imagen: form.imagen,
      libras: Number(form.libras),
      onzas: Number(form.onzas),
      cresta: form.cresta.trim() || null,
      patas: form.patas.trim() || null,
      pico: form.pico.trim() || null,
      mama: form.mama.trim() || null,
      papa: form.papa.trim() || null,
      marca_mes: marcaMes ? Number(marcaMes) : null,
      marca_anio: marcaAnio ? Number(marcaAnio) : null,
    };

    try {
      const url = gallo ? `/api/gallos/${gallo.id}` : "/api/gallos";
      const method = gallo ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (data as { error?: string }).error || `Error ${res.status}`;
        setError(msg);
        return;
      }

      router.push("/gallos");
      router.refresh();
    } catch (err) {
      console.error("[GalloForm] submit:", err);
      setError(
        err instanceof Error
          ? `No se pudo conectar con el servidor: ${err.message}`
          : "No se pudo conectar con el servidor"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!gallo) return;
    if (!confirm("¿Eliminar este gallo? Esta acción no se puede deshacer.")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/gallos/${gallo.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error || "No se pudo eliminar");
        setSaving(false);
        return;
      }
      router.push("/gallos");
      router.refresh();
    } catch (err) {
      console.error("[GalloForm] delete:", err);
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
            onClick={() => update("tipoId", "placa")}
            className={`flex-1 rounded-lg px-4 py-2.5 font-headline font-semibold text-sm transition-colors ${
              form.tipoId === "placa" ? segActive : segInactive
            }`}
          >
            Placa
          </button>
          <button
            type="button"
            onClick={() => update("tipoId", "candado")}
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
            onChange={(e) => update("placa", e.target.value)}
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
            onChange={(e) => update("candado", e.target.value)}
            className={inputClass}
            placeholder="Ej: 50"
            min={1}
          />
        )}

        <button
          type="button"
          onClick={() => update("usarSecundaria", !form.usarSecundaria)}
          className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
            {form.usarSecundaria ? "remove" : "add"}
          </span>
          {form.usarSecundaria ? "Quitar llave secundaria" : "Agregar llave secundaria (opcional)"}
        </button>

        {form.usarSecundaria && (
          <div className="mt-2">
            <label className={labelClass}>
              {form.tipoId === "placa" ? "Candado (opcional)" : "Placa (opcional)"}
            </label>
            {form.tipoId === "placa" ? (
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.candado}
                onChange={(e) => update("candado", e.target.value)}
                className={inputClass}
                placeholder="Ej: 50"
                min={1}
              />
            ) : (
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.placa}
                onChange={(e) => update("placa", e.target.value)}
                className={inputClass}
                placeholder="Ej: 100"
                min={1}
              />
            )}
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>Criador</label>
        <div className={selectWrapClass}>
          <select
            value={form.criador_id}
            onChange={(e) => update("criador_id", e.target.value)}
            className={selectClass}
            disabled={catalogLoading}
          >
            <option value="">Seleccionar criador...</option>
            {catalog.criadores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/criadores"
            label="criador"
            existingNames={catalog.criadores.map((c) => c.nombre)}
            onCreated={(item) => {
              const next = [
                ...catalog.criadores,
                { id: item.id, nombre: item.nombre, creado_en: "" },
              ].sort((a, b) => a.nombre.localeCompare(b.nombre));
              setCatalog((prev) => ({ ...prev, criadores: next }));
              update("criador_id", String(item.id));
            }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Color *</label>
        <div className={selectWrapClass}>
          <select
            value={form.color}
            onChange={(e) => update("color", e.target.value)}
            className={selectClass}
            disabled={catalogLoading}
            required
          >
            <option value="">Seleccionar color...</option>
            {catalog.colores.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/colores"
            label="color"
            existingNames={catalog.colores.map((c) => c.nombre)}
            onCreated={(item) => {
              const next = [
                ...catalog.colores,
                { id: item.id, nombre: item.nombre, creado_en: "" },
              ].sort((a, b) => a.nombre.localeCompare(b.nombre));
              setCatalog((prev) => ({ ...prev, colores: next }));
              update("color", item.nombre);
            }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Imagen (opcional, máx. 5MB)</label>
        <div className="flex flex-col items-center gap-3">
          {form.imagen ? (
            <div className="relative w-full max-w-[200px] aspect-square rounded-lg overflow-hidden border border-outline-variant bg-surface-container">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imagen}
                alt="Vista previa del gallo"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => update("imagen", null)}
                className="absolute top-1 right-1 w-7 h-7 rounded-full bg-black/70 text-on-background flex items-center justify-center"
                aria-label="Quitar imagen"
              >
                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                  close
                </span>
              </button>
            </div>
          ) : null}
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={openCamera}
              disabled={imageProcessing}
              className="flex-1 bg-surface border border-outline-variant text-primary rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                photo_camera
              </span>
              Cámara
            </button>
            <button
              type="button"
              onClick={openGallery}
              disabled={imageProcessing}
              className="flex-1 bg-surface border border-outline-variant text-primary rounded-lg px-3 py-2.5 text-sm font-medium flex items-center justify-center gap-1 hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                photo_library
              </span>
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
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Mama (opcional)</label>
        <div className={selectWrapClass}>
          <select
            value={form.mama}
            onChange={(e) => update("mama", e.target.value)}
            className={selectClass}
            disabled={catalogLoading}
          >
            <option value="">Seleccionar mama...</option>
            {catalog.mamas.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/mamas"
            label="mama"
            existingNames={catalog.mamas.map((c) => c.nombre)}
            onCreated={(item) => {
              const next = [
                ...catalog.mamas,
                { id: item.id, nombre: item.nombre, creado_en: "" },
              ].sort((a, b) => a.nombre.localeCompare(b.nombre));
              setCatalog((prev) => ({ ...prev, mamas: next }));
              update("mama", item.nombre);
            }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Papa (opcional)</label>
        <div className={selectWrapClass}>
          <select
            value={form.papa}
            onChange={(e) => update("papa", e.target.value)}
            className={selectClass}
            disabled={catalogLoading}
          >
            <option value="">Seleccionar papa...</option>
            {catalog.papas.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/papas"
            label="papa"
            existingNames={catalog.papas.map((c) => c.nombre)}
            onCreated={(item) => {
              const next = [
                ...catalog.papas,
                { id: item.id, nombre: item.nombre, creado_en: "" },
              ].sort((a, b) => a.nombre.localeCompare(b.nombre));
              setCatalog((prev) => ({ ...prev, papas: next }));
              update("papa", item.nombre);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Libras (1-6) *</label>
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
          <label className={labelClass}>Onzas (1-15) *</label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={15}
            value={form.onzas}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 15)) {
                update("onzas", v);
              }
            }}
            className={inputClass}
            placeholder="1-15"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Cresta (opcional)</label>
        <div className={selectWrapClass}>
          <select
            value={form.cresta}
            onChange={(e) => update("cresta", e.target.value)}
            className={selectClass}
            disabled={catalogLoading}
          >
            <option value="">Seleccionar cresta...</option>
            {catalog.crestas.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/crestas"
            label="cresta"
            existingNames={catalog.crestas.map((c) => c.nombre)}
            onCreated={(item) => {
              const next = [
                ...catalog.crestas,
                { id: item.id, nombre: item.nombre, creado_en: "" },
              ].sort((a, b) => a.nombre.localeCompare(b.nombre));
              setCatalog((prev) => ({ ...prev, crestas: next }));
              update("cresta", item.nombre);
            }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Patas (opcional)</label>
        <div className={selectWrapClass}>
          <select
            value={form.patas}
            onChange={(e) => update("patas", e.target.value)}
            className={selectClass}
            disabled={catalogLoading}
          >
            <option value="">Seleccionar patas...</option>
            {catalog.patas.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/patas"
            label="patas"
            existingNames={catalog.patas.map((c) => c.nombre)}
            onCreated={(item) => {
              const next = [
                ...catalog.patas,
                { id: item.id, nombre: item.nombre, creado_en: "" },
              ].sort((a, b) => a.nombre.localeCompare(b.nombre));
              setCatalog((prev) => ({ ...prev, patas: next }));
              update("patas", item.nombre);
            }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Pico (opcional)</label>
        <div className={selectWrapClass}>
          <select
            value={form.pico}
            onChange={(e) => update("pico", e.target.value)}
            className={selectClass}
            disabled={catalogLoading}
          >
            <option value="">Seleccionar pico...</option>
            {catalog.picos.map((c) => (
              <option key={c.id} value={c.nombre}>
                {c.nombre}
              </option>
            ))}
          </select>
          <InlineOptionAdd
            apiPath="/api/picos"
            label="pico"
            existingNames={catalog.picos.map((c) => c.nombre)}
            onCreated={(item) => {
              const next = [
                ...catalog.picos,
                { id: item.id, nombre: item.nombre, creado_en: "" },
              ].sort((a, b) => a.nombre.localeCompare(b.nombre));
              setCatalog((prev) => ({ ...prev, picos: next }));
              update("pico", item.nombre);
            }}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Marca (opcional, mes y año)</label>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            value={form.marca_mes}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 12)) {
                update("marca_mes", v);
              }
            }}
            className={inputClass}
            placeholder="Mes 1-12"
          />
          <input
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            value={form.marca_anio}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "" || /^\d+$/.test(v)) {
                update("marca_anio", v);
              }
            }}
            className={inputClass}
            placeholder="Año 2000-2100"
          />
        </div>
      </div>

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
          disabled={saving}
          className="px-6 bg-surface border border-outline-variant text-on-surface rounded-lg py-3 font-headline font-semibold text-lg hover:bg-surface-container-high transition-colors disabled:opacity-50"
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
