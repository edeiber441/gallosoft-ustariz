import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { createSessionToken, COOKIE_NAME, COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      return NextResponse.json({ error: "Usuario y contraseña son obligatorios" }, { status: 400 });
    }

    const { rows } = await sql`SELECT id, username, password, rango FROM usuarios WHERE username = ${username}`;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    const user = rows[0] as { id: number; username: string; password: string; rango: string };
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return NextResponse.json({ error: "Usuario o contraseña incorrectos" }, { status: 401 });
    }

    const token = createSessionToken({ id: user.id, username: user.username, rango: user.rango });

    const res = NextResponse.json({ ok: true, user: { username: user.username, rango: user.rango } });
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
    return res;
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}