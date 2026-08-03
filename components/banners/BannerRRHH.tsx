"use client";

import React, { useState, useRef } from "react";
import { 
  Users, 
  Briefcase, 
  UploadCloud, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  Loader2,
  FileText
} from "lucide-react";
import { supabase } from "@/lib/supabase"; // Asegurate de que la ruta sea correcta

export default function BannerRRHH() {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
        // Resetear formulario
        setNombre(""); setApellido(""); setEmail(""); setTelefono(""); setArchivoCV(null);
      }, 4000);

    } catch (error) {
      console.error("Error al enviar postulación:", error);
      alert("Hubo un error al enviar tu postulación. Por favor intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ================= BANNER ================= */}
      <section className="py-16 md:py-24 relative overflow-hidden bg-[#0b1329] border-t border-slate-800">
        {/* Luces de fondo */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#0145F2]/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-sky-400/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          
          <div className="flex-1 text-center md:text-left">
            <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              <Users className="w-3.5 h-3.5" /> Recursos Humanos
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-md mb-3">
              Unite a nuestro <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-[#0145F2]">equipo</span>
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-lg mx-auto md:mx-0">
              Estamos en constante crecimiento y buscamos talentos apasionados por la industria automotriz. Si querés ser parte de Pfaffen Autos, dejanos tus datos.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full md:w-auto bg-white hover:bg-slate-100 text-navy font-black text-xs md:text-sm uppercase tracking-widest px-8 py-4.5 rounded-2xl transition-all shadow-[0_8px_25px_rgba(255,255,255,0.15)] flex items-center justify-center gap-3 active:scale-95 group"
            >
              <Briefcase className="w-5 h-5 text-[#0145F2]" />
              Postularme Ahora
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-navy group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= MODAL FORMULARIO ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={() => !loading && !success && setIsModalOpen(false)}
          ></div>
          
          <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            
            {/* Header Modal */}
            <div className="bg-[#0b1329] p-6 text-center relative shrink-0">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Formulario de Postulación</h3>
              <p className="text-xs text-sky-200 mt-1 font-medium">Completá tus datos y subí tu CV actualizado.</p>
            </div>

            {/* Contenido Modal */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
              {success ? (
                <div className="flex flex-col items-center justify-center py-10 text-center animate-fadeIn">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h4 className="text-2xl font-black text-navy mb-2">¡CV Enviado!</h4>
                  <p className="text-slate-500 text-sm max-w-sm">
                    Recibimos tu postulación correctamente. Nuestro equipo de Recursos Humanos la revisará y nos pondremos en contacto si tu perfil se ajusta a nuestras búsquedas.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Nombre</label>
                      <input 
                        type="text" 
                        required 
                        value={nombre} onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Apellido</label>
                      <input 
                        type="text" 
                        required 
                        value={apellido} onChange={(e) => setApellido(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        placeholder="Tu apellido"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email</label>
                      <input 
                        type="email" 
                        required 
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        placeholder="ejemplo@correo.com"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Teléfono (WhatsApp)</label>
                      <input 
                        type="tel" 
                        required 
                        value={telefono} onChange={(e) => setTelefono(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                        placeholder="+54 9 11 0000-0000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Puesto de interés</label>
                    <div className="relative">
                      <select 
                        value={puesto} onChange={(e) => setPuesto(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy outline-none focus:border-[#0145F2] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm appearance-none cursor-pointer"
                      >
                        <option value="Ventas / Comercial">Ventas / Comercial</option>
                        <option value="Administración">Administración</option>
                        <option value="Marketing / Redes Sociales">Marketing / Redes Sociales</option>
                        <option value="Taller / Mecánica">Taller / Mecánica</option>
                        <option value="Atención al Cliente">Atención al Cliente</option>
                        <option value="Otro">Otro puesto</option>
                      </select>
                    </div>
                  </div>

                  {/* Zona de Carga de CV */}
                  <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Currículum Vitae (PDF o Word)</label>
                    
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
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${archivoCV ? 'border-[#0145F2] bg-blue-50' : 'border-slate-300 hover:border-[#0145F2] hover:bg-slate-100 bg-white'}`}
                    >
                      {archivoCV ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-[#0145F2]/10 text-[#0145F2] rounded-full flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-bold text-navy">{archivoCV.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#0145F2]">Cambiar archivo</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-1">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-bold text-navy">Hacé clic para seleccionar tu CV</span>
                          <span className="text-xs text-slate-400 font-medium">Tamaño máximo: 5MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading || !archivoCV}
                      className="flex-1 py-4 bg-gradient-to-r from-[#0145F2] to-sky-500 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:from-blue-600 hover:to-sky-400 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Enviando..." : "Enviar Postulación"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}