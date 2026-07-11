import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const placa = searchParams.get("placa");
  const candado = searchParams.get("candado");
  const criador = searchParams.get("criador");

  if (placa) {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
      g.cresta, g.patas, g.pico, g.criado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE g.placa = ${parseInt(placa)} ORDER BY g.criado_en DESC`;
    return NextResponse.json(rows);
  }

  if (candado) {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
      g.cresta, g.patas, g.pico, g.criado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE g.candado = ${parseInt(candado)} ORDER BY g.criado_en DESC`;
    return NextResponse.json(rows);
  }

  if (criador) {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
      g.cresta, g.patas, g.pico, g.criado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE c.nombre ILIKE ${"%" + criador + "%"} ORDER BY g.criado_en DESC`;
    return NextResponse.json(rows);
  }

  const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
    g.cresta, g.patas, g.pico, g.criado_en,
    c.id AS criador_id, c.nombre AS criador_nombre
    FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id ORDER BY g.criado_en DESC`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { placa, candado, criador_id, color, imagen, libras, onzas, cresta, patas, pico } = body;

    if (!color || (!placa && !candado)) {
      return NextResponse.json({ error: "Debes registrar al menos placa o candado, y el color es obligatorio" }, { status: 400 });
    }

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

    const { rows } = await sql`
      INSERT INTO gallos (placa, candado, criador_id, color, imagen, libras, onzas, cresta, patas, pico, creado_por)
      VALUES (${placaVal}, ${candadoVal}, ${criador_id ? parseInt(criador_id) : null},
        ${color}, ${imagen || null}, ${librasNum}, ${onzasNum},
        ${cresta || null}, ${patas || null}, ${pico || null}, ${session.id})
      RETURNING id`;

    revalidatePath("/gallos");
    revalidatePath("/");
    return NextResponse.json({ ok: true, id: rows[0].id });
  } catch (err) {
    console.error("[/api/gallos POST]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("unique")) {
      return NextResponse.json({ error: "La placa o el candado ya existen" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}