"use client";

import { useState, useEffect } from "react";
import type { Usuario } from "@/lib/types";

export default function UserManager() {
  const [users, setUsers] = useState<Usuario[]>([]);
  const [cedula, setCedula] = useState("");
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{ id: number; username: string; nombre: string | null } | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPassword, setEditPassword] = useState("");

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (Array.isArray(data)) setUsers(data); })
      .catch(() => {});
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!cedula.trim() || !password) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cedula: cedula.trim(), nombre: nombre.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al crear usuario");
        setBusy(false);
        return;
      }
      setUsers((prev) => [...prev, data].sort((a, b) => (a.nombre || a.username).localeCompare(b.nombre || b.username)));
      setCedula("");
      setNombre("");
      setPassword("");
    } catch {
      setError("Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(id: number) {
    setError("");
    if (!editPassword && editNombre === "") {
      setError("Indica un nombre o una contraseña para guardar");
      return;
    }
    if (editPassword && editPassword.length < 4) {
      setError("La contraseña debe tener al menos 4 caracteres");
      return;
    }
    setBusy(true);
    try {
      const payload: Record<string, string> = {};
      if (editNombre !== "") payload.nombre = editNombre.trim();
      if (editPassword) payload.password = editPassword;
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev
            .map((u) => (u.id === id ? { ...u, nombre: editNombre !== "" ? editNombre.trim() : u.nombre } : u))
            .sort((a, b) => (a.nombre || a.username).localeCompare(b.nombre || b.username))
        );
        setEditing(null);
        setEditNombre("");
        setEditPassword("");
      } else {
        const data = await res.json();
        setError(data.error || "Error al actualizar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: number, username: string) {
    if (!confirm(`¿Eliminar el usuario "${username}"?`)) return;
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      setUsers(users.filter((u) => u.id !== id));
    } catch {
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "flex-1 bg-surface border border-outline-variant rounded-lg px-4 py-3 text-on-background text-base focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors";
  const labelClass =
    "font-mono text-xs text-on-surface-variant uppercase tracking-wider mb-1 block";

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleAdd} className="flex flex-col gap-2">
        <div>
          <label className={labelClass}>Nombre del propietario</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Juan Pérez"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Cédula del nuevo usuario</label>
          <input
            type="text"
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Ej: 1234567890"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Contraseña</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 4 caracteres"
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={busy || !cedula.trim() || !password}
          className="bg-primary text-on-primary-container rounded-lg px-4 py-3 font-headline font-semibold flex items-center justify-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined">person_add</span>
          Crear usuario
        </button>
      </form>

      {error && (
        <div className="text-sm text-error bg-error-container/40 border border-error/30 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {users.length === 0 && (
          <div className="bg-surface border border-surface-variant rounded-lg p-4 text-center text-on-surface-variant">
            No hay usuarios registrados.
          </div>
        )}
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-surface border border-surface-variant rounded-lg p-3 flex items-center gap-3"
          >
            {editing?.id === u.id ? (
              <>
                <div className="flex-1 flex flex-col gap-1.5">
                  <span className="text-on-surface-variant text-xs font-mono">C.C. {u.username}</span>
                  <input
                    type="text"
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    placeholder="Nombre del propietario"
                    className="bg-surface-container border border-primary rounded-lg px-3 py-2 text-on-background text-sm"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Nueva contraseña (dejar vacío para no cambiar)"
                    className="bg-surface-container border border-primary rounded-lg px-3 py-2 text-on-background text-sm"
                  />
                </div>
                <button
                  onClick={() => handleSave(u.id)}
                  disabled={busy}
                  className="text-primary p-2 disabled:opacity-50"
                  title="Guardar"
                >
                  <span className="material-symbols-outlined">check</span>
                </button>
                <button
                  onClick={() => { setEditing(null); setEditNombre(""); setEditPassword(""); setError(""); }}
                  className="text-on-surface-variant p-2"
                  title="Cancelar"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 flex flex-col">
                  <span className="text-on-background text-base font-medium">
                    {u.nombre || "Sin nombre"}
                  </span>
                  <span className="text-on-surface-variant text-xs font-mono">
                    C.C. {u.username}
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${u.rango === "admin" ? "bg-primary/20 text-primary" : "bg-surface-container-highest text-on-surface-variant"}`}>
                      {u.rango}
                    </span>
                  </span>
                </div>
                <button
                  onClick={() => { setEditing({ id: u.id, username: u.username, nombre: u.nombre }); setEditNombre(u.nombre || ""); setEditPassword(""); setError(""); }}
                  className="text-primary p-2"
                  title="Editar"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>edit</span>
                </button>
                {u.rango !== "admin" && (
                  <button
                    onClick={() => handleDelete(u.id, u.nombre || u.username)}
                    disabled={busy}
                    className="text-error p-2 disabled:opacity-50"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
