import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Endpoint combinado: devuelve todos los catálogos del formulario de gallos
// en una sola petición (antes eran 7 requests paralelos).
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const uid = session.id;

  try {
    const [
      criadores,
      colores,
      crestas,
      patas,
      picos,
      mamas,
      papas,
    ] = await Promise.all([
      sql`SELECT id, nombre, creado_en FROM criadores ORDER BY nombre ASC`,
      sql`SELECT id, nombre, creado_en FROM colores ORDER BY nombre ASC`,
      sql`SELECT id, nombre, creado_en FROM crestas ORDER BY nombre ASC`,
      sql`SELECT id, nombre, creado_en FROM patas ORDER BY nombre ASC`,
      sql`SELECT id, nombre, creado_en FROM picos ORDER BY nombre ASC`,
      sql`SELECT id, nombre, usuario_id, creado_en FROM mamas
          WHERE usuario_id IS NULL OR usuario_id = ${uid} ORDER BY nombre ASC`,
      sql`SELECT id, nombre, usuario_id, creado_en FROM papas
          WHERE usuario_id IS NULL OR usuario_id = ${uid} ORDER BY nombre ASC`,
    ]);

    return NextResponse.json({
      criadores: criadores.rows,
      colores: colores.rows,
      crestas: crestas.rows,
      patas: patas.rows,
      picos: picos.rows,
      mamas: mamas.rows,
      papas: papas.rows,
    });
  } catch (err) {
    console.error("[/api/catalog GET]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
