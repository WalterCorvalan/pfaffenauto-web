// Única fuente de verdad de "marcas y modelos" para los 3 formularios
// públicos que piden el auto del cliente (ConsignarForm.tsx, VenderForm.tsx,
// CotizadorForm.tsx) -- antes cada uno tenía su propia copia idéntica de
// ~160 marcas (incluyendo marcas históricas/discontinuadas/que nunca se
// vendieron en Argentina, como Abarth, Cisitalia, DeLorean, Hillman, Morris,
// Pagani, Rastrojero, Siam Di Tella, Torino...) y solo 10 marcas con modelos
// reales cargados -- el resto caía al fallback genérico ["Base", "Full",
// "Sport", "Standard", "Otro"].
//
// MARCAS_ARGENTINA se recortó a las marcas con presencia real en el mercado
// argentino actual (venta oficial o importación habitual). "Otra" al final
// cubre cualquier caso fuera de la lista -- no hay campo de texto libre
// todavía si se elige "Otra" (mismo comportamiento que ya tenía "Otro"
// antes, no es parte de este cambio).
//
// Esta lista es dato curado a mano, no viene de ningún catálogo oficial --
// el mercado cambia (marcas chinas entran/salen seguido), así que conviene
// revisarla cada tanto en vez de darla por estática para siempre.
export const MARCAS_ARGENTINA = [
  "Alfa Romeo", "Audi", "BAIC", "BMW", "BYD", "Changan", "Chery", "Chevrolet",
  "Citroën", "DFSK", "Fiat", "Ford", "Foton", "GWM / Great Wall", "Haval",
  "Honda", "Hyundai", "Iveco", "JAC", "Jeep", "Jetour", "Karry", "Kia",
  "Land Rover", "Mahindra", "Mercedes-Benz", "MG", "MINI", "Mitsubishi",
  "Nissan", "Peugeot", "Porsche", "RAM", "Rely", "Renault", "Subaru",
  "Suzuki", "Tata", "Tesla", "Toyota", "Volkswagen", "Volvo", "Wuling",
  "Zanella Utilitarios", "Otra",
];

// Ver también lib/marcasLogos.ts (LOGOS_MARCAS) -- al recortar esta lista
// se sumaron los logos que faltaban para las marcas nuevas del recorte.

// Única fuente de verdad del slug de marca para las URLs /marcas/[marca] --
// antes cada lugar que armaba este link (MarcasClient.tsx, el link de marca
// en catalogo/[slug]/page.tsx, sitemap.ts) usaba su propia versión naive
// (solo reemplazar espacios), sin sacar tildes -- "Citroën" generaba
// "citroën" en un lado y "citroen" en otro: dos URLs distintas para la
// misma marca, cada una mostrando resultados distintos.
export function slugificarMarca(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\s*\/\s*/g, "-")
    .replace(/\s+/g, "-");
}

// Modelos reales por marca, para las marcas de mayor volumen en el mercado
// argentino (las que más van a aparecer en consignaciones/cotizaciones/
// ventas reales). Las marcas de MARCAS_ARGENTINA que no están acá siguen
// cayendo al fallback genérico en cada formulario -- ampliar esta lista a
// medida que se necesite, no hace falta cubrir las 41 de una.
export const MODELOS_POR_MARCA: Record<string, string[]> = {
  "Chevrolet": ["Onix", "Onix Plus", "Tracker", "Cruze", "Equinox", "Montana", "S10", "Silverado", "Joy"],
  "Toyota": ["Hilux", "Corolla", "Corolla Cross", "Yaris", "SW4", "Etios", "RAV4", "Camry"],
  "Volkswagen": ["Gol Trend", "Polo", "Virtus", "Nivus", "T-Cross", "Taos", "Amarok", "Tiguan Allspace", "Saveiro"],
  "Ford": ["Ka", "Fiesta", "Focus", "EcoSport", "Territory", "Ranger", "Bronco Sport", "Maverick", "Kuga"],
  "Peugeot": ["208", "2008", "3008", "308", "408", "Partner", "Boxer"],
  "Renault": ["Kwid", "Sandero", "Logan", "Stepway", "Duster", "Oroch", "Kangoo", "Alaskan", "Captur"],
  "Fiat": ["Argo", "Cronos", "Pulse", "Fastback", "Toro", "Strada", "Mobi"],
  "Jeep": ["Renegade", "Compass", "Commander", "Wrangler", "Gladiator"],
  "Honda": ["Fit", "City", "Civic", "HR-V", "CR-V", "WR-V"],
  "Hyundai": ["HB20", "Creta", "Tucson", "Santa Fe", "i10"],
  "Kia": ["Picanto", "Rio", "Cerato", "Sportage", "Sorento", "Seltos"],
  "Nissan": ["March", "Versa", "Kicks", "Frontier", "X-Trail"],
  "Citroën": ["C3", "C4 Cactus", "C4", "Basalt", "Berlingo", "Jumpy", "Jumper"],
  "Mitsubishi": ["L200", "ASX", "Outlander", "Eclipse Cross"],
  "Suzuki": ["Fronx", "Swift", "S-Presso", "Vitara", "Jimny"],
  "Mercedes-Benz": ["Clase A", "Clase C", "Clase E", "GLA", "GLB", "GLC", "Sprinter", "Vito"],
  "Audi": ["A1", "A3", "A4", "Q2", "Q3", "Q5"],
  "BMW": ["Serie 1", "Serie 3", "X1", "X2", "X3", "X5"],
  "RAM": ["1500", "2500", "Rampage"],
  "Chery": ["Tiggo 2", "Tiggo 3", "Tiggo 5X", "Tiggo 7", "Tiggo 8", "Arrizo 5"],
  "BYD": ["Dolphin Mini", "Dolphin", "Song Plus", "Yuan Plus", "Seal", "Shark"],
  "Haval": ["H6", "Jolion", "H6 GT"],
  "JAC": ["T40", "T50", "T60", "T8"],
  "GWM / Great Wall": ["Poer", "Haval H6", "Ora 03"],
  "Land Rover": ["Discovery Sport", "Range Rover Evoque", "Defender", "Range Rover Sport"],
  "Volvo": ["XC40", "XC60", "XC90"],
  "MG": ["MG3", "ZS", "5", "RX5"],
  "MINI": ["Cooper", "Countryman", "Clubman"],
  "Subaru": ["XV", "Forester", "Outback"],
  "Mahindra": ["Pik Up", "Scorpio"],
  "Iveco": ["Daily"],
  "Wuling": ["Baojun 510", "Baojun 530", "Air EV"],
};
