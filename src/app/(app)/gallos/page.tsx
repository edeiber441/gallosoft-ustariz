import { sql } from "@/lib/db";
import Link from "next/link";
import { Suspense } from "react";
import GalloSearch from "@/components/GalloSearch";
import type { Criador, GalloListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 60;

type SearchParams = { placa?: string; candado?: string; criador_id?: string };

async function getGallos(params: SearchParams): Promise<GalloListItem[]> {
  const { placa, candado, criador_id } = params;

  if (placa) {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color,
      (g.imagen IS NOT NULL) AS tiene_imagen,
      g.libras, g.onzas, g.creado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE g.placa = ${parseInt(placa)} ORDER BY g.creado_en DESC`;
    return rows as unknown as GalloListItem[];
  }

  if (candado) {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color,
      (g.imagen IS NOT NULL) AS tiene_imagen,
      g.libras, g.onzas, g.creado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE g.candado = ${parseInt(candado)} ORDER BY g.creado_en DESC`;
    return rows as unknown as GalloListItem[];
  }

  if (criador_id) {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color,
      (g.imagen IS NOT NULL) AS tiene_imagen,
      g.libras, g.onzas, g.creado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE c.id = ${parseInt(criador_id)} ORDER BY g.creado_en DESC LIMIT ${PAGE_SIZE}`;
    return rows as unknown as GalloListItem[];
  }

  const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color,
    (g.imagen IS NOT NULL) AS tiene_imagen,
    g.libras, g.onzas, g.creado_en,
    c.id AS criador_id, c.nombre AS criador_nombre
    FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
    ORDER BY g.creado_en DESC LIMIT ${PAGE_SIZE}`;
  return rows as unknown as GalloListItem[];
}

async function getCriadores(): Promise<Criador[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM criadores ORDER BY nombre ASC`;
  return rows as Criador[];
}

export default async function GallosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  // Disparar ambas queries en paralelo: la lista se pasa como Promise al
  // Suspense boundary para que el formulario de búsqueda se muestre al instante.
  const gallosPromise = getGallos(params).catch(() => [] as GalloListItem[]);
  const criadores = await getCriadores().catch(() => [] as Criador[]);

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-headline text-2xl font-bold text-on-background">
          Buscar gallos
        </h1>
        <Link
          href="/gallos/nuevo"
          className="bg-primary text-on-primary-container rounded-lg px-4 py-2 font-headline font-semibold flex items-center gap-1 hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
          Nuevo
        </Link>
      </div>

      <GalloSearch initial={params} criadores={criadores} />

      <div className="mt-4 flex flex-col gap-3">
        <Suspense fallback={<GallosListSkeleton />}>
          <GallosList gallosPromise={gallosPromise} hasFilters={Object.keys(params).length > 0} />
        </Suspense>
      </div>
    </>
  );
}

function GallosListSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse" aria-busy="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-surface border border-surface-variant rounded-lg p-3 flex items-center gap-4" style={{ minHeight: "76px" }}>
          <div className="w-14 h-14 rounded bg-surface-container-highest" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-32 rounded bg-surface-container-high" />
            <div className="h-3 w-48 rounded bg-surface-container-high" />
          </div>
        </div>
      ))}
      <span className="sr-only">Cargando gallos…</span>
    </div>
  );
}

async function GallosList({
  gallosPromise,
  hasFilters,
}: {
  gallosPromise: Promise<GalloListItem[]>;
  hasFilters: boolean;
}) {
  const gallos = await gallosPromise;

  if (gallos.length === 0) {
    return (
      <div className="bg-surface border border-surface-variant rounded-lg p-6 text-center text-on-surface-variant">
        {hasFilters
          ? "No se encontraron gallos con esos filtros."
          : "No hay gallos registrados todavía."}
      </div>
    );
  }

  return (
    <>
      {gallos.map((g) => (
        <Link
          key={g.id}
          href={`/gallos/${g.id}`}
          className="bg-surface border border-surface-variant hover:border-primary transition-all rounded-lg p-3 flex items-center gap-4 group shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
        >
          <div className="w-14 h-14 shrink-0 rounded bg-surface-container-highest overflow-hidden border border-outline-variant/30 flex items-center justify-center">
            {g.tiene_imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/gallos/${g.id}/imagen`}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
            ) : (
              <span className="material-symbols-outlined text-on-surface-variant">image</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-headline font-semibold text-lg text-on-surface truncate group-hover:text-primary transition-colors">
              {g.placa != null ? `Placa ${g.placa}` : g.candado != null ? `Candado ${g.candado}` : "Sin llave"}
            </div>
            <div className="font-mono text-xs text-on-surface-variant mt-1 truncate">
              {g.placa != null && g.candado != null
                ? `Candado: ${g.candado}`
                : g.placa != null
                  ? "Sin candado"
                  : g.candado != null
                    ? "Sin placa"
                    : ""} • {g.criador_nombre || "Sin criador"} • {g.color}
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <div className="px-2 py-1 rounded-full bg-surface-container-highest border border-surface-variant flex items-center gap-1 mb-1">
              <span className="font-mono text-xs text-on-surface" style={{ fontSize: "10px" }}>
                {g.libras} lb {g.onzas} oz
              </span>
            </div>
          </div>
        </Link>
      ))}
    </>
  );
}
