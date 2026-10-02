import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Service-role, no la key pública: "perfiles" tiene RLS que bloquea lectura
// anónima (correcto, son datos de empleados) -- mismo patrón que ya usa la
// página pública de presupuestos para leer perfiles.whatsapp.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE2_URL!,
  process.env.SUPABASE2_SERVICE_ROLE_KEY!
);

// Botón "Contactar Asesor" del banner de Consignar (home) -- antes era un
// link fijo a "/#sucursales". Pedido: que redirija por WhatsApp a
// cualquiera de los vendedores/encargados activos, al azar, uno distinto
// en cada clic (no round-robin guardado, no hace falta repartir leads acá,
// solo evitar que todos le lleguen siempre a la misma persona). Mismo
// patrón de numeroContacto que ya usa la página pública de presupuestos
// (perfiles.whatsapp, formato internacional completo, solo se le sacan los
// caracteres no numéricos).
const WHATSAPP_FALLBACK = "5491121907000"; // Casa Central, por si no hay ningún perfil con whatsapp cargado

export async function GET() {
  const { data } = await supabase
    .from("perfiles")
    .select("whatsapp")
    .eq("activo", true)
    .or("roles.cs.{ventas},roles.cs.{encargado}")
    .not("whatsapp", "is", null);

  // perfiles.whatsapp no viene siempre en formato internacional completo
  // (algunos lo tienen cargado como el número local de 10 dígitos, sin
  // "549") -- mismo criterio que sucursales.telefono_encargado en
  // promptsV2.ts: si ya empieza con 54 se asume completo, si no se le saca
  // el 0 de troncal y se le agrega 549 adelante.
  const numeros = (data || [])
    .map((p) => p.whatsapp?.replace(/\D/g, ""))
    .filter((n): n is string => !!n)
    .map((n) => (n.startsWith("54") ? n : `549${n.replace(/^0/, "")}`));

  const elegido = numeros.length > 0 ? numeros[Math.floor(Math.random() * numeros.length)] : WHATSAPP_FALLBACK;

  const mensaje = encodeURIComponent("Hola! Quiero consultar por consignar mi vehículo.");
  return NextResponse.redirect(`https://wa.me/${elegido}?text=${mensaje}`);
}
