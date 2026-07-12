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
  creado_en: string;
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