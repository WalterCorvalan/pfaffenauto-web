-- Plantillas de WhatsApp para panel-v2 (envío fuera de la ventana de 24h,
-- cuando Meta rechaza texto libre). Puerto del patrón de Vocero CRM
-- (src/server/whatsapp/templates.ts) adaptado a Supabase2/nova.

alter table whatsapp_configuracion
  add column if not exists waba_id text;

comment on column whatsapp_configuracion.waba_id is
  'WhatsApp Business Account ID (Meta Business Manager) -- distinto de phone_number_id, lo pide el endpoint de message_templates.';

create table if not exists whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  idioma text not null default 'es_AR',
  categoria text not null default 'UTILITY',
  cuerpo text not null,
  estado text not null default 'pending' check (estado in ('pending', 'approved', 'rejected')),
  motivo_rechazo text,
  wa_template_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (nombre, idioma)
);

comment on table whatsapp_templates is
  'Plantillas aprobadas por Meta para enviar fuera de la ventana de 24h. v1: máximo una variable {{1}} en el cuerpo.';
