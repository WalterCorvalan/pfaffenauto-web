// Convierte un monto entero a su expresión en letras (español, "pesos") —
// usado en el recibo de seña para calcar el formato legal tradicional
// ("$ 1.000.000,00 .- (un millon pesos)").

const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const DIECIS = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciseis", "diecisiete", "dieciocho", "diecinueve"];
const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function trescientos(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  let out = "";
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (c > 0) out += CENTENAS[c] + " ";
  if (resto >= 10 && resto < 20) {
    out += DIECIS[resto - 10];
  } else if (resto >= 20) {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    out += DECENAS[d] + (u > 0 ? " y " + UNIDADES[u] : "");
  } else if (resto > 0) {
    out += UNIDADES[resto];
  }
  return out.trim();
}

function grupoDeMiles(n: number, singular: string, plural: string): string {
  if (n === 0) return "";
  if (n === 1) return singular;
  return `${trescientos(n)} ${plural}`;
}

export function numeroALetras(monto: number): string {
  const n = Math.round(Math.abs(monto));
  if (n === 0) return "cero pesos";

  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const partes = [
    grupoDeMiles(millones, "un millon", "millones"),
    grupoDeMiles(miles, "mil", "mil"),
    resto > 0 ? trescientos(resto) : "",
  ].filter(Boolean);

  return `${partes.join(" ")} pesos`.replace(/\s+/g, " ").trim();
}
