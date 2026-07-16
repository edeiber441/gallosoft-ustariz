"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const TABS = [
  { href: "/", icon: "home", label: "Inicio" },
  { href: "/gallos", icon: "search", label: "Buscar" },
  { href: "/gallos/nuevo", icon: "add_circle", label: "Nuevo" },
  { href: "/planillas", icon: "edit_note", label: "Planilla" },
  { href: "/salir", icon: "logout", label: "Salir" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function handleSalir() {
    if (saliendo) return;
    setSaliendo(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignorar: de todos modos redirigimos al login
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-lowest rounded-t-xl shadow-lg">
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));

        if (tab.href === "/salir") {
          return (
            <button
              key={tab.href}
              type="button"
              onClick={handleSalir}
              disabled={saliendo}
              className={`flex flex-col items-center justify-center p-3 rounded-full transition-all text-on-surface-variant hover:text-primary disabled:opacity-50`}
            >
              <span
                className="material-symbols-outlined"
                style={saliendo ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {saliendo ? "progress_activity" : tab.icon}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex  flex-col items-center justify-center p-3 rounded-full transition-all ${
              active
                ? "bg-secondary-container text-secondary scale-95"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}