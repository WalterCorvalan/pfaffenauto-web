"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Settings, UserPlus, Pencil, Trash2, ShieldCheck, ShieldOff, Loader2, X } from "lucide-react";

const ROLES = ["admin", "ventas", "finanzas", "gestoria"] as const;
const ROL_LABEL: Record<string, string> = { admin: "Admin", ventas: "Ventas", finanzas: "Finanzas", gestoria: "Gestoría" };
const ROL_COLOR: Record<string, string> = {
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  ventas: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  finanzas: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  gestoria: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
};

interface Usuario { id: string; nombre: string; email: string; roles: string[]; activo: boolean; totp_enabled: boolean; }

export default function UsuariosClient() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const [modal2fa, setModal2fa] = useState<Usuario | null>(null);

  const cargar = async () => {
    setCargando(true);
    const res = await fetch("/api/panel-v2/usuarios");
    const data = await res.json();
    if (res.ok) setUsuarios(data.usuarios);
    else setError(data.error || "No se pudo cargar.");
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const eliminar = async (u: Usuario) => {
    if (!confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/panel-v2/usuarios?id=${u.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "No se pudo eliminar.");
    cargar();
  };

  const toggleActivo = async (u: Usuario) => {
    await fetch("/api/panel-v2/usuarios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: u.id, activo: !u.activo }) });
    cargar();
  };

  const disable2fa = async (u: Usuario) => {
    if (!confirm(`¿Deshabilitar 2FA para ${u.nombre}?`)) return;
    await fetch("/api/panel-v2/2fa/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: u.id }) });
    cargar();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-600" /> Configuración</h1>
          <p className="text-sm text-slate-400">Usuarios, roles y 2FA.</p>
        </div>
        <button onClick={() => setNuevo(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg"><UserPlus className="w-4 h-4" /> Nuevo usuario</button>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-white/10">
        <span className="px-3 py-2.5 text-sm font-bold border-b-2 border-rose-600 text-rose-600">Usuarios</span>
        <Link href="/panel-v2/configuracion/empresa" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">Empresa</Link>
        <Link href="/panel-v2/configuracion/whatsapp" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">WhatsApp</Link>
        <Link href="/panel-v2/configuracion/instagram" className="px-3 py-2.5 text-sm font-bold border-b-2 border-transparent text-slate-500">Instagram</Link>
      </div>

      {error && <div className="text-rose-600 text-sm bg-rose-50 dark:bg-rose-500/10 p-3 rounded-lg">{error}</div>}

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
        {cargando ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                  <th className="px-4 py-3 font-bold">Usuario</th>
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Roles</th>
                  <th className="px-4 py-3 font-bold">2FA</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                  <th className="px-4 py-3 font-bold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 dark:border-white/5 last:border-0">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">{u.nombre}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => <span key={r} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ROL_COLOR[r] || "bg-slate-100 text-slate-600"}`}>{ROL_LABEL[r] || r}</span>)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.totp_enabled
                        ? <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><ShieldCheck className="w-3.5 h-3.5" /> Activo</span>
                        : <span className="flex items-center gap-1 text-slate-400 text-xs">— Sin 2FA</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActivo(u)} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.activo ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-slate-100 text-slate-500"}`}>
                        {u.activo ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3 text-xs font-bold">
                        <button onClick={() => setEditando(u)} className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"><Pencil className="w-3.5 h-3.5" /> Editar</button>
                        {u.totp_enabled ? (
                          <button onClick={() => disable2fa(u)} className="flex items-center gap-1 text-amber-600 hover:text-amber-700"><ShieldOff className="w-3.5 h-3.5" /> Deshabilitar 2FA</button>
                        ) : (
                          <button onClick={() => setModal2fa(u)} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700"><ShieldCheck className="w-3.5 h-3.5" /> Habilitar 2FA</button>
                        )}
                        <button onClick={() => eliminar(u)} className="flex items-center gap-1 text-rose-600 hover:text-rose-700"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {usuarios.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Sin usuarios.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {nuevo && <ModalNuevoUsuario onClose={() => setNuevo(false)} onSaved={() => { setNuevo(false); cargar(); }} />}
      {editando && <ModalEditarUsuario usuario={editando} onClose={() => setEditando(null)} onSaved={() => { setEditando(null); cargar(); }} />}
      {modal2fa && <Modal2FA usuario={modal2fa} onClose={() => setModal2fa(null)} onSaved={() => { setModal2fa(null); cargar(); }} />}
    </div>
  );
}

function ModalShell({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
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

function ModalNuevoUsuario({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [roles, setRoles] = useState<string[]>(["ventas"]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const toggleRol = (r: string) => setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const guardar = async () => {
    if (!email || !nombre || roles.length === 0) return setError("Completá email, nombre y al menos un rol.");
    setGuardando(true);
    setError("");
    const res = await fetch("/api/panel-v2/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, nombre, roles }) });
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
          <p className="text-[11px] text-slate-400 mt-1">Le llega una invitación por mail para activar su cuenta.</p>
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
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button onClick={guardar} disabled={guardando} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">
          {guardando ? "Creando..." : "Crear usuario"}
        </button>
      </div>
    </ModalShell>
  );
}

function ModalEditarUsuario({ usuario, onClose, onSaved }: { usuario: Usuario; onClose: () => void; onSaved: () => void }) {
  const [nombre, setNombre] = useState(usuario.nombre);
  const [roles, setRoles] = useState<string[]>(usuario.roles);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const toggleRol = (r: string) => setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));

  const guardar = async () => {
    if (!nombre || roles.length === 0) return setError("Completá nombre y al menos un rol.");
    setGuardando(true);
    const res = await fetch("/api/panel-v2/usuarios", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: usuario.id, nombre, roles }) });
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
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <button onClick={guardar} disabled={guardando} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </ModalShell>
  );
}

function Modal2FA({ usuario, onClose, onSaved }: { usuario: Usuario; onClose: () => void; onSaved: () => void }) {
  const [qr, setQr] = useState("");
  const [claveManual, setClaveManual] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    fetch("/api/panel-v2/2fa/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: usuario.id }) })
      .then((r) => r.json())
      .then((data) => { setQr(data.qrDataUrl || ""); setClaveManual(data.claveManual || ""); setCargando(false); })
      .catch(() => { setError("No se pudo generar el QR."); setCargando(false); });
  }, [usuario.id]);

  const confirmar = async () => {
    setConfirmando(true);
    setError("");
    const res = await fetch("/api/panel-v2/2fa/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: usuario.id, codigo }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Código incorrecto."); setConfirmando(false); return; }
    onSaved();
  };

  return (
    <ModalShell titulo={`Activar 2FA — ${usuario.nombre}`} onClose={onClose}>
      <p className="text-xs text-slate-500 mb-3">Escaneá el código QR con Google Authenticator (o cualquier app TOTP) y tipeá el código de 6 dígitos para confirmar.</p>
      {cargando ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : qr ? (
        <div className="space-y-3">
          <img src={qr} alt="QR 2FA" className="mx-auto w-48 h-48" />
          <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-3">
            <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Clave manual (si no podés escanear)</p>
            <p className="text-sm font-mono text-slate-700 dark:text-slate-200">{claveManual}</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Código de 6 dígitos</label>
            <input type="text" inputMode="numeric" maxLength={6} value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none text-center tracking-[0.5em]" />
          </div>
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-bold text-slate-500 border border-slate-200 dark:border-white/10">Cancelar</button>
            <button onClick={confirmar} disabled={confirmando || codigo.length !== 6} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-50">
              {confirmando ? "Confirmando..." : "Confirmar y activar"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-rose-600">{error || "No se pudo generar el QR."}</p>
      )}
    </ModalShell>
  );
}
