import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "gallosoft-ustariz-dev-secret-change-in-prod";
const COOKIE_NAME = "gallosoft_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;

const secretKey = new TextEncoder().encode(JWT_SECRET);

export type SessionUser = {
  id: number;
  username: string;
  rango: string;
};

export function createSessionToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: SESSION_DURATION });
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "lax" as const,
  maxAge: SESSION_DURATION,
  path: "/",
};

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export { COOKIE_NAME, JWT_SECRET, SESSION_DURATION };