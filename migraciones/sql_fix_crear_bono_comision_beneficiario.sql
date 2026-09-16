-- Bug encontrado en la auditoría de código del módulo Comisiones: un
-- vendedor no-admin puede pedir un bono (BonoModal.tsx fuerza
-- beneficiario_id = auth.uid() del lado del cliente), pero la función
-- crear_bono_comision() toma p_beneficiario_id tal cual viene del caller
-- sin validar del lado del servidor que coincida con auth.uid() cuando
-- quien llama no es admin/finanzas. El frontend oculta el selector de
-- beneficiario para no-admins, pero eso no es un control real -- un
-- llamado directo al RPC (devtools, curl con el token de sesión) podría
-- pedir un bono "pendiente de aprobación" a nombre de otro perfil.
--
-- Se agrega la validación server-side que faltaba: si quien llama no es
-- admin/finanzas, se ignora el p_beneficiario_id recibido y se usa
-- siempre auth.uid() -- mismo criterio que ya aplica el resto de la
-- función para aprobacion_pendiente/solicitado_por.
create or replace function public.crear_bono_comision(p_beneficiario_id uuid, p_concepto text, p_monto numeric, p_moneda text DEFAULT 'USD'::text)
 returns uuid
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_soy_admin boolean;
  v_beneficiario_id uuid;
  v_id uuid;
  v_encargado record;
begin
  select exists(select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) into v_soy_admin;

  v_beneficiario_id := case when v_soy_admin then p_beneficiario_id else auth.uid() end;

  insert into public.comisiones (beneficiario_id, tipo, concepto, monto, moneda, creado_por, aprobacion_pendiente, solicitado_por)
  values (v_beneficiario_id, 'bono', p_concepto, p_monto, p_moneda, auth.uid(), not v_soy_admin, case when v_soy_admin then null else auth.uid() end)
  returning id into v_id;

  if not v_soy_admin then
    for v_encargado in select id from public.perfiles where ('admin' = any(roles) or 'finanzas' = any(roles)) and activo = true loop
      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
      values (v_encargado.id, 'comision_bono_pedido', 'media', 'Pidieron un bono/comisión manual', '/panel/comisiones');
    end loop;
  end if;

  return v_id;
end;
$function$;
