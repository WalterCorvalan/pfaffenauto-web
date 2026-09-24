-- Automatización tipo ManyChat: palabra clave en un comentario de Instagram
-- -> DM automático (y opcionalmente respuesta pública debajo del comentario)
-- con un texto puntual, en vez del mensaje de apertura genérico fijo que
-- se manda hoy para CUALQUIER comentario. Reglas globales (no por post),
-- mismo criterio simple que whatsapp_memoria.
create table if not exists instagram_automatizaciones_comentarios (
  id uuid primary key default gen_random_uuid(),
  palabras_clave text[] not null,
  respuesta_dm text not null,
  respuesta_publica text,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
