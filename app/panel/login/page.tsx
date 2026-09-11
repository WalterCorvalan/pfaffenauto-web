"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Login propio de panel-v2 — Auth vive en el proyecto Supabase nuevo, separado
// del de panel-v1 (app/(auth)/login), así que no puede reusar esa sesión.
export default function LoginPageV2() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: authError } = await supabase2.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !data.user) {
      setError("Usuario o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/panel");
    router.refresh();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050208] px-4 overflow-hidden">
      <style>{`
        @keyframes blob1 {
          0%, 100% { transform: translate(-10%, -10%) scale(1); }
          33% { transform: translate(20%, 10%) scale(1.3); }
          66% { transform: translate(-5%, 20%) scale(0.85); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(10%, 15%) scale(1); }
          40% { transform: translate(-20%, -10%) scale(1.2); }
          75% { transform: translate(15%, -20%) scale(0.9); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          50% { transform: translate(-25%, 15%) scale(1.4); }
        }
        @keyframes hueshift {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        @keyframes gradientText {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floatIn {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes borderGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        .psy-field { animation: hueshift 18s linear infinite; }
        .psy-blob1 { animation: blob1 22s ease-in-out infinite; }
        .psy-blob2 { animation: blob2 26s ease-in-out infinite; }
        .psy-blob3 { animation: blob3 30s ease-in-out infinite; }
        .psy-title {
          background: linear-gradient(90deg, #ff5fae, #7c5cff, #35d0ff, #ffd25f, #ff5fae);
          background-size: 300% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradientText 6s ease infinite;
        }
        .psy-card { animation: floatIn 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
        .psy-card-border {
          background: linear-gradient(135deg, #ff5fae, #7c5cff, #35d0ff, #ffd25f);
          background-size: 300% 300%;
          animation: gradientText 8s ease infinite, borderGlow 4s ease-in-out infinite;
        }
      `}</style>

      {/* Fondo psicodélico: blobs de gradiente girando/pulsando */}
      <div className="absolute inset-0 psy-field pointer-events-none">
        <div className="psy-blob1 absolute top-0 left-0 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] rounded-full bg-fuchsia-500/40 blur-[100px]" />
        <div className="psy-blob2 absolute bottom-0 right-0 w-[55vw] h-[55vw] max-w-[550px] max-h-[550px] rounded-full bg-cyan-400/40 blur-[100px]" />
        <div className="psy-blob3 absolute top-1/3 right-1/4 w-[45vw] h-[45vw] max-w-[450px] max-h-[450px] rounded-full bg-violet-500/40 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] rounded-full bg-amber-400/20 blur-[110px]" />
      </div>
      {/* Grano sutil para que no quede plano */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      {/* Tarjeta con borde en degradé animado */}
      <div className="psy-card relative max-w-md w-full rounded-2xl p-[1.5px] psy-card-border shadow-[0_0_80px_-15px_rgba(124,92,255,0.5)]">
        <div className="rounded-2xl bg-[#0A0710]/90 backdrop-blur-xl px-8 py-10 space-y-8">
          <div>
            <h2 className="text-center text-4xl font-black tracking-tight psy-title">
              Panel
            </h2>
            <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30 mt-1.5">
              Pfaffen Autos
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-white/50">Email</label>
                <input
                  type="email"
                  required
                  autoFocus
                  className="mt-1.5 w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm outline-none transition-colors focus:border-fuchsia-400/60 focus:bg-white/[0.06] placeholder:text-white/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-white/50">Contraseña</label>
                <input
                  type="password"
                  required
                  className="mt-1.5 w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm outline-none transition-colors focus:border-cyan-400/60 focus:bg-white/[0.06] placeholder:text-white/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-rose-300 text-xs font-semibold text-center bg-rose-500/10 border border-rose-500/20 py-2.5 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-500 hover:brightness-110 transition-all shadow-lg shadow-violet-900/40 disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
