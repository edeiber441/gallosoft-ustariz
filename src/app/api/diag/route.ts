import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import type { GalloRow } from "@/lib/db";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Insertar fila de prueba
  try {
    await sql`DELETE FROM gallos WHERE placa = 888`;
    await sql`INSERT INTO gallos (placa, color, libras, onzas) VALUES (888, 'Diag', 4, 8)`;
  } catch (e) {
    results.setupError = e instanceof Error ? e.message : String(e);
  }

  // Query EXACTA copiada del route.ts
  const placa = 888;
  try {
    const { rows } = await sql<GalloRow>`
      SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
        g.cresta, g.patas, g.pico, g.mama, g.papa, g.marca, g.creado_en,
        c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE g.placa = ${placa} ORDER BY g.creado_en DESC`;
    results.exactRouteQuery = { ok: true, count: rows.length, sample: rows[0] };
  } catch (e) {
    results.exactRouteQuery = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Lista general (sin WHERE) - la que FALLA en el route.ts
  try {
    const { rows } = await sql<GalloRow>`
      SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
        g.cresta, g.patas, g.pico, g.mama, g.papa, g.marca, g.creado_en,
        c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      ORDER BY g.creado_en DESC`;
    results.listQuery = { ok: true, count: rows.length };
  } catch (e) {
    results.listQuery = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Misma query pero con la variable ya interpolada como literal
  try {
    const { rows } = await sql<GalloRow>`
      SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
        g.cresta, g.patas, g.pico, g.mama, g.papa, g.marca, g.creado_en,
        c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE g.placa = 888 ORDER BY g.creado_en DESC`;
    results.literalQuery = { ok: true, count: rows.length, sample: rows[0] };
  } catch (e) {
    results.literalQuery = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Con comillas dobles en creado_en
  try {
    const { rows } = await sql<GalloRow>`
      SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
        g.cresta, g.patas, g.pico, g.mama, g.papa, g.marca, g."creado_en",
        c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id
      WHERE g.placa = ${placa} ORDER BY g."creado_en" DESC`;
    results.quotedQuery = { ok: true, count: rows.length, sample: rows[0] };
  } catch (e) {
    results.quotedQuery = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  // Limpiar
  try {
    await sql`DELETE FROM gallos WHERE placa = 888`;
  } catch {}

  return NextResponse.json(results);
}
