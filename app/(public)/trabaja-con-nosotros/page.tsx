"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { 
  Users, 
  UploadCloud, 
  CheckCircle2, 
  Loader2,
  FileText,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function TrabajaConNosotrosPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [puesto, setPuesto] = useState("Ventas / Comercial");
  const [archivoCV, setArchivoCV] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !apellido || !email || !telefono || !archivoCV) {
      alert("Por favor completá todos los campos y adjuntá tu CV.");
      return;
    }

    setLoading(true);

    try {
      // 1. Subir el CV a Supabase Storage (Bucket: 'cvs')
      const fileExt = archivoCV.name.split('.').pop();
      const fileName = `${Date.now()}_${nombre.trim()}_${apellido.trim()}.${fileExt}`;
      const filePath = `${fileName.replace(/\s+/g, '')}`;

      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(filePath, archivoCV);

      if (uploadError) throw uploadError;

      // Obtener la URL pública del CV
      const { data: publicUrlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(filePath);

      // 2. Guardar los datos en la tabla 'postulaciones'
      const { error: dbError } = await supabase
        .from('postulaciones')
        .insert([{
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          puesto: puesto,
          cv_url: publicUrlData.publicUrl
        }]);

      if (dbError) throw dbError;

      // Éxito
      setSuccess(true);
      
      // Reseteamos el formulario pero mantenemos el mensaje de éxito unos segundos más
      setTimeout(() => {
        setSuccess(false);
        setNombre(""); setApellido(""); setEmail(""); setTelefono(""); setArchivoCV(null);
      }, 8000);

    } catch (error) {
      console.error("Error al enviar postulación:", error);
      alert("Hubo un error al enviar tu postulación. Por favor intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b1329] relative overflow-hidden flex flex-col items-center justify-center py-12 px-4 font-sans selection:bg-[#0145F2] selection:text-white">
      
      {/* ================= LUCES Y EFECTOS DE FONDO ================= */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#0145F2]/20 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-400/10 rounded-full blur-[120px]"></div>
        {/* Grilla sutil tecnológica */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      {/* Botón para volver a la web principal */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
          <ArrowLeft className="w-4 h-4" /> Volver a la web
        </Link>
      </div>

      <div className="w-full max-w-2xl relative z-10 flex flex-col mt-10 md:mt-0">
        
        {/* ================= ENCABEZADO ================= */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <Users className="w-4 h-4" /> Recursos Humanos
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-md mb-4">
            Unite a nuestro <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-[#0145F2]">equipo</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed">
            Estamos en constante crecimiento y buscamos talentos apasionados por la industria automotriz. Dejanos tus datos y nos pondremos en contacto.
          </p>
        </div>

        {/* ================= TARJETA DEL FORMULARIO ================= */}
        <div className="bg-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 p-6 md:p-10 relative overflow-hidden">
          
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-fadeIn">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black text-navy mb-3 uppercase tracking-tight">¡CV Enviado con éxito!</h2>
              <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
                Recibimos tu postulación correctamente. Nuestro equipo de Recursos Humanos la revisará y nos pondremos en contacto si tu perfil se ajusta a nuestras búsquedas activas.
              </p>
              <button 
                onClick={() => setSuccess(false)}
                className="mt-8 text-[#0145F2] font-bold text-xs uppercase tracking-widest hover:underline transition-all"
              >
                Enviar otra postulación
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nombre</label>
                  <input 
                    type="text" 
                    required 
                    value={nombre} onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Apellido</label>
                  <input 
                    type="text" 
                    required 
                    value={apellido} onChange={(e) => setApellido(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    placeholder="Tu apellido"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Email</label>
                  <input 
                    type="email" 
                    required 
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Teléfono (WhatsApp)</label>
                  <input 
                    type="tel" 
                    required 
                    value={telefono} onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                    placeholder="+54 9 11 0000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Puesto de interés</label>
                <div className="relative">
                  <select 
                    value={puesto} onChange={(e) => setPuesto(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy outline-none focus:bg-white focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="Ventas / Comercial">Ventas / Comercial</option>
                    <option value="Administración">Administración</option>
                    <option value="Marketing / Redes Sociales">Marketing / Redes Sociales</option>
                    <option value="Taller / Mecánica">Taller / Mecánica</option>
                    <option value="Atención al Cliente">Atención al Cliente</option>
                    <option value="Gerencia / Liderazgo">Gerencia / Liderazgo</option>
                    <option value="Otro">Otro puesto</option>
                  </select>
                </div>
              </div>

              {/* Zona de Carga de CV */}
              <div>
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Currículum Vitae (PDF o Word)</label>
                
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setArchivoCV(e.target.files[0]);
                    }
                  }}
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${archivoCV ? 'border-[#0145F2] bg-blue-50/50 shadow-inner' : 'border-slate-300 hover:border-[#0145F2] hover:bg-slate-50 bg-slate-50/50'}`}
                >
                  {archivoCV ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-white shadow-sm text-[#0145F2] rounded-full flex items-center justify-center border border-blue-100">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-black text-navy">{archivoCV.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#0145F2] hover:underline">Cambiar archivo</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 bg-white shadow-sm text-slate-400 rounded-full flex items-center justify-center border border-slate-100 mb-1">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-black text-navy">Hacé clic para seleccionar tu CV</span>
                      <span className="text-xs text-slate-400 font-medium">Formatos soportados: PDF, DOC. Tamaño máximo: 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón Submit */}
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading || !archivoCV}
                  className="w-full py-5 bg-gradient-to-r from-[#0145F2] to-sky-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:from-blue-600 hover:to-sky-400 transition-all shadow-[0_8px_25px_rgba(1,69,242,0.3)] hover:shadow-[0_12px_30px_rgba(1,69,242,0.4)] disabled:opacity-50 disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? "Procesando Postulación..." : "Enviar Postulación"}
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Footer simple para la Landing */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">
            Pfaffen Autos © {new Date().getFullYear()} • Tu próximo desafío te espera
          </p>
        </div>
      </div>
    </main>
  );
}