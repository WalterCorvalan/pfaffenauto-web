-- Panel v2 — Marketing. Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- Replica de v1: Pautas, Búsquedas Web, Asistente Virtual, Autos Pautados.
-- Embudo de Conversión NO necesita tablas nuevas, se arma con clientes/
-- ventas/eventos_calendario que ya existen. Instagram es API externa (sin
-- DB). WhatsApp-métricas queda afuera: depende de un bot que no existe acá.

-- Pautas publicitarias (Google Ads / Meta Ads / MercadoLibre). Sin
-- sucursal_id — panel-v2 es agencia única, a diferencia de v1.
create table if not exists public.campanas_marketing (
  id uuid primary key default gen_random_uuid(),
  plataforma text not null check (plataforma in ('Google Ads', 'Meta Ads', 'MercadoLibre')),
  nombre_campana text,
  periodo date not null,
  gasto numeric not null default 0,
  clics int not null default 0,
  leads int not null default 0,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists campanas_marketing_periodo_idx on public.campanas_marketing(periodo);
create index if not exists campanas_marketing_plataforma_idx on public.campanas_marketing(plataforma);

alter table public.campanas_marketing enable row level security;

drop policy if exists "ver_campanas" on public.campanas_marketing;
create policy "ver_campanas" on public.campanas_marketing for select to authenticated using (true);
drop policy if exists "crear_campanas" on public.campanas_marketing;
create policy "crear_campanas" on public.campanas_marketing for insert to authenticated with check (true);
drop policy if exists "editar_campanas" on public.campanas_marketing;
create policy "editar_campanas" on public.campanas_marketing for update to authenticated using (true) with check (true);
drop policy if exists "borrar_campanas" on public.campanas_marketing;
create policy "borrar_campanas" on public.campanas_marketing for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Búsquedas Web: lo tipea el público en el buscador del catálogo público
-- (/catalogo-v2). Se inserta desde ahí (frontend del catálogo), no desde
-- el panel — sin auth, así que anon necesita poder insertar.
create table if not exists public.busquedas_log (
  id uuid primary key default gen_random_uuid(),
  termino text not null,
  resultados_encontrados int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists busquedas_log_created_idx on public.busquedas_log(created_at desc);

alter table public.busquedas_log enable row level security;

drop policy if exists "ver_busquedas" on public.busquedas_log;
create policy "ver_busquedas" on public.busquedas_log for select to authenticated using (true);
drop policy if exists "insertar_busquedas_publico" on public.busquedas_log;
create policy "insertar_busquedas_publico" on public.busquedas_log for insert to anon, authenticated with check (true);

-- Asistente Virtual (chatbot de la web): mismo criterio, anon inserta,
-- solo el equipo lee.
create table if not exists public.chatbot_log (
  id uuid primary key default gen_random_uuid(),
  pregunta text not null,
  respondida boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists chatbot_log_created_idx on public.chatbot_log(created_at desc);

alter table public.chatbot_log enable row level security;

drop policy if exists "ver_chatbot_log" on public.chatbot_log;
create policy "ver_chatbot_log" on public.chatbot_log for select to authenticated using (true);
drop policy if exists "insertar_chatbot_log_publico" on public.chatbot_log;
create policy "insertar_chatbot_log_publico" on public.chatbot_log for insert to anon, authenticated with check (true);

-- Autos Pautados: se agrega sobre la tabla vehiculos que ya existe (Stock).
-- ADITIVO — no rompe nada de lo que ya está.
alter table public.vehiculos
  add column if not exists pautado boolean not null default false,
  add column if not exists canal_pauta text,
  add column if not exists razon_pauta text,
  add column if not exists precio_publicado_ars numeric;

-- Embudo de Conversión: vista de apoyo — leads por canal (origen del
-- cliente) cruzado con ventas cerradas de ese mismo cliente, igual a como
-- ya lo arma "Leads por canal" en la pantalla actual de Marketing.
create or replace view public.v_marketing_embudo_por_canal as
  select c.origen as canal,
         count(distinct c.id) as leads,
         count(distinct v.cliente_id) filter (where v.estado = 'cerrada') as ganados
  from public.clientes c
  left join public.ventas v on v.cliente_id = c.id
  group by c.origen;

alter view public.v_marketing_embudo_por_canal set (security_invoker = true);
grant select on public.v_marketing_embudo_por_canal to authenticated;
