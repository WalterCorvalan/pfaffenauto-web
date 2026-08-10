"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, UserPlus, X, Edit2, Trash2, Shield } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UsuariosPage() {
  const router = useRouter();
  const [perfiles, setPerfiles] = useState<any[]>([]);
  const [sucursales, setSucursales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
    // 1. Traer perfiles con sucursal relacional
    const { data: dataPerfiles } = await supabase
      .from("perfiles")
      .select(`*, sucursales(nombre)`);

    // 2. Traer sucursales para el select
    const { data: dataSucursales } = await supabase
      .from("sucursales")
      .select("id, nombre");

    if (dataPerfiles) setPerfiles(dataPerfiles);
    if (dataSucursales) setSucursales(dataSucursales);
    setLoading(false);
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

  // Función para asignar colores a los roles (Light Theme)
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-rose-50 text-rose-700 border-rose-200"; 
      case "encargado":
        return "bg-teal-50 text-teal-700 border-teal-200"; 
      case "vendedor":
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F9FAFB] overflow-hidden font-sans">
      
      {/* ================= HEADER ================= */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">
              Gestión de Equipo
            </h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              Control de accesos y asignación de sucursales para el personal.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 shadow-sm transition-colors active:scale-95"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Colaborador
          </button>
        </div>
      </header>

      {/* ================= ÁREA SCROLLABLE ================= */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Tabla de Usuarios */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <Users className="w-10 h-10 mb-3 text-slate-300 animate-pulse" />
                <p className="text-[13px] font-medium text-slate-500">Cargando equipo...</p>
              </div>
            ) : perfiles.length > 0 ? (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                      <th className="py-4 px-6">Empleado</th>
                      <th className="py-4 px-6 text-center">Rol de Acceso</th>
                      <th className="py-4 px-6">Correo Electrónico</th>
                      <th className="py-4 px-6">Sucursal</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {perfiles.map((p) => {
                      // Generamos un correo visual basado en el nombre para mantener la estética
                      const correoVisual = p.nombre 
                        ? `${p.nombre.split(' ')[0].toLowerCase()}@pfaffenautos.com.ar` 
                        : "contacto@pfaffenautos.com.ar";

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                          {/* Empleado (Avatar + Nombre) */}
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              {/* Usamos DiceBear para generar un avatar neutral lindo basado en el ID */}
                              <img 
                                src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.id}&backgroundColor=f8fafc`} 
                                alt={p.nombre} 
                                className="w-9 h-9 rounded-full border border-slate-200 bg-slate-50 object-cover"
                              />
                              <span className="text-[13px] font-bold text-slate-900">{p.nombre || "Sin nombre asignado"}</span>
                            </div>
                          </td>
                          
                          {/* Título del Puesto (Rol) */}
                          <td className="py-3.5 px-6 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${getRoleBadgeStyle(p.rol)}`}>
                              <Shield className="w-3 h-3 mr-1.5 opacity-70" />
                              {p.rol}
                            </span>
                          </td>

                          {/* Correo Electrónico (Visual/Placeholder) */}
                          <td className="py-3.5 px-6">
                            <span className="text-[13px] font-medium text-slate-500">
                              {correoVisual}
                            </span>
                          </td>

                          {/* Sucursal */}
                          <td className="py-3.5 px-6">
                            <span className="text-[13px] font-medium text-slate-700">
                              {p.sucursales?.nombre || "Sin sucursal asignada"}
                            </span>
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-6 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Editar usuario">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Eliminar usuario">
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
            ) : (
              <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
                <Users className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-[13px] font-medium text-slate-600">No hay perfiles registrados en el sistema.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL PARA CREAR NUEVO USUARIO ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !creando && setShowModal(false)}></div>
          
          <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-xl p-6 md:p-8 animate-fadeIn">
            
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-[15px] font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-indigo-600" /> Nuevo Colaborador
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Creá credenciales de acceso para el panel.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCrearUsuario} className="space-y-4">
              
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] p-3 rounded-xl font-bold tracking-wide">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Carlos Gómez"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Correo Electrónico (Login)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@pfaffenautos.com.ar"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Contraseña Temporal</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors placeholder:text-slate-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Rol / Permisos</label>
                  <select
                    value={rol}
                    onChange={(e) => setRol(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:bg-white cursor-pointer transition-colors appearance-none"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="encargado">Encargado</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5 block">Sucursal Asignada</label>
                  <select
                    value={sucursalId}
                    onChange={(e) => setSucursalId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-900 outline-none focus:border-indigo-500 focus:bg-white cursor-pointer transition-colors appearance-none"
                  >
                    <option value="">Sin sucursal fija</option>
                    {sucursales.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-5 mt-2 flex gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-[11px] font-bold uppercase tracking-widest bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-colors"
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

    </div>
  );
} 