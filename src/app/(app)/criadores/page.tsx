import { sql } from "@/lib/db";
import ConfigManager from "@/components/ConfigManager";
import type { Criador, Color } from "@/lib/types";

async function getCriadores(): Promise<Criador[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM criadores ORDER BY nombre ASC`;
  return rows as Criador[];
}

async function getColores(): Promise<Color[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM colores ORDER BY nombre ASC`;
  return rows as Color[];
}

export default async function ConfigPage() {
  let criadores: Criador[] = [];
  let colores: Color[] = [];
  try {
    criadores = await getCriadores();
    colores = await getColores();
  } catch {
    criadores = [];
    colores = [];
  }

  return (
    <>
      <h1 className="font-headline text-2xl font-bold text-on-background mb-2">
        Configuración
      </h1>
      <ConfigManager initialCriadores={criadores} initialColores={colores} />
    </>
  );
}