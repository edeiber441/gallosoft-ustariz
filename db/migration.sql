-- =====================================================================
-- Gallosoft Ustariz — Migración de base de datos (Supabase / PostgreSQL)
-- =====================================================================
-- Esta migración es idempotente: puede ejecutarse varias veces sin
-- generar errores. Crea el esquema completo y datos iniciales.
--
-- Cómo aplicarla:
--   1) Conectar a Supabase (SQL Editor o psql)
--   2) Pegar y ejecutar este archivo completo
--   3) El usuario por defecto es: admin / admin123
--      (cambiar la contraseña inmediatamente en producción)
-- =====================================================================

-- Extensión opcional para generar identificadores únicos (no requerida)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1) Tabla de usuarios
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  username    TEXT NOT NULL UNIQUE,
  password    TEXT NOT NULL,
  rango       TEXT NOT NULL DEFAULT 'admin' CHECK (rango IN ('admin', 'operador')),
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 2) Tablas de catálogo (criadores, colores, crestas, patas, picos, mamas, papas)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS criadores (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS colores (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crestas (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patas (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS picos (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mamas (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS papas (
  id        SERIAL PRIMARY KEY,
  nombre    TEXT NOT NULL UNIQUE,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- 3) Tabla principal de gallos
-- ---------------------------------------------------------------------
-- placa y candado son opcionales (un gallo puede tener uno, otro o ambos)
-- pero al menos uno debe estar presente al registrar (validado en la API).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallos (
  id          SERIAL PRIMARY KEY,
  placa       INTEGER UNIQUE,
  candado     INTEGER UNIQUE,
  criador_id  INTEGER REFERENCES criadores(id) ON DELETE SET NULL,
  color       TEXT NOT NULL,
  imagen      TEXT,
  libras      INTEGER NOT NULL DEFAULT 4 CHECK (libras BETWEEN 1 AND 6),
  onzas       INTEGER NOT NULL DEFAULT 8 CHECK (onzas BETWEEN 1 AND 15),
  cresta      TEXT,
  patas       TEXT,
  pico        TEXT,
  creado_por  INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Al menos uno de placa o candado debe estar definido
  CONSTRAINT gallos_llave_presente CHECK (placa IS NOT NULL OR candado IS NOT NULL)
);

-- Columnas de progenie (mama/papa) — opcionales. Idempotentes por si la
-- tabla gallos ya existía sin estas columnas.
ALTER TABLE gallos ADD COLUMN IF NOT EXISTS mama TEXT;
ALTER TABLE gallos ADD COLUMN IF NOT EXISTS papa TEXT;

-- ---------------------------------------------------------------------
-- 4) Índices para acelerar búsquedas
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_gallos_placa        ON gallos (placa)         WHERE placa IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gallos_candado      ON gallos (candado)       WHERE candado IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gallos_criador      ON gallos (criador_id);
CREATE INDEX IF NOT EXISTS idx_gallos_creado_en    ON gallos (creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_gallos_color        ON gallos (color);

-- ---------------------------------------------------------------------
-- 5) Datos iniciales (idempotentes)
-- ---------------------------------------------------------------------

-- Usuario admin (password: admin123)
-- Hash bcrypt generado con: bcrypt.hash('admin123', 10)
-- Se regenera automáticamente con el script npm run seed si no coincide.
INSERT INTO usuarios (username, password, rango)
VALUES (
  'admin',
  '$2b$10$u1S6uNdu8ZWBNB37nVWeSerngaLEPqxb9TDloUHPvhSWo3LB6/MfW',
  'admin'
)
ON CONFLICT (username) DO NOTHING;

-- Criador por defecto
INSERT INTO criadores (nombre) VALUES ('Ustariz')
ON CONFLICT (nombre) DO NOTHING;

-- Colores
INSERT INTO colores (nombre) VALUES
  ('Chino'), ('Giro'), ('Blanco'), ('Jabao'), ('Pinto'),
  ('Gallino'), ('Mono'), ('Negro'), ('Canaguey'), ('Morao')
ON CONFLICT (nombre) DO NOTHING;

-- Crestas
INSERT INTO crestas (nombre) VALUES ('Simple'), ('Nuez')
ON CONFLICT (nombre) DO NOTHING;

-- Patas
INSERT INTO patas (nombre) VALUES ('Verdes'), ('Amarillas')
ON CONFLICT (nombre) DO NOTHING;

-- Picos
INSERT INTO picos (nombre) VALUES ('Curvo corto'), ('Recto')
ON CONFLICT (nombre) DO NOTHING;

-- Mamas
INSERT INTO mamas (nombre) VALUES ('Desconocida')
ON CONFLICT (nombre) DO NOTHING;

-- Papas
INSERT INTO papas (nombre) VALUES ('Desconocido')
ON CONFLICT (nombre) DO NOTHING;

-- =====================================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================================
