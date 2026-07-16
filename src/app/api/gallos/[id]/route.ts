import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql, type GalloRow } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

type GalloBody = {
  placa?: number | string | null;
  candado?: number | string | null;
  criador_id?: number | string | null;
  color?: string | null;
  imagen?: string | null;
  libras?: number | string | null;
  onzas?: number | string | null;
  cresta?: string | null;
  patas?: string | null;
  pico?: string | null;
  mama?: string | null;
  papa?: string | null;
  marca_mes?: number | string | null;
  marca_anio?: number | string | null;
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

function toTrimmedString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function isValidImageDataUrl(v: string): boolean {
  if (v.length > 20 * 1024 * 1024) return false;
  return /^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v);
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const idNum = toIntOrNull(id);
  if (idNum === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { rows } = await sql<GalloRow>`
    SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
      g.cresta, g.patas, g.pico, g.mama, g.papa, g.marca_mes, g.marca_anio, g.creado_en,
      c.id AS criador_id, c.nombre AS criador_nombre
    FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
    WHERE g.id = ${idNum}`;

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
  const idNum = toIntOrNull(id);
  if (idNum === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: GalloBody;
  try {
    body = (await request.json()) as GalloBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo de la petición inválido" }, { status: 400 });
  }

  const placaVal = toIntOrNull(body.placa);
  const candadoVal = toIntOrNull(body.candado);
  const criadorIdVal = toIntOrNull(body.criador_id);
  const color = toTrimmedString(body.color);
  const cresta = toTrimmedString(body.cresta);
  const patas = toTrimmedString(body.patas);
  const pico = toTrimmedString(body.pico);
  const mama = toTrimmedString(body.mama);
  const papa = toTrimmedString(body.papa);
  const marcaMesVal = toIntOrNull(body.marca_mes);
  const marcaAnioVal = toIntOrNull(body.marca_anio);

  if (placaVal === null && candadoVal === null) {
    return NextResponse.json(
      { error: "Debes mantener al menos una placa o un candado" },
      { status: 400 }
    );
  }
  if (!color) {
    return NextResponse.json({ error: "El color es obligatorio" }, { status: 400 });
  }

  if ((marcaMesVal === null) !== (marcaAnioVal === null)) {
    return NextResponse.json(
      { error: "La marca debe tener mes y año completos, o ambos vacíos" },
      { status: 400 }
    );
  }
  if (marcaMesVal !== null && (marcaMesVal < 1 || marcaMesVal > 12)) {
    return NextResponse.json({ error: "El mes de la marca debe estar entre 1 y 12" }, { status: 400 });
  }
  if (marcaAnioVal !== null && (marcaAnioVal < 2000 || marcaAnioVal > 2100)) {
    return NextResponse.json({ error: "El año de la marca debe estar entre 2000 y 2100" }, { status: 400 });
  }

  const librasNum = toIntOrNull(body.libras);
  const onzasNum = toIntOrNull(body.onzas);
  if (librasNum === null || librasNum < 1 || librasNum > 6) {
    return NextResponse.json({ error: "Las libras deben estar entre 1 y 6" }, { status: 400 });
  }
  if (onzasNum === null || onzasNum < 1 || onzasNum > 15) {
    return NextResponse.json({ error: "Las onzas deben estar entre 1 y 15" }, { status: 400 });
  }

  const imagenRaw = body.imagen;
  let imagen: string | null = null;
  if (imagenRaw === null) {
    imagen = null;
  } else if (typeof imagenRaw === "string" && imagenRaw.length > 0) {
    if (!isValidImageDataUrl(imagenRaw)) {
      return NextResponse.json(
        { error: "La imagen debe ser un data URL JPEG/PNG/WebP válido (máx. 20MB)" },
        { status: 400 }
      );
    }
    imagen = imagenRaw;
  }

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
        marca_mes = ${marcaMesVal},
        marca_anio = ${marcaAnioVal}
      WHERE id = ${idNum}`;

    revalidatePath("/gallos");
    revalidatePath("/");
    revalidatePath(`/gallos/${idNum}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/gallos/[id] PUT]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";

    if (msg.includes("gallos_placa_key") || msg.includes("gallos_candado_key")) {
      return NextResponse.json(
        { error: "Ya existe otro gallo con esa placa o candado" },
        { status: 409 }
      );
    }
    if (msg.includes("gallos_libras_check")) {
      return NextResponse.json({ error: "Las libras deben estar entre 1 y 6" }, { status: 400 });
    }
    if (msg.includes("gallos_onzas_check")) {
      return NextResponse.json({ error: "Las onzas deben estar entre 1 y 15" }, { status: 400 });
    }
    if (msg.includes("gallos_criador_id_fkey")) {
      return NextResponse.json({ error: "El criador seleccionado no existe" }, { status: 400 });
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
  const idNum = toIntOrNull(id);
  if (idNum === null) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  await sql`DELETE FROM gallos WHERE id = ${idNum}`;
  revalidatePath("/gallos");
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
