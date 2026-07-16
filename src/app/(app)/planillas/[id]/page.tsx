import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import PlanillaDetail from "@/components/PlanillaDetail";
import type { Planilla } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PlanillaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const isAdmin = session?.rango === "admin";

  let planilla: Planilla | null = null;
  try {
    const { rows } = await sql`
      SELECT p.id, p.gallo_id, p.fecha_trabajo, p.libras, p.onzas,
        p.salida, p.salida_cantidad, p.mona_muerta, p.mona_muerta_minutos,
        p.topa, p.topa_minutos, p.alas, p.alas_cantidad,
        p.creado_por, p.creado_en,
        g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
      FROM planillas_de_trabajo p
      JOIN gallos g ON p.gallo_id = g.id
      WHERE p.id = ${parseInt(id)}`;
    if (rows.length > 0) planilla = rows[0] as Planilla;
  } catch {
    planilla = null;
  }

  if (!planilla) {
    return (
      <div className="bg-surface border border-surface-variant rounded-lg p-6 text-center text-on-surface-variant">
        Planilla no encontrada.
      </div>
    );
  }

  return (
    <>
      <h1 className="font-headline text-2xl font-bold text-on-background mb-2">
        Planilla de trabajo
      </h1>
      <PlanillaDetail planilla={planilla} canDelete={isAdmin} />
    </>
  );
}
