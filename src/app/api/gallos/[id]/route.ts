import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
    g.cresta, g.patas, g.pico, g.criado_en,
    c.id AS criador_id, c.nombre AS criador_nombre
    FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id WHERE g.id = ${parseInt(id)}`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Gallo no encontrado" }, { status: 404 });
  }

  return NextResponse.json(rows[0]);
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const body = await request.json();
    const { placa, candado, criador_id, color, imagen, libras, onzas, cresta, patas, pico } = body;

    const librasNum = Number(libras);
    const onzasNum = Number(onzas);
    if (!Number.isFinite(librasNum) || librasNum < 1 || librasNum > 6) {
      return NextResponse.json({ error: "Libras debe estar entre 1 y 6" }, { status: 400 });
    }
    if (!Number.isFinite(onzasNum) || onzasNum < 1 || onzasNum > 15) {
      return NextResponse.json({ error: "Onzas debe estar entre 1 y 15" }, { status: 400 });
    }

    const placaVal = placa != null && placa !== "" ? parseInt(placa) : null;
    const candadoVal = candado != null && candado !== "" ? parseInt(candado) : null;

    await sql`
      UPDATE gallos SET
        placa = ${placaVal},
        candado = ${candadoVal},
        criador_id = ${criador_id ? parseInt(criador_id) : null},
        color = ${color},
        imagen = ${imagen || null},
        libras = ${librasNum},
        onzas = ${onzasNum},
        cresta = ${cresta || null},
        patas = ${patas || null},
        pico = ${pico || null}
      WHERE id = ${parseInt(id)}`;

    revalidatePath("/gallos");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "La placa o el candado ya existen" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await sql`DELETE FROM gallos WHERE id = ${parseInt(id)}`;
  revalidatePath("/gallos");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}