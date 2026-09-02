-- Panel v2 — Mi Espacio, segunda tanda: Deudas, Cuotas a pagar/cobrar,
-- Saldo agencia, Mis autos, Patrimonio (agregación, sin tabla propia),
-- Pendientes, Calendario personal, Gastos fijos, Contactos, Mis
-- notificaciones (solo preferencia — el filtrado real en cada punto de
-- generación de alertas queda para después) y Mi WhatsApp (solo
-- preferencia — enganchar en los botones de WhatsApp existentes queda
-- para después). Mismo patrón que la primera tanda: RLS privada por dueño
-- (perfil_id = auth.uid()), no la política "authenticated true" del resto
-- del panel.

create table if not exists public.espacio_deudas (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  acreedor text not null,
  concepto text,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  monto numeric not null default 0,
  monto_pagado numeric not null default 0,
  fecha_inicio date not null default current_date,
  vencimiento date,
  pagada boolean not null default false,
  notas text,
  created_at timestamptz not null default now()
);
alter table public.espacio_deudas enable row level security;
drop policy if exists "dueño_espacio_deudas" on public.espacio_deudas;
create policy "dueño_espacio_deudas" on public.espacio_deudas for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_cuotas_pagar (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  concepto text not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  monto numeric not null default 0,
  monto_pagado numeric not null default 0,
  vencimiento date not null,
  cuota_actual int,
  cuota_total int,
  deuda_id uuid references public.espacio_deudas(id) on delete set null,
  acreedor_banco text,
  notas text,
  pagada boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists espacio_cuotas_pagar_deuda_idx on public.espacio_cuotas_pagar(deuda_id);
alter table public.espacio_cuotas_pagar enable row level security;
drop policy if exists "dueño_espacio_cuotas_pagar" on public.espacio_cuotas_pagar;
create policy "dueño_espacio_cuotas_pagar" on public.espacio_cuotas_pagar for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_cuotas_cobrar (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  concepto text not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  monto numeric not null default 0,
  monto_cobrado numeric not null default 0,
  vencimiento date not null,
  cuota_actual int,
  cuota_total int,
  deudor text,
  notas text,
  cobrada boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.espacio_cuotas_cobrar enable row level security;
drop policy if exists "dueño_espacio_cuotas_cobrar" on public.espacio_cuotas_cobrar;
create policy "dueño_espacio_cuotas_cobrar" on public.espacio_cuotas_cobrar for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_movimientos_agencia (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  tipo text not null check (tipo in ('saque', 'aporte')),
  monto numeric not null,
  moneda text not null default 'USD' check (moneda in ('ARS', 'USD')),
  fecha date not null default current_date,
  motivo text,
  notas text,
  saldado boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.espacio_movimientos_agencia enable row level security;
drop policy if exists "dueño_espacio_movimientos_agencia" on public.espacio_movimientos_agencia;
create policy "dueño_espacio_movimientos_agencia" on public.espacio_movimientos_agencia for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_autos_personales (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  marca text not null,
  modelo text,
  anio int,
  patente text,
  titular text,
  km int,
  valor_estimado_usd numeric,
  vence_vtv date,
  vence_seguro date,
  vence_patente date,
  compania_seguro text,
  notas text,
  created_at timestamptz not null default now()
);
alter table public.espacio_autos_personales enable row level security;
drop policy if exists "dueño_espacio_autos_personales" on public.espacio_autos_personales;
create policy "dueño_espacio_autos_personales" on public.espacio_autos_personales for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_cuentas_personales (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  nombre text not null,
  tipo text not null default 'Banco',
  moneda text not null default 'USD' check (moneda in ('ARS', 'USD')),
  saldo_actual numeric not null default 0,
  notas text,
  created_at timestamptz not null default now()
);
alter table public.espacio_cuentas_personales enable row level security;
drop policy if exists "dueño_espacio_cuentas_personales" on public.espacio_cuentas_personales;
create policy "dueño_espacio_cuentas_personales" on public.espacio_cuentas_personales for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_pendientes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  titulo text not null,
  prioridad text not null default 'Media' check (prioridad in ('Baja', 'Media', 'Alta')),
  vencimiento date,
  notas text,
  completada boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.espacio_pendientes enable row level security;
drop policy if exists "dueño_espacio_pendientes" on public.espacio_pendientes;
create policy "dueño_espacio_pendientes" on public.espacio_pendientes for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_eventos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  evento text not null,
  fecha date not null,
  hora time,
  categoria text not null default 'Personal' check (categoria in ('Familia', 'Salud', 'Vacaciones', 'Cumpleaños', 'Personal', 'Otro')),
  recordar_antes text not null default '1 día antes',
  notas text,
  created_at timestamptz not null default now()
);
alter table public.espacio_eventos enable row level security;
drop policy if exists "dueño_espacio_eventos" on public.espacio_eventos;
create policy "dueño_espacio_eventos" on public.espacio_eventos for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_gastos_fijos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  concepto text not null,
  monto numeric not null,
  moneda text not null default 'USD' check (moneda in ('ARS', 'USD')),
  frecuencia text not null default 'Mensual' check (frecuencia in ('Mensual', 'Bimestral', 'Anual')),
  dia_del_mes int,
  categoria text not null default 'Otros',
  notas text,
  created_at timestamptz not null default now()
);
alter table public.espacio_gastos_fijos enable row level security;
drop policy if exists "dueño_espacio_gastos_fijos" on public.espacio_gastos_fijos;
create policy "dueño_espacio_gastos_fijos" on public.espacio_gastos_fijos for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_contactos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  nombre text not null,
  rol text,
  empresa text,
  telefono text,
  whatsapp text,
  email text,
  notas text,
  created_at timestamptz not null default now()
);
alter table public.espacio_contactos enable row level security;
drop policy if exists "dueño_espacio_contactos" on public.espacio_contactos;
create policy "dueño_espacio_contactos" on public.espacio_contactos for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_notif_prefs (
  perfil_id uuid primary key references public.perfiles(id) on delete cascade,
  desactivadas jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.espacio_notif_prefs enable row level security;
drop policy if exists "dueño_espacio_notif_prefs" on public.espacio_notif_prefs;
create policy "dueño_espacio_notif_prefs" on public.espacio_notif_prefs for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

create table if not exists public.espacio_whatsapp_prefs (
  perfil_id uuid primary key references public.perfiles(id) on delete cascade,
  saludo_seguimiento text,
  firma text,
  updated_at timestamptz not null default now()
);
alter table public.espacio_whatsapp_prefs enable row level security;
drop policy if exists "dueño_espacio_whatsapp_prefs" on public.espacio_whatsapp_prefs;
create policy "dueño_espacio_whatsapp_prefs" on public.espacio_whatsapp_prefs for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
