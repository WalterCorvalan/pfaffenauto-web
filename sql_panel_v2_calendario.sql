-- Panel v2 — primer módulo (Calendario). Corre en la base NUEVA
-- (vdcpmbajlyqgohrwpkeo), no toca nada de la base de panel-v1.

-- perfiles: mínimo indispensable para que Calendario tenga a quién asignar
-- "Responsable" y a quién notificar. El manual dice que un usuario puede
-- tener VARIOS roles a la vez (permisos se suman) — por eso roles es array,
-- no una columna única como en panel-v1.
create table if not exists public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  roles text[] not null default '{}',
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.perfiles enable row level security;

drop policy if exists "ver_perfiles" on public.perfiles;
create policy "ver_perfiles" on public.perfiles for select to authenticated using (true);

drop policy if exists "editar_propio_perfil" on public.perfiles;
create policy "editar_propio_perfil" on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- eventos_calendario: turnos, vencimientos, entregas, recordatorios.
create table if not exists public.eventos_calendario (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null default 'Reunión',
  fecha date not null,
  hora time,
  color text not null default '#6366f1',
  nombre_cliente text,
  telefono_cliente text,
  descripcion_vehiculo text,
  responsable_id uuid references public.perfiles(id),
  visibilidad text not null default 'equipo' check (visibilidad in ('equipo', 'privado')),
  notificar_por text not null default 'sector' check (notificar_por in ('sector', 'personas')),
  sectores text[] not null default '{}',
  personas_notificadas uuid[] not null default '{}',
  descripcion text,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now()
);

create index if not exists eventos_calendario_fecha_idx on public.eventos_calendario(fecha);

alter table public.eventos_calendario enable row level security;

-- "Privado" solo lo ven: responsable, quien lo creó, y admins (roles
-- contiene 'admin'). "Equipo" lo ve cualquier autenticado.
drop policy if exists "ver_eventos" on public.eventos_calendario;
create policy "ver_eventos" on public.eventos_calendario for select to authenticated
  using (
    visibilidad = 'equipo'
    or responsable_id = auth.uid()
    or creado_por = auth.uid()
    or exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles))
  );

drop policy if exists "crear_eventos" on public.eventos_calendario;
create policy "crear_eventos" on public.eventos_calendario for insert to authenticated
  with check (creado_por = auth.uid());

drop policy if exists "editar_eventos" on public.eventos_calendario;
create policy "editar_eventos" on public.eventos_calendario for update to authenticated
  using (
    creado_por = auth.uid()
    or responsable_id = auth.uid()
    or exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles))
  );

drop policy if exists "borrar_eventos" on public.eventos_calendario;
create policy "borrar_eventos" on public.eventos_calendario for delete to authenticated
  using (
    creado_por = auth.uid()
    or exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles))
  );
