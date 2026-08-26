export interface MetricaCampana {
  campanaExternaId: string;
  nombreCampana: string;
  gasto: number;
  clics: number;
  leads: number;
}

export interface ResultadoSync {
  plataforma: string;
  configurado: boolean;
  ok: boolean;
  campanas: number;
  error?: string;
}
