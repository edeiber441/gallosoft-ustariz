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
  const body = await request.json();
  const { nombre } = body;

  if (!nombre || !nombre.trim()) {
    return NextResponse.json({ error: "El nombre de la mama es obligatorio" }, { status: 400 });
  }

  const nuevoNombre = nombre.trim();
  const { rows } = await sql<{ nombre: string }>`SELECT nombre FROM mamas WHERE id = ${parseInt(id)}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "La mama no existe" }, { status: 404 });
  }
  const nombreViejo = rows[0].nombre;

  await sql`UPDATE mamas SET nombre = ${nuevoNombre} WHERE id = ${parseInt(id)}`;
  if (nombreViejo !== nuevoNombre) {
    await sql`UPDATE gallos SET mama = ${nuevoNombre} WHERE mama = ${nombreViejo}`;
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
  await sql`DELETE FROM mamas WHERE id = ${parseInt(id)}`;
  revalidatePath("/criadores");
  return NextResponse.json({ ok: true });
}
