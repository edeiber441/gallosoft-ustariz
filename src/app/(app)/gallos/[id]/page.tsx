import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import GalloForm from "@/components/GalloForm";
import type { Gallo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditarGalloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  let gallo: Gallo | null = null;
  try {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
      g.cresta, g.patas, g.pico, g.mama, g.papa, g.marca_mes, g.marca_anio, g.creado_en, g.creado_por,
      c.id AS criador_id, c.nombre AS criador_nombre
      FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id WHERE g.id = ${parseInt(id)}`;
    if (rows.length > 0) gallo = rows[0] as Gallo;
  } catch {
    gallo = null;
  }

  if (!gallo) {
    return (
      <div className="bg-surface border border-surface-variant rounded-lg p-6 text-center text-on-surface-variant">
        Gallo no encontrado.
      </div>
    );
  }

  // Permisos: admin siempre puede editar/eliminar.
  // Operador: puede editar solo si es el creador y <10 min desde creado_en.
  const isAdmin = session?.rango === "admin";
  const esCreador = gallo.creado_por != null && session?.id === gallo.creado_por;
  const diffMin = (new Date().getTime() - new Date(gallo.creado_en).getTime()) / 60000;
  const canEdit = isAdmin || (esCreador && diffMin <= 10);
  const canDelete = isAdmin;

  return (
    <>
      <h1 className="font-headline text-2xl font-bold text-on-background mb-2">
        Editar gallo — {gallo.placa != null ? `Placa ${gallo.placa}` : gallo.candado != null ? `Candado ${gallo.candado}` : "Sin llave"}
      </h1>
      <GalloForm gallo={gallo} canEdit={canEdit} canDelete={canDelete} />
    </>
  );
}