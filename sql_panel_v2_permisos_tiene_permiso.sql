-- El RPC tiene_permiso ya existía en el proyecto Supabase de v1 (single
-- rol por perfil) pero nunca se creó en Supabase2 (v2, perfil con VARIOS
-- roles a la vez). PermisosTab.tsx ya lee/escribe permisos_definiciones,
-- rol_permisos y usuario_permisos acá -- solo faltaba esta función para
-- poder consultarlos desde el cliente (lib/permisos.ts).
--
-- Mismo criterio que defaultParaRoles() en PermisosTab.tsx: admin siempre
-- true; excepción por usuario pisa todo; si no, alcanza con que UNO de
-- los roles del perfil otorgue el permiso.
create or replace function public.tiene_permiso(uid uuid, clave_permiso text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_roles text[];
  v_excepcion boolean;
begin
  select roles into v_roles from public.perfiles where id = uid;
  if v_roles is null then
    return false;
  end if;
  if 'admin' = any(v_roles) then
    return true;
  end if;

  select otorgado into v_excepcion from public.usuario_permisos where perfil_id = uid and permiso_clave = clave_permiso;
  if v_excepcion is not null then
    return v_excepcion;
  end if;

  return exists(
    select 1 from public.rol_permisos
    where permiso_clave = clave_permiso and otorgado = true and rol = any(v_roles)
  );
end;
$$;
