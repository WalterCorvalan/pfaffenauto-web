"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Plus, Search, PhoneCall, MessageCircle, Mail, MapPin } from "lucide-react";
import NuevoTelefonoModal from "./NuevoTelefonoModal";

export default function TelefonosClient({
  telefonosIniciales,
  usuarioActualId,
}: {
  telefonosIniciales: any[];
  usuarioActualId: string;
}) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [telefonoAEditar, setTelefonoAEditar] = useState<any | null>(null);

  const filtrados = telefonosIniciales.filter(t => 
    (t.nombre || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (t.categoria || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (t.notas || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  // Agrupamos por categoría para que parezca una cartelera ordenada
  const agrupados = filtrados.reduce((acc: Record<string, any[]>, tel) => {
    const cat = tel.categoria || "Otros";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tel);
    return acc;
  }, {});

  const abrirNuevo = () => {
    setTelefonoAEditar(null);
    setModalAbierto(true);
  };

  const abrirEdicion = (tel: any) => {
    setTelefonoAEditar(tel);
    setModalAbierto(true);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-white/5 px-6 py-4 bg-white dark:bg-white/[0.02] shrink-0 gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
            Teléfonos útiles
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cartelera compartida de la agencia.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" /> Nuevo teléfono
        </button>
      </header>

      {/* CONTENIDO */}
      <div className="flex-1 overflow-auto bg-slate-50 dark:bg-[#141414] p-6">
        
        {/* BUSCADOR */}
        {telefonosIniciales.length > 0 && (
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría o nota..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-rose-500 text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>
        )}

        {/* ESTADO VACÍO */}
        {telefonosIniciales.length === 0 ? (
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center p-12 text-center mt-4">
            <Phone className="w-8 h-8 text-slate-400 mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Sin teléfonos cargados</h3>
            <p className="text-[13px] font-medium text-slate-500 max-w-sm">
              Esta es una cartelera compartida — agregá teléfonos útiles que todos en la agencia necesiten a mano: mecánico, gestor externo, gomería, despachante...
            </p>
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-slate-500 mt-8 text-center">No se encontraron resultados.</p>
        ) : (
          /* GRILLA DE CARTELERA */
          <div className="space-y-8">
            {Object.entries(agrupados).map(([categoria, items]) => (
              <div key={categoria}>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 dark:border-white/10 pb-2">
                  {categoria}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map((tel) => (
                    <div 
                      key={tel.id} 
                      onClick={() => abrirEdicion(tel)}
                      className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl p-4 hover:border-rose-300 dark:hover:border-rose-500/50 transition-colors cursor-pointer group"
                    >
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {tel.nombre}
                      </h4>
                      <div className="space-y-2 text-[13px]">
                        {tel.telefono && (
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                            <span>{tel.telefono}</span>
                          </div>
                        )}
                        {tel.whatsapp && (
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{tel.whatsapp}</span>
                          </div>
                        )}
                        {tel.email && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">{tel.email}</span>
                          </div>
                        )}
                        {tel.notas && (
                          <p className="text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-white/5 italic text-xs leading-relaxed">
                            {tel.notas}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAbierto && (
        <NuevoTelefonoModal
          telefono={telefonoAEditar}
          usuarioActualId={usuarioActualId}
          onClose={() => setModalAbierto(false)}
          onSuccess={() => {
            setModalAbierto(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}