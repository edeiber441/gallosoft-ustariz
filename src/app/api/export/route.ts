import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { rows } = await sql`SELECT g.placa, g.candado, c.nombre AS criador, g.color,
    g.libras, g.onzas, g.cresta, g.patas, g.pico, g.creado_en
    FROM gallos g LEFT JOIN criadores c ON g.criador_id = c.id ORDER BY g.creado_en DESC`;

  const headers = ["Placa", "Candado", "Criador", "Color", "Libras", "Onzas", "Cresta", "Patas", "Pico", "Fecha"];
  const escape = (val: unknown) => {
    const s = val == null ? "" : String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csvLines = [headers.join(",")];
  for (const row of rows) {
    const record = row as Record<string, unknown>;
    csvLines.push([
      escape(record.placa),
      escape(record.candado),
      escape(record.criador),
      escape(record.color),
      escape(record.libras),
      escape(record.onzas),
      escape(record.cresta),
      escape(record.patas),
      escape(record.pico),
      escape(record.creado_en),
    ].join(","));
  }

  const csv = "\uFEFF" + csvLines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="gallos_ustariz.csv"',
    },
  });
}