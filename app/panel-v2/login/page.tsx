"use client";

import { useState } from "react";
import { supabase2 } from "@/lib/supabase2/client";
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

    router.push("/panel-v2");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="max-w-md w-full space-y-8 bg-[#1A1A1A] p-8 rounded-xl border border-white/10 shadow-2xl">
        <div>
          <h2 className="text-center text-3xl font-serif text-[#F5F5F3]">
            Panel v2
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  required
                  className="mt-1 w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-md text-white focus:outline-none focus:border-[#0055A4]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Contraseña</label>
                <input
                  type="password"
                  required
                  className="mt-1 w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-md text-white focus:outline-none focus:border-[#0055A4]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-bold text-white bg-[#0055A4] hover:bg-[#1E6FD9] transition-colors disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Iniciar Sesión"}
            </button>
        </form>
      </div>
    </div>
  );
}
