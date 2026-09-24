"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// "Convertida" no es un estado que se elija a mano -- lo pone solo el
// sistema cuando una Venta se vincula a esta seña (NuevaVentaModal.tsx). Acá
// solo se puede pasar manualmente entre Pendiente y Perdida; si ya está
// Realizada queda como badge fijo, sin selector.
const ESTADOS = ["Activa", "Perdida"];
const LABEL: Record<string, string> = { Activa: "Pendiente", Convertida: "Realizada", Perdida: "Perdida" };
const COLOR: Record<string, string> = {
  Activa: "bg-amber-500 text-white border-amber-500",
  Convertida: "bg-emerald-500 text-white border-emerald-500",
  Perdida: "bg-rose-500 text-white border-rose-500",
};

export default function EstadoSenaSelector({ id, estado, vehiculoId }: { id: string; estado: string; vehiculoId?: string | null }) {
  const router = useRouter();
  const [actual, setActual] = useState(estado || "Activa");
  const [cargando, setCargando] = useState(false);

  if (actual === "Convertida") {
    return (
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border inline-block ${COLOR.Convertida}`} title="Se marcó sola al vincular la venta — no se puede cambiar a mano">
        {LABEL.Convertida}
      </span>
    );
  }

  const cambiar = async (nuevo: string) => {
    // Al recibir la seña se cargó un ingreso real en Finanzas
    // (movimientos_caja.sena_id = id). Si se pierde y el depósito se
    // devuelve al cliente, ese ingreso hay que revertirlo -- si no, la plata
    // queda contabilizada como ingreso para siempre sin que haya entrado
    // nada. Si en cambio queda en la agencia (arras, gasto administrativo),
    // el movimiento se deja intacto, igual que en una venta caída.
    let devuelta = false;
    if (nuevo === "Perdida") {
      devuelta = confirm("La seña se marca como perdida. ¿El depósito se devuelve al cliente? Aceptar = se devuelve (revierte el ingreso en Finanzas). Cancelar = queda en la agencia (no se toca Finanzas).");
    }

    // Orden importa: primero se actualiza la seña (lo reversible y sin
    // efecto en plata real), y RECIÉN si eso funciona se toca Finanzas --
    // antes era al revés, y si el update de la seña fallaba DESPUÉS de
    // revertir la caja, quedaba la plata revertida con la seña todavía
    // "Activa" (inconsistente: el ingreso ya no estaba en Finanzas, pero
    // nada en la seña reflejaba que se había perdido).
    setActual(nuevo);
    setCargando(true);
    const { error } = await supabase2.from("senas").update({ estado: nuevo, etapa_seguimiento: nuevo }).eq("id", id);
    if (error) {
      setCargando(false);
      alert("Error al cambiar el estado");
      setActual(estado);
      return;
    }
    if (nuevo === "Perdida" && vehiculoId) {
      // Se cayó la seña: liberamos el auto.
      await supabase2.from("vehiculos").update({ estado: "disponible" }).eq("id", vehiculoId);
    }
    if (nuevo === "Activa" && estado === "Perdida" && vehiculoId) {
      // Reactivar una seña Perdida es el efecto inverso de arriba -- sin
      // esto el auto quedaba "disponible" mientras la seña volvía a
      // mostrarse "Activa" (implica reservado), y otro vendedor podía
      // vender/señar el mismo auto. Solo se vuelve a marcar "señado" si
      // sigue disponible -- si mientras tanto se vendió/señó por otro
      // lado, no se pisa ese estado más nuevo, se avisa para resolver a mano.
      const { data: vehiculoActual } = await supabase2.from("vehiculos").select("estado").eq("id", vehiculoId).maybeSingle();
      if (vehiculoActual?.estado === "disponible") {
        await supabase2.from("vehiculos").update({ estado: "señado" }).eq("id", vehiculoId);
      } else if (vehiculoActual && vehiculoActual.estado !== "señado") {
        alert(`La seña se reactivó, pero el vehículo ya está "${vehiculoActual.estado}" por otro lado -- revisalo a mano.`);
      }
    }
    if (nuevo === "Perdida" && devuelta) {
      const { data: mov } = await supabase2.from("movimientos_caja").select("id").eq("sena_id", id).is("deleted_at", null).maybeSingle();
      if (mov) {
        const { error: errorRev } = await supabase2.rpc("eliminar_movimiento_caja", { p_movimiento_id: mov.id, p_motivo: "Seña perdida — depósito devuelto al cliente" });
        // La seña YA quedó marcada Perdida -- si esto falla no se revierte
        // ese cambio (sería peor: la seña volvería a verse "Activa" con la
        // plata todavía sin resolver). Se avisa fuerte para revisarlo a
        // mano en vez de dejarlo pasar en silencio.
        if (errorRev) alert(`La seña quedó marcada como Perdida, pero no se pudo revertir el ingreso en Finanzas: ${errorRev.message}. Revisalo a mano.`);
      }
    }
    setCargando(false);
    router.refresh();
  };

  return (
    <select
      value={actual}
      disabled={cargando}
      onChange={(e) => cambiar(e.target.value)}
      className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border outline-none cursor-pointer transition-transform hover:scale-105 disabled:opacity-50 ${COLOR[actual] || COLOR.Activa}`}
    >
      {ESTADOS.map((e) => <option key={e} value={e} className="bg-white dark:bg-[#141414] text-slate-900 dark:text-white">{LABEL[e]}</option>)}
    </select>
  );
}
