create table if not exists public.modulos_config (
  modulo text primary key,
  activo boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.modulos_config (modulo) values
  ('cotizaciones'),('pedidos'),('consignaciones'),('gestoria'),('taller'),
  ('service'),('postventa'),('reclamos'),('infracciones'),('telefonos_utiles'),
  ('tesoreria'),('liquidaciones'),('reportes'),('marketing'),('mensajes'),
  ('whatsapp'),('correos'),('nps'),('sugerencias'),('dormidos'),('oportunidades')
on conflict (modulo) do nothing;

create table if not exists public.visibilidad_sector (
  modulo text not null,
  sector text not null check (sector in ('ventas','recepcion','finanzas','gestoria','taller','cm')),
  visible boolean not null default true,
  primary key (modulo, sector)
);

alter table public.modulos_config enable row level security;
alter table public.visibilidad_sector enable row level security;
create policy "lectura autenticados" on public.modulos_config for select to authenticated using (true);
create policy "lectura autenticados" on public.visibilidad_sector for select to authenticated using (true);
create policy "escritura admin" on public.modulos_config for all to authenticated using (exists(select 1 from perfiles where id=auth.uid() and 'admin'=any(roles))) with check (exists(select 1 from perfiles where id=auth.uid() and 'admin'=any(roles)));
create policy "escritura admin" on public.visibilidad_sector for all to authenticated using (exists(select 1 from perfiles where id=auth.uid() and 'admin'=any(roles))) with check (exists(select 1 from perfiles where id=auth.uid() and 'admin'=any(roles)));
