"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// El link del correo de recuperación llega acá con un token en el hash de la URL;
// Supabase lo procesa solo y deja una sesión temporal habilitada para updateUser.
export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listo, setListo] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setListo(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setListo(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setOk(true);
    setTimeout(() => router.push("/panel"), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="max-w-md w-full space-y-8 bg-[#1A1A1A] p-8 rounded-xl border border-white/10 shadow-2xl">
        <h2 className="text-center text-2xl font-serif text-[#F5F5F3]">Elegí tu nueva contraseña</h2>

        {!listo ? (
          <p className="text-center text-sm text-gray-400">Verificando el link de recuperación...</p>
        ) : ok ? (
          <p className="text-center text-sm text-emerald-400">Contraseña actualizada. Redirigiendo al panel...</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-gray-300">Nueva contraseña</label>
              <input
                type="password"
                required
                className="mt-1 w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-md text-white focus:outline-none focus:border-[#0055A4]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300">Confirmar contraseña</label>
              <input
                type="password"
                required
                className="mt-1 w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-md text-white focus:outline-none focus:border-[#0055A4]"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-bold text-white bg-[#0055A4] hover:bg-[#1E6FD9] transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Actualizar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
