"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, UserPlus, X, Edit2, Trash2 } from "lucide-react";
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

  // Función para asignar colores a los roles según el estilo Mantine de la imagen
  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-[#c92a2a]/10 text-[#ff8787]"; // Estilo Diseñador (Rojo/Rosa)
      case "encargado":
        return "bg-[#0b7285]/10 text-[#63e6be]"; // Estilo Gerente (Teal/Cian)
      case "vendedor":
      default:
        return "bg-[#1864ab]/10 text-[#74c0fc]"; // Estilo Ingeniero (Azul)
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1329] pt-6 md:pt-8 pb-16 px-4 text-slate-100">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif mb-1 text-white">Tabla con usuarios</h1>
            <p className="text-xs md:text-sm text-gray-400">Control de accesos y asignación de sucursales para el equipo.</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto justify-center bg-[#0145F2] hover:bg-blue-600 transition-colors px-6 py-2.5 rounded-md font-medium text-sm flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Colaborador
          </button>
        </div>

        {/* Tabla de Usuarios (Estilo Mantine Dark) */}
        <div className="bg-[#1A1B1E] border border-[#2C2E33] rounded-lg overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-16 text-center text-gray-500 flex flex-col items-center">
              <Users className="w-10 h-10 mb-3 opacity-30 animate-pulse" />
              <p className="text-sm">Cargando equipo...</p>
            </div>
          ) : perfiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-[#2C2E33]">
                    <th className="py-3 px-5 text-[#C1C2C5] text-sm font-semibold">Empleado</th>
                    <th className="py-3 px-5 text-[#C1C2C5] text-sm font-semibold">Título del puesto</th>
                    <th className="py-3 px-5 text-[#C1C2C5] text-sm font-semibold">Correo electrónico</th>
                    <th className="py-3 px-5 text-[#C1C2C5] text-sm font-semibold">Sucursal</th>
                    <th className="py-3 px-5 text-right text-[#C1C2C5] text-sm font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {perfiles.map((p) => {
                    // Generamos un correo visual basado en el nombre para mantener la estética de la imagen
                    const correoVisual = p.nombre 
                      ? `${p.nombre.split(' ')[0].toLowerCase()}@pfaffenautos.com.ar` 
                      : "contacto@pfaffenautos.com.ar";

                    return (
                      <tr key={p.id} className="border-b border-[#2C2E33] hover:bg-[#25262B] transition-colors">
                        {/* Empleado (Avatar + Nombre) */}
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-3">
                            {/* Usamos DiceBear para generar un avatar neutral lindo basado en el ID */}
                            <img 
                              src={`https://api.dicebear.com/7.x/notionists/svg?seed=${p.id}&backgroundColor=e2e8f0`} 
                              alt={p.nombre} 
                              className="w-8 h-8 rounded-full border border-[#373A40] bg-slate-200"
                            />
                            <span className="text-sm font-medium text-[#C1C2C5]">{p.nombre || "Sin nombre asignado"}</span>
                          </div>
                        </td>
                        
                        {/* Título del Puesto (Rol) */}
                        <td className="py-3 px-5">
                          <span className={`inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(p.rol)}`}>
                            {p.rol}
                          </span>
                        </td>

                        {/* Correo Electrónico (Visual/Placeholder) */}
                        <td className="py-3 px-5">
                          <span className="text-sm text-[#339AF0] hover:underline cursor-pointer">
                            {correoVisual}
                          </span>
                        </td>

                        {/* Sucursal (Reemplazo del Teléfono) */}
                        <td className="py-3 px-5">
                          <span className="text-sm text-[#C1C2C5]">
                            {p.sucursales?.nombre || "Sin sucursal asignada"}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-1.5 text-gray-500 hover:text-[#C1C2C5] hover:bg-[#373A40] rounded transition-colors" title="Editar usuario">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-[#373A40] rounded transition-colors" title="Eliminar usuario">
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
            <div className="p-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay perfiles registrados en el sistema.</p>
            </div>
          )}
        </div>

        {/* ================= MODAL PARA CREAR NUEVO USUARIO ================= */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !creando && setShowModal(false)}></div>
            
            <div className="relative bg-[#1A1B1E] border border-[#2C2E33] w-full max-w-md rounded-lg shadow-2xl p-6 md:p-8 animate-fadeIn">
              
              <div className="flex justify-between items-center mb-6 border-b border-[#2C2E33] pb-4">
                <div>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-[#339AF0]" /> Nuevo Colaborador
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Creá credenciales de acceso para el panel.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors bg-[#25262B] hover:bg-[#373A40] p-1.5 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCrearUsuario} className="space-y-4">
                
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg font-medium">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-[#C1C2C5] mb-1.5 block">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Carlos Gómez"
                    className="w-full bg-[#25262B] border border-[#373A40] rounded-md px-3 py-2 text-sm outline-none focus:border-[#339AF0] text-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#C1C2C5] mb-1.5 block">Correo Electrónico (Login)</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@pfaffenautos.com.ar"
                    className="w-full bg-[#25262B] border border-[#373A40] rounded-md px-3 py-2 text-sm outline-none focus:border-[#339AF0] text-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#C1C2C5] mb-1.5 block">Contraseña Temporal</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-[#25262B] border border-[#373A40] rounded-md px-3 py-2 text-sm outline-none focus:border-[#339AF0] text-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#C1C2C5] mb-1.5 block">Rol / Permisos</label>
                    <select
                      value={rol}
                      onChange={(e) => setRol(e.target.value)}
                      className="w-full bg-[#25262B] border border-[#373A40] rounded-md px-3 py-2 text-sm outline-none focus:border-[#339AF0] text-white cursor-pointer transition-colors"
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="encargado">Encargado</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#C1C2C5] mb-1.5 block">Sucursal Asignada</label>
                    <select
                      value={sucursalId}
                      onChange={(e) => setSucursalId(e.target.value)}
                      className="w-full bg-[#25262B] border border-[#373A40] rounded-md px-3 py-2 text-sm outline-none focus:border-[#339AF0] text-white cursor-pointer transition-colors"
                    >
                      <option value="">Sin sucursal fija</option>
                      {sucursales.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2 text-sm font-medium bg-[#25262B] hover:bg-[#373A40] text-[#C1C2C5] rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creando}
                    className="flex-1 py-2 text-sm font-medium bg-[#1971C2] hover:bg-[#1864AB] text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {creando ? "Creando..." : "Guardar Colaborador"}
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}