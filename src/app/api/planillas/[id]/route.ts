import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

type PlanillaRow = {
  id: number;
  gallo_id: number;
  fecha_trabajo: string;
  libras: number;
  onzas: number;
  salida: boolean;
  salida_cantidad: number | null;
  mona_muerta: boolean;
  mona_muerta_minutos: number | null;
  topa: boolean;
  topa_minutos: number | null;
  alas: boolean;
  alas_cantidad: number | null;
  pierna: boolean;
  pierna_cantidad: number | null;
  volteo: boolean;
  volteo_cantidad: number | null;
  correteo: boolean;
  correteo_tiempo: number | null;
  observaciones: string | null;
  vitamina: boolean;
  coccidia: boolean;
  purgante: boolean;
  enfermo_tipo: string | null;
  creado_por: number | null;
  creado_en: string;
  gallo_placa: number | null;
  gallo_candado: number | null;
  gallo_color: string | null;
};

function toIntOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const idNum = toIntOrNull(id);
  if (idNum === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { rows } = await sql<PlanillaRow>`
    SELECT p.id, p.gallo_id, p.fecha_trabajo, p.libras, p.onzas,
      p.salida, p.salida_cantidad, p.mona_muerta, p.mona_muerta_minutos,
      p.topa, p.topa_minutos, p.alas, p.alas_cantidad,
      p.pierna, p.pierna_cantidad, p.volteo, p.volteo_cantidad,
      p.correteo, p.correteo_tiempo, p.observaciones,
      p.vitamina, p.coccidia, p.purgante, p.enfermo_tipo,
      p.creado_por, p.creado_en,
      g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
    FROM planillas_de_trabajo p
    JOIN gallos g ON p.gallo_id = g.id
    WHERE p.id = ${idNum}`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Planilla no encontrada" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.rango !== "admin") {
    return NextResponse.json({ error: "Solo el admin puede eliminar planillas" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const idNum = toIntOrNull(id);
  if (idNum === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  await sql`DELETE FROM planillas_de_trabajo WHERE id = ${idNum}`;
  revalidatePath("/planillas");
  return NextResponse.json({ ok: true });
}
