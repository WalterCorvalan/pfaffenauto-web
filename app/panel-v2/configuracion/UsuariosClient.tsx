"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, UserPlus, Pencil, Trash2, Loader2, X, Users, UserCheck, UserX, MapPin, Search, ShieldCheck } from "lucide-react";
import { supabase2 } from "@/lib/supabase2/client";
import TablaResponsiva, { type ColumnaTabla } from "@/components/panelV2/TablaResponsiva";
import PermisosTab from "./PermisosTab";

const ROLES = ["admin", "encargado", "ventas", "finanzas", "gestoria"] as const;
const ROL_LABEL: Record<string, string> = { admin: "Admin", encargado: "Encargado", ventas: "Ventas", finanzas: "Finanzas", gestoria: "Gestoría" };
const ROL_COLOR: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  encargado: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  ventas: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  finanzas: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  gestoria: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};

interface Usuario { id: string; nombre: string; email: string; roles: string[]; activo: boolean; sucursal_id: string | null; }
interface Sucursal { id: string; nombre: string; }

export default function UsuariosClient() {
  const [vista, setVista] = useState<"equipo" | "permisos">("equipo");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [editandoSucursalId, setEditandoSucursalId] = useState<string | null>(null);
  const [guardandoSucursal, setGuardandoSucursal] = useState(false);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const cargar = async () => {
    setCargando(true);
    const [res, { data: sucursalesData }] = await Promise.all([
      fetch("/api/panel-v2/usuarios"),
      supabase2.from("sucursales").select("id, nombre").order("nombre"),
    ]);
    const data = await res.json();
    if (res.ok) setUsuarios(data.usuarios);
    else setError(data.error || "No se pudo cargar.");
    setSucursales(sucursalesData || []);
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const eliminar = async (u: Usuario) => {
    if (!confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) return;
    setEliminandoId(u.id);
    try {
      const res = await fetch(`/api/panel-v2/usuarios?id=${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) return alert(data.error || "No se pudo eliminar.");
      await cargar();
    } finally {
      setEliminandoId(null);
    }
  };

  const toggleActivo = async (u: Usuario) => {
    await fetch("/api/panel-v2/usuarios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id, activo: !u.activo }) });
    setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, activo: !u.activo } : x)));
  };

  const cambiarSucursal = async (u: Usuario, sucursalId: string) => {
    setGuardandoSucursal(true);
    await fetch("/api/panel-v2/usuarios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id, sucursal_id: sucursalId || null }) });
    setUsuarios((prev) => prev.map((x) => (x.id === u.id ? { ...x, sucursal_id: sucursalId || null } : x)));
    setGuardandoSucursal(false);
    setEditandoSucursalId(null);
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideRol = filtroRol === "todos" || u.roles.includes(filtroRol);
    const coincideBusqueda = !busqueda.trim() || u.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
    return coincideRol && coincideBusqueda;
  });
  const totalActivos = usuarios.filter((u) => u.activo).length;
  const totalInactivos = usuarios.length - totalActivos;
  const sucursalMap = Object.fromEntries(sucursales.map((s) => [s.id, s.nombre]));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-600" /> Configuración</h1>
          <p className="text-sm text-slate-400">Usuarios, roles y permisos del equipo.</p>
        </div>
        {vista === "equipo" && (
          <button onClick={() => setNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><UserPlus className="w-4 h-4" /> Nuevo usuario</button>
        )}
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10 overflow-x-auto">
        <button onClick={() => setVista("equipo")} className={`px-3 py-2.5 text-sm font-bold border-b-2 -mb-px whitespace-nowrap ${vista === "equipo" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>Colaboradores</button>
        <button onClick={() => setVista("permisos")} className={`px-3 py-2.5 text-sm font-bold border-b-2 -mb-px whitespace-nowrap flex items-center gap-1.5 ${vista === "permisos" ? "border-rose-600 text-rose-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}><ShieldCheck className="w-3.5 h-3.5" /> Permisos</button>
        <Link href="/panel-v2/configuracion/empresa" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">Empresa</Link>
        <Link href="/panel-v2/configuracion/whatsapp" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">WhatsApp</Link>
        <Link href="/panel-v2/configuracion/instagram" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500 whitespace-nowrap">Instagram</Link>
      </div>

      {error && <div className="text-rose-600 text-sm bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg">{error}</div>}

      {vista === "permisos" ? (
        <PermisosTab usuarios={usuarios} roles={ROLES as unknown as string[]} rolLabel={ROL_LABEL} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-500" /> {usuarios.length}</span>
            </div>
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Activos</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><UserCheck className="w-4 h-4" /> {totalActivos}</span>
            </div>
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Inactivos</span>
              <span className="text-xl font-bold text-slate-400 flex items-center gap-1.5"><UserX className="w-4 h-4" /> {totalInactivos}</span>
            </div>
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Sucursales</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-500" /> {sucursales.length}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar colaborador por nombre..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {["todos", ...ROLES].map((r) => (
                <button key={r} onClick={() => setFiltroRol(r)} className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-colors ${filtroRol === r ? "bg-slate-800 dark:bg-white/10 text-white border-slate-800 dark:border-white/10" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10"}`}>
                  {r === "todos" ? "Todos" : ROL_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
            {cargando ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : (
              <TablaResponsiva<Usuario>
                filas={usuariosFiltrados}
                keyExtractor={(u) => u.id}
                encabezadoMobile={(u) => (
                  <div className="flex items-center gap-3">
                    <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.id}&backgroundColor=f8fafc`} alt={u.nombre} className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 bg-white shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.nombre}</p>
                      <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                    </div>
                  </div>
                )}
                acciones={(u) => (
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <button onClick={() => setEditando(u)} disabled={eliminandoId === u.id} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-50"><Pencil className="w-3.5 h-3.5" /> Editar</button>
                    <button onClick={() => eliminar(u)} disabled={eliminandoId === u.id} className="flex items-center gap-1 text-rose-600 hover:text-rose-700 disabled:opacity-50">
                      {eliminandoId === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      {eliminandoId === u.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                )}
                columnas={
                  [
                    {
                      key: "usuario", header: "Usuario", ocultarEnMobile: true,
                      cell: (u) => (
                        <div className="flex items-center gap-3">
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${u.id}&backgroundColor=f8fafc`} alt={u.nombre} className="w-9 h-9 rounded-full border border-slate-200 dark:border-white/10 bg-white shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.nombre}</p>
                            <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "roles", header: "Roles",
                      cell: (u) => (
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => <span key={r} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ROL_COLOR[r] || "bg-slate-100 text-slate-600"}`}>{ROL_LABEL[r] || r}</span>)}
                        </div>
                      ),
                    },
                    {
                      key: "sucursal", header: "Sucursal",
                      cell: (u) => editandoSucursalId === u.id ? (
                        <select autoFocus defaultValue={u.sucursal_id || ""} disabled={guardandoSucursal} onChange={(e) => cambiarSucursal(u, e.target.value)} onBlur={() => setEditandoSucursalId(null)} className="bg-white dark:bg-white/5 border border-indigo-300 dark:border-indigo-400 rounded-lg px-2 py-1 text-xs outline-none">
                          <option value="">Sin sucursal fija</option>
                          {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                        </select>
                      ) : (
                        <button onClick={() => setEditandoSucursalId(u.id)} className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-sky-300">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {sucursalMap[u.sucursal_id || ""] || "Sin sucursal"}
                        </button>
                      ),
                    },
                    {
                      key: "estado", header: "Estado",
                      cell: (u) => (
                        <button onClick={() => toggleActivo(u)} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.activo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500"}`}>
                          {u.activo ? "Activo" : "Inactivo"}
                        </button>
                      ),
                    },
                  ] as ColumnaTabla<Usuario>[]
                }
              />
            )}
            {!cargando && usuariosFiltrados.length === 0 && <p className="px-4 py-8 text-center text-slate-400 text-sm">Ningún colaborador coincide con la búsqueda.</p>}
          </div>
        </>
      )}

      {nuevo && <ModalNuevoUsuario sucursales={sucursales} onClose={() => setNuevo(false)} onSaved={() => { setNuevo(false); cargar(); }} />}
      {editando && <ModalEditarUsuario usuario={editando} sucursales={sucursales} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); cargar(); }} />}
    </div>
  );
}

function ModalShell({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white dark:bg-[#111] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{titulo}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalNuevoUsuario({ sucursales, onClose, onSaved }: { sucursales: Sucursal[]; onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [roles, setRoles] = useState<string[]>(["ventas"]);
  const [sucursalId, setSucursalId] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const toggleRol = (r: string) => setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const guardar = async () => {
    if (!email || !password || !nombre || roles.length === 0) return setError("Completá email, contraseña, nombre y al menos un rol.");
    if (password.length < 6) return setError("La contraseña necesita al menos 6 caracteres.");
    setGuardando(true);
    setError("");
    const res = await fetch("/api/panel-v2/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, nombre, roles, sucursal_id: sucursalId || null }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "No se pudo crear."); setGuardando(false); return; }
    onSaved();
  };

  return (
    <ModalShell titulo="Nuevo usuario" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Contraseña</label>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
          <p className="text-[11px] text-slate-400 mt-1">La cargás vos acá -- no le llega ninguna invitación por mail, la cuenta queda activa directo.</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Roles</label>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button key={r} onClick={() => toggleRol(r)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${roles.includes(r) ? "bg-rose-600 text-white border-rose-600" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>
                {ROL_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Sucursal</label>
          <select value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">Sin sucursal fija</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button onClick={guardar} disabled={guardando} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">
          {guardando ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalEditarUsuario({ usuario, sucursales, onClose, onSaved }: { usuario: Usuario; sucursales: Sucursal[]; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [roles, setRoles] = useState<string[]>(usuario.roles);
  const [sucursalId, setSucursalId] = useState(usuario.sucursal_id || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const toggleRol = (r: string) => setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const guardar = async () => {
    if (!nombre || roles.length === 0) return setError("Completá nombre y al menos un rol.");
    setGuardando(true);
    const res = await fetch("/api/panel-v2/usuarios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: usuario.id, nombre, roles, sucursal_id: sucursalId || null }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "No se pudo guardar."); setGuardando(false); return; }
    onSaved();
  };

  return (
    <ModalShell titulo="Editar usuario" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Roles</label>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button key={r} onClick={() => toggleRol(r)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${roles.includes(r) ? "bg-rose-600 text-white border-rose-600" : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500"}`}>
                {ROL_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1">Sucursal</label>
          <select value={sucursalId} onChange={(e) => setSucursalId(e.target.value)} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none">
            <option value="">Sin sucursal fija</option>
            {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button onClick={guardar} disabled={guardando} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </ModalShell>
  );
}