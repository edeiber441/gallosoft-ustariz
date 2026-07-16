import { sql } from "@/lib/db";
import Link from "next/link";
import PlanillaSearch from "@/components/PlanillaSearch";
import type { Planilla } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getPlanillas(searchParams: {
  placa?: string;
  candado?: string;
}): Promise<Planilla[]> {
  const { placa, candado } = searchParams;

  if (placa) {
    const { rows } = await sql`
      SELECT p.id, p.gallo_id, p.fecha_trabajo, p.libras, p.onzas,
        p.salida, p.salida_cantidad, p.mona_muerta, p.mona_muerta_minutos,
        p.topa, p.topa_minutos, p.alas, p.alas_cantidad,
        p.creado_por, p.creado_en,
        g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
      FROM planillas_de_trabajo p
      JOIN gallos g ON p.gallo_id = g.id
      WHERE g.placa = ${parseInt(placa)} ORDER BY p.fecha_trabajo DESC`;
    return rows as Planilla[];
  }

  if (candado) {
    const { rows } = await sql`
      SELECT p.id, p.gallo_id, p.fecha_trabajo, p.libras, p.onzas,
        p.salida, p.salida_cantidad, p.mona_muerta, p.mona_muerta_minutos,
        p.topa, p.topa_minutos, p.alas, p.alas_cantidad,
        p.creado_por, p.creado_en,
        g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
      FROM planillas_de_trabajo p
      JOIN gallos g ON p.gallo_id = g.id
      WHERE g.candado = ${parseInt(candado)} ORDER BY p.fecha_trabajo DESC`;
    return rows as Planilla[];
  }

  const { rows } = await sql`
    SELECT p.id, p.gallo_id, p.fecha_trabajo, p.libras, p.onzas,
      p.salida, p.salida_cantidad, p.mona_muerta, p.mona_muerta_minutos,
      p.topa, p.topa_minutos, p.alas, p.alas_cantidad,
      p.creado_por, p.creado_en,
      g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
    FROM planillas_de_trabajo p
    JOIN gallos g ON p.gallo_id = g.id
    ORDER BY p.fecha_trabajo DESC LIMIT 100`;
  return rows as Planilla[];
}

function fmtFecha(s: string): string {
  try {
    return new Date(s).toLocaleString("es", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return s;
  }
}

export default async function PlanillasPage({
  searchParams,
}: {
  searchParams: Promise<{ placa?: string; candado?: string }>;
}) {
  const params = await searchParams;
  let planillas: Planilla[] = [];
  try {
    planillas = await getPlanillas(params);
  } catch {
    planillas = [];
  }

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <h1 className="font-headline text-2xl font-bold text-on-background">
          Planilla de trabajo
        </h1>
        <Link
          href="/planillas/nuevo"
          className="bg-primary text-on-primary-container rounded-lg px-4 py-2 font-headline font-semibold flex items-center gap-1 hover:brightness-110 transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>add</span>
          Nueva
        </Link>
      </div>

      <PlanillaSearch initial={params} />

      <div className="mt-4 flex flex-col gap-3">
        {planillas.length === 0 ? (
          <div className="bg-surface border border-surface-variant rounded-lg p-6 text-center text-on-surface-variant">
            {Object.keys(params).length > 0
              ? "No se encontraron planillas con esos filtros."
              : "No hay planillas registradas todavía."}
          </div>
        ) : (
          planillas.map((p) => (
            <Link
              key={p.id}
              href={`/planillas/${p.id}`}
              className="bg-surface border border-surface-variant hover:border-primary transition-all rounded-lg p-3 flex items-center gap-4 group shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">edit_note</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-headline font-semibold text-lg text-on-surface truncate group-hover:text-primary transition-colors">
                  {p.gallo_placa != null ? `Placa ${p.gallo_placa}` : p.gallo_candado != null ? `Candado ${p.gallo_candado}` : "Sin llave"}
                </div>
                <div className="font-mono text-xs text-on-surface-variant mt-1 truncate">
                  {fmtFecha(p.fecha_trabajo)} • {p.gallo_color ?? "Sin color"}
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="px-2 py-1 rounded-full bg-surface-container-highest border border-surface-variant flex items-center gap-1">
                  <span className="font-mono text-xs text-on-surface" style={{ fontSize: "10px" }}>
                    {p.libras} lb {p.onzas} oz
                  </span>
                </div>
                <div className="flex gap-1 mt-1">
                  {p.salida && <Tag>S</Tag>}
                  {p.mona_muerta && <Tag>MM</Tag>}
                  {p.topa && <Tag>T</Tag>}
                  {p.alas && <Tag>A</Tag>}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary font-mono" style={{ fontSize: "9px" }}>
      {children}
    </span>
  );
}
