import { Pool, type QueryResult, type QueryResultRow } from "pg";

type SqlFn = <T extends QueryResultRow = QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<QueryResult<T>>;

function buildPool(): Pool {
  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL no está definida. Configúrala en .env.local apuntando a Supabase."
    );
  }

  return new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  });
}

const pool = buildPool();

pool.on("error", (err) => {
  console.error("[db] Error inesperado en el pool:", err);
});

function buildSql(pool: Pool): SqlFn {
  return async <T extends QueryResultRow = QueryResultRow>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<QueryResult<T>> => {
    let query = "";
    for (let i = 0; i < strings.length; i++) {
      query += strings[i];
      if (i < values.length) {
        query += `$${i + 1}`;
      }
    }
    const result = await pool.query<T>(query, values as unknown[]);
    return result;
  };
}

export const sql: SqlFn = buildSql(pool);

export type GalloRow = {
  id: number;
  placa: number | null;
  candado: number | null;
  color: string;
  imagen: string | null;
  libras: number;
  onzas: number;
  cresta: string | null;
  patas: string | null;
  pico: string | null;
  creado_en: string;
  criador_id: number | null;
  criador_nombre: string | null;
};

export async function ping(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (err) {
    console.error("[db] ping falló:", err);
    return false;
  }
}
