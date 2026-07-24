"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Users, UserPlus, Shield, MapPin, Mail, CheckCircle2, X } from "lucide-react";
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
    // 1. Traer perfiles con sucursal
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] pt-6 md:pt-8 pb-16 px-4 text-white">
      <div className="max-w-5xl mx-auto">
        
        {/* Cabecera */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif mb-1">Gestión de Personal</h1>
            <p className="text-xs md:text-sm text-gray-400">Control de accesos para encargados y vendedores</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="w-full md:w-auto justify-center bg-[#0055A4] hover:bg-[#1E6FD9] transition-colors px-6 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <UserPlus className="w-5 h-5" /> Nuevo Colaborador
          </button>
        </div>

        {/* Lista de Usuarios */}
        <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Cargando equipo...</div>
          ) : perfiles.length > 0 ? (
            <div className="grid grid-cols-1 divide-y divide-white/10">
              {perfiles.map((p) => (
                <div key={p.id} className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#0055A4]/20 border border-[#0055A4]/30 flex items-center justify-center text-[#0055A4] font-black text-lg">
                      {p.nombre ? p.nombre.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{p.nombre || "Sin nombre asignado"}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5 text-blue-400" /> 
                          <strong className="uppercase text-gray-300">{p.rol}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" /> 
                          {p.sucursales?.nombre || "Sin sucursal fija"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                    ${p.rol === 'admin' ? 'bg-purple-900/30 text-purple-400 border-purple-700/50' : ''}
                    ${p.rol === 'encargado' ? 'bg-blue-900/30 text-blue-400 border-blue-700/50' : ''}
                    ${p.rol === 'vendedor' ? 'bg-green-900/30 text-green-400 border-green-700/50' : ''}
                  `}>
                    {p.rol}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay perfiles registrados en el sistema.</p>
            </div>
          )}
        </div>

        {/* MODAL PARA CREAR NUEVO USUARIO */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !creando && setShowModal(false)}></div>
            
            <div className="relative bg-[#121212] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 md:p-8 animate-fadeIn">
              
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-xl font-serif text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#0055A4]" /> Nuevo Colaborador
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Creá credenciales de acceso para el panel.</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCrearUsuario} className="space-y-4">
                
                {errorMsg && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl font-medium">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Carlos Gómez"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0055A4] text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Correo Electrónico (Login)</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@pfaffenautos.com.ar"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0055A4] text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Contraseña Temporal</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0055A4] text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Rol / Permisos</label>
                    <select
                      value={rol}
                      onChange={(e) => setRol(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#0055A4] text-white cursor-pointer"
                    >
                      <option value="vendedor">Vendedor</option>
                      <option value="encargado">Encargado</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Sucursal Asignada</label>
                    <select
                      value={sucursalId}
                      onChange={(e) => setSucursalId(e.target.value)}
                      className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-3 py-3 text-sm outline-none focus:border-[#0055A4] text-white cursor-pointer"
                    >
                      <option value="">Sin sucursal fija</option>
                      {sucursales.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-white/5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creando}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-widest bg-[#0055A4] hover:bg-[#1E6FD9] text-white rounded-xl transition-colors shadow-lg disabled:opacity-50"
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