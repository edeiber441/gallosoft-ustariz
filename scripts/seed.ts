import bcrypt from "bcryptjs";
import { sql } from "../src/lib/db";

async function seed() {
  console.log("Creando esquema...");
  await sql`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      rango TEXT NOT NULL DEFAULT 'admin',
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS criadores (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL UNIQUE,
      creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS gallos (
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
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_gallos_placa ON gallos (placa)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_gallos_candado ON gallos (candado)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_gallos_criador ON gallos (criador_id)`;

  console.log("Creando usuario admin (admin / admin123)...");
  const hash = await bcrypt.hash("admin123", 10);
  await sql`
    INSERT INTO usuarios (username, password, rango)
    VALUES ('admin', ${hash}, 'admin')
    ON CONFLICT (username) DO NOTHING
  `;

  console.log("Creando criador inicial...");
  await sql`INSERT INTO criadores (nombre) VALUES ('Ustariz') ON CONFLICT (nombre) DO NOTHING`;

  console.log("Seed completado. Usuario: admin / Contraseña: admin123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});