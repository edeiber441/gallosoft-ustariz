import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import SugerenciaList from "@/components/SugerenciaList";
import type { Sugerencia } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SugerenciasPage() {
  const session = await getSession();
  const isAdmin = session?.rango === "admin";

  let sugerencias: Sugerencia[] = [];
  try {
    if (isAdmin) {
      const { rows } = await sql`
        SELECT s.id, s.gallo_id, s.usuario_id, s.payload, s.estado,
          s.revisado_por, s.revisado_en, s.creado_en,
          COALESCE(u.nombre, u.username) AS usuario_nombre,
          g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color,
          g.libras AS gallo_libras, g.onzas AS gallo_onzas,
          g.cresta AS gallo_cresta, g.patas AS gallo_patas, g.pico AS gallo_pico,
          g.mama AS gallo_mama, g.papa AS gallo_papa,
          g.marca_mes AS gallo_marca_mes, g.marca_anio AS gallo_marca_anio,
          g.imagen AS gallo_imagen,
          c.nombre AS gallo_criador
        FROM sugerencias s
        LEFT JOIN usuarios u ON s.usuario_id = u.id
        LEFT JOIN gallos g ON s.gallo_id = g.id
        LEFT JOIN criadores c ON g.criador_id = c.id
        ORDER BY
          CASE WHEN s.estado = 'pendiente' THEN 0 ELSE 1 END,
          s.creado_en DESC`;
      sugerencias = rows as Sugerencia[];
    } else if (session) {
      const { rows } = await sql`
        SELECT s.id, s.gallo_id, s.usuario_id, s.payload, s.estado,
          s.revisado_por, s.revisado_en, s.creado_en,
          COALESCE(u.nombre, u.username) AS usuario_nombre,
          g.placa AS gallo_placa, g.candado AS gallo_candado, g.color AS gallo_color,
          g.libras AS gallo_libras, g.onzas AS gallo_onzas,
          g.cresta AS gallo_cresta, g.patas AS gallo_patas, g.pico AS gallo_pico,
          g.mama AS gallo_mama, g.papa AS gallo_papa,
          g.marca_mes AS gallo_marca_mes, g.marca_anio AS gallo_marca_anio,
          g.imagen AS gallo_imagen,
          c.nombre AS gallo_criador
        FROM sugerencias s
        LEFT JOIN usuarios u ON s.usuario_id = u.id
        LEFT JOIN gallos g ON s.gallo_id = g.id
        LEFT JOIN criadores c ON g.criador_id = c.id
        WHERE s.usuario_id = ${session.id}
        ORDER BY s.creado_en DESC`;
      sugerencias = rows as Sugerencia[];
    }
  } catch {
    sugerencias = [];
  }

  return (
    <>
      <h1 className="font-headline text-2xl font-bold text-on-background mb-2">
        {isAdmin ? "Sugerencias de modificación" : "Mis sugerencias"}
      </h1>
      <SugerenciaList sugerencias={sugerencias} isAdmin={isAdmin} />
    </>
  );
}
