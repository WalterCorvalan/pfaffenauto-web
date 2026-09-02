-- Panel v2 — Finanzas parte 3: Devol. Registro (devoluciones de arancel de
-- gestoría). Cuando se resuelve, dos caminos: "Acreditada" = ingresa de
-- verdad a una caja de la agencia (movimiento real); "Al cliente" = la
-- gestoría se lo devuelve directo al cliente, nunca toca la caja de la
-- agencia (por diseño, sin movimiento).
--
-- Mismo mandato: cero tolerancia a errores de centavos, ARS/USD separados,
-- toda mutación de plata pasa por función security definer.

create table if not exists public.devoluciones_registro (
  id uuid primary key default gen_random_uuid(),
  patente text,
  cliente text,
  gestora text,
  monto numeric not null,
  moneda text not null default 'ARS' check (moneda in ('ARS', 'USD')),
  estado text not null default 'por_confirmar' check (estado in ('por_confirmar', 'acreditada', 'al_cliente')),
  fecha date not null default current_date,
  cuenta_id uuid references public.cuentas(id),
  movimiento_id uuid references public.movimientos_caja(id) on delete set null,
  notas text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists devoluciones_registro_estado_idx on public.devoluciones_registro(estado);

alter table public.devoluciones_registro enable row level security;
drop policy if exists "equipo_devoluciones_registro" on public.devoluciones_registro;
create policy "equipo_devoluciones_registro" on public.devoluciones_registro for all to authenticated using (true) with check (true);

create or replace function public.resolver_devolucion_registro(
  p_id uuid, p_destino text, p_cuenta_id uuid default null, p_fecha date default current_date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d record;
  v_mov_id uuid;
begin
  if p_destino not in ('acreditada', 'al_cliente') then
    raise exception 'Destino inválido.';
  end if;
  select * into v_d from public.devoluciones_registro where id = p_id;
  if v_d is null then raise exception 'Devolución no encontrada.'; end if;
  if v_d.estado <> 'por_confirmar' then raise exception 'Esta devolución ya fue resuelta.'; end if;

  if p_destino = 'acreditada' then
    if p_cuenta_id is null then raise exception 'Elegí la caja donde se acredita.'; end if;
    v_mov_id := public.registrar_movimiento_caja('ingreso', v_d.monto, p_cuenta_id, p_fecha, 'Devolución registro', null, null, null, null, format('Devolución de %s%s', coalesce(v_d.gestora, 'gestoría'), coalesce(' — ' || v_d.patente, '')));
    update public.devoluciones_registro set estado = 'acreditada', cuenta_id = p_cuenta_id, movimiento_id = v_mov_id, fecha = p_fecha where id = p_id;
  else
    update public.devoluciones_registro set estado = 'al_cliente', fecha = p_fecha where id = p_id;
  end if;
end;
$$;

create or replace function public.eliminar_devolucion_registro(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_d record;
begin
  select * into v_d from public.devoluciones_registro where id = p_id;
  if v_d is null then raise exception 'Devolución no encontrada.'; end if;
  if v_d.movimiento_id is not null then
    perform public.eliminar_movimiento_caja(v_d.movimiento_id, 'Devolución de registro eliminada');
  end if;
  delete from public.devoluciones_registro where id = p_id;
end;
$$;
