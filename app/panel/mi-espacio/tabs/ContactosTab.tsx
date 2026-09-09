"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase2 } from "@/lib/supabase2/client";
import { Plus, X, Save, Trash2, Search, MessageCircle, Phone, Mail } from "lucide-react";
import { inputClass, labelClass } from "./shared";

const ROLES = ["Contador", "Abogado", "Escribano", "Mecánico", "Médico", "Plomero", "Electricista", "Otro"];

export default function ContactosTab({ miId }: { miId: string }) {
  const [contactos, setContactos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [showNuevo, setShowNuevo] = useState(false);
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [notas, setNotas] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const { data } = await supabase2.from("espacio_contactos").select("*").eq("perfil_id", miId).order("nombre");
    setContactos(data || []);
    setCargando(false);
  };
  useEffect(() => { cargar(); }, [miId]);

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return contactos;
    const q = busqueda.trim().toLowerCase();
    return contactos.filter((c) => [c.nombre, c.rol, c.empresa].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [contactos, busqueda]);

  const crear = async () => {
    if (!nombre.trim()) return alert("Completá el nombre.");
    setGuardando(true);
    try {
      const { data, error } = await supabase2.from("espacio_contactos").insert({ perfil_id: miId, nombre: nombre.trim(), rol: rol || null, empresa: empresa || null, telefono: telefono || null, whatsapp: whatsapp || null, email: email || null, notas: notas || null }).select().single();
      if (error) throw error;
      setContactos((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setShowNuevo(false);
      setNombre(""); setRol(""); setEmpresa(""); setTelefono(""); setWhatsapp(""); setEmail(""); setNotas("");
    } catch { alert("No se pudo crear el contacto."); } finally { setGuardando(false); }
  };

  const eliminar = async (c: any) => {
    if (!confirm(`¿Eliminar a ${c.nombre}?`)) return;
    await supabase2.from("espacio_contactos").delete().eq("id", c.id);
    setContactos((prev) => prev.filter((x) => x.id !== c.id));
  };

  if (cargando) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div><p className="text-lg font-bold">Mis contactos clave — {contactos.length} registrado{contactos.length === 1 ? "" : "s"}</p><p className="text-xs text-slate-400">Tu agenda personal — separada de los clientes de la agencia.</p></div>
        <button onClick={() => setShowNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shrink-0"><Plus className="w-4 h-4" /> Nuevo contacto</button>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, rol o empresa..." className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none" />
      </div>

      {filtrados.length === 0 ? (
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-16 text-center"><p className="text-sm font-bold">Sin contactos</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtrados.map((c) => (
            <div key={c.id} className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-sm font-bold">{c.nombre}</p>{c.rol && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-1.5 py-0.5 rounded">{c.rol}</span>}</div>
                <div className="flex gap-1 shrink-0"><button onClick={() => eliminar(c)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button></div>
              </div>
              {c.empresa && <p className="text-xs text-slate-500 mt-1">🏢 {c.empresa}</p>}
              {c.telefono && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {c.telefono}</p>}
              {c.email && <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="w-3 h-3" /> {c.email}</p>}
              {(c.whatsapp || c.telefono) && (
                <a href={`https://wa.me/${(c.whatsapp || c.telefono).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold py-1.5 rounded-lg"><MessageCircle className="w-3.5 h-3.5" /> WhatsApp</a>
              )}
            </div>
          ))}
        </div>
      )}

      {showNuevo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#141414] border border-slate-200 dark:border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-end mb-1"><button onClick={() => setShowNuevo(false)}><X className="w-4 h-4 text-slate-400" /></button></div>
            <p className="text-xs text-slate-400 mb-4">Tu agenda personal — solo vos ves estos contactos.</p>
            <label className={labelClass}>Nombre *</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Rol / Profesión</label><select value={rol} onChange={(e) => setRol(e.target.value)} className={inputClass}><option value="">— Elegir —</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
              <div><label className={labelClass}>Empresa / Estudio</label><input value={empresa} onChange={(e) => setEmpresa(e.target.value)} className={inputClass} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div><label className={labelClass}>Teléfono</label><input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} /></div>
              <div><label className={labelClass}>WhatsApp (si distinto)</label><input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} /><p className="text-[10px] text-slate-400 mt-0.5">Solo si difiere del teléfono</p></div>
            </div>
            <label className={labelClass + " mt-3"}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <label className={labelClass + " mt-3"}>Notas</label>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Cómo me ayuda, en qué cosas..." className={inputClass} />
            <div className="flex justify-end gap-2 mt-4"><button onClick={() => setShowNuevo(false)} className="px-4 py-2 text-sm font-bold text-slate-500">Cancelar</button><button onClick={crear} disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Crear</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
