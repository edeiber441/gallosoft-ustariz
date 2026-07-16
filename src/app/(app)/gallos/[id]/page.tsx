import { sql } from "@/lib/db";
import GalloForm from "@/components/GalloForm";
import type { Gallo } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditarGalloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let gallo: Gallo | null = null;
  try {
    const { rows } = await sql`SELECT g.id, g.placa, g.candado, g.color, g.imagen, g.libras, g.onzas,
      g.cresta, g.patas, g.pico, g.mama, g.papa, g.marca, g.creado_en,
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

  return (
    <>
      <h1 className="font-headline text-2xl font-bold text-on-background mb-2">
        Editar gallo — {gallo.placa != null ? `Placa ${gallo.placa}` : gallo.candado != null ? `Candado ${gallo.candado}` : "Sin llave"}
      </h1>
      <GalloForm gallo={gallo} />
    </>
  );
}