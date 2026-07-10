# Gallosoft — Galería Ustariz

Herramienta web móvil-first para gestionar gallos de la Galería Ustariz.

## Características

- Login de administrador (JWT en cookie httpOnly)
- CRUD completo de gallos (placa, candado, criador, color, imagen, peso, cresta, patas, pico)
- Foto desde cámara o galería (compresión automática, máx. 20MB)
- Búsqueda por placa, candado o criador
- Gestión de criadores
- Exportar a CSV
- Diseño dorado/negro mobile-first

## Stack

- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Vercel Postgres (Neon)
- bcryptjs + jsonwebtoken

## Setup

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Crear `.env.local` con las variables de `.env.example`:
   ```
   DATABASE_URL=postgres://user:password@host/db?sslmode=require
   JWT_SECRET=tu-secreto-super-seguro
   ```

3. Sembrar la base de datos (crea tablas + usuario admin):
   ```bash
   npm run seed
   ```
   Usuario por defecto: `admin` / Contraseña: `admin123`

4. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```

5. (Opcional) Ejecutar el SQL de `db/migration.sql` directamente en tu instancia Postgres.

## Deploy en Vercel

1. Subir el repositorio a GitHub
2. Importar en Vercel
3. Conectar una base de datos Vercel Postgres
4. Añadir `JWT_SECRET` como variable de entorno
5. Ejecutar `npm run seed` desde eldashboard de Vercel o localmente con la DATABASE_URL de producción