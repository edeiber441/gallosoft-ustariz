import { sql } from "@/lib/db";
import ConfigManager from "@/components/ConfigManager";
import type { Criador, Color, Cresta, Pata, Pico, Mama, Papa, Marca } from "@/lib/types";

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

async function getMamas(): Promise<Mama[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM mamas ORDER BY nombre ASC`;
  return rows as Mama[];
}

async function getPapas(): Promise<Papa[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM papas ORDER BY nombre ASC`;
  return rows as Papa[];
}

async function getMarcas(): Promise<Marca[]> {
  const { rows } = await sql`SELECT id, nombre, creado_en FROM marcas ORDER BY nombre ASC`;
  return rows as Marca[];
}

export default async function ConfigPage() {
  let criadores: Criador[] = [];
  let colores: Color[] = [];
  let crestas: Cresta[] = [];
  let patas: Pata[] = [];
  let picos: Pico[] = [];
  let mamas: Mama[] = [];
  let papas: Papa[] = [];
  let marcas: Marca[] = [];
  try {
    [criadores, colores, crestas, patas, picos, mamas, papas, marcas] = await Promise.all([
      getCriadores(),
      getColores(),
      getCrestas(),
      getPatas(),
      getPicos(),
      getMamas(),
      getPapas(),
      getMarcas(),
    ]);
  } catch {
    criadores = [];
    colores = [];
    crestas = [];
    patas = [];
    picos = [];
    mamas = [];
    papas = [];
    marcas = [];
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
        initialMarcas={marcas}
      />
    </>
  );
}