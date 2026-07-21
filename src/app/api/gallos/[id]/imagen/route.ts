import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const DATA_URL_RE = /^data:(image\/[a-zA-Z+.-]+);base64,([A-Za-z0-9+/=]+)$/;

// Devuelve la imagen de un gallo como respuesta binaria cacheable.
// Así la lista de gallos no transfiere todas las imágenes base64 embebidas
// en el RSC payload (que era la causa de la lentitud): cada imagen se carga
// lazy y se cachea en el navegador.
export async function GET(_req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { rows } = await sql`SELECT imagen FROM gallos WHERE id = ${numId}`;
  const imagen = rows[0]?.imagen as string | null | undefined;

  if (!imagen) {
    return new NextResponse(null, { status: 404 });
  }

  const match = imagen.match(DATA_URL_RE);
  if (!match) {
    return new NextResponse(null, { status: 404 });
  }

  const contentType = match[1];
  const base64 = match[2];
  const bytes = Uint8Array.from(Buffer.from(base64, "base64"));

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300, stale-while-revalidate=86400",
    },
  });
}
