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
  const [pidiendoCodigo, setPidiendoCodigo] = useState(false);
  const [userIdPendiente, setUserIdPendiente] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
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

    // Chequeamos si el usuario tiene 2FA activo. Si lo tiene, cerramos la
    // sesión recién creada de inmediato — no queda sesión válida hasta que
    // no pase el código, en vez de confiar en un gate solo de UI.
    const res = await fetch("/api/panel-v2/2fa/check-required", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: data.user.id }),
    });
    const { requerido } = await res.json();

    if (requerido) {
      await supabase2.auth.signOut();
      setUserIdPendiente(data.user.id);
      setPidiendoCodigo(true);
      setLoading(false);
      return;
    }

    router.push("/panel-v2");
    router.refresh();
  };

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/panel-v2/2fa/verify-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: userIdPendiente, codigo }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Código incorrecto.");
      setLoading(false);
      return;
    }

    // Código verificado — recién ahora establecemos la sesión real.
    const { error: authError } = await supabase2.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("No se pudo iniciar sesión.");
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

        {pidiendoCodigo ? (
          <form className="mt-8 space-y-6" onSubmit={handleVerificarCodigo}>
            <p className="text-sm text-gray-300 text-center">Ingresá el código de 6 dígitos de tu app de autenticación.</p>
            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              required
              className="mt-1 w-full px-3 py-2 bg-[#0A0A0A] border border-white/10 rounded-md text-white text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-[#0055A4]"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            />
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-500/10 py-2 rounded">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || codigo.length !== 6}
              className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-bold text-white bg-[#0055A4] hover:bg-[#1E6FD9] transition-colors disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
            <button
              type="button"
              onClick={() => { setPidiendoCodigo(false); setCodigo(""); setError(null); }}
              className="w-full text-xs text-gray-400 hover:text-gray-200"
            >
              Volver
            </button>
          </form>
        ) : (
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
        )}
      </div>
    </div>
  );
}
