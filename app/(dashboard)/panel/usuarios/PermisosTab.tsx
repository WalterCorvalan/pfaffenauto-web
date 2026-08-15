"use client";

import { Fragment, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { ShieldCheck, User } from "lucide-react";

const ROLES = ["admin", "encargado", "vendedor", "taller"];

interface PermisoDef {
  clave: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
}

export default function PermisosTab({ perfiles }: { perfiles: any[] }) {
  const [permisos, setPermisos] = useState<PermisoDef[]>([]);
  const [rolPermisos, setRolPermisos] = useState<Record<string, boolean>>({});
  const [usuarioPermisos, setUsuarioPermisos] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState("");
  const [guardando, setGuardando] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: defs }, { data: rp }, { data: up }] = await Promise.all([
      supabase.from("permisos_definiciones").select("*").order("categoria"),
      supabase.from("rol_permisos").select("*"),
      supabase.from("usuario_permisos").select("*"),
    ]);
    setPermisos(defs || []);
    const rolMap: Record<string, boolean> = {};
    (rp || []).forEach((r: any) => { rolMap[`${r.rol}:${r.permiso_clave}`] = r.otorgado; });
    setRolPermisos(rolMap);
    const usuMap: Record<string, boolean> = {};
    (up || []).forEach((u: any) => { usuMap[`${u.perfil_id}:${u.permiso_clave}`] = u.otorgado; });
    setUsuarioPermisos(usuMap);
    setLoading(false);
  };

  const toggleRolPermiso = async (rol: string, clave: string) => {
    const key = `${rol}:${clave}`;
    const nuevoValor = !rolPermisos[key];
    setGuardando(key);
    setRolPermisos((prev) => ({ ...prev, [key]: nuevoValor }));
    await supabase.from("rol_permisos").upsert({ rol, permiso_clave: clave, otorgado: nuevoValor }, { onConflict: "rol,permiso_clave" });
    setGuardando(null);
  };

  const cambiarExcepcionUsuario = async (perfilId: string, clave: string, valor: "heredado" | "otorgado" | "denegado") => {
    const key = `${perfilId}:${clave}`;
    setGuardando(key);
    if (valor === "heredado") {
      await supabase.from("usuario_permisos").delete().eq("perfil_id", perfilId).eq("permiso_clave", clave);
      setUsuarioPermisos((prev) => { const next = { ...prev }; delete next[key]; return next; });
    } else {
      const otorgado = valor === "otorgado";
      await supabase.from("usuario_permisos").upsert({ perfil_id: perfilId, permiso_clave: clave, otorgado }, { onConflict: "perfil_id,permiso_clave" });
      setUsuarioPermisos((prev) => ({ ...prev, [key]: otorgado }));
    }
    setGuardando(null);
  };

  if (loading) {
    return (
      <div className="p-16 text-center flex flex-col items-center justify-center">
        <ShieldCheck className="w-10 h-10 mb-3 text-slate-300 animate-pulse" />
        <p className="text-[13px] font-medium text-slate-500">Cargando permisos...</p>
      </div>
    );
  }

  const usuarioSeleccionado = perfiles.find((p) => p.id === usuarioSeleccionadoId);
  const categorias = [...new Set(permisos.map((p) => p.categoria))];

  return (
    <div className="space-y-6">
      {/* ============= PERMISOS POR ROL ============= */}
      <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-white" />
          <h2 className="text-[12px] font-bold text-white uppercase tracking-widest">Permisos por Rol</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-300 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-3 pl-4">Permiso</th>
                {ROLES.map((r) => (<th key={r} className="p-3 text-center capitalize">{r}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
              {categorias.map((cat) => (
                <Fragment key={cat}>
                  <tr className="bg-slate-50/60 dark:bg-[#00184a]">
                    <td colSpan={ROLES.length + 1} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{cat}</td>
                  </tr>
                  {permisos.filter((p) => p.categoria === cat).map((permiso) => (
                    <tr key={permiso.clave}>
                      <td className="p-3 pl-4">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">{permiso.nombre}</p>
                        {permiso.descripcion && <p className="text-[11px] text-slate-500 dark:text-slate-400">{permiso.descripcion}</p>}
                      </td>
                      {ROLES.map((rol) => {
                        const key = `${rol}:${permiso.clave}`;
                        const otorgado = rol === "admin" ? true : !!rolPermisos[key];
                        return (
                          <td key={rol} className="p-3 text-center">
                            <button
                              type="button"
                              disabled={rol === "admin" || guardando === key}
                              onClick={() => toggleRolPermiso(rol, permiso.clave)}
                              title={rol === "admin" ? "Admin siempre tiene todos los permisos" : ""}
                              className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors mx-auto disabled:opacity-60 disabled:cursor-not-allowed ${otorgado ? "bg-emerald-500 justify-end" : "bg-slate-300 dark:bg-[#0a2a6b] justify-start"}`}
                            >
                              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============= EXCEPCIONES POR USUARIO ============= */}
      <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-800 flex items-center gap-2">
          <User className="w-4 h-4 text-white" />
          <h2 className="text-[12px] font-bold text-white uppercase tracking-widest">Excepciones por Usuario</h2>
        </div>
        <div className="p-4 space-y-4">
          <select
            value={usuarioSeleccionadoId}
            onChange={(e) => setUsuarioSeleccionadoId(e.target.value)}
            className="w-full sm:w-72 bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white"
          >
            <option value="">Elegir colaborador...</option>
            {perfiles.map((p) => (<option key={p.id} value={p.id}>{p.nombre} — {p.rol}</option>))}
          </select>

          {usuarioSeleccionado && (
            <div className="border border-slate-200 dark:border-[#0a2a6b] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#00246b] text-slate-500 dark:text-slate-300 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-3 pl-4">Permiso</th>
                    <th className="p-3">Default del rol ({usuarioSeleccionado.rol})</th>
                    <th className="p-3">Excepción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                  {permisos.map((permiso) => {
                    const key = `${usuarioSeleccionadoId}:${permiso.clave}`;
                    const esAdmin = usuarioSeleccionado.rol === "admin";
                    const defaultRol = esAdmin ? true : !!rolPermisos[`${usuarioSeleccionado.rol}:${permiso.clave}`];
                    const tieneExcepcion = key in usuarioPermisos;
                    const valorActual = tieneExcepcion ? (usuarioPermisos[key] ? "otorgado" : "denegado") : "heredado";
                    return (
                      <tr key={permiso.clave}>
                        <td className="p-3 pl-4 text-[13px] font-bold text-slate-900 dark:text-white">{permiso.nombre}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${defaultRol ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            {defaultRol ? "Sí" : "No"}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={valorActual}
                            disabled={esAdmin || guardando === key}
                            onChange={(e) => cambiarExcepcionUsuario(usuarioSeleccionadoId, permiso.clave, e.target.value as any)}
                            className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg px-2.5 py-1.5 text-[12px] font-bold outline-none cursor-pointer text-slate-800 dark:text-white disabled:opacity-60"
                          >
                            <option value="heredado">Heredado del rol</option>
                            <option value="otorgado">Otorgado</option>
                            <option value="denegado">Denegado</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
