type SqlResult = { rows: Record<string, unknown>[] };
type SqlFn = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<SqlResult>;

let _sql: SqlFn | null = null;

async function getSql(): Promise<SqlFn> {
  if (_sql) return _sql;

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (connectionString) {
    const { Client } = await import("pg");
    const client = new Client({
      connectionString,
      ssl: connectionString.includes("supabase") || connectionString.includes("vercel")
        ? { rejectUnauthorized: false }
        : undefined,
      connectionTimeoutMillis: 15000,
    });
    await client.connect();
    console.log("[db] Conectado a PostgreSQL remoto");

    const pgSql: SqlFn = async (strings: TemplateStringsArray, ...values: unknown[]) => {
      let query = "";
      for (let i = 0; i < strings.length; i++) {
        query += strings[i];
        if (i < values.length) {
          query += `$${i + 1}`;
        }
      }
      const result = await client.query(query, values as unknown[]);
      return { rows: result.rows as Record<string, unknown>[] };
    };
    _sql = pgSql;
    return _sql;
  }

  const { newDb } = await import("pg-mem");
  const bcrypt = await import("bcryptjs");
  const db = newDb();

  db.public.many(`
    CREATE TABLE usuarios (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      rango TEXT NOT NULL DEFAULT 'admin',
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE criadores (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE colores (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE gallos (
      id SERIAL PRIMARY KEY,
      placa INTEGER NOT NULL UNIQUE,
      candado INTEGER NOT NULL UNIQUE,
      criador_id INTEGER REFERENCES criadores(id) ON DELETE SET NULL,
      color TEXT NOT NULL,
      imagen TEXT,
      libras INTEGER NOT NULL DEFAULT 4 CHECK (libras BETWEEN 1 AND 6),
      onzas INTEGER NOT NULL DEFAULT 8 CHECK (onzas BETWEEN 1 AND 15),
      cresta TEXT,
      patas TEXT,
      pico TEXT,
      creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const hash = await bcrypt.default.hash("admin123", 10);
  const userRows = db.public.many(
    `INSERT INTO usuarios (username, password, rango) VALUES ('admin', '${hash}', 'admin') RETURNING id`
  );
  const userId = userRows[0].id as number;

  db.public.many(
    `INSERT INTO criadores (nombre) VALUES ('Ustariz'), ('Criador Norte'), ('Criador Sur') RETURNING id, nombre`
  );

  db.public.many(
    `INSERT INTO colores (nombre) VALUES ('Chino'), ('Giro'), ('Blanco Jabao'), ('Pinto'), ('Gallino'), ('Mono'), ('Negro'), ('Canaguey'), ('Morao') RETURNING id, nombre`
  );

  const gallosSeed = [
    { placa: 100, candado: 501, color: "Giro", libras: 4, onzas: 8 },
    { placa: 101, candado: 502, color: "Negro", libras: 5, onzas: 3 },
    { placa: 102, candado: 503, color: "Chino", libras: 3, onzas: 10 },
    { placa: 103, candado: 504, color: "Pinto", libras: 4, onzas: 12 },
    { placa: 104, candado: 505, color: "Morao", libras: 5, onzas: 6 },
  ];

  for (const g of gallosSeed) {
    const hoursAgo = Math.floor(Math.random() * 48) + 1;
    db.public.many(
      `INSERT INTO gallos (placa, candado, criador_id, color, libras, onzas, cresta, patas, pico, creado_por, creado_en)
       VALUES (${g.placa}, ${g.candado}, 1, '${g.color}', ${g.libras}, ${g.onzas}, 'Simple', 'Verdes', 'Curvo', ${userId}, now() - interval '${hoursAgo} hours')`
    );
  }

  const memSql: SqlFn = (strings: TemplateStringsArray, ...values: unknown[]) => {
    let query = "";
    for (let i = 0; i < strings.length; i++) {
      query += strings[i];
      if (i < values.length) {
        const v = values[i];
        if (v === null || v === undefined) {
          query += "NULL";
        } else if (typeof v === "number") {
          query += String(v);
        } else if (typeof v === "string") {
          query += `'${v.replace(/'/g, "''")}'`;
        } else if (typeof v === "boolean") {
          query += v ? "true" : "false";
        } else {
          query += `'${String(v).replace(/'/g, "''")}'`;
        }
      }
    }
    try {
      const rows = db.public.many(query);
      return Promise.resolve({ rows });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("no data") || msg.includes("No rows")) {
        return Promise.resolve({ rows: [] });
      }
      throw err;
    }
  };

  _sql = memSql;
  console.log("[db] Usando pg-mem con datos de prueba. Login: admin / admin123");
  return _sql;
}

export async function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<SqlResult> {
  const s = await getSql();
  return s(strings, ...values);
}