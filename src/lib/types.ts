export type Gallo = {
  id: number;
  placa: number;
  candado: number;
  color: string;
  imagen: string | null;
  libras: number;
  onzas: number;
  cresta: string | null;
  patas: string | null;
  pico: string | null;
  criado_en: string;
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

export type Stats = {
  total: number;
  nuevos: number;
  criadores: number;
  recientes: Array<{
    id: number;
    placa: number;
    candado: number;
    color: string;
    imagen: string | null;
    libras: number;
    onzas: number;
    criado_en: string;
    criador_nombre: string | null;
  }>;
};