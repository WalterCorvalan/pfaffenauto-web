"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Users, UserPlus, X, Edit2, Trash2, Shield, MapPin, Tags, ShieldCheck, Search, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import PermisosTab from "./PermisosTab";

export default function UsuariosPage() {
  const router = useRouter();
  const [vista, setVista] = useState<"equipo" | "permisos">("equipo");
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<any | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [editandoSucursalId, setEditandoSucursalId] = useState<string | null>(null);
  const [guardandoSucursalRapida, setGuardandoSucursalRapida] = useState(false);
  const [editandoRolId, setEditandoRolId] = useState<string | null>(null);
  const [guardandoRolRapido, setGuardandoRolRapido] = useState(false);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [editandoCategoriaId, setEditandoCategoriaId] = useState<string | null>(null);
  const [guardandoCategoriaRapida, setGuardandoCategoriaRapida] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<string>("todos");

  // Estados del formulario de nuevo usuario
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("vendedor");
  const [sucursalId, setSucursalId] = useState("");
  const [creando, setCreando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. Traer perfiles con sucursal y categoría relacional
    const { data: dataPerfiles } = await supabase
      .from("perfiles")
      .select(`*, sucursales(nombre), categorias_empleado(id, nombre)`);

    // 2. Traer sucursales para el select
    const { data: dataSucursales } = await supabase
      .from("sucursales")
      .select("id, nombre");

    // 3. Traer categorías de empleado para el select
    const { data: dataCategorias } = await supabase
      .from("categorias_empleado")
      .select("id, nombre")
      .order("nombre");

    if (dataPerfiles) setPerfiles(dataPerfiles);
    if (dataSucursales) setSucursales(dataSucursales);
    if (dataCategorias) setCategorias(dataCategorias);
    setLoading(false);
  };

  const handleCambiarCategoriaRapida = async (perfilId: string, categoriaId: string) => {
    setGuardandoCategoriaRapida(true);
    try {
      const { error } = await supabase
        .from("perfiles")
        .update({ categoria_id: categoriaId || null })
        .eq("id", perfilId);
      if (error) throw error;
      fetchData();
    } catch (err) {
      alert("No se pudo actualizar la categoría.");
    } finally {
      setGuardandoCategoriaRapida(false);
      setEditandoCategoriaId(null);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreando(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          nombre,
          rol,
          sucursal_id: sucursalId || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear el usuario");
      }

      // Limpiar y recargar
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("vendedor");
      setSucursalId("");
      setShowModal(false);
      fetchData();
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCreando(false);
    }
  };

  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;
    setGuardandoEdicion(true);
    setErrorEdicion(null);

    try {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: usuarioEditando.id,
          nombre: usuarioEditando.nombre,
          rol: usuarioEditando.rol,
          sucursal_id: usuarioEditando.sucursal_id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar el usuario");

      setUsuarioEditando(null);
      fetchData();
    } catch (err: any) {
      setErrorEdicion(err.message);
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const handleCambiarSucursalRapida = async (perfil: any, nuevaSucursalId: string) => {
    if (nuevaSucursalId === (perfil.sucursal_id || "")) {
      setEditandoSucursalId(null);
      return;
    }
    setGuardandoSucursalRapida(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: perfil.id,
          nombre: perfil.nombre,
          rol: perfil.rol,
          sucursal_id: nuevaSucursalId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la sucursal");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGuardandoSucursalRapida(false);
      setEditandoSucursalId(null);
    }
  };

  const handleCambiarRolRapido = async (perfil: any, nuevoRol: string) => {
    if (nuevoRol === perfil.rol) {
      setEditandoRolId(null);
      return;
    }
    setGuardandoRolRapido(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: perfil.id,
          nombre: perfil.nombre,
          rol: nuevoRol,
          sucursal_id: perfil.sucursal_id || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar el rol");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGuardandoRolRapido(false);
      setEditandoRolId(null);
    }
  };

  const handleToggleActivo = async (perfil: any) => {
    const nuevoActivo = !(perfil.activo !== false);
    try {
      const res = await fetch("/api/usuarios", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: perfil.id,
          nombre: perfil.nombre,
          rol: perfil.rol,
          sucursal_id: perfil.sucursal_id || null,
          activo: nuevoActivo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEliminarUsuario = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre || "este usuario"}? Esta acción no se puede deshacer.`)) return;
    setEliminandoId(id);

    try {
      const res = await fetch(`/api/usuarios?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar el usuario");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEliminandoId(null);
    }
  };

  // Función para asignar colores a los roles (Light Theme)
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-rose-50 text-rose-700 border-rose-200"; 
      case "encargado":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "taller":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "gestoria":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "vendedor":
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  const perfilesFiltrados = perfiles.filter((p) => {
    const coincideRol = filtroRol === "todos" || p.rol === filtroRol;
    const coincideBusqueda = !busqueda.trim() || (p.nombre || "").toLowerCase().includes(busqueda.trim().toLowerCase());
    return coincideRol && coincideBusqueda;
  });
  const totalActivos = perfiles.filter((p) => p.activo !== false).length;
  const totalInactivos = perfiles.length - totalActivos;

  return (
    <div className="flex flex-col h-full w-full bg-[#F9FAFB] dark:bg-[#001233] overflow-hidden font-sans">

      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-[#0a2a6b] px-6 py-4 bg-white dark:bg-[#001c55] shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-[#002a6e] border border-indigo-100 dark:border-[#0a2a6b] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600 dark:text-sky-300" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 dark:text-white leading-tight">
              Gestión de Equipo
            </h1>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Control de accesos y asignación de sucursales para el personal.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-lg p-0.5">
            <button
              onClick={() => setVista("equipo")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors ${vista === "equipo" ? "bg-white dark:bg-[#001c55] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
            >
              Colaboradores
            </button>
            <button
              onClick={() => setVista("permisos")}
              className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-colors flex items-center gap-1 ${vista === "permisos" ? "bg-white dark:bg-[#001c55] text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Permisos
            </button>
          </div>
          {vista === "equipo" && (
            <button
              onClick={() => setShowModal(true)}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-95"
            >
              <UserPlus className="w-4 h-4" /> Nuevo Colaborador
            </button>
          )}
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-[1200px] mx-auto">

          {vista === "permisos" ? (
            <PermisosTab perfiles={perfiles} />
          ) : (
          <>
          {/* Stats rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-500" /> {perfiles.length}</span>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Activos</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><UserCheck className="w-4 h-4" /> {totalActivos}</span>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Inactivos</span>
              <span className="text-xl font-bold text-slate-400 flex items-center gap-1.5"><UserX className="w-4 h-4" /> {totalInactivos}</span>
            </div>
            <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Sucursales</span>
              <span className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5"><MapPin className="w-4 h-4 text-indigo-500" /> {sucursales.length}</span>
            </div>
          </div>

          {/* Búsqueda + filtro de rol */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar colaborador por nombre..."
                className="w-full bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-lg py-2 pl-9 pr-3 text-[13px] outline-none focus:border-indigo-500 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto">
              {["todos", "admin", "encargado", "vendedor", "taller", "gestoria"].map((r) => (
                <button
                  key={r}
                  onClick={() => setFiltroRol(r)}
                  className={`shrink-0 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border transition-colors capitalize ${filtroRol === r ? "bg-slate-800 dark:bg-[#00246b] text-white border-slate-800 dark:border-[#0a2a6b]" : "bg-white dark:bg-[#001c55] border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#00246b]"}`}
                >
                  {r === "todos" ? "Todos" : r}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <Users className="w-10 h-10 mb-3 text-slate-300 animate-pulse" />
                <p className="text-[13px] font-medium text-slate-500">Cargando equipo...</p>
              </div>
            ) : perfilesFiltrados.length > 0 ? (
              <>
              {/* VISTA MÓVIL */}
              <div className="flex flex-col gap-3 p-4 md:hidden">
                {perfilesFiltrados.map((p) => (
                  <div key={p.id} className="bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.id}&backgroundColor=f8fafc`}
                          alt={p.nombre}
                          className="w-9 h-9 rounded-full border border-slate-200 bg-white object-cover shrink-0"
                        />
                        <span className="text-[13px] font-bold text-slate-900 dark:text-white truncate">{p.nombre || "Sin nombre asignado"}</span>
                      </div>
                      <button
                        onClick={() => handleToggleActivo(p)}
                        className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                          p.activo !== false
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-400 border-slate-200"
                        }`}
                      >
                        {p.activo !== false ? "Activo" : "Inactivo"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1">Rol</span>
                        <select
                          value={p.rol}
                          disabled={guardandoRolRapido}
                          onChange={(e) => handleCambiarRolRapido(p, e.target.value)}
                          className={`w-full text-[11px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-md border outline-none cursor-pointer ${getRoleBadgeStyle(p.rol)}`}
                        >
                          <option value="vendedor" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Vendedor</option>
                          <option value="taller" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Taller</option>
                          <option value="gestoria" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Gestoría</option>
                          <option value="encargado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Encargado</option>
                          <option value="admin" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Administrador</option>
                        </select>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1">Sucursal</span>
                        <select
                          value={p.sucursal_id || ""}
                          disabled={guardandoSucursalRapida}
                          onChange={(e) => handleCambiarSucursalRapida(p, e.target.value)}
                          className="w-full bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-md px-2 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin sucursal</option>
                          {sucursales.map((s) => (<option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <span className="block text-[9px] uppercase tracking-widest font-bold text-slate-400 mb-1">Categoría</span>
                        <select
                          value={p.categoria_id || ""}
                          disabled={guardandoCategoriaRapida}
                          onChange={(e) => handleCambiarCategoriaRapida(p.id, e.target.value)}
                          className="w-full bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] rounded-md px-2 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                          <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin categoría</option>
                          {categorias.map((c) => (<option key={c.id} value={c.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{c.nombre}</option>))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-200 dark:border-[#0a2a6b]">
                      <button
                        onClick={() => { setUsuarioEditando({ ...p, sucursal_id: p.sucursal_id || "" }); setErrorEdicion(null); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-[#002a6e] rounded-lg transition-all"
                        title="Editar usuario"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEliminarUsuario(p.id, p.nombre)}
                        disabled={eliminandoId === p.id}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-[#002a6e] rounded-lg transition-all disabled:opacity-50"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* VISTA DESKTOP */}
              <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-[#00246b] border-b border-slate-200 dark:border-[#0a2a6b] text-slate-500 dark:text-slate-300 text-[10px] uppercase tracking-widest font-bold">
                      <th className="py-4 px-6">Empleado</th>
                      <th className="py-4 px-6 text-center">Rol de Acceso</th>
                      <th className="py-4 px-6">Correo Electrónico</th>
                      <th className="py-4 px-6">Sucursal</th>
                      <th className="py-4 px-6">Categoría</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#0a2a6b]">
                    {perfilesFiltrados.map((p) => {
                      // Generamos un correo visual basado en el nombre para mantener la estética
                      const correoVisual = p.nombre 
                        ? `${p.nombre.split(' ')[0].toLowerCase()}@pfaffenautos.com.ar` 
                        : "contacto@pfaffenautos.com.ar";

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-[#00246b] transition-colors group">
                          {/* Empleado (Avatar + Nombre) */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {/* Usamos DiceBear para generar un avatar neutral lindo basado en el ID */}
                              <img
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.id}&backgroundColor=f8fafc`}
                                alt={p.nombre}
                                className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 object-cover"
                              />
                              <span className="text-[13px] font-bold text-slate-900 dark:text-white">{p.nombre || "Sin nombre asignado"}</span>
                            </div>
                          </td>
                          
                          {/* Título del Puesto (Rol) - acceso directo */}
                          <td className="py-3.5 px-6 text-center">
                            {editandoRolId === p.id ? (
                              <select
                                autoFocus
                                defaultValue={p.rol}
                                disabled={guardandoRolRapido}
                                onChange={(e) => handleCambiarRolRapido(p, e.target.value)}
                                onBlur={() => setEditandoRolId(null)}
                                className="bg-white dark:bg-[#001c55] border border-indigo-300 dark:border-indigo-400 rounded-lg px-2 py-1.5 text-[12px] font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                              >
                                <option value="vendedor" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Vendedor</option>
                                <option value="taller" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Taller</option>
                          <option value="gestoria" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Gestoría</option>
                                <option value="encargado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Encargado</option>
                                <option value="admin" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Administrador</option>
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditandoRolId(p.id)}
                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border hover:opacity-75 transition-opacity ${getRoleBadgeStyle(p.rol)}`}
                                title="Tocar para cambiar de rol"
                              >
                                <Shield className="w-3 h-3 mr-1.5 opacity-70" />
                                {p.rol}
                              </button>
                            )}
                          </td>

                          {/* Correo Electrónico (Visual/Placeholder) */}
                          <td className="py-3.5 px-6">
                            <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                              {correoVisual}
                            </span>
                          </td>

                          {/* Sucursal (acceso directo, estilo mover auto en Stock) */}
                          <td className="py-3.5 px-6">
                            {editandoSucursalId === p.id ? (
                              <select
                                autoFocus
                                defaultValue={p.sucursal_id || ""}
                                disabled={guardandoSucursalRapida}
                                onChange={(e) => handleCambiarSucursalRapida(p, e.target.value)}
                                onBlur={() => setEditandoSucursalId(null)}
                                className="bg-white dark:bg-[#001c55] border border-indigo-300 dark:border-indigo-400 rounded-lg px-2 py-1.5 text-[12px] font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                              >
                                <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin sucursal fija</option>
                                {sucursales.map(s => (
                                  <option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>
                                ))}
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditandoSucursalId(p.id)}
                                className="inline-flex items-center gap-1.5 truncate font-medium text-[13px] text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-[#002a6e] rounded-md px-1.5 py-1 -ml-1.5 transition-colors group"
                                title="Tocar para cambiar de sucursal"
                              >
                                <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                                {p.sucursales?.nombre || "Sin sucursal asignada"}
                                <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                              </button>
                            )}
                          </td>

                          {/* Categoría (para el liquidador de sueldos) */}
                          <td className="py-3.5 px-6">
                            {editandoCategoriaId === p.id ? (
                              <select
                                autoFocus
                                defaultValue={p.categoria_id || ""}
                                disabled={guardandoCategoriaRapida}
                                onChange={(e) => handleCambiarCategoriaRapida(p.id, e.target.value)}
                                onBlur={() => setEditandoCategoriaId(null)}
                                className="bg-white dark:bg-[#001c55] border border-indigo-300 dark:border-indigo-400 rounded-lg px-2 py-1.5 text-[12px] font-medium text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                              >
                                <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin categoría</option>
                                {categorias.map((c) => (
                                  <option key={c.id} value={c.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{c.nombre}</option>
                                ))}
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditandoCategoriaId(p.id)}
                                className="inline-flex items-center gap-1.5 truncate font-medium text-[13px] text-slate-700 dark:text-slate-200 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-[#002a6e] rounded-md px-1.5 py-1 -ml-1.5 transition-colors group"
                                title="Tocar para cambiar de categoría"
                              >
                                <Tags className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                                {p.categorias_empleado?.nombre || "Sin categoría"}
                                <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
                              </button>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleToggleActivo(p)}
                                className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-colors mr-1 ${
                                  p.activo !== false
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                    : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200"
                                }`}
                                title={p.activo !== false ? "Tocar para desactivar" : "Tocar para activar"}
                              >
                                {p.activo !== false ? "Activo" : "Inactivo"}
                              </button>
                              <button
                                onClick={() => { setUsuarioEditando({ ...p, sucursal_id: p.sucursal_id || "" }); setErrorEdicion(null); }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-[#002a6e] rounded-lg transition-all"
                                title="Editar usuario"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEliminarUsuario(p.id, p.nombre)}
                                disabled={eliminandoId === p.id}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-[#002a6e] rounded-lg transition-all disabled:opacity-50"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              </>
            ) : (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
                <Users className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-[13px] font-medium text-slate-600 dark:text-slate-300">
                  {perfiles.length === 0 ? "No hay perfiles registrados en el sistema." : "Ningún colaborador coincide con la búsqueda."}
                </p>
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      {/* ================= MODAL PARA CREAR NUEVO USUARIO ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !creando && setShowModal(false)}></div>
          
          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-md rounded-2xl shadow-xl p-6 md:p-8 animate-fadeIn">
            
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-[#0a2a6b] pb-4">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-600" /> Nuevo Colaborador
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Creá credenciales de acceso para el panel.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-4">
              
              {errorMsg && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] p-3 rounded-xl font-bold tracking-wide">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Carlos Gómez"
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Correo Electrónico (Login)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@pfaffenautos.com.ar"
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Contraseña Temporal</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] transition-colors placeholder:text-slate-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Rol / Permisos</label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] cursor-pointer transition-colors appearance-none"
                  >
                    <option value="vendedor" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Vendedor</option>
                    <option value="taller" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Taller</option>
                          <option value="gestoria" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Gestoría</option>
                    <option value="encargado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Encargado</option>
                    <option value="admin" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Sucursal Asignada</label>
                  <select
                    value={sucursalId}
                    onChange={(e) => setSucursalId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] cursor-pointer transition-colors appearance-none"
                  >
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin sucursal fija</option>
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-5 mt-2 flex gap-3 border-t border-slate-100 dark:border-[#0a2a6b]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-[11px] font-bold uppercase tracking-widest bg-white dark:bg-[#001c55] hover:bg-slate-50 dark:hover:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="flex-1 py-3 text-[11px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  {creando ? "Guardando..." : "Crear Usuario"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL PARA EDITAR USUARIO ================= */}
      {usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardandoEdicion && setUsuarioEditando(null)}></div>

          <div className="relative bg-white dark:bg-[#001c55] border border-slate-200 dark:border-[#0a2a6b] w-full max-w-md rounded-2xl shadow-xl p-6 md:p-8 animate-fadeIn">

            <div className="flex justify-between items-center mb-6 border-b border-slate-100 dark:border-[#0a2a6b] pb-4">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-indigo-600" /> Editar Colaborador
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">Actualizá rol y sucursal del acceso.</p>
              </div>
              <button
                onClick={() => setUsuarioEditando(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors bg-slate-50 dark:bg-[#00246b] hover:bg-slate-100 dark:hover:bg-[#002a6e] p-1.5 rounded-lg border border-slate-200 dark:border-[#0a2a6b]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="space-y-4">

              {errorEdicion && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] p-3 rounded-xl font-bold tracking-wide">
                  {errorEdicion}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={usuarioEditando.nombre || ""}
                  onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nombre: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Rol / Permisos</label>
                  <select
                    value={usuarioEditando.rol}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, rol: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] cursor-pointer transition-colors appearance-none"
                  >
                    <option value="vendedor" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Vendedor</option>
                    <option value="taller" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Taller</option>
                          <option value="gestoria" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Gestoría</option>
                    <option value="encargado" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Encargado</option>
                    <option value="admin" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 block">Sucursal Asignada</label>
                  <select
                    value={usuarioEditando.sucursal_id || ""}
                    onChange={(e) => setUsuarioEditando({ ...usuarioEditando, sucursal_id: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-[#00246b] cursor-pointer transition-colors appearance-none"
                  >
                    <option value="" className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">Sin sucursal fija</option>
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id} className="bg-white dark:bg-[#001c55] text-slate-900 dark:text-white">{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-5 mt-2 flex gap-3 border-t border-slate-100 dark:border-[#0a2a6b]">
                <button
                  type="button"
                  onClick={() => setUsuarioEditando(null)}
                  className="flex-1 py-3 text-[11px] font-bold uppercase tracking-widest bg-white dark:bg-[#001c55] hover:bg-slate-50 dark:hover:bg-[#00246b] border border-slate-200 dark:border-[#0a2a6b] text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="flex-1 py-3 text-[11px] font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
} 