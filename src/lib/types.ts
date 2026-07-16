export type Gallo = {
  id: number;
  placa: number | null;
  candado: number | null;
  color: string;
  imagen: string | null;
  libras: number;
  onzas: number;
  cresta: string | null;
  patas: string | null;
  pico: string | null;
  mama: string | null;
  papa: string | null;
  marca_mes: number | null;
  marca_anio: number | null;
  creado_en: string;
  creado_por: number | null;
  criador_id: number | null;
  criador_nombre: string | null;
};

export type Criador = {
  id: number;
  nombre: string;
  creado_en: string;
};

export type Color = {
  id: number;
  nombre: string;
  creado_en: string;
};

export type Cresta = {
  id: number;
  nombre: string;
  creado_en: string;
};

export type Pata = {
  id: number;
  nombre: string;
  creado_en: string;
};

export type Pico = {
  id: number;
  nombre: string;
  creado_en: string;
};

export type Mama = {
  id: number;
  nombre: string;
  usuario_id: number | null;
  creado_en: string;
};

export type Papa = {
  id: number;
  nombre: string;
  usuario_id: number | null;
  creado_en: string;
};

export type Usuario = {
  id: number;
  username: string;
  rango: string;
  creado_en: string;
};

export type Sugerencia = {
  id: number;
  gallo_id: number;
  usuario_id: number;
  usuario_nombre: string | null;
  payload: Record<string, unknown>;
  estado: "pendiente" | "aceptada" | "rechazada";
  revisado_por: number | null;
  revisado_en: string | null;
  creado_en: string;
  gallo_placa: number | null;
  gallo_candado: number | null;
  gallo_color: string | null;
};

export type Stats = {
  total: number;
  recientes: Array<{
    id: number;
    placa: number | null;
    candado: number | null;
    color: string;
    imagen: string | null;
    libras: number;
    onzas: number;
    creado_en: string;
    criador_nombre: string | null;
  }>;
};