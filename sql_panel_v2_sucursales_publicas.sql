create or replace function public.sucursales_publicas()
returns table (id uuid, nombre text)
language sql
security definer
set search_path = public
as $$
  select id, nombre from public.sucursales order by nombre;
$$;

grant execute on function public.sucursales_publicas() to anon, authenticated;
