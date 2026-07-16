import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

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

function toTrimmedString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.rango !== "admin") {
    return NextResponse.json({ error: "Solo el admin puede revisar sugerencias" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const idNum = parseInt(id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: { accion: "aceptar" | "rechazar" };
  try {
    body = (await request.json()) as { accion: "aceptar" | "rechazar" };
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  if (body.accion !== "aceptar" && body.accion !== "rechazar") {
    return NextResponse.json({ error: "Acción inválida (usar 'aceptar' o 'rechazar')" }, { status: 400 });
  }

  // Obtener la sugerencia
  const { rows: sugRows } = await sql<{ payload: Record<string, unknown>; gallo_id: number; estado: string }>`
    SELECT payload, gallo_id, estado FROM sugerencias WHERE id = ${idNum}`;
  if (sugRows.length === 0) {
    return NextResponse.json({ error: "Sugerencia no encontrada" }, { status: 404 });
  }
  if (sugRows[0].estado !== "pendiente") {
    return NextResponse.json({ error: "Esta sugerencia ya fue revisada" }, { status: 400 });
  }

  if (body.accion === "rechazar") {
    await sql`
      UPDATE sugerencias SET estado = 'rechazada', revisado_por = ${session.id}, revisado_en = now()
      WHERE id = ${idNum}`;
    revalidatePath("/sugerencias");
    return NextResponse.json({ ok: true });
  }

  // Aceptar: aplicar los cambios al gallo
  const p = sugRows[0].payload;
  const galloId = sugRows[0].gallo_id;

  const placaVal = toIntOrNull(p.placa);
  const candadoVal = toIntOrNull(p.candado);
  const criadorIdVal = toIntOrNull(p.criador_id);
  const color = toTrimmedString(p.color);
  const cresta = toTrimmedString(p.cresta);
  const patas = toTrimmedString(p.patas);
  const pico = toTrimmedString(p.pico);
  const mama = toTrimmedString(p.mama);
  const papa = toTrimmedString(p.papa);
  const marcaMes = toIntOrNull(p.marca_mes);
  const marcaAnio = toIntOrNull(p.marca_anio);
  const librasNum = toIntOrNull(p.libras);
  const onzasNum = toIntOrNull(p.onzas);
  const imagen = typeof p.imagen === "string" && p.imagen.length > 0 ? p.imagen : null;

  try {
    await sql`
      UPDATE gallos SET
        placa = ${placaVal},
        candado = ${candadoVal},
        criador_id = ${criadorIdVal},
        color = ${color},
        imagen = ${imagen},
        libras = ${librasNum},
        onzas = ${onzasNum},
        cresta = ${cresta},
        patas = ${patas},
        pico = ${pico},
        mama = ${mama},
        papa = ${papa},
        marca_mes = ${marcaMes},
        marca_anio = ${marcaAnio}
      WHERE id = ${galloId}`;

    await sql`
      UPDATE sugerencias SET estado = 'aceptada', revisado_por = ${session.id}, revisado_en = now()
      WHERE id = ${idNum}`;

    revalidatePath("/sugerencias");
    revalidatePath("/gallos");
    revalidatePath(`/gallos/${galloId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    if (msg.includes("gallos_placa_key") || msg.includes("gallos_candado_key")) {
      return NextResponse.json({ error: "Ya existe otro gallo con esa placa o candado" }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
