import Seguimiento from "@/components/Seguimiento";

// Página standalone del buscador de seguimiento (mismo componente que se usa
// en el home) — existe para que el link "Probar de nuevo" de
// /seguimiento/[codigo] (código inválido) tenga a dónde apuntar, y para
// poder compartir/bookmarkear la URL sin pasar por el home.
export default function SeguimientoPage() {
  return <Seguimiento />;
}
