"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Eye, UserCheck, Image as ImageIcon, Heart, MessageCircle } from "lucide-react";

type SerieDia = { fecha: string; alcance: number; visitasPerfil: number };
type Post = {
  id: string;
  caption?: string;
  media_url?: string;
  permalink: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
  reach?: number;
  saved?: number;
};

export default function InstagramMetricsClient({
  seguidores,
  cantidadPosts,
  username,
  serie,
  posts,
}: {
  seguidores: number;
  cantidadPosts: number;
  username: string;
  serie: SerieDia[];
  posts: Post[];
}) {
  const alcanceTotal = serie.reduce((acc, d) => acc + d.alcance, 0);
  const visitasTotal = serie.reduce((acc, d) => acc + d.visitasPerfil, 0);

  const kpis = [
    { label: "Seguidores", valor: seguidores.toLocaleString("es-AR"), icon: Users },
    { label: "Alcance (30d)", valor: alcanceTotal.toLocaleString("es-AR"), icon: Eye },
    { label: "Visitas al perfil (30d)", valor: visitasTotal.toLocaleString("es-AR"), icon: UserCheck },
    { label: "Publicaciones", valor: cantidadPosts.toLocaleString("es-AR"), icon: ImageIcon },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-2">
              <k.icon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{k.label}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{k.valor}</div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl p-5">
        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 mb-4">Alcance y visitas al perfil — últimos 30 días</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serie}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-[#0a2a6b]" />
              <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="alcance" name="Alcance" stroke="#0145F2" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="visitasPerfil" name="Visitas al perfil" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden">
        <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 p-5 pb-3">Publicaciones recientes — @{username}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-[#0a2a6b]">
                <th className="p-3">Post</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Alcance</th>
                <th className="p-3"><Heart className="w-3.5 h-3.5" /></th>
                <th className="p-3"><MessageCircle className="w-3.5 h-3.5" /></th>
                <th className="p-3">Guardados</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 dark:border-[#0a2a6b] hover:bg-slate-50 dark:hover:bg-[#00246b]">
                  <td className="p-3">
                    <a href={p.permalink} target="_blank" rel="noopener noreferrer" className="text-[#0145F2] dark:text-sky-300 hover:underline line-clamp-1 max-w-xs block">
                      {p.caption ? p.caption.slice(0, 60) : "(sin texto)"}
                    </a>
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400">
                    {new Date(p.timestamp).toLocaleDateString("es-AR")}
                  </td>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-200">{p.reach?.toLocaleString("es-AR") ?? "—"}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{p.like_count ?? 0}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{p.comments_count ?? 0}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{p.saved ?? "—"}</td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400 dark:text-slate-500 text-sm">Sin publicaciones para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
