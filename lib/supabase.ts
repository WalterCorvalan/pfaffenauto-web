import { createClient } from '@supabase/supabase-js'

// Traemos las llaves de nuestra caja fuerte (.env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

// Creamos y exportamos la conexión oficial a tu base de datos
export const supabase = createClient(supabaseUrl, supabaseAnonKey)