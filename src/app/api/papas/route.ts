import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { rows } = await sql`
    SELECT id, nombre, usuario_id, creado_en FROM papas
    WHERE usuario_id IS NULL OR usuario_id = ${session.id}
    ORDER BY nombre ASC`;
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
      return NextResponse.json({ error: "El nombre del papa es obligatorio" }, { status: 400 });
    }

    const { rows } = await sql<{ id: number; nombre: string }>`
      INSERT INTO papas (nombre, usuario_id)
      VALUES (${nombre.trim()}, ${session.id})
      RETURNING id, nombre
    `;
    revalidatePath("/criadores");
    return NextResponse.json(rows[0]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "El papa ya existe" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
