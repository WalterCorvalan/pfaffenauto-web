-- Panel v2 — Visitas (agenda de citas agendadas desde la web). Replica
-- visitas_agendadas de v1 (app/(panel-v1)/panel/citas).

create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid references public.vehiculos(id) on delete set null,
  nombre_cliente text not null,
  telefono_cliente text not null,
  fecha_visita date not null,
  horario_visita text not null,
  sucursal text not null,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'Confirmada', 'Asistió', 'Cancelada')),
  vendedor_id uuid references public.perfiles(id),
  cliente_id uuid references public.clientes(id),
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists visitas_fecha_idx on public.visitas(fecha_visita, horario_visita);
create index if not exists visitas_sucursal_fecha_idx on public.visitas(sucursal, fecha_visita);
create index if not exists visitas_vendedor_idx on public.visitas(vendedor_id);
create index if not exists visitas_estado_idx on public.visitas(estado);

alter table public.visitas enable row level security;
drop policy if exists "equipo_visitas" on public.visitas;
create policy "equipo_visitas" on public.visitas for all to authenticated using (true) with check (true);

drop policy if exists "borrar_visitas" on public.visitas;
create policy "borrar_visitas" on public.visitas for delete to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Chequeo de horario ocupado — mismo criterio que el form público de v1
-- (misma sucursal + misma fecha + mismo horario, sin contar canceladas), lo
-- expone el frontend público para deshabilitar franjas ya tomadas.
create or replace function public.visitas_horarios_ocupados(p_sucursal text, p_fecha date)
returns table (horario_visita text)
language sql
stable
as $$
  select horario_visita from public.visitas
  where sucursal = p_sucursal and fecha_visita = p_fecha and estado <> 'Cancelada';
$$;

-- Notifica al vendedor asignado (del vehículo, o el vendedor_id explícito) al
-- agendarse una visita nueva; si no hay nadie asignado, avisa a encargados/admin.
create or replace function public.visitas_notificar_nueva()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo text;
  v_link text;
  v_encargado record;
begin
  v_titulo := 'Nueva visita: ' || new.nombre_cliente || ' — ' || to_char(new.fecha_visita, 'DD/MM') || ' ' || new.horario_visita || ' (' || new.sucursal || ')';
  v_link := '/panel-v2/visitas?visita=' || new.id;

  if new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
    values (new.vendedor_id, 'visita_nueva', 'media', v_titulo, v_link);
  else
    for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'visita_nueva', 'media', v_titulo, v_link);
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_visitas_notificar_nueva on public.visitas;
create trigger trg_visitas_notificar_nueva
  after insert on public.visitas
  for each row execute function public.visitas_notificar_nueva();
