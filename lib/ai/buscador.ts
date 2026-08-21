import { z } from "zod";
import { chatJson, isAiConfigured } from "./index";

const TIPOS_VALIDOS = [
  "Auto", "Buses", "Cabriolet", "Camión", "Camioneta", "Casa Rodante",
  "Coupe", "Familiar", "Monovolumen", "Moto", "Náutica", "Pickup",
  "Rural 5 Puertas", "Sedan 3p", "Sedan 4p", "Sedan 5p", "Todo Terreno | SUV",
  "Utilitarios", "Van | Mini-Van",
] as const;

const MARCAS_VALIDAS = [
  "Audi", "BMW", "Chevrolet", "Citroën", "Fiat", "Ford", "Hyundai",
  "Jeep", "Kia", "Nissan", "Peugeot", "Renault", "Toyota", "Volkswagen",
] as const;

const InterpretacionSchema = z.object({
  tipo: z.enum(TIPOS_VALIDOS).nullable(),
  marca: z.enum(MARCAS_VALIDAS).nullable(),
  transmision: z.enum(["Manual", "Automática"]).nullable(),
  combustible: z.enum(["Nafta", "Diesel", "Eléctrico", "GNC", "Híbrido"]).nullable(),
  condicion: z.enum(["0km", "usados"]).nullable(),
  precio_max_usd: z.number().nullable(),
  explicacion: z.string(),
});

export type InterpretacionBusqueda = z.infer<typeof InterpretacionSchema>;

export function isBuscadorIaDisponible(): boolean {
  return isAiConfigured();
}

export async function interpretarBusqueda(termino: string) {
  const prompt = `Un cliente busca un auto en una concesionaria escribiendo en lenguaje natural. Traducí su búsqueda a filtros estructurados, usando ÚNICAMENTE estos valores válidos (si no aplica alguno, poné null):

- tipo: uno de [${TIPOS_VALIDOS.join(", ")}] (ej: "SUV" o "todoterreno" → "Todo Terreno | SUV"; "familiar" → "Familiar" o "Rural 5 Puertas")
- marca: uno de [${MARCAS_VALIDAS.join(", ")}]
- transmision: "Manual" o "Automática"
- combustible: "Nafta", "Diesel", "Eléctrico", "GNC" o "Híbrido"
- condicion: "0km" o "usados"
- precio_max_usd: número si menciona un tope de presupuesto en dólares (convertí pesos a null si no podés estimar el tipo de cambio, solo completá si es explícitamente en dólares o USD)
- explicacion: una frase corta en español explicando cómo interpretaste la búsqueda, para mostrarle al cliente

Búsqueda del cliente: "${termino}"

Respondé ÚNICAMENTE con el JSON.`;

  return chatJson(InterpretacionSchema, [
    { role: "system", content: "Sos un asistente que traduce búsquedas en lenguaje natural a filtros estructurados de un catálogo de autos. Nunca inventás valores fuera de la lista permitida." },
    { role: "user", content: prompt },
  ], { origen: "api/buscar-ia" });
}
