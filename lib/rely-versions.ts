function galeria(folder: string, cantidad: number): string[] {
  return Array.from({ length: cantidad }, (_, i) => `/${folder}/${i + 1}.jpeg`);
}

export const RELY_VERSIONS = [
  {
    code: "COMFORT",
    slug: "comfort",
    name: "RELY R8 COMFORT",
    subtitle: "TRACCIÓN 4X4 DE SERIE, LISTA PARA TRABAJAR",
    load: "1.000 kg",
    text: "La puerta de entrada a la gama R8, sin resignar equipamiento de seguridad.",
    specs: [
      "Motor 2.3L turbodiésel",
      "Doble airbag frontal",
      "Tracción 4×4",
      "Garantía 5 años / 200.000 km",
    ],
    image: "/Rely-confort/1.jpeg",
    images: galeria("Rely-confort", 7),
  },
  {
    code: "LUXURY",
    slug: "luxury",
    name: "RELY R8 LUXURY",
    subtitle: "EQUIPAMIENTO AMPLIADO Y PANTALLA 12,3″",
    load: "1.000 kg",
    text: "Más tecnología a bordo: pantalla central grande y terminaciones superiores.",
    specs: [
      "Motor 2.3L turbodiésel",
      "Pantalla 12,3″ · CarPlay/Android Auto",
      "Tracción 4×4",
      "Garantía 5 años / 200.000 km",
    ],
    image: "/Rely-deluxe/1.jpeg",
    images: galeria("Rely-deluxe", 8),
  },
  {
    code: "LIMITED",
    slug: "limited",
    name: "RELY R8 LIMITED",
    subtitle: "TOPE DE GAMA, CÁMARA 360° Y ADAS",
    load: "1.000 kg",
    text: "La versión más completa: máxima seguridad y confort para cualquier terreno.",
    specs: [
      "Motor 2.3L turbodiésel",
      "7 airbags + asistentes ADAS",
      "Cámara 360°",
      "Garantía 5 años / 200.000 km",
    ],
    image: "/Rely-Limited/1.jpeg",
    images: galeria("Rely-Limited", 12),
  },
];
