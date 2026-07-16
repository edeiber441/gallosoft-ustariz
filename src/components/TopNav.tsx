import Link from "next/link";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";
import UserMenu from "@/components/UserMenu";

export default async function TopNav() {
  const session = await getSession();
  const isAdmin = session?.rango === "admin";

  let pendientes = 0;
  let userNombre: string | null = null;
  if (session) {
    try {
      const { rows } = await sql<{ nombre: string | null }>`SELECT nombre FROM usuarios WHERE id = ${session.id}`;
      userNombre = rows[0]?.nombre ?? null;
    } catch {
      userNombre = null;
    }
  }
  if (isAdmin) {
    try {
      const { rows } = await sql`SELECT COUNT(*)::int AS count FROM sugerencias WHERE estado = 'pendiente'`;
      pendientes = rows[0]?.count ?? 0;
    } catch {
      pendientes = 0;
    }
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 h-16 bg-surface border-b border-outline-variant shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center bg-surface-container-lowest overflow-hidden shadow-inner p-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-ustariz.png" alt="Galería Ustariz" className="w-full h-full object-contain opacity-90" />
        </div>
        <span className="font-headline font-bold text-2xl text-primary uppercase tracking-wider">
          Gallosoft
        </span>
      </div>
      <div className="flex items-center gap-1">
        {isAdmin && (
          <Link
            href="/sugerencias"
            className="relative text-primary hover:bg-surface-container-high transition-colors opacity-80 duration-150 p-2 rounded-full flex items-center justify-center"
            title="Sugerencias de modificación"
          >
            <span className="material-symbols-outlined">notifications</span>
            {pendientes > 0 && (
              <span className="absolute top-0 right-0 min-w-5 h-5 px-1 rounded-full bg-error text-on-error text-xs font-bold flex items-center justify-center">
                {pendientes > 9 ? "9+" : pendientes}
              </span>
            )}
          </Link>
        )}
        <Link
          href="/criadores"
          className="text-primary hover:bg-surface-container-high transition-colors opacity-80 duration-150 p-2 rounded-full flex items-center justify-center"
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>
        {session && (
          <UserMenu nombre={userNombre} username={session.username} rango={session.rango} />
        )}
      </div>
    </nav>
  );
}