-- Login por usuario corto en vez de email (pedido del 29/9): Supabase Auth
-- sigue autenticando por email como siempre -- este campo es solo un alias
-- visible que se traduce al email real antes de llamar a signInWithPassword
-- (ver app/api/panel/login-usuario/route.ts). No borra ni reemplaza nada.
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS usuario text;

-- Único (case-insensitive) para que no haya ambigüedad al resolver
-- usuario -> email. Parcial (WHERE usuario IS NOT NULL) para no romper
-- perfiles existentes que todavía no cargaron uno.
CREATE UNIQUE INDEX IF NOT EXISTS perfiles_usuario_unico ON perfiles (lower(usuario)) WHERE usuario IS NOT NULL;
