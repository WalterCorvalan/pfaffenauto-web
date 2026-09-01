-- Panel v2 — Recontactos. Corre en la base NUEVA (vdcpmbajlyqgohrwpkeo).
-- Backend primero, según lo acordado — el frontend se arma después con el ok.
--
-- Decisiones tomadas (ver conversación):
-- * "Ya compraron" se excluye solo cruzando clientes.id contra ventas.cliente_id
--   con estado='cerrada'. Las compras viejas cargadas en Postventa
--   (postventa_compras) no tienen cliente_id — no se cruzan automático, es
--   un gap conocido y aceptado.
-- * Duplicados (misma persona cargada 2-3 veces): se agrupan por teléfono al
--   momento de consultar, no se hace merge físico de filas — no toca datos
--   existentes, mismo resultado práctico (un solo mensaje por teléfono).
-- * Fase 2 (bot automático "Milagros") queda para después — la columna
--   envio_automatico_recontactos se crea ahora (default false, sin lógica
--   detrás) para no tener que volver a tocar el schema cuando se construya.

-- ============================================================
-- 1) Clientes — segmento (para elegir plantilla) y opt-out global
-- ============================================================
alter table public.clientes
  add column if not exists segmento text check (segmento is null or segmento in ('busca_auto', 'quiere_vender', 'taller_service', 'consulta_general')),
  add column if not exists no_contactar boolean not null default false;

-- ============================================================
-- 2) Configuración de la empresa — la tabla YA EXISTE (singleton id=true,
-- creada en sql_panel_v2_pedidos_busqueda.sql para Pedidos). Se suma acá
-- 100% aditivo, sin tocar columnas/políticas existentes.
-- ============================================================
alter table public.configuracion_empresa
  add column if not exists plazo_recontacto_meses int not null default 4,
  add column if not exists asignar_al_enviar boolean not null default false,
  add column if not exists envio_automatico_recontactos boolean not null default false,
  add column if not exists plantilla_busca_auto text not null default 'Hola {nombre}! Soy {vendedor} de Pfaffen Autos. Vi que hace un tiempo consultaste por el {vehiculo} — ¿seguís buscando? Tenemos stock nuevo, te puedo mandar opciones.',
  add column if not exists plantilla_quiere_vender text not null default 'Hola {nombre}! Soy {vendedor} de Pfaffen Autos. Hace un tiempo nos consultaste para tasar tu auto — ¿todavía te interesa? Te hacemos una oferta sin compromiso.',
  add column if not exists plantilla_taller_service text not null default 'Hola {nombre}! Soy {vendedor} de Pfaffen Autos. Hace tiempo no sabemos de vos — ¿cómo va tu auto? Cualquier cosa de service o mantenimiento, contanos.',
  add column if not exists plantilla_consulta_general text not null default 'Hola {nombre}! Soy {vendedor} de Pfaffen Autos. Hace un tiempo nos consultaste y no volvimos a hablar — ¿en qué te podemos ayudar hoy?';
-- RLS ya existe ("equipo_config_empresa", FOR ALL a authenticated) — no se toca.

-- ============================================================
-- 3) Recontactos — un registro por mensaje mandado
-- ============================================================
create table if not exists public.recontactos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  segmento_usado text not null,
  mensaje_usado text not null,
  vendedor_id uuid references public.perfiles(id),
  enviado_en timestamptz not null default now(),
  disponible_desde date not null,
  resultado text not null default 'pendiente' check (resultado in ('pendiente', 'quiere_avanzar', 'no_interesa', 'pidio_baja')),
  resultado_en timestamptz,
  resultado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists recontactos_cliente_idx on public.recontactos(cliente_id);
create index if not exists recontactos_enviado_idx on public.recontactos(enviado_en desc);
create index if not exists recontactos_resultado_idx on public.recontactos(resultado);

alter table public.recontactos enable row level security;
drop policy if exists "equipo_recontactos" on public.recontactos;
create policy "equipo_recontactos" on public.recontactos for all to authenticated using (true) with check (true);

-- Al marcar "quiere_avanzar": si el cliente no tenía vendedor asignado, se le
-- asigna el que mandó el recontacto (punto del manual: "se adjudica cuando
-- quiere algo, no cuando le escribimos"). Si ya tenía vendedor, no se toca.
create or replace function public.asignar_vendedor_en_recontacto_avanza()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.resultado = 'quiere_avanzar' and (old.resultado is distinct from new.resultado) then
    update public.clientes
    set vendedor_id = new.vendedor_id
    where id = new.cliente_id and vendedor_id is null and new.vendedor_id is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recontacto_avanza on public.recontactos;
create trigger trg_recontacto_avanza
  after update on public.recontactos
  for each row execute function public.asignar_vendedor_en_recontacto_avanza();

-- Al marcar "pidio_baja": no_contactar = true en la ficha (para TODAS las
-- campañas, no solo recontactos, según el manual).
create or replace function public.marcar_no_contactar_en_baja()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.resultado = 'pidio_baja' and (old.resultado is distinct from new.resultado) then
    update public.clientes set no_contactar = true where id = new.cliente_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_recontacto_baja on public.recontactos;
create trigger trg_recontacto_baja
  after update on public.recontactos
  for each row execute function public.marcar_no_contactar_en_baja();
