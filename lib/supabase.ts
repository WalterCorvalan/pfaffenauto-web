import { createBrowserClient } from "@supabase/ssr";

// Traemos las llaves de nuestra caja fuerte (.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// 1. Exportamos la instancia directa (para componentes que usaban "import { supabase } from '@/lib/supabase'")
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// 2. Exportamos también createClient por si algún componente la llama explícitamente
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}