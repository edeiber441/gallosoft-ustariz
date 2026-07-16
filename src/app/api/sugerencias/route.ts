import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");

  if (session.rango === "admin") {
    // Admin ve todas
    if (estado && estado !== "todas") {
      const { rows } = await sql`
        SELECT s.id, s.gallo_id, s.usuario_id, s.payload, s.estado,
          s.revisado_por, s.revisado_en, s.creado_en,
          COALESCE(u.nombre, u.username) AS usuario_nombre,
          g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
        FROM sugerencias s
        LEFT JOIN usuarios u ON s.usuario_id = u.id
        LEFT JOIN gallos g ON s.gallo_id = g.id
        WHERE s.estado = ${estado}
        ORDER BY s.creado_en DESC`;
      return NextResponse.json(rows);
    }
    const { rows } = await sql`
      SELECT s.id, s.gallo_id, s.usuario_id, s.payload, s.estado,
        s.revisado_por, s.revisado_en, s.creado_en,
        u.username AS usuario_nombre,
        g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
      FROM sugerencias s
      LEFT JOIN usuarios u ON s.usuario_id = u.id
      LEFT JOIN gallos g ON s.gallo_id = g.id
      ORDER BY s.creado_en DESC`;
    return NextResponse.json(rows);
  }

  // Operador solo ve las suyas
  const { rows } = await sql`
    SELECT s.id, s.gallo_id, s.usuario_id, s.payload, s.estado,
      s.revisado_por, s.revisado_en, s.creado_en,
      u.username AS usuario_nombre,
      g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
    FROM sugerencias s
    LEFT JOIN usuarios u ON s.usuario_id = u.id
    LEFT JOIN gallos g ON s.gallo_id = g.id
    WHERE s.usuario_id = ${session.id}
    ORDER BY s.creado_en DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { gallo_id, payload } = body as { gallo_id?: number; payload?: Record<string, unknown> };

    if (!gallo_id || !Number.isFinite(gallo_id)) {
      return NextResponse.json({ error: "ID de gallo inválido" }, { status: 400 });
    }
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "Payload de cambios inválido" }, { status: 400 });
    }

    // Verificar que el gallo existe
    const { rows: galloRows } = await sql`SELECT id FROM gallos WHERE id = ${gallo_id}`;
    if (galloRows.length === 0) {
      return NextResponse.json({ error: "El gallo no existe" }, { status: 404 });
    }

    // No permitir sugerencias duplicadas pendientes para el mismo gallo+usuario
    const { rows: dup } = await sql`
      SELECT id FROM sugerencias
      WHERE gallo_id = ${gallo_id} AND usuario_id = ${session.id} AND estado = 'pendiente'`;
    if (dup.length > 0) {
      return NextResponse.json(
        { error: "Ya tienes una sugerencia pendiente para este gallo" },
        { status: 409 }
      );
    }

    const { rows } = await sql<{ id: number }>`
      INSERT INTO sugerencias (gallo_id, usuario_id, payload)
      VALUES (${gallo_id}, ${session.id}, ${JSON.stringify(payload)}::jsonb)
      RETURNING id`;

    revalidatePath("/sugerencias");
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
