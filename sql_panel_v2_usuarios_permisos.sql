-- Panel v2 — Usuarios y Roles + matriz de Permisos, calcada de v1
-- (app/(panel-v1)/panel/usuarios/PermisosTab.tsx) pero adaptada a que en v2
-- un perfil puede tener VARIOS roles a la vez (perfiles.roles es array, no
-- un solo perfiles.rol como en v1).

-- perfiles v2 nunca tuvo sucursal_id (gap conocido) -- Usuarios y Roles en
-- v1 permite fijar sucursal por colaborador, hace falta la columna.
alter table public.perfiles
  add column if not exists sucursal_id uuid references public.sucursales(id);

create table if not exists public.permisos_definiciones (
  clave text primary key,
  nombre text not null,
  descripcion text,
  categoria text not null
);

create table if not exists public.rol_permisos (
  rol text not null,
  permiso_clave text not null references public.permisos_definiciones(clave) on delete cascade,
  otorgado boolean not null default false,
  primary key (rol, permiso_clave)
);

create table if not exists public.usuario_permisos (
  perfil_id uuid not null references public.perfiles(id) on delete cascade,
  permiso_clave text not null references public.permisos_definiciones(clave) on delete cascade,
  otorgado boolean not null default false,
  primary key (perfil_id, permiso_clave)
);

alter table public.permisos_definiciones enable row level security;
alter table public.rol_permisos enable row level security;
alter table public.usuario_permisos enable row level security;

drop policy if exists "ver_permisos_definiciones" on public.permisos_definiciones;
create policy "ver_permisos_definiciones" on public.permisos_definiciones for select to authenticated using (true);

drop policy if exists "ver_rol_permisos" on public.rol_permisos;
create policy "ver_rol_permisos" on public.rol_permisos for select to authenticated using (true);
drop policy if exists "admin_escribe_rol_permisos" on public.rol_permisos;
create policy "admin_escribe_rol_permisos" on public.rol_permisos for all to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)))
  with check (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

drop policy if exists "ver_usuario_permisos" on public.usuario_permisos;
create policy "ver_usuario_permisos" on public.usuario_permisos for select to authenticated using (true);
drop policy if exists "admin_escribe_usuario_permisos" on public.usuario_permisos;
create policy "admin_escribe_usuario_permisos" on public.usuario_permisos for all to authenticated
  using (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)))
  with check (exists (select 1 from public.perfiles p where p.id = auth.uid() and 'admin' = any(p.roles)));

-- Seed: mismos 21 permisos que tiene v1 hoy en su base real (consultados
-- directamente, no había SQL de origen commiteado — se corrió una sola vez
-- y se borró, mismo patrón que otros seeds de este proyecto).
insert into public.permisos_definiciones (clave, nombre, descripcion, categoria) values
  ('usuarios.gestionar', 'Gestionar equipo', 'Crear/editar/eliminar colaboradores', 'Administración'),
  ('crm.ver_todos_los_leads', 'Ver todos los leads', 'No solo los propios, todo el CRM', 'CRM'),
  ('crm.reasignar_leads', 'Reasignar leads', 'Cambiar el vendedor asignado a un lead', 'CRM'),
  ('crm.eliminar_leads', 'Eliminar leads', 'Borrar leads del CRM', 'CRM'),
  ('marketing.ver', 'Ver marketing', 'Acceso a métricas y pautas publicitarias', 'Marketing'),
  ('postventa.eliminar', 'Eliminar casos de postventa', 'Borrar casos cargados', 'Postventa'),
  ('postventa.crear', 'Cargar casos de postventa', 'Registrar service/reclamos/garantías', 'Postventa'),
  ('vehiculos.eliminar', 'Eliminar vehículos', 'Borrar unidades del stock', 'Stock'),
  ('vehiculos.crear', 'Crear vehículo nuevo', 'Dar de alta un auto nuevo en el stock', 'Stock'),
  ('vehiculos.editar_completo', 'Editar ficha completa del vehículo', 'Editar specs, precios y datos legales (no solo fotos)', 'Stock'),
  ('vehiculos.ver_costo', 'Ver precio de costo', 'Ver el precio de costo oculto del vehículo', 'Stock'),
  ('gastos.crear', 'Cargar gastos', 'Registrar movimientos de caja', 'Tesorería'),
  ('gastos.eliminar', 'Eliminar gastos', 'Borrar movimientos de caja', 'Tesorería'),
  ('tesoreria.ver', 'Ver tesorería', 'Acceso a reportes financieros globales', 'Tesorería'),
  ('liquidaciones.gestionar', 'Liquidar sueldos', 'Generar y ver liquidaciones de empleados', 'Tesorería'),
  ('boletos.eliminar', 'Eliminar ventas', 'Borrar boletos cargados', 'Ventas'),
  ('presupuestos.eliminar', 'Eliminar presupuestos', 'Borrar presupuestos cargados', 'Ventas'),
  ('senas.eliminar', 'Eliminar señas', 'Borrar señas cargadas', 'Ventas'),
  ('senas.crear', 'Cargar señas', 'Registrar nuevas señas', 'Ventas'),
  ('presupuestos.crear', 'Cargar presupuestos', 'Registrar nuevos presupuestos', 'Ventas'),
  ('boletos.crear', 'Cargar ventas', 'Registrar boletos de compraventa', 'Ventas')
on conflict (clave) do nothing;

-- admin siempre tiene todo en la UI (hardcodeado, igual que v1) -- estos
-- son los únicos grants reales que v1 tenía cargados hoy en su base.
insert into public.rol_permisos (rol, permiso_clave, otorgado) values
  ('admin', 'vehiculos.crear', true),
  ('admin', 'vehiculos.editar_completo', true),
  ('admin', 'vehiculos.ver_costo', true)
on conflict (rol, permiso_clave) do nothing;
