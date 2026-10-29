import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

// Lo llama el cron de Vercel (ver vercel.json) una vez al día para que
// Supabase no pause el proyecto por 7 días sin actividad.
// Si CRON_SECRET está definido en Vercel, el cron lo manda como
// "Authorization: Bearer <CRON_SECRET>" y aquí se exige.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Consulta sobre una tabla real (no solo SELECT 1) para que cuente como uso.
    const { rows } = await sql<{ total: number }>`
      SELECT COUNT(*)::int AS total FROM usuarios`;
    return NextResponse.json({
      ok: true,
      usuarios: rows[0]?.total ?? 0,
      at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/keepalive GET]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
