-- Mismo criterio que uso_ia_openai: Anthropic tampoco devuelve el costo en
-- USD de la llamada (solo OpenRouter lo hace, y ese ya se registra en
-- movimientos_caja vía registrarCostoIA). Guardamos tokens para poder cruzar
-- después contra el pricing de Haiku. Usado por lib/ai/index.ts (WA bot,
-- webchat, buscador con IA, informes) cada vez que responde Anthropic.
create table if not exists uso_ia_anthropic (
  id uuid primary key default gen_random_uuid(),
  origen text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists uso_ia_anthropic_created_at_idx on uso_ia_anthropic (created_at desc);

alter table uso_ia_anthropic enable row level security;

create policy "Staff logueado puede ver uso de Anthropic"
  on uso_ia_anthropic for select
  to authenticated
  using (true);
