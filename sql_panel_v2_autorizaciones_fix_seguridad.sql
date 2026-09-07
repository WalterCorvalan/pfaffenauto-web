-- Fix de seguridad: resolver_autorizacion() era security definer sin ningun
-- chequeo de rol adentro -- el frontend esconde Aprobar/Rechazar a quien no
-- es admin, pero cualquier usuario autenticado podia llamar la RPC directo
-- (ej. desde la consola del navegador) y aprobar/rechazar sin PIN cualquier
-- solicitud con requiere_pin = false. Ahora el permiso se valida server-side:
-- admin siempre puede resolver; un no-admin solo puede APROBAR (nunca
-- rechazar) y solo si la solicitud pide PIN y el PIN es valido.
create or replace function public.resolver_autorizacion(p_id uuid, p_aprobar boolean, p_motivo text default null, p_pin text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fila public.autorizaciones;
  v_pin_perfil_id uuid;
  v_soy_admin boolean;
begin
  select exists (
    select 1 from public.perfiles where id = auth.uid() and 'admin' = any(roles)
  ) into v_soy_admin;

  select * into v_fila from public.autorizaciones where id = p_id for update;
  if v_fila is null then
    raise exception 'Solicitud no encontrada.';
  end if;
  if v_fila.estado <> 'pendiente' then
    raise exception 'Esta solicitud ya fue resuelta.';
  end if;

  if p_aprobar and v_fila.requiere_pin then
    if p_pin is null then
      raise exception 'Esta solicitud requiere PIN de administrador.';
    end if;
    v_pin_perfil_id := public.verificar_autorizacion_pin(p_pin);
    if v_pin_perfil_id is null then
      raise exception 'PIN inválido.';
    end if;
  end if;

  -- Permiso: admin siempre; no-admin solo si aprueba con PIN ya validado
  -- arriba (v_pin_perfil_id no nulo). Rechazar queda reservado a admin.
  if not v_soy_admin and not (p_aprobar and v_pin_perfil_id is not null) then
    raise exception 'No tenés permiso para resolver esta autorización.';
  end if;

  if v_pin_perfil_id is not null then
    insert into public.autorizaciones_pin_usos (autorizacion_id, pin_de_perfil_id, usado_por)
    values (p_id, v_pin_perfil_id, auth.uid());
  end if;

  if p_aprobar then
    perform public.aplicar_autorizacion(v_fila);
  end if;

  update public.autorizaciones
  set estado = case when p_aprobar then 'aprobada' else 'rechazada' end,
      motivo_rechazo = case when p_aprobar then null else p_motivo end,
      resuelto_por = auth.uid(),
      resuelto_en = now()
  where id = p_id;
end;
$$;
