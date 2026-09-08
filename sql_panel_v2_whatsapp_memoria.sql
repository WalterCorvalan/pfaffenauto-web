-- "Memoria" del bot de WhatsApp: respuestas fijas por palabra clave para
-- preguntas frecuentes (horarios, ubicación, formas de pago, datos de la
-- empresa) que se contestan SIN llamar a la IA -- mismo espíritu que el
-- buscador de la web (DB primero, IA solo si no matchea nada). También cubre
-- el mensaje fuera de horario (hoy no se respondía nada fuera de las 8-22).
create table if not exists public.whatsapp_memoria (
  id uuid primary key default gen_random_uuid(),
  categoria text not null check (categoria in ('horarios_ubicacion', 'pagos_financiacion', 'datos_empresa', 'saludo', 'fuera_horario')),
  palabras_clave text[] not null default '{}',
  respuesta text not null,
  activo boolean not null default true,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_memoria_categoria on public.whatsapp_memoria(categoria) where activo;

alter table public.whatsapp_memoria enable row level security;

create policy "whatsapp_memoria_all_authenticated"
on public.whatsapp_memoria
for all
to authenticated
using (true)
with check (true);

-- El webhook (rol anon vía service role, no hace falta policy extra) lee esto
-- server-side con el service role key, no necesita policy para "anon".

-- Evita mandar el aviso de fuera de horario más de una vez por día por
-- conversación (si el cliente escribe 5 veces a la madrugada no le mandamos
-- el mismo mensaje 5 veces).
alter table public.whatsapp_conversaciones add column if not exists fuera_horario_avisado_fecha date;
