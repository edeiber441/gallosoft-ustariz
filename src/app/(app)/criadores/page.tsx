import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ConfigManager from "@/components/ConfigManager";
import type { Criador, Color, Cresta, Pata, Pico, Mama, Papa } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getCriadores(): Promise<Criador[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM criadores ORDER BY nombre ASC`;
  return rows as Criador[];
}

async function getColores(): Promise<Color[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM colores ORDER BY nombre ASC`;
  return rows as Color[];
}

async function getCrestas(): Promise<Cresta[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM crestas ORDER BY nombre ASC`;
  return rows as Cresta[];
}

async function getPatas(): Promise<Pata[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM patas ORDER BY nombre ASC`;
  return rows as Pata[];
}

async function getPicos(): Promise<Pico[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM picos ORDER BY nombre ASC`;
  return rows as Pico[];
}

async function getMamas(usuarioId: number): Promise<Mama[]> {
  const { rows } = await sql`
    SELECT id, nombre, usuario_id, creado_en FROM mamas
    WHERE usuario_id IS NULL OR usuario_id = ${usuarioId}
    ORDER BY nombre ASC`;
  return rows as Mama[];
}

async function getPapas(usuarioId: number): Promise<Papa[]> {
  const { rows } = await sql`
    SELECT id, nombre, usuario_id, creado_en FROM papas
    WHERE usuario_id IS NULL OR usuario_id = ${usuarioId}
    ORDER BY nombre ASC`;
  return rows as Papa[];
}

export default async function ConfigPage() {
  const session = await getSession();
  const usuarioId = session?.id ?? 0;
  const isAdmin = session?.rango === "admin";

  let criadores: Criador[] = [];
  let colores: Color[] = [];
  let crestas: Cresta[] = [];
  let patas: Pata[] = [];
  let picos: Pico[] = [];
  let mamas: Mama[] = [];
  let papas: Papa[] = [];
  try {
    [criadores, colores, crestas, patas, picos, mamas, papas] = await Promise.all([
      getCriadores(),
      getColores(),
      getCrestas(),
      getPatas(),
      getPicos(),
      getMamas(usuarioId),
      getPapas(usuarioId),
    ]);
  } catch {
    criadores = [];
    colores = [];
    crestas = [];
    patas = [];
    picos = [];
    mamas = [];
    papas = [];
  }

  return (
    <>
      <h1 className="font-headline text-2xl font-bold text-on-background mb-2">
        Configuración
      </h1>
      <ConfigManager
        initialCriadores={criadores}
        initialColores={colores}
        initialCrestas={crestas}
        initialPatas={patas}
        initialPicos={picos}
        initialMamas={mamas}
        initialPapas={papas}
        isAdmin={isAdmin}
      />
    </>
  );
}