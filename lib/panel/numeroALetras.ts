const UNIDADES = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
const DIECIS = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
const DECENAS = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const CENTENAS = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function trescientos(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cien";
  if (n < 10) return UNIDADES[n];
  if (n < 20) return DIECIS[n - 10];
  if (n < 30) return n === 20 ? "veinte" : "veinti" + UNIDADES[n - 20];
  if (n < 100) {
    const d = Math.floor(n / 10), u = n % 10;
    return DECENAS[d] + (u ? " y " + UNIDADES[u] : "");
  }
  const c = Math.floor(n / 100), r = n % 100;
  return CENTENAS[c] + (r ? " " + trescientos(r) : "");
}

function seccion(n: number, singular: string, plural: string): string {
  if (n === 0) return "";
  if (n === 1) return singular;
  return trescientos(n) + " " + plural;
}

export function numeroALetras(valor: number): string {
  const entero = Math.floor(Math.abs(valor));
  if (entero === 0) return "cero";
  if (entero >= 1000000000) return entero.toLocaleString("es-AR");

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const resto = entero % 1000;

  const partes = [
    seccion(millones, "un millón", "millones"),
    seccion(miles, "mil", "mil"),
    resto ? trescientos(resto) : "",
  ].filter(Boolean);

  return partes.join(" ").replace(/\s+/g, " ").trim();
}
