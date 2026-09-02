-- Panel v2 — Mi Espacio: zona personal de cada usuario (privado, no
-- operación de la agencia). Nuevo desde cero según el manual. Esta primera
-- tanda cubre Mi día, Mi resumen (preferencias del digest), URGENTE y Pagos
-- realizados — el resto de las pestañas (Pendientes, Calendario, Deudas,
-- Cuotas, Gastos fijos, Patrimonio, Contactos, Preferencias) se suman
-- después, incrementalmente.
--
-- A diferencia del resto de panel-v2 (políticas "authenticated true" de
-- confianza total entre staff), acá los datos son explícitamente privados
-- ("Solo vos ves esto") — la RLS restringe cada tabla a su dueño
-- (perfil_id = auth.uid()), primera tabla del proyecto con ese nivel de
-- aislamiento.

-- ============================================================
-- 1) Urgentes — anotaciones de pagos/trámites propios con vencimiento.
-- ============================================================
create table if not exists public.espacio_urgentes (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  titulo text not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  monto numeric not null default 0,
  monto_pagado numeric not null default 0,
  vencimiento date not null,
  notas text,
  pagado boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists espacio_urgentes_perfil_idx on public.espacio_urgentes(perfil_id, vencimiento);

alter table public.espacio_urgentes enable row level security;
drop policy if exists "dueño_espacio_urgentes" on public.espacio_urgentes;
create policy "dueño_espacio_urgentes" on public.espacio_urgentes for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

-- ============================================================
-- 2) Pagos realizados — registro manual + los que salen de pagar un
-- urgente (parcial o total). origen_id apunta a la tabla de origen cuando
-- corresponde (por ahora solo 'urgente'; 'deuda'/'cuota' se suman cuando
-- existan esas pestañas).
-- ============================================================
create table if not exists public.espacio_pagos (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  fecha date not null default current_date,
  metodo text,
  concepto text not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  monto numeric not null,
  beneficiario text,
  notas text,
  origen text not null default 'manual' check (origen in ('manual', 'urgente')),
  origen_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists espacio_pagos_perfil_idx on public.espacio_pagos(perfil_id, fecha);

alter table public.espacio_pagos enable row level security;
drop policy if exists "dueño_espacio_pagos" on public.espacio_pagos;
create policy "dueño_espacio_pagos" on public.espacio_pagos for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());

-- ============================================================
-- 3) Preferencias del resumen diario (campanita) — qué incluir, cada uno
-- arma el suyo. El envío real del digest (cron) queda para después; esto
-- solo guarda la preferencia.
-- ============================================================
create table if not exists public.espacio_resumen_prefs (
  perfil_id uuid primary key references public.perfiles(id) on delete cascade,
  recibir_resumen boolean not null default true,
  items jsonb not null default '["ventas_cerradas","leads_nuevos","expedientes_atrasados","cuotas","stock_disponible","cotizaciones_nuevas","clientes_ingresaron","clientes_sin_contactar","reclamos_abiertos","autorizaciones_pendientes"]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.espacio_resumen_prefs enable row level security;
drop policy if exists "dueño_espacio_resumen_prefs" on public.espacio_resumen_prefs;
create policy "dueño_espacio_resumen_prefs" on public.espacio_resumen_prefs for all to authenticated using (perfil_id = auth.uid()) with check (perfil_id = auth.uid());
