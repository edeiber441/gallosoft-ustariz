import { sql } from "@/lib/db";
import Link from "next/link";
import GalloSearch from "@/components/GalloSearch";
import type { Gallo } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getGallos(searchParams: { placa?: string; candado?: string; criador_id?: string }): Promise<Gallo[]> {
  const { placa, candado, criador_id } = searchParams;

  if (placa) {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
      g.cresta, g.patas, g.pico, g.mama, g.papa, g.creado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE g.placa = ${parseInt(placa)} ORDER BY g.creado_en DESC`;
    return rows as Gallo[];
  }

  if (candado) {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
      g.cresta, g.patas, g.pico, g.mama, g.papa, g.creado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE g.candado = ${parseInt(candado)} ORDER BY g.creado_en DESC`;
    return rows as Gallo[];
  }

  if (criador_id) {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
      g.cresta, g.patas, g.pico, g.mama, g.papa, g.creado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE c.id = ${parseInt(criador_id)} ORDER BY g.creado_en DESC`;
    return rows as Gallo[];
  }

  const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
    g.cresta, g.patas, g.pico, g.mama, g.papa, g.creado_en,
    c.id AS criador_id, c.nombre AS criador_nombre
    FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id ORDER BY g.creado_en DESC`;
  return rows as Gallo[];
}

export default async function GallosPage({
  searchParams,
}: {
  searchParams: Promise<{ placa?: string; candado?: string; criador_id?: string }>;
}) {
  const params = await searchParams;
  let gallos: Gallo[] = [];
  try {
    gallos = await getGallos(params);
  } catch {
    gallos = [];
  }

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

      <GalloSearch initial={params} />

      <div className="mt-4 flex flex-col gap-3">
        {gallos.length === 0 ? (
          <div className="bg-surface border border-surface-variant rounded-lg p-6 text-center text-on-surface-variant">
            {Object.keys(params).length > 0
              ? "No se encontraron gallos con esos filtros."
              : "No hay gallos registrados todavía."}
          </div>
        ) : (
          gallos.map((g) => (
            <Link
              key={g.id}
              href={`/gallos/${g.id}`}
              className="bg-surface border border-surface-variant hover:border-primary transition-all rounded-lg p-3 flex items-center gap-4 group shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
            >
              <div className="w-14 h-14 shrink-0 rounded bg-surface-container-highest overflow-hidden border border-outline-variant/30 flex items-center justify-center">
                {g.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.imagen} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
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
          ))
        )}
      </div>
    </>
  );
}