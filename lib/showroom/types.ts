export type ShowroomView = "cenital" | "exterior" | "interior" | "trasera";

export type ShowroomVehicle = {
  id: string;
  marca: string;
  nombre: string;
  subtitulo: string;
  modelUrl?: string; // .glb/.gltf, undefined = placeholder box
  colorPlaceholder: string;
  dimensiones: { largo: number; ancho: number; alto: number };
  image: string;
  specs: string[];
  whatsappLink: string;
  disponibles?: number; // cantidad de unidades en stock de este modelo, para el badge de la tarjeta cenital
};
