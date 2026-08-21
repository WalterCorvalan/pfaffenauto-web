"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  Users,
  UploadCloud,
  CheckCircle2,
  Loader2,
  FileText,
  ArrowLeft,
  Briefcase,
  Star,
  HeartHandshake,
  User,
  Mail,
  Phone,
  Building2
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

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

  // Turnstile (anti-spam) — antes este form insertaba directo a Supabase con
  // la anon key, sin captcha ni rate limit.
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileListo, setTurnstileListo] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!turnstileListo || !turnstileRef.current || !window.turnstile) return;
    if (turnstileWidgetId.current) return;

    turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
      callback: (token: string) => setTurnstileToken(token),
      "expired-callback": () => setTurnstileToken(""),
      "error-callback": () => setTurnstileToken(""),
    });
  }, [turnstileListo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !apellido || !email || !telefono || !archivoCV) {
      alert("Por favor completá todos los campos y adjuntá tu CV.");
      return;
    }
    if (!turnstileToken) {
      alert("Completá la verificación anti-spam antes de continuar.");
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

      // 2. Guardar los datos vía API (Turnstile + zod + rate limit del lado servidor)
      const response = await fetch("/api/postulaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          turnstileToken,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.trim(),
          telefono: telefono.trim(),
          puesto,
          cv_url: publicUrlData.publicUrl,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar la postulación");

      // Éxito
      setSuccess(true);

      // Reseteamos el formulario pero mantenemos el mensaje de éxito unos segundos más
      setTimeout(() => {
        setSuccess(false);
        setNombre(""); setApellido(""); setEmail(""); setTelefono(""); setArchivoCV(null);
      }, 8000);

    } catch (error) {
      console.error("Error al enviar postulación:", error);
      alert(error instanceof Error ? error.message : "Hubo un error al enviar tu postulación. Por favor intentá nuevamente.");
      if (turnstileWidgetId.current && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId.current);
      }
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col py-8 px-4 sm:px-6 lg:px-8 font-sans text-slate-900 dark:text-white bg-slate-100 dark:bg-[#0a0a0f]">

      {/* ================= VIDEO DE FONDO ================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover scale-105"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        {/* Overlay protector translúcido para asegurar que los textos oscuros se lean perfecto */}
        <div className="absolute inset-0 bg-white/80 dark:bg-[#0a0a0f]/85 backdrop-blur-[2px]"></div>
      </div>

      {/* Botón para volver */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-[#0145F2] dark:hover:text-sky-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 px-4 py-2.5 rounded-full border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center w-full mt-12 md:mt-0 relative z-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          
          {/* ================= COLUMNA IZQUIERDA: CULTURA Y CONFIANZA ================= */}
          <div className="lg:col-span-5 flex flex-col gap-8 order-2 lg:order-1 mt-8 lg:mt-0">
            <div>
              <span className="inline-flex items-center gap-2 bg-[#0145F2]/10 dark:bg-sky-400/10 text-[#0145F2] dark:text-sky-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md mb-4 border border-[#0145F2]/20 dark:border-sky-400/20 backdrop-blur-md">
                <Building2 className="w-3.5 h-3.5" /> Sumate al equipo
              </span>
              <h1 className="text-4xl lg:text-5xl font-black text-[#0f293e] dark:text-white tracking-tighter leading-tight mb-4 drop-shadow-sm">
                Construí tu futuro en <span className="text-[#0145F2] dark:text-sky-300">Pfaffen Autos</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                Somos una agencia líder en constante expansión. Buscamos personas proactivas, apasionadas por la industria automotriz y con ganas de desarrollarse en un entorno dinámico y profesional.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm p-3 rounded-2xl shadow-sm dark:shadow-none border border-white dark:border-white/10 shrink-0">
                  <Star className="w-6 h-6 text-[#0145F2] dark:text-sky-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#0f293e] dark:text-white">Desarrollo Profesional</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Oportunidades reales de crecimiento y capacitación constante en ventas y gestión.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm p-3 rounded-2xl shadow-sm dark:shadow-none border border-white dark:border-white/10 shrink-0">
                  <HeartHandshake className="w-6 h-6 text-[#0145F2] dark:text-sky-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#0f293e] dark:text-white">Excelente Clima Laboral</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Fomentamos el trabajo en equipo, el respeto y la colaboración diaria entre todas las áreas.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm p-3 rounded-2xl shadow-sm dark:shadow-none border border-white dark:border-white/10 shrink-0">
                  <Briefcase className="w-6 h-6 text-[#0145F2] dark:text-sky-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-[#0f293e] dark:text-white">Estabilidad y Beneficios</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">Condiciones de contratación claras, esquema de comisiones competitivo y estabilidad garantizada.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= COLUMNA DERECHA: FORMULARIO ================= */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-white/90 dark:bg-white/5 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none border border-white dark:border-white/10 p-6 sm:p-10 relative overflow-hidden">

              {success ? (
                <div className="flex flex-col items-center justify-center py-16 text-center animate-fadeIn">
                  <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-400/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-emerald-100 dark:border-emerald-400/20">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-black text-[#0f293e] dark:text-white mb-3 uppercase tracking-tight">¡Postulación recibida!</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                    Gracias por querer formar parte de Pfaffen Autos. Nuestro equipo de Recursos Humanos revisará tu perfil y te contactaremos si se ajusta a nuestras búsquedas.
                  </p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-8 text-[#0145F2] dark:text-sky-300 font-bold text-xs uppercase tracking-widest hover:text-blue-700 dark:hover:text-sky-200 transition-all bg-blue-50 dark:bg-sky-400/10 px-6 py-3 rounded-full"
                  >
                    Enviar otra postulación
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">

                  <div>
                    <h2 className="text-xl font-black text-[#0f293e] dark:text-white mb-1">Dejanos tus datos</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completá el formulario para ingresar a nuestra base de talentos.</p>
                  </div>

                  {/* Fila: Nombre y Apellido */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Nombre</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="text"
                          required
                          value={nombre} onChange={(e) => setNombre(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm font-semibold text-[#0f293e] dark:text-white outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium"
                          placeholder="Tu nombre"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Apellido</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="text"
                          required
                          value={apellido} onChange={(e) => setApellido(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm font-semibold text-[#0f293e] dark:text-white outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium"
                          placeholder="Tu apellido"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fila: Email y Teléfono */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email} onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm font-semibold text-[#0f293e] dark:text-white outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium"
                          placeholder="ejemplo@correo.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Teléfono</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="tel"
                          required
                          value={telefono} onChange={(e) => setTelefono(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm font-semibold text-[#0f293e] dark:text-white outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium"
                          placeholder="+54 9 11 0000-0000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Puesto */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Puesto de interés</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Briefcase className="w-4 h-4 text-[#0145F2] dark:text-sky-300" />
                      </div>
                      <select
                        value={puesto} onChange={(e) => setPuesto(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-sm font-semibold text-[#0f293e] dark:text-white outline-none focus:bg-white dark:focus:bg-white/10 focus:border-[#0145F2] dark:focus:border-sky-400 focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-sky-400/10 transition-all shadow-sm dark:shadow-none appearance-none cursor-pointer dark:[color-scheme:dark]"
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
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">Currículum Vitae (PDF o Word)</label>

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
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${archivoCV ? 'border-[#0145F2] dark:border-sky-400 bg-blue-50/50 dark:bg-sky-400/10 shadow-sm dark:shadow-none' : 'border-slate-300 dark:border-white/20 hover:border-[#0145F2] dark:hover:border-sky-400 hover:bg-slate-50 dark:hover:bg-white/10 bg-slate-50/50 dark:bg-white/5'}`}
                    >
                      {archivoCV ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-white dark:bg-white/10 shadow-sm dark:shadow-none text-[#0145F2] dark:text-sky-300 rounded-full flex items-center justify-center border border-blue-100 dark:border-sky-400/20">
                            <FileText className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-black text-[#0f293e] dark:text-white mt-1">{archivoCV.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 hover:text-[#0145F2] dark:hover:text-sky-300">Cambiar archivo adjunto</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-white dark:bg-white/10 shadow-sm dark:shadow-none text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center border border-slate-200 dark:border-white/10 mb-1 group-hover:text-[#0145F2]">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <span className="text-sm font-bold text-[#0f293e] dark:text-white">Hacé clic para subir tu CV</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-widest">Máximo 5MB • PDF, DOC, DOCX</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div ref={turnstileRef} className="flex justify-center" />

                  {/* Botón Submit */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading || !archivoCV || !turnstileToken}
                      className="w-full py-4 bg-[#0145F2] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-[0_8px_20px_rgba(1,69,242,0.25)] disabled:opacity-50 disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? "Enviando Postulación..." : "Enviar Postulación"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
        onLoad={() => setTurnstileListo(true)}
      />
    </main>
  );
}