import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const idNum = parseInt(id);
  const body = await request.json();
  const { nombre } = body;

  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre del papa es obligatorio" }, { status: 400 });
  }

  const nuevoNombre = nombre.trim();
  const { rows } = await sql<{ nombre: string; usuario_id: number | null }>`
    SELECT nombre, usuario_id FROM papas WHERE id = ${idNum}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "El papa no existe" }, { status: 404 });
  }

  const nombreViejo = rows[0].nombre;
  const dueno = rows[0].usuario_id;
  if (dueno !== session.id && session.rango !== "admin") {
    return NextResponse.json({ error: "No tienes permiso para editar este papa" }, { status: 403 });
  }

  await sql`UPDATE papas SET nombre = ${nuevoNombre} WHERE id = ${idNum}`;
  if (nombreViejo !== nuevoNombre) {
    await sql`UPDATE gallos SET papa = ${nuevoNombre} WHERE papa = ${nombreViejo}`;
  }
  revalidatePath("/criadores");
  revalidatePath("/gallos");
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const idNum = parseInt(id);

  const { rows } = await sql<{ usuario_id: number | null }>`SELECT usuario_id FROM papas WHERE id = ${idNum}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "El papa no existe" }, { status: 404 });
  }
  if (rows[0].usuario_id !== session.id && session.rango !== "admin") {
    return NextResponse.json({ error: "No tienes permiso para eliminar este papa" }, { status: 403 });
  }

  await sql`DELETE FROM papas WHERE id = ${idNum}`;
  revalidatePath("/criadores");
  return NextResponse.json({ ok: true });
}
