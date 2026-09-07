-- Panel v2 — Registro de cambios (calcado de v1: app/(panel-v1)/panel/logs).
-- Tabla genérica de auditoría + un trigger genérico que loguea, campo por
-- campo, cada UPDATE en las tablas que se le enganchen. Arranca en Ventas
-- y Señas -- para sumar otra tabla más adelante alcanza con un
-- "create trigger ... execute function registrar_historial_cambios()".

create table if not exists public.historial_cambios (
  id uuid primary key default gen_random_uuid(),
  tabla text not null,
  registro_id uuid not null,
  campo_modificado text not null,
  valor_anterior text,
  valor_nuevo text,
  usuario_id uuid references public.perfiles(id),
  fecha_cambio timestamptz not null default now()
);

create index if not exists historial_cambios_tabla_registro_idx on public.historial_cambios(tabla, registro_id);
create index if not exists historial_cambios_fecha_idx on public.historial_cambios(fecha_cambio desc);

alter table public.historial_cambios enable row level security;
drop policy if exists "equipo_historial_cambios_select" on public.historial_cambios;
create policy "equipo_historial_cambios_select" on public.historial_cambios for select to authenticated using (true);
-- Sin policy de insert/update/delete para authenticated a propósito: solo
-- entra por el trigger (security definer), nunca a mano desde el cliente.

create or replace function public.registrar_historial_cambios()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb := to_jsonb(OLD);
  v_new jsonb := to_jsonb(NEW);
  v_key text;
  v_ignorar text[] := array['updated_at', 'created_at'];
begin
  for v_key in select jsonb_object_keys(v_new) loop
    if v_key = any(v_ignorar) then continue; end if;
    if v_old -> v_key is distinct from v_new -> v_key then
      insert into public.historial_cambios (tabla, registro_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
      values (TG_TABLE_NAME, NEW.id, v_key, v_old ->> v_key, v_new ->> v_key, auth.uid());
    end if;
  end loop;
  return NEW;
end;
$$;

drop trigger if exists trg_historial_ventas on public.ventas;
create trigger trg_historial_ventas after update on public.ventas for each row execute function public.registrar_historial_cambios();

drop trigger if exists trg_historial_senas on public.senas;
create trigger trg_historial_senas after update on public.senas for each row execute function public.registrar_historial_cambios();
