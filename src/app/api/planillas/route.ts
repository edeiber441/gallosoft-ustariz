import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type PlanillaRow = {
  id: number;
  gallo_id: number;
  fecha_trabajo: string;
  libras: number;
  onzas: number;
  salida: boolean;
  salida_cantidad: number | null;
  mona_muerta: boolean;
  mona_muerta_minutos: number | null;
  topa: boolean;
  topa_minutos: number | null;
  alas: boolean;
  alas_cantidad: number | null;
  creado_por: number | null;
  creado_en: string;
  gallo_placa: number | null;
  gallo_candado: number | null;
  gallo_color: string | null;
};

type PlanillaBody = {
  gallo_id?: number | string | null;
  placa?: number | string | null;
  candado?: number | string | null;
  libras?: number | string | null;
  onzas?: number | string | null;
  salida?: boolean | null;
  salida_cantidad?: number | string | null;
  mona_muerta?: boolean | null;
  mona_muerta_minutos?: number | string | null;
  topa?: boolean | null;
  topa_minutos?: number | string | null;
  alas?: boolean | null;
  alas_cantidad?: number | string | null;
};

function toIntOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return null;
    const n = Number(trimmed);
    if (Number.isFinite(n)) return Math.trunc(n);
  }
  return null;
}

function toBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1 || v === "1";
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const placa = toIntOrNull(searchParams.get("placa"));
  const candado = toIntOrNull(searchParams.get("candado"));

  if (placa !== null) {
    const { rows } = await sql<PlanillaRow>`
      SELECT p.id, p.gallo_id, p.fecha_trabajo, p.libras, p.onzas,
        p.salida, p.salida_cantidad, p.mona_muerta, p.mona_muerta_minutos,
        p.topa, p.topa_minutos, p.alas, p.alas_cantidad,
        p.creado_por, p.creado_en,
        g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
      FROM planillas_de_trabajo p
      JOIN gallos g ON p.gallo_id = g.id
      WHERE g.placa = ${placa}
      ORDER BY p.fecha_trabajo DESC`;
    return NextResponse.json(rows);
  }

  if (candado !== null) {
    const { rows } = await sql<PlanillaRow>`
      SELECT p.id, p.gallo_id, p.fecha_trabajo, p.libras, p.onzas,
        p.salida, p.salida_cantidad, p.mona_muerta, p.mona_muerta_minutos,
        p.topa, p.topa_minutos, p.alas, p.alas_cantidad,
        p.creado_por, p.creado_en,
        g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
      FROM planillas_de_trabajo p
      JOIN gallos g ON p.gallo_id = g.id
      WHERE g.candado = ${candado}
      ORDER BY p.fecha_trabajo DESC`;
    return NextResponse.json(rows);
  }

  const { rows } = await sql<PlanillaRow>`
    SELECT p.id, p.gallo_id, p.fecha_trabajo, p.libras, p.onzas,
      p.salida, p.salida_cantidad, p.mona_muerta, p.mona_muerta_minutos,
      p.topa, p.topa_minutos, p.alas, p.alas_cantidad,
      p.creado_por, p.creado_en,
      g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color
    FROM planillas_de_trabajo p
    JOIN gallos g ON p.gallo_id = g.id
    ORDER BY p.fecha_trabajo DESC
    LIMIT 100`;
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: PlanillaBody;
  try {
    body = (await request.json()) as PlanillaBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }

  const placaVal = toIntOrNull(body.placa);
  const candadoVal = toIntOrNull(body.candado);
  const galloIdDirect = toIntOrNull(body.gallo_id);

  if (galloIdDirect === null && placaVal === null && candadoVal === null) {
    return NextResponse.json(
      { error: "Debes indicar una placa o un candado para identificar el gallo" },
      { status: 400 }
    );
  }

  let galloId: number;
  if (galloIdDirect !== null) {
    const { rows: galloRows } = await sql<{ id: number }>`
      SELECT id FROM gallos WHERE id = ${galloIdDirect}`;
    if (galloRows.length === 0) {
      return NextResponse.json(
        { error: "El gallo seleccionado no existe." },
        { status: 404 }
      );
    }
    galloId = galloRows[0].id;
  } else {
    const { rows: galloRows } = await sql<{ id: number }>`
      SELECT id FROM gallos
      WHERE (${placaVal} IS NOT NULL AND placa = ${placaVal})
         OR (${candadoVal} IS NOT NULL AND candado = ${candadoVal})
      LIMIT 1`;
    if (galloRows.length === 0) {
      return NextResponse.json(
        { error: "No existe un gallo con esa placa o candado. Regístralo primero." },
        { status: 404 }
      );
    }
    galloId = galloRows[0].id;
  }

  const librasNum = toIntOrNull(body.libras);
  const onzasNum = toIntOrNull(body.onzas);
  if (librasNum === null || librasNum < 1 || librasNum > 6) {
    return NextResponse.json({ error: "Las libras deben estar entre 1 y 6" }, { status: 400 });
  }
  if (onzasNum === null || onzasNum < 0 || onzasNum > 15) {
    return NextResponse.json({ error: "Las onzas deben estar entre 0 y 15" }, { status: 400 });
  }

  const salida = toBool(body.salida);
  const monaMuerta = toBool(body.mona_muerta);
  const topa = toBool(body.topa);
  const alas = toBool(body.alas);

  const salidaCantidad = toIntOrNull(body.salida_cantidad);
  const monaMuertaMinutos = toIntOrNull(body.mona_muerta_minutos);
  const topaMinutos = toIntOrNull(body.topa_minutos);
  const alasCantidad = toIntOrNull(body.alas_cantidad);

  if (salida && (salidaCantidad === null || salidaCantidad < 0)) {
    return NextResponse.json({ error: "Si marca 'Salida' debe indicar una cantidad válida" }, { status: 400 });
  }
  if (monaMuerta && (monaMuertaMinutos === null || monaMuertaMinutos < 0)) {
    return NextResponse.json({ error: "Si marca 'Mona muerta' debe indicar los minutos" }, { status: 400 });
  }
  if (topa && (topaMinutos === null || topaMinutos < 0)) {
    return NextResponse.json({ error: "Si marca 'Topa' debe indicar los minutos" }, { status: 400 });
  }
  if (alas && (alasCantidad === null || alasCantidad < 0)) {
    return NextResponse.json({ error: "Si marca 'Alas' debe indicar una cantidad válida" }, { status: 400 });
  }

  try {
    const { rows } = await sql<{ id: number }>`
      INSERT INTO planillas_de_trabajo (
        gallo_id, fecha_trabajo, libras, onzas,
        salida, salida_cantidad,
        mona_muerta, mona_muerta_minutos,
        topa, topa_minutos,
        alas, alas_cantidad,
        creado_por
      )
      VALUES (
        ${galloId}, now(), ${librasNum}, ${onzasNum},
        ${salida}, ${salida ? salidaCantidad : null},
        ${monaMuerta}, ${monaMuerta ? monaMuertaMinutos : null},
        ${topa}, ${topa ? topaMinutos : null},
        ${alas}, ${alas ? alasCantidad : null},
        ${session.id}
      )
      RETURNING id`;

    revalidatePath("/planillas");
    return NextResponse.json({ ok: true, id: rows[0].id }, { status: 201 });
  } catch (err) {
    console.error("[/api/planillas POST]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
