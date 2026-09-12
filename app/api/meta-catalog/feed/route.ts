import { createClient } from "@supabase/supabase-js";

// Feed de catálogo de vehículos para Meta Commerce Manager (catálogo de tipo
// "Vehicles" -- lo que alimenta el Marketplace/Shopping de Facebook e
// Instagram). Se configura UNA vez a mano en Meta Commerce Manager: Catálogo
// > Agregar artículos > Fuente de datos programada, pegando la URL de este
// endpoint (ej: https://www.pfaffencars.com/api/meta-catalog/feed) con una
// frecuencia diaria. A partir de ahí Meta lo vuelve a pedir solo -- no hace
// falta un botón "publicar" por auto (a diferencia de MercadoLibre, que usa
// su API de Items en vez de un feed).
//
// Fuente única: la misma tabla "vehiculos" (nova/panel-v2) que ya alimenta
// /catalogo -- un alta/edición/venta en el panel actualiza el feed sin pasos
// extra, que es justamente la idea de "cargar una vez y que salga en todos
// los canales".
//
// ADVERTENCIA (mismo criterio que lib/ads/mercadolibrePublish.ts): las
// columnas de acá siguen la especificación pública de Meta para catálogos de
// vehículos (Commerce Manager > Vehicles), pero no se pudo probar contra una
// cuenta real todavía -- si el import falla en Meta, el mensaje de error de
// Commerce Manager indica qué columna/valor ajustar.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

const COLUMNAS = [
  "vehicle_id",
  "availability",
  "condition",
  "make",
  "model",
  "year",
  "title",
  "description",
  "price",
  "url",
  "image_url",
  "mileage.value",
  "mileage.unit",
  "transmission",
  "exterior_color",
  "fuel_type",
  "address.city",
  "address.region",
  "address.country",
] as const;

function csvEscape(valor: unknown): string {
  const texto = valor === null || valor === undefined ? "" : String(valor);
  if (/[",\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`;
  return texto;
}

export async function GET() {
  const { data: vehiculos, error } = await supabase
    .from("vehiculos")
    .select("id, marca, modelo, anio, km, slug, precio_publicado_ars, precio_publicado_usd, transmision, combustible, color, condicion, fotos, sucursales!vehiculos_sucursal_id_fkey ( nombre )")
    .eq("estado", "disponible");

  if (error) {
    return new Response(`Error generando el feed: ${error.message}`, { status: 500 });
  }

  const filas = (vehiculos || [])
    .filter((v: any) => v.slug && Array.isArray(v.fotos) && v.fotos.length > 0 && (v.precio_publicado_ars || v.precio_publicado_usd))
    .map((v: any) => {
      const precio = v.precio_publicado_usd
        ? `${Number(v.precio_publicado_usd).toFixed(2)} USD`
        : `${Number(v.precio_publicado_ars).toFixed(2)} ARS`;
      const sucursal = Array.isArray(v.sucursales) ? v.sucursales[0] : v.sucursales;

      const fila: Record<(typeof COLUMNAS)[number], string> = {
        vehicle_id: v.id,
        availability: "in stock",
        // Ojo: NO usar "v.km === 0" como señal de 0km -- muchos usados
        // todavía no tienen el km cargado y quedan en 0/null por defecto,
        // no por ser nuevos. "condicion" es el único campo confiable acá.
        condition: v.condicion === "0km" ? "new" : "used",
        make: v.marca || "",
        model: v.modelo || "",
        year: String(v.anio || ""),
        title: `${v.marca} ${v.modelo} ${v.anio}`.trim(),
        description: `${v.marca} ${v.modelo} ${v.anio}. Consultá financiación y disponibilidad en Pfaffen Autos.`,
        price: precio,
        url: `https://www.pfaffencars.com/catalogo/${v.slug}`,
        image_url: v.fotos[0],
        "mileage.value": v.km != null ? String(v.km) : "",
        "mileage.unit": "KM",
        transmission: v.transmision || "",
        exterior_color: v.color || "",
        fuel_type: v.combustible || "",
        "address.city": sucursal?.nombre || "",
        "address.region": "",
        "address.country": "AR",
      };
      return COLUMNAS.map((c) => csvEscape(fila[c])).join(",");
    });

  const csv = [COLUMNAS.join(","), ...filas].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
