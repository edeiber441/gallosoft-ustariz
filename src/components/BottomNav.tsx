"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", icon: "home", label: "Inicio" },
  { href: "/gallos", icon: "search", label: "Buscar" },
  { href: "/gallos/nuevo", icon: "add_circle", label: "Nuevo" },
  { href: "/login", icon: "logout", label: "Salir" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface-container-lowest rounded-t-xl shadow-lg">
      {TABS.map((tab) => {
        const active = pathname === tab.href || (tab.href !== "/" && pathname.startsWith(tab.href));
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