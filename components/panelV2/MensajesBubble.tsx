"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase2 } from "@/lib/supabase2/client";
import { MessageCircle } from "lucide-react";

export default function MensajesBubble() {
  const router = useRouter();
  const pathname = usePathname();
  const [miId, setMiId] = useState("");
  const [noLeidos, setNoLeidos] = useState(0);

  useEffect(() => {
    supabase2.auth.getUser().then(({ data }) => setMiId(data.user?.id || ""));
  }, []);

  useEffect(() => {
    if (!miId) return;

    const calcular = async () => {
      const { data: misMembresias } = await supabase2.from("mensajes_canal_miembros").select("canal_id").eq("perfil_id", miId);
      const idsPropios = (misMembresias || []).map((m) => m.canal_id);
      const { data: canalesRaw } = await supabase2.from("mensajes_canales").select("id").or(`tipo.eq.general,id.in.(${idsPropios.length ? idsPropios.join(",") : "00000000-0000-0000-0000-000000000000"})`);
      const idsTodos = (canalesRaw || []).map((c) => c.id);
      if (idsTodos.length === 0) { setNoLeidos(0); return; }

      const [{ data: metaMsgs }, { data: lecturasRaw }] = await Promise.all([
        supabase2.from("mensajes").select("canal_id, autor_id, created_at").in("canal_id", idsTodos).neq("autor_id", miId),
        supabase2.from("mensajes_lecturas").select("canal_id, last_read_at").eq("perfil_id", miId),
      ]);
      const lecturaMap: Record<string, number> = {};
      (lecturasRaw || []).forEach((l) => { lecturaMap[l.canal_id] = new Date(l.last_read_at).getTime(); });
      const total = (metaMsgs || []).filter((m) => new Date(m.created_at).getTime() > (lecturaMap[m.canal_id] || 0)).length;
      setNoLeidos(total);
    };

    calcular();
    const canal = supabase2.channel(`mensajes-bubble-realtime-${miId}-${Math.random().toString(36).slice(2)}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, calcular).subscribe();
    return () => { supabase2.removeChannel(canal); };
  }, [miId]);

  if (pathname === "/panel-v2/mensajes") return null;

  return (
    <button
      onClick={() => router.push("/panel-v2/mensajes")}
      className="fixed bottom-6 right-24 z-40 w-12 h-12 rounded-full bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      title="Mensajes"
    >
      <MessageCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      {noLeidos > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
          {noLeidos > 99 ? "99+" : noLeidos}
        </span>
      )}
    </button>
  );
}
