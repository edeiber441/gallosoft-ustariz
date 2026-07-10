-- Gallosoft Ustariz — Esquema de base de datos
-- Ejecutar en Vercel Postgres (Neon) o cualquier PostgreSQL

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  rango       TEXT NOT NULL DEFAULT 'admin',
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de criadores
CREATE TABLE IF NOT EXISTS criadores (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de colores
CREATE TABLE IF NOT EXISTS colores (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabla de gallos
CREATE TABLE IF NOT EXISTS gallos (
  id          SERIAL PRIMARY KEY,
  placa       INTEGER NOT NULL UNIQUE,
  candado     INTEGER NOT NULL UNIQUE,
  criador_id  INTEGER REFERENCES criadores(id) ON DELETE SET NULL,
  color       TEXT NOT NULL,
  imagen      TEXT,
  libras      INTEGER NOT NULL DEFAULT 4 CHECK (libras BETWEEN 1 AND 6),
  onzas       INTEGER NOT NULL DEFAULT 8 CHECK (onzas BETWEEN 1 AND 15),
  cresta      TEXT,
  patas       TEXT,
  pico        TEXT,
  creado_por  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para búsqueda por llave (placa y candado)
CREATE INDEX IF NOT EXISTS idx_gallos_placa ON gallos (placa);
CREATE INDEX IF NOT EXISTS idx_gallos_candado ON gallos (candado);
CREATE INDEX IF NOT EXISTS idx_gallos_criador ON gallos (criador_id);

-- Usuario admin inicial (password: admin123)
-- La contraseña se debe hashear con bcryptjs; generada con hash:
--   const hash = await bcrypt.hash('admin123', 10)
-- INSERT manual:
INSERT INTO usuarios (username, password, rango)
VALUES ('admin', '$2a$10$REEMPLAZAR_CON_HASH_BCRYPT', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Criadores de ejemplo
INSERT INTO criadores (nombre) VALUES ('Ustariz') ON CONFLICT (nombre) DO NOTHING;

-- Colores de ejemplo
INSERT INTO colores (nombre) VALUES ('Chino'), ('Giro'), ('Blanco Jabao'), ('Pinto'), ('Gallino'), ('Mono'), ('Negro'), ('Canaguey'), ('Morao') ON CONFLICT (nombre) DO NOTHING;