import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { rows } = await sql`SELECT id, nombre, creado_en FROM crestas ORDER BY nombre ASC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || !nombre.trim()) {
      return NextResponse.json({ error: "El nombre de la cresta es obligatorio" }, { status: 400 });
    }

    const { rows } = await sql`INSERT INTO crestas (nombre) VALUES (${nombre.trim()}) RETURNING id, nombre`;
    revalidatePath("/criadores");
    return NextResponse.json(rows[0]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "La cresta ya existe" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}