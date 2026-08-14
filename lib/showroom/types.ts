export type ShowroomView = "exterior" | "interior" | "trasera";

export type ShowroomVehicle = {
  id: string;
  marca: "karry" | "rely";
  nombre: string;
  subtitulo: string;
  modelUrl?: string; // .glb/.gltf, undefined = placeholder box
  colorPlaceholder: string;
  dimensiones: { largo: number; ancho: number; alto: number };
  image: string;
  specs: string[];
  whatsappLink: string;
};

export const SHOWROOM_VEHICULOS: ShowroomVehicle[] = [
  {
    id: "karry-cabina-simple",
    marca: "karry",
    nombre: "Karry Cabina Simple",
    subtitulo: "Mayor espacio y superficie comercial",
    colorPlaceholder: "#c8102e",
    dimensiones: { largo: 4.4, ancho: 1.6, alto: 1.5 },
    image: "/Karry-cabina-simple/1.jpeg",
    specs: [
      "Motor 1.6L · 121 HP",
      "Capacidad de carga: 1.620 kg",
      "Ideal para reparto y logística urbana",
      "Garantía 7 años / 100.000 km",
    ],
    whatsappLink:
      "https://wa.me/5491121907000?text=Hola%2C%20quiero%20cotizar%20la%20Karry%20Cabina%20Simple",
  },
  {
    id: "karry-cabina-doble",
    marca: "karry",
    nombre: "Karry Cabina Doble",
    subtitulo: "Dos filas de asientos para tu equipo",
    colorPlaceholder: "#c8102e",
    dimensiones: { largo: 4.6, ancho: 1.6, alto: 1.5 },
    image: "/Karry-cabina-doble/1.jpeg",
    specs: [
      "Motor 1.6L · 121 HP",
      "Capacidad de carga: 1.540 kg",
      "Ideal para cuadrillas y servicio técnico",
      "Garantía 7 años / 100.000 km",
    ],
    whatsappLink:
      "https://wa.me/5491121907000?text=Hola%2C%20quiero%20cotizar%20la%20Karry%20Cabina%20Doble",
  },
  {
    id: "rely-modelo-1",
    marca: "rely",
    nombre: "Rely Modelo 1",
    subtitulo: "Pendiente de datos reales",
    colorPlaceholder: "#1a1a2e",
    dimensiones: { largo: 4.5, ancho: 1.7, alto: 1.6 },
    image: "/RelyLogo.png",
    specs: ["Pendiente de datos reales"],
    whatsappLink: "https://wa.me/5491121907000?text=Hola%2C%20quiero%20cotizar%20la%20Rely",
  },
  {
    id: "rely-modelo-2",
    marca: "rely",
    nombre: "Rely Modelo 2",
    subtitulo: "Pendiente de datos reales",
    colorPlaceholder: "#1a1a2e",
    dimensiones: { largo: 4.7, ancho: 1.7, alto: 1.6 },
    image: "/RelyLogo.png",
    specs: ["Pendiente de datos reales"],
    whatsappLink: "https://wa.me/5491121907000?text=Hola%2C%20quiero%20cotizar%20la%20Rely",
  },
];
