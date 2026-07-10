import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { rows: totalRows } = await sql`SELECT COUNT(*)::int AS total FROM gallos`;
  const total = totalRows[0].total;

  const { rows: newRows } = await sql`SELECT COUNT(*)::int AS total FROM gallos WHERE creado_en >= now() - interval '30 days'`;
  const nuevos = newRows[0].total;

  const { rows: criadoresRows } = await sql`SELECT COUNT(*)::int AS total FROM criadores`;
  const criadores = criadoresRows[0].total;

  const { rows: recientes } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen,
    g.criado_en, c.nombre AS criador_nombre
    FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
    ORDER BY g.criado_en DESC LIMIT 6`;

  return NextResponse.json({ total, nuevos, criadores, recientes });
}