-- Panel v2 — NPS y Satisfacción. Front ya construido (app/panel-v2/nps/*),
-- esto arma solo el backend que le falta: registro de encuestas enviadas,
-- respuestas (manuales o por WhatsApp), y los 4 mensajes configurables por
-- contexto en Configuración → Empresa → WhatsApp.

create table if not exists public.nps_respuestas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  vendedor_id uuid references public.perfiles(id) on delete set null,
  contexto text not null check (contexto in ('post-venta', 'post-visita', 'post-entrega', 'post-cotizacion')),
  puntaje int not null check (puntaje between 0 and 10),
  comentario text,
  origen text not null default 'manual' check (origen in ('manual', 'whatsapp')),
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists nps_respuestas_vendedor_idx on public.nps_respuestas(vendedor_id);
create index if not exists nps_respuestas_created_at_idx on public.nps_respuestas(created_at desc);

alter table public.nps_respuestas enable row level security;
drop policy if exists "equipo_nps_respuestas" on public.nps_respuestas;
create policy "equipo_nps_respuestas" on public.nps_respuestas for all to authenticated using (true) with check (true);

-- Registro de cada encuesta enviada por WhatsApp (no la respuesta en sí,
-- solo que se mandó) -- permite ver a quién ya se le pidió y evitar
-- reenvíos duplicados desde otra pantalla el día de mañana.
create table if not exists public.nps_envios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  vendedor_id uuid references public.perfiles(id) on delete set null,
  contexto text not null check (contexto in ('post-venta', 'post-visita', 'post-entrega', 'post-cotizacion')),
  enviado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists nps_envios_cliente_idx on public.nps_envios(cliente_id);

alter table public.nps_envios enable row level security;
drop policy if exists "equipo_nps_envios" on public.nps_envios;
create policy "equipo_nps_envios" on public.nps_envios for all to authenticated using (true) with check (true);

-- Mensajes de WhatsApp por contexto -- si la agencia no los personaliza,
-- EnviarEncuestaModal igual tiene un texto de arranque (el default acá).
alter table public.configuracion_empresa add column if not exists nps_msg_post_venta text
  default '¡Hola! Gracias por confiar en Pfaffen Autos para tu compra 🚗 Nos encantaría saber cómo fue tu experiencia. Del 0 al 10, ¿qué tan probable es que nos recomiendes a un amigo o familiar? Contanos también qué te pareció.';
alter table public.configuracion_empresa add column if not exists nps_msg_post_visita text
  default '¡Hola! Gracias por visitarnos hoy en Pfaffen Autos 🙌 Nos gustaría conocer tu opinión: del 0 al 10, ¿qué tan probable es que nos recomiendes? Cualquier comentario nos sirve para mejorar.';
alter table public.configuracion_empresa add column if not exists nps_msg_post_entrega text
  default '¡Hola! Esperamos que estés disfrutando tu vehículo 🚗✨ Nos ayudarías mucho contándonos, del 0 al 10, qué tan probable es que nos recomiendes después de la entrega. ¡Gracias!';
alter table public.configuracion_empresa add column if not exists nps_msg_post_cotizacion text
  default '¡Hola! Gracias por cotizar con Pfaffen Autos. Nos gustaría saber tu opinión sobre la atención que recibiste: del 0 al 10, ¿qué tan probable es que nos recomiendes?';
