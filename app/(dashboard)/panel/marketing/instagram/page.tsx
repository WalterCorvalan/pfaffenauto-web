import { Camera, AlertTriangle } from "lucide-react";
import {
  getInstagramAccountSummary,
  getInstagramAccountInsights,
  getInstagramMedia,
  getInstagramMediaInsights,
  MetaApiError,
} from "@/lib/meta/client";
import InstagramMetricsClient from "./InstagramMetricsClient";

function EstadoVacio({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="flex flex-col h-full w-full bg-[#F9FAFB] dark:bg-[#001233]">
      <header className="flex items-center gap-3 border-b border-slate-200 dark:border-[#0a2a6b] px-4 py-4 bg-white dark:bg-[#001c55] shrink-0">
        <div className="w-9 h-9 rounded-lg bg-pink-50 dark:bg-[#002a6e] border border-pink-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
          <Camera className="w-4.5 h-4.5 text-pink-600 dark:text-pink-300" />
        </div>
        <div>
          <h1 className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight">Métricas de Instagram</h1>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Dashboard de rendimiento de la cuenta</p>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h2 className="font-bold text-slate-800 dark:text-white mb-2">{titulo}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{detalle}</p>
        </div>
      </div>
    </div>
  );
}

export default async function InstagramMetricasPage() {
  const igUserId = process.env.META_INSTAGRAM_USER_ID;
  const token = process.env.META_INSTAGRAM_TOKEN;

  if (!igUserId || !token) {
    return (
      <EstadoVacio
        titulo="Instagram no está configurado"
        detalle="Faltan META_INSTAGRAM_USER_ID / META_INSTAGRAM_TOKEN en las variables de entorno."
      />
    );
  }

  const ahora = Math.floor(Date.now() / 1000);
  const hace30dias = ahora - 30 * 24 * 3600;

  try {
    const [resumen, insights, media] = await Promise.all([
      getInstagramAccountSummary(igUserId, token),
      getInstagramAccountInsights(igUserId, token, hace30dias, ahora),
      getInstagramMedia(igUserId, token, 12),
    ]);

    const reachSerie = insights.data.find((m) => m.name === "reach")?.values ?? [];
    const visitasSerie = insights.data.find((m) => m.name === "profile_views")?.values ?? [];
    const serie = reachSerie.map((v, i) => ({
      fecha: new Date(v.end_time).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
      alcance: v.value,
      visitasPerfil: visitasSerie[i]?.value ?? 0,
    }));

    // Insights por post: uno por uno, solo para los primeros 6 (evita pegarle
    // demasiadas veces a la API en una sola carga de página).
    const postsConInsights = await Promise.all(
      media.data.slice(0, 6).map(async (p) => {
        try {
          const ins = await getInstagramMediaInsights(p.id, token);
          const reach = ins.data.find((m) => m.name === "reach")?.values[0]?.value;
          const saved = ins.data.find((m) => m.name === "saved")?.values[0]?.value;
          return { ...p, reach, saved };
        } catch {
          return { ...p, reach: undefined, saved: undefined };
        }
      })
    );

    return (
      <div className="flex flex-col h-full w-full bg-[#F9FAFB] dark:bg-[#001233] overflow-y-auto">
        <header className="flex items-center gap-3 border-b border-slate-200 dark:border-[#0a2a6b] px-4 py-4 bg-white dark:bg-[#001c55] shrink-0">
          <div className="w-9 h-9 rounded-lg bg-pink-50 dark:bg-[#002a6e] border border-pink-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Camera className="w-4.5 h-4.5 text-pink-600 dark:text-pink-300" />
          </div>
          <div>
            <h1 className="text-[16px] font-bold text-slate-900 dark:text-white leading-tight">Métricas de Instagram</h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">@{resumen.username} — últimos 30 días</p>
          </div>
        </header>
        <div className="p-4 md:p-6">
          <InstagramMetricsClient
            seguidores={resumen.followers_count}
            cantidadPosts={resumen.media_count}
            username={resumen.username}
            serie={serie}
            posts={postsConInsights}
          />
        </div>
      </div>
    );
  } catch (err) {
    const esPermiso = err instanceof MetaApiError && (err.code === 10 || err.code === 100);
    return (
      <EstadoVacio
        titulo={esPermiso ? "Falta el permiso instagram_manage_insights" : "No se pudieron cargar las métricas"}
        detalle={
          esPermiso
            ? "El token de Meta no tiene el permiso de insights aprobado todavía. Hay que agregarlo en la configuración de la app de Meta for Developers y volver a autorizar."
            : err instanceof Error
            ? err.message
            : "Error desconocido al conectar con la API de Meta."
        }
      />
    );
  }
}
