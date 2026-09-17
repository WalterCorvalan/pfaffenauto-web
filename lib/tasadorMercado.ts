import * as cheerio from "cheerio";
import { descuentoPctPorKm } from "@/lib/panel/descuentoPorKm";

// Tasador de mercado v1: scraping directo del listado público de MercadoLibre
// (fetch + parseo de HTML con cheerio), NO la API oficial -- la API de
// búsqueda pública (sites/MLA/search) está bloqueada desde abril 2025 incluso
// con token OAuth (confirmado en vivo, devuelve 403/401). El sitio web
// público sigue sirviendo HTML server-rendered con los primeros resultados,
// que es lo que se parsea acá.
//
// Riesgo conocido, aceptado a propósito: esto viola los términos de uso de
// MercadoLibre (prohíben scraping) y se puede romper si cambian el HTML del
// listado o bloquean la IP del server. No hay fallback automático si eso
// pasa -- fetchComparablesMeli() devuelve un array vacío y el caller decide
// qué mostrar (ver TasarUsadoModal.tsx).

export interface ComparableMeli {
  precio: number;
  km: number | null;
  titulo: string;
  url: string;
}

function slugQuery(...partes: (string | undefined)[]): string {
  return partes
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// User-Agent de browser real -- sin esto MeLi devuelve una página distinta
// (o directamente bloquea) a requests que se identifican como bot/fetch.
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "es-AR,es;q=0.9",
};

export async function fetchComparablesMeli(params: {
  marca: string;
  modelo: string;
  version?: string;
  anio: number;
  limite?: number;
}): Promise<ComparableMeli[]> {
  const { marca, modelo, version, anio, limite = 10 } = params;
  const query = slugQuery(marca, modelo, version, String(anio));
  const url = `https://listado.mercadolibre.com.ar/${encodeURIComponent(query)}_OrderId_PRICE`;

  const res = await fetch(url, { headers: HEADERS, cache: "no-store" });
  if (!res.ok) throw new Error(`MercadoLibre respondió ${res.status} -- puede que haya bloqueado el request.`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const comparables: ComparableMeli[] = [];
  // Estructura de card actual del listado (poll_item / ui-search-layout__item)
  // -- si MeLi cambia el markup esto deja de encontrar nada, no rompe (ver
  // comentario de riesgo arriba). No confiar en un selector único: se prueban
  // los dos nombres de clase que MeLi usó en los últimos rediseños.
  $(".ui-search-layout__item, li.ui-search-layout__item").each((_, el) => {
    if (comparables.length >= limite) return;
    const $el = $(el);
    const tituloEl = $el.find(".poly-component__title, .ui-search-item__title").first();
    const titulo = tituloEl.text().trim();
    const href = tituloEl.closest("a").attr("href") || $el.find("a.poly-component__title, a.ui-search-link").first().attr("href") || "";

    const precioTexto = $el.find(".andes-money-amount__fraction, .price-tag-fraction").first().text().trim();
    const precio = Number(precioTexto.replace(/\./g, "").replace(/\D/g, ""));
    if (!precio) return;

    // El km aparece como atributo suelto en la card (ej. "63.000 Km"), no en
    // un campo estructurado -- se busca por texto entre los atributos listados.
    const atributos = $el.find(".poly-attributes_list__item, .ui-search-item__group__element").map((_, a) => $(a).text().trim()).get();
    const kmTexto = atributos.find((a) => /km$/i.test(a.trim()));
    const km = kmTexto ? Number(kmTexto.replace(/\./g, "").replace(/\D/g, "")) : null;

    comparables.push({ precio, km, titulo, url: href });
  });

  return comparables;
}

export interface EstadisticasComparables {
  media: number;
  mediana: number;
  minimo: number;
  maximo: number;
  n: number;
}

export function calcularEstadisticas(comparables: ComparableMeli[]): EstadisticasComparables | null {
  const precios = comparables.map((c) => c.precio).filter((p) => p > 0).sort((a, b) => a - b);
  if (precios.length === 0) return null;
  const n = precios.length;
  const media = precios.reduce((acc, p) => acc + p, 0) / n;
  const mediana = n % 2 === 0 ? (precios[n / 2 - 1] + precios[n / 2]) / 2 : precios[(n - 1) / 2];
  return { media: Math.round(media), mediana: Math.round(mediana), minimo: precios[0], maximo: precios[n - 1], n };
}

// El descuento por km ya vivía en lib/panel/descuentoPorKm.ts (usado por el
// form público /cotizador para restarle al precio que el cliente dice
// esperar) -- se reusa la misma tabla acá en vez de mantener una copia
// paralela con los mismos números.
export const descuentoPorKm = descuentoPctPorKm;
