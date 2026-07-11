import { sql } from "@/lib/db";
import ConfigManager from "@/components/ConfigManager";
import type { Criador, Color, Cresta, Pata, Pico } from "@/lib/types";

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

export default async function ConfigPage() {
  let criadores: Criador[] = [];
  let colores: Color[] = [];
  let crestas: Cresta[] = [];
  let patas: Pata[] = [];
  let picos: Pico[] = [];
  try {
    [criadores, colores, crestas, patas, picos] = await Promise.all([
      getCriadores(),
      getColores(),
      getCrestas(),
      getPatas(),
      getPicos(),
    ]);
  } catch {
    criadores = [];
    colores = [];
    crestas = [];
    patas = [];
    picos = [];
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
      />
    </>
  );
}