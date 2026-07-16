import bcrypt from "bcryptjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "../src/lib/db";

async function ensureAdmin() {
  const { rows } = await sql<{ id: number; password: string }>`
    SELECT id, password FROM usuarios WHERE username = 'admin'
  `;
  if (rows.length === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    await sql`
      INSERT INTO usuarios (username, password, rango)
      VALUES ('admin', ${hash}, 'admin')
    `;
    console.log("✓ Usuario admin creado (admin / admin123)");
    return;
  }

  const valid = await bcrypt.compare("admin123", rows[0].password);
  if (!valid) {
    const hash = await bcrypt.hash("admin123", 10);
    await sql`UPDATE usuarios SET password = ${hash} WHERE id = ${rows[0].id}`;
    console.log("✓ Contraseña del admin reseteada a 'admin123'");
  } else {
    console.log("✓ Usuario admin OK (admin / admin123)");
  }
}

async function seedCatalog() {
  await sql`INSERT INTO criadores (nombre) VALUES ('Ustariz') ON CONFLICT (nombre) DO NOTHING`;
  await sql`
    INSERT INTO colores (nombre) VALUES
      ('Chino'), ('Giro'), ('Blanco'), ('Jabao'), ('Pinto'),
      ('Gallino'), ('Mono'), ('Negro'), ('Canaguey'), ('Morao')
    ON CONFLICT (nombre) DO NOTHING
  `;
  await sql`INSERT INTO crestas (nombre) VALUES ('Simple'), ('Nuez') ON CONFLICT (nombre) DO NOTHING`;
  await sql`INSERT INTO patas (nombre) VALUES ('Verdes'), ('Amarillas') ON CONFLICT (nombre) DO NOTHING`;
  await sql`INSERT INTO picos (nombre) VALUES ('Curvo corto'), ('Recto') ON CONFLICT (nombre) DO NOTHING`;
  await sql`INSERT INTO mamas (nombre, usuario_id) VALUES ('Desconocida', NULL) ON CONFLICT (nombre, usuario_id) DO NOTHING`;
  await sql`INSERT INTO papas (nombre, usuario_id) VALUES ('Desconocido', NULL) ON CONFLICT (nombre, usuario_id) DO NOTHING`;
  console.log("✓ Catálogos inicializados");
}

async function ensureSchema() {
  const migration = readFileSync(join(process.cwd(), "db", "migration.sql"), "utf8");
  const statements = migration
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    const trimmed = stmt.replace(/^--.*$/gm, "").trim();
    if (!trimmed) continue;
    try {
      await sql([trimmed] as unknown as TemplateStringsArray);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate") ||
        msg.includes("no relation")
      ) {
        continue;
      }
      throw err;
    }
  }
  console.log("✓ Esquema verificado");
}

async function seed() {
  console.log("→ Conectando a Supabase...");
  console.log("→ Aplicando migración si hace falta...");
  await ensureSchema();
  await seedCatalog();
  await ensureAdmin();
  console.log("\nSeed completado. Credenciales: admin / admin123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("✗ Error en seed:", err);
  process.exit(1);
});
