-- Uso de OpenAI (tokens, no USD — OpenAI no devuelve el costo directo como sí
-- hace OpenRouter, así que acá guardamos lo que la API sí reporta: tokens de
-- entrada/salida y cantidad de búsquedas web hechas). Para pasar esto a plata
-- hay que mirar el pricing vigente en platform.openai.com/usage y multiplicar.
create table if not exists uso_ia_openai (
  id uuid primary key default gen_random_uuid(),
  origen text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  web_search_calls integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists uso_ia_openai_created_at_idx on uso_ia_openai (created_at desc);

alter table uso_ia_openai enable row level security;

create policy "Staff logueado puede ver uso de IA"
  on uso_ia_openai for select
  to authenticated
  using (true);

-- Ejemplo para ver consumo total de los últimos 30 días:
-- select sum(input_tokens) as input, sum(output_tokens) as output, sum(web_search_calls) as busquedas
-- from uso_ia_openai where created_at > now() - interval '30 days';
