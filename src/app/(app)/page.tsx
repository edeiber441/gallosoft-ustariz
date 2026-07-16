import { sql } from "@/lib/db";
import Link from "next/link";
import type { Stats } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getStats(): Promise<Stats> {
  const { rows: totalRows } = await sql`SELECT COUNT(*)::int AS total FROM gallos`;
  const total = totalRows[0].total as number;

  const { rows: recientes } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
    g.creado_en, c.nombre AS criador_nombre
    FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
    ORDER BY g.creado_en DESC LIMIT 6`;

  return { total, recientes: recientes as unknown as Stats["recientes"] };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  const mins = Math.floor(diff / 60000);
  return `${mins}min`;
}

export default async function DashboardPage() {
  let stats: Stats;
  try {
    stats = await getStats();
  } catch {
    stats = { total: 0, recientes: [] };
  }

  return (
    <>
      <section className="bg-surface rounded-xl p-6 gold-edge shadow-[0_4px_16px_rgba(0,0,0,0.6)] relative overflow-hidden min-h-[140px] flex flex-col justify-between">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex justify-between items-start">
          <span className="font-mono text-xs text-on-surface-variant uppercase tracking-widest">
            Total Gallos
          </span>
          <span className="material-symbols-outlined text-primary">analytics</span>
        </div>
        <div className="relative z-10 mt-auto pt-4">
          <div className="font-headline text-5xl font-extrabold text-primary tracking-tight">
            {stats.total.toLocaleString("es")}
          </div>
          <div className="text-base text-on-surface flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
            Roster activo
          </div>
        </div>
      </section>

      <section className="w-full mt-2">
        <div className="flex gap-3 overflow-x-auto snap-x hide-scrollbar pb-1">
          <Link
            href="/gallos"
            className="snap-start shrink-0 bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-lg px-6 py-3 font-headline font-semibold text-lg flex items-center gap-2 hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined">search</span>
            Buscar gallo
          </Link>
          <Link
            href="/gallos/nuevo"
            className="snap-start shrink-0 bg-transparent border border-primary text-primary rounded-lg px-6 py-3 font-headline font-semibold text-lg flex items-center gap-2 hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined">add</span>
            Registrar nuevo
          </Link>
          <a
            href="/api/export"
            className="snap-start shrink-0 bg-surface border border-outline-variant text-on-surface rounded-lg px-6 py-3 font-headline font-semibold text-lg flex items-center gap-2 hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">description</span>
            Exportar CSV
          </a>
          <Link
            href="/planillas"
            className="snap-start shrink-0 bg-transparent border border-primary text-primary rounded-lg px-6 py-3 font-headline font-semibold text-lg flex items-center gap-2 hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined">edit_note</span>
            Planilla de trabajo
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-3 mt-2">
        <div className="flex justify-between items-end mb-1">
          <h2 className="font-headline text-xl font-semibold text-on-background">
            Registros recientes
          </h2>
          <Link href="/gallos" className="font-mono text-xs text-primary uppercase tracking-widest">
            Ver todos
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {stats.recientes.length === 0 && (
            <div className="bg-surface border border-surface-variant rounded-lg p-4 text-center text-on-surface-variant">
              No hay gallos registrados todavía. ¡Crea el primero!
            </div>
          )}
          {stats.recientes.map((g) => (
            <Link
              key={g.id}
              href={`/gallos/${g.id}`}
              className="bg-surface border border-surface-variant hover:border-primary transition-all rounded-lg p-3 flex items-center gap-4 cursor-pointer group shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
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
                  {g.criador_nombre || "Sin criador"} • {g.color}
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <div className="px-2 py-1 rounded-full bg-surface-container-highest border border-surface-variant flex items-center gap-1 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span className="font-mono text-xs text-on-surface" style={{ fontSize: "10px" }}>
                    {g.libras} lb {g.onzas} oz
                  </span>
                </div>
                <span className="font-mono text-xs text-outline" style={{ fontSize: "10px" }}>
                  {timeAgo(g.creado_en)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}