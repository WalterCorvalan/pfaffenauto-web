-- Parte 2 de la réplica de v1 (ver conversación): amplía clientes para que
-- el buscador de señas/presupuestos autocomplete con datos reales, alinea
-- estados de senas al vocabulario de v1, y suma la tabla de aperturas del
-- presupuesto público. 100% aditivo.

-- ============================================================
-- 1) Clientes — campos que v1 tiene y nova no (dni_cuit/telefono/email/
-- fecha_nacimiento ya existían, se reusan tal cual).
-- ============================================================
alter table public.clientes
  add column if not exists apellido text,
  add column if not exists cuit_cuil text,
  add column if not exists calle text,
  add column if not exists numero_calle text,
  add column if not exists depto text,
  add column if not exists localidad text,
  add column if not exists codigo_postal text,
  add column if not exists provincia text,
  add column if not exists estado_civil text,
  add column if not exists profesion text,
  add column if not exists telefono_linea text;

-- ============================================================
-- 2) Senas.estado — se alinea al vocabulario real de v1 (Activa/Convertida/
-- Perdida). La fila QA existente con 'activa' (minúscula) queda como está,
-- el check solo aplica a filas nuevas/actualizadas.
-- ============================================================
alter table public.senas drop constraint if exists senas_estado_check;
alter table public.senas add constraint senas_estado_check
  check (estado in ('Activa', 'Convertida', 'Perdida', 'activa', 'convertida', 'cancelada'));
alter table public.senas alter column estado set default 'Activa';

-- ============================================================
-- 3) Aperturas del presupuesto público (para notificar al vendedor cuando
-- el cliente lo abre).
-- ============================================================
create table if not exists public.presupuesto_aperturas (
  id uuid primary key default gen_random_uuid(),
  presupuesto_id uuid not null references public.presupuestos(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists presupuesto_aperturas_presupuesto_idx on public.presupuesto_aperturas(presupuesto_id);

alter table public.presupuesto_aperturas enable row level security;
drop policy if exists "equipo_presupuesto_aperturas" on public.presupuesto_aperturas;
create policy "equipo_presupuesto_aperturas" on public.presupuesto_aperturas for select to authenticated using (true);
-- El insert lo hace la página pública con service role (bypassea RLS).
