import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { actual, nueva } = body as { actual?: string; nueva?: string };

    if (!actual || !nueva) {
      return NextResponse.json({ error: "Debes ingresar la contraseña actual y la nueva" }, { status: 400 });
    }
    if (nueva.length < 4) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 4 caracteres" }, { status: 400 });
    }

    const { rows } = await sql<{ password: string }>`
      SELECT password FROM usuarios WHERE id = ${session.id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const valid = await bcrypt.compare(actual, rows[0].password);
    if (!valid) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 403 });
    }

    const hash = await bcrypt.hash(nueva, 10);
    await sql`UPDATE usuarios SET password = ${hash} WHERE id = ${session.id}`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
