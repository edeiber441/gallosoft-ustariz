"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Action = {
  href: string;
  label: string;
  icon: string;
  external?: boolean;
};

const ACTIONS: Action[] = [
  { href: "/gallos", label: "Buscar gallo", icon: "search" },
  { href: "/gallos/nuevo", label: "Registrar nuevo", icon: "add" },
  { href: "/api/export", label: "Exportar CSV", icon: "description", external: true },
  { href: "/planillas", label: "Planilla de trabajo", icon: "edit_note" },
];

export default function DashboardActions() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary-container rounded-lg px-6 py-3 font-headline font-semibold text-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="material-symbols-outlined">menu</span>
        Acciones
        <span
          className="material-symbols-outlined transition-transform"
          style={{ fontSize: "20px", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-surface border border-outline-variant rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex flex-col p-2"
        >
          {ACTIONS.map((action) =>
            action.external ? (
              <a
                key={action.href}
                role="menuitem"
                href={action.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "22px" }}>
                  {action.icon}
                </span>
                {action.label}
              </a>
            ) : (
              <Link
                key={action.href}
                href={action.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-on-surface hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-primary" style={{ fontSize: "22px" }}>
                  {action.icon}
                </span>
                {action.label}
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
