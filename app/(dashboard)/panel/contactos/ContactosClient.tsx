"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Archive, ArchiveRestore, MessageSquareText, Search, Users, Edit2, X, Save, Phone,
} from "lucide-react";

interface Contacto {
  id: string;
  telefono: string;
  nombre_perfil: string | null;
  notas: string | null;
  archivado_at: string | null;
  created_at: string;
  whatsapp_conversaciones: { id: string }[] | null;
}

function formatearTelefono(tel: string) {
  return tel?.replace(/^54?9?/, "").replace(/(\d{2,4})(\d{4})(\d{4})/, "$1 $2-$3") || tel;
}

export default function ContactosClient({ contactosIniciales }: { contactosIniciales: Contacto[] }) {
  const [contactos, setContactos] = useState(contactosIniciales);
  const [query, setQuery] = useState("");
  const [verArchivados, setVerArchivados] = useState(false);
  const [editando, setEditando] = useState<Contacto | null>(null);
  const [archivandoId, setArchivandoId] = useState<string | null>(null);

  const contactosFiltrados = useMemo(() => {
    return contactos.filter((c) => {
      if (verArchivados !== !!c.archivado_at) return false;
      if (!query.trim()) return true;
      const q = query.trim().toLowerCase();
      return (c.nombre_perfil || "").toLowerCase().includes(q) || c.telefono.includes(q);
    });
  }, [contactos, query, verArchivados]);

  const toggleArchivado = async (c: Contacto) => {
    setArchivandoId(c.id);
    const nuevoValor = c.archivado_at ? null : new Date().toISOString();
    try {
      const { error } = await supabase.from("whatsapp_contactos").update({ archivado_at: nuevoValor }).eq("id", c.id);
      if (error) throw error;
      setContactos((prev) => prev.map((x) => (x.id === c.id ? { ...x, archivado_at: nuevoValor } : x)));
    } catch (err) {
      console.error(err);
      alert("Error al archivar el contacto.");
    } finally {
      setArchivandoId(null);
    }
  };

  const guardarEdicion = async (nombre: string, notas: string) => {
    if (!editando) return;
    try {
      const { error } = await supabase
        .from("whatsapp_contactos")
        .update({ nombre_perfil: nombre, notas })
        .eq("id", editando.id);
      if (error) throw error;
      setContactos((prev) => prev.map((x) => (x.id === editando.id ? { ...x, nombre_perfil: nombre, notas } : x)));
      setEditando(null);
    } catch (err) {
      console.error(err);
      alert("Error al guardar el contacto.");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 px-6 py-4 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-slate-900 leading-tight">Contactos</h1>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">Todas las personas que escribieron por WhatsApp</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-500 cursor-pointer">
            <input
              type="checkbox"
              checked={verArchivados}
              onChange={(e) => setVerArchivados(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
            Ver archivados
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o teléfono..."
              className="w-72 bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-[13px] outline-none focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-[#F9FAFB] custom-scrollbar">
        <div className="max-w-[900px] mx-auto">
          {contactosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 text-center py-24">
              <Users className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-[14px] font-bold text-slate-700">
                {verArchivados ? "No hay contactos archivados" : "Sin contactos todavía"}
              </p>
              <p className="max-w-sm text-[12px] text-slate-500">
                Cada persona que escriba a tu WhatsApp va a quedar registrada acá automáticamente.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {contactosFiltrados.map((c) => {
                const conversacionId = c.whatsapp_conversaciones?.[0]?.id;
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm hover:border-indigo-200 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {(c.nombre_perfil || c.telefono).substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[14px] font-bold text-slate-900">
                          {c.nombre_perfil || "Sin nombre"}
                        </span>
                        {c.archivado_at && (
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">
                            Archivado
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {formatearTelefono(c.telefono)}
                        {c.notas ? ` · ${c.notas.slice(0, 60)}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => setEditando(c)}
                        className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      {conversacionId && (
                        <Link
                          href={`/panel/chat?conversacion=${conversacionId}`}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Abrir conversación"
                        >
                          <MessageSquareText className="w-4 h-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => toggleArchivado(c)}
                        disabled={archivandoId === c.id}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                        title={c.archivado_at ? "Desarchivar" : "Archivar"}
                      >
                        {c.archivado_at ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {editando && (
        <EditarContactoModal
          contacto={editando}
          onClose={() => setEditando(null)}
          onSave={guardarEdicion}
        />
      )}
    </div>
  );
}

function EditarContactoModal({
  contacto,
  onClose,
  onSave,
}: {
  contacto: Contacto;
  onClose: () => void;
  onSave: (nombre: string, notas: string) => Promise<void>;
}) {
  const [nombre, setNombre] = useState(contacto.nombre_perfil || "");
  const [notas, setNotas] = useState(contacto.notas || "");
  const [guardando, setGuardando] = useState(false);

  const handleGuardar = async () => {
    setGuardando(true);
    await onSave(nombre.trim(), notas);
    setGuardando(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !guardando && onClose()}></div>
      <div className="relative bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
          <h3 className="text-lg font-bold text-slate-900">Editar contacto</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre</label>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Notas</label>
            <textarea
              rows={4}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors resize-none"
            />
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!nombre.trim() || guardando}
            className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-50 shadow-sm"
          >
            {guardando ? "Guardando..." : (<><Save className="w-3.5 h-3.5" /> Guardar</>)}
          </button>
        </div>
      </div>
    </div>
  );
}
