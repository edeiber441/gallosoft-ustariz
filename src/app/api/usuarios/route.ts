import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.rango !== "admin") {
    return NextResponse.json({ error: "Solo el admin puede gestionar usuarios" }, { status: 403 });
  }

  const { rows } = await sql`SELECT id, username, nombre, rango, creado_en FROM usuarios ORDER BY creado_en ASC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.rango !== "admin") {
    return NextResponse.json({ error: "Solo el admin puede crear usuarios" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { cedula, password, nombre } = body as { cedula?: string; password?: string; nombre?: string };

    if (!cedula || !cedula.trim()) {
      return NextResponse.json({ error: "La cédula es obligatoria" }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 4 caracteres" }, { status: 400 });
    }

    const cedulaTrim = cedula.trim();
    const nombreTrim = nombre?.trim() || null;
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await sql<{ id: number; username: string }>`
      INSERT INTO usuarios (username, nombre, password, rango)
      VALUES (${cedulaTrim}, ${nombreTrim}, ${hash}, 'gallero')
      RETURNING id, username
    `;
    return NextResponse.json({ id: rows[0].id, username: rows[0].username, nombre: nombreTrim, rango: "gallero" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Ya existe un usuario con esa cédula" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
