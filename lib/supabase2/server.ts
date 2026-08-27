import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server client de la DB de panel-v2 — mismo patrón que lib/supabase/server.ts
// pero apuntando al proyecto Supabase nuevo (env vars NEXT_PUBLIC_SUPABASE2_*).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE2_URL!,
    process.env.NEXT_PUBLIC_SUPABASE2_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
