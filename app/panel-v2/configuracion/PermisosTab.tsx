"use client";

import { Fragment, useEffect, useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { ShieldCheck, User, Search, Loader2 } from "lucide-react";

interface PermisoDef { clave: string; nombre: string; descripcion: string | null; categoria: string; }
interface UsuarioLite { id: string; nombre: string; roles: string[]; }

// Calcado de app/(panel-v1)/panel/usuarios/PermisosTab.tsx, adaptado a que
// en v2 un perfil tiene VARIOS roles a la vez (array) en vez de uno solo --
// el default de un usuario para un permiso es "otorgado si CUALQUIERA de
// sus roles lo otorga", no un único rol como en v1.
export default function PermisosTab({ usuarios, roles, rolLabel }: { usuarios: UsuarioLite[]; roles: string[]; rolLabel: Record<string, string> }) {
  const [permisos, setPermisos] = useState<PermisoDef[]>([]);
  const [rolPermisos, setRolPermisos] = useState<Record<string, boolean>>({});
  const [usuarioPermisos, setUsuarioPermisos] = useState<Record<string, boolean>>({});
  const [cargando, setCargando] = useState(true);
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState("");
  const [guardando, setGuardando] = useState<string | null>(null);
  const [busquedaPermiso, setBusquedaPermiso] = useState("");

  const cargar = async () => {
    setCargando(true);
    const [{ data: defs }, { data: rp }, { data: up }] = await Promise.all([
      supabase2.from("permisos_definiciones").select("*").order("categoria"),
      supabase2.from("rol_permisos").select("*"),
      supabase2.from("usuario_permisos").select("*"),
    ]);
    setPermisos(defs || []);
    const rolMap: Record<string, boolean> = {};
    (rp || []).forEach((r: any) => { rolMap[`${r.rol}:${r.permiso_clave}`] = r.otorgado; });
    setRolPermisos(rolMap);
    const usuMap: Record<string, boolean> = {};
    (up || []).forEach((u: any) => { usuMap[`${u.perfil_id}:${u.permiso_clave}`] = u.otorgado; });
    setUsuarioPermisos(usuMap);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const toggleRolPermiso = async (rol: string, clave: string) => {
    const key = `${rol}:${clave}`;
    const nuevoValor = !rolPermisos[key];
    setGuardando(key);
    setRolPermisos((prev) => ({ ...prev, [key]: nuevoValor }));
    await supabase2.from("rol_permisos").upsert({ rol, permiso_clave: clave, otorgado: nuevoValor }, { onConflict: "rol,permiso_clave" });
    setGuardando(null);
  };

  const cambiarExcepcionUsuario = async (perfilId: string, clave: string, valor: "heredado" | "otorgado" | "denegado") => {
    const key = `${perfilId}:${clave}`;
    setGuardando(key);
    if (valor === "heredado") {
      await supabase2.from("usuario_permisos").delete().eq("perfil_id", perfilId).eq("permiso_clave", clave);
      setUsuarioPermisos((prev) => { const next = { ...prev }; delete next[key]; return next; });
    } else {
      const otorgado = valor === "otorgado";
      await supabase2.from("usuario_permisos").upsert({ perfil_id: perfilId, permiso_clave: clave, otorgado }, { onConflict: "perfil_id,permiso_clave" });
      setUsuarioPermisos((prev) => ({ ...prev, [key]: otorgado }));
    }
    setGuardando(null);
  };

  if (cargando) {
    return <div className="p-16 flex flex-col items-center justify-center"><Loader2 className="w-8 h-8 mb-3 text-slate-300 animate-spin" /><p className="text-[13px] font-medium text-slate-500">Cargando permisos...</p></div>;
  }

  const usuarioSeleccionado = usuarios.find((u) => u.id === usuarioSeleccionadoId);
  const permisosFiltrados = permisos.filter((p) => {
    const q = busquedaPermiso.trim().toLowerCase();
    if (!q) return true;
    return p.nombre.toLowerCase().includes(q) || (p.descripcion || "").toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q);
  });
  const categorias = [...new Set(permisosFiltrados.map((p) => p.categoria))];

  // Un usuario tiene el default de un permiso si CUALQUIERA de sus roles lo
  // otorga (admin siempre true, igual que v1 lo hardcodea para su único rol).
  const defaultParaRoles = (rolesUsuario: string[], clave: string) => {
    if (rolesUsuario.includes("admin")) return true;
    return rolesUsuario.some((r) => !!rolPermisos[`${r}:${clave}`]);
  };

  return (
    <div className="space-y-6">
      {/* ============= PERMISOS POR ROL ============= */}
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-800 dark:bg-white/5 flex items-center gap-2 flex-wrap justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-white" />
            <h2 className="text-[12px] font-bold text-white uppercase tracking-widest">Permisos por Rol</h2>
          </span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" value={busquedaPermiso} onChange={(e) => setBusquedaPermiso(e.target.value)} placeholder="Buscar permiso..." className="bg-slate-700 dark:bg-white/10 border border-slate-600 dark:border-white/10 rounded-lg py-1.5 pl-8 pr-3 text-[12px] text-white outline-none focus:border-indigo-400 placeholder:text-slate-400 w-48" />
          </div>
        </div>
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-[1]">
              <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 text-[10px] uppercase tracking-widest font-bold">
                <th className="p-3 pl-4">Permiso</th>
                {roles.map((r) => (<th key={r} className="p-3 text-center">{rolLabel[r] || r}</th>))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {categorias.length === 0 && (
                <tr><td colSpan={roles.length + 1} className="p-8 text-center text-[12px] text-slate-400 italic">Ningún permiso coincide con la búsqueda.</td></tr>
              )}
              {categorias.map((cat) => (
                <Fragment key={cat}>
                  <tr className="bg-slate-50/60 dark:bg-white/[0.03]">
                    <td colSpan={roles.length + 1} className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{cat}</td>
                  </tr>
                  {permisosFiltrados.filter((p) => p.categoria === cat).map((permiso) => (
                    <tr key={permiso.clave}>
                      <td className="p-3 pl-4">
                        <p className="text-[13px] font-bold text-slate-900 dark:text-white">{permiso.nombre}</p>
                        {permiso.descripcion && <p className="text-[11px] text-slate-500 dark:text-slate-400">{permiso.descripcion}</p>}
                      </td>
                      {roles.map((rol) => {
                        const key = `${rol}:${permiso.clave}`;
                        const otorgado = rol === "admin" ? true : !!rolPermisos[key];
                        return (
                          <td key={rol} className="p-3 text-center">
                            <button
                              type="button"
                              disabled={rol === "admin" || guardando === key}
                              onClick={() => toggleRolPermiso(rol, permiso.clave)}
                              title={rol === "admin" ? "Admin siempre tiene todos los permisos" : ""}
                              className={`w-11 h-6 rounded-full flex items-center px-1 transition-colors mx-auto disabled:opacity-60 disabled:cursor-not-allowed ${otorgado ? "bg-emerald-500 justify-end" : "bg-slate-300 dark:bg-white/10 justify-start"}`}
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
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-slate-800 dark:bg-white/5 flex items-center gap-2">
          <User className="w-4 h-4 text-white" />
          <h2 className="text-[12px] font-bold text-white uppercase tracking-widest">Excepciones por Usuario</h2>
        </div>
        <div className="p-4 space-y-4">
          <select value={usuarioSeleccionadoId} onChange={(e) => setUsuarioSeleccionadoId(e.target.value)} className="w-full sm:w-72 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-white">
            <option value="">Elegir colaborador...</option>
            {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nombre} — {u.roles.map((r) => rolLabel[r] || r).join(", ")}</option>))}
          </select>

          {usuarioSeleccionado && (
            <div className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-300 text-[10px] uppercase tracking-widest font-bold">
                    <th className="p-3 pl-4">Permiso</th>
                    <th className="p-3">Default de sus roles ({usuarioSeleccionado.roles.map((r) => rolLabel[r] || r).join(", ")})</th>
                    <th className="p-3">Excepción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {permisos.map((permiso) => {
                    const key = `${usuarioSeleccionadoId}:${permiso.clave}`;
                    const esAdmin = usuarioSeleccionado.roles.includes("admin");
                    const defaultRoles = defaultParaRoles(usuarioSeleccionado.roles, permiso.clave);
                    const tieneExcepcion = key in usuarioPermisos;
                    const valorActual = tieneExcepcion ? (usuarioPermisos[key] ? "otorgado" : "denegado") : "heredado";
                    return (
                      <tr key={permiso.clave}>
                        <td className="p-3 pl-4 text-[13px] font-bold text-slate-900 dark:text-white">{permiso.nombre}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${defaultRoles ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-white/10 text-slate-500"}`}>
                            {defaultRoles ? "Sí" : "No"}
                          </span>
                        </td>
                        <td className="p-3">
                          <select
                            value={valorActual}
                            disabled={esAdmin || guardando === key}
                            onChange={(e) => cambiarExcepcionUsuario(usuarioSeleccionadoId, permiso.clave, e.target.value as any)}
                            className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-[12px] font-bold outline-none cursor-pointer text-slate-800 dark:text-white disabled:opacity-60"
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
