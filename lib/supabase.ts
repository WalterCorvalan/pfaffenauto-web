import { createBrowserClient } from "@supabase/ssr";

// Traemos las llaves de nuestra caja fuerte (.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

// Creamos y exportamos la conexión oficial a tu base de datos (ahora con soporte de cookies)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);