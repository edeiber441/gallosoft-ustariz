import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.rango !== "admin") {
    return NextResponse.json({ error: "Solo el admin puede editar usuarios" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const idNum = parseInt(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const body = await request.json();
  const { password, nombre } = body as { password?: string; nombre?: string };

  const nombreTrim = nombre !== undefined ? (nombre.trim() || null) : undefined;

  if ((!password || password.length < 4) && nombreTrim === undefined) {
    return NextResponse.json({ error: "Indica una contraseña (mín. 4 caracteres) o un nombre" }, { status: 400 });
  }

  if (password && password.length < 4) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 4 caracteres" }, { status: 400 });
  }

  if (password && nombreTrim !== undefined) {
    const hash = await bcrypt.hash(password, 10);
    await sql`UPDATE usuarios SET password = ${hash}, nombre = ${nombreTrim} WHERE id = ${idNum}`;
  } else if (password) {
    const hash = await bcrypt.hash(password, 10);
    await sql`UPDATE usuarios SET password = ${hash} WHERE id = ${idNum}`;
  } else {
    await sql`UPDATE usuarios SET nombre = ${nombreTrim} WHERE id = ${idNum}`;
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.rango !== "admin") {
    return NextResponse.json({ error: "Solo el admin puede eliminar usuarios" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const idNum = parseInt(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  if (idNum === session.id) {
    return NextResponse.json({ error: "No puedes eliminar tu propia cuenta" }, { status: 400 });
  }

  await sql`DELETE FROM usuarios WHERE id = ${idNum}`;
  return NextResponse.json({ ok: true });
}
