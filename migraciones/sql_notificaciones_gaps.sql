-- 4 eventos importantes que hoy no generaban ninguna notificación:
-- 1) saldo de cuenta queda en negativo, 2) comisión generada/anulada,
-- 3) lead se convierte en cliente, 4) peritaje completado.

-- 1) Saldo de cuenta en negativo ---------------------------------------
-- Solo se chequea en egresos (los ingresos no pueden empeorar el saldo).
-- Puede repetirse si hay varios egresos seguidos en negativo -- se
-- prefiere sobre-avisar a que se pierda un caso real.
create or replace function public.movimientos_caja_notificar_saldo_negativo()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_saldo numeric;
  v_cuenta_nombre text;
  v_destinatario_id uuid;
begin
  if new.tipo <> 'egreso' or new.deleted_at is not null then return new; end if;

  v_saldo := public.saldo_cuenta(new.cuenta_id);
  if v_saldo is null or v_saldo >= 0 then return new; end if;

  select nombre into v_cuenta_nombre from public.cuentas where id = new.cuenta_id;

  for v_destinatario_id in select id from public.perfiles where activo = true and (roles && array['admin', 'finanzas']) loop
    insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
    values (v_destinatario_id, 'saldo_negativo', 'Saldo en negativo en ' || coalesce(v_cuenta_nombre, 'una caja') || ': ' || v_saldo::text, '/panel/finanzas?tab=cuentas', 'alta');
  end loop;

  return new;
end;
$function$;

drop trigger if exists trg_movimientos_caja_notificar_saldo_negativo on public.movimientos_caja;
create trigger trg_movimientos_caja_notificar_saldo_negativo
after insert on public.movimientos_caja
for each row execute function public.movimientos_caja_notificar_saldo_negativo();

-- 2) Comisión generada / anulada al vendedor -----------------------------
create or replace function public.comisiones_notificar_beneficiario()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if tg_op = 'INSERT' then
    if new.beneficiario_id is not null then
      insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
      values (new.beneficiario_id, 'comision_generada', 'Se generó una comisión — ' || new.moneda || ' ' || new.monto::text, '/panel/comisiones', 'media');
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.estado = 'anulada' and old.estado is distinct from 'anulada' then
    if new.beneficiario_id is not null then
      insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
      values (new.beneficiario_id, 'comision_anulada', 'Se anuló una comisión — ' || new.moneda || ' ' || new.monto::text, '/panel/comisiones', 'alta');
    end if;
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_comisiones_notificar_beneficiario on public.comisiones;
create trigger trg_comisiones_notificar_beneficiario
after insert or update on public.comisiones
for each row execute function public.comisiones_notificar_beneficiario();

-- 3) Lead convertido a cliente --------------------------------------------
create or replace function public.clientes_notificar_convertido()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.estado_relacion = 'cliente' and old.estado_relacion is distinct from 'cliente' and new.vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
    values (new.vendedor_id, 'lead_convertido', coalesce(new.nombre, 'Un lead') || ' se convirtió en cliente 🎉', '/panel/clientes', 'media');
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_clientes_notificar_convertido on public.clientes;
create trigger trg_clientes_notificar_convertido
after update on public.clientes
for each row execute function public.clientes_notificar_convertido();

-- 4) Peritaje completado ---------------------------------------------------
create or replace function public.peritaje_notificar_completado()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_vendedor_id uuid;
begin
  if new.estado <> 'Completado' or old.estado is not distinct from 'Completado' then return new; end if;

  if new.whatsapp_conversacion_id is not null then
    select vendedor_id into v_vendedor_id from public.whatsapp_conversaciones where id = new.whatsapp_conversacion_id;
  elsif new.instagram_conversacion_id is not null then
    select vendedor_id into v_vendedor_id from public.instagram_conversaciones where id = new.instagram_conversacion_id;
  end if;

  if v_vendedor_id is not null then
    insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
    values (v_vendedor_id, 'peritaje_completado', 'Se completó un peritaje' || (case when new.puntaje is not null then ' — puntaje ' || new.puntaje::text else '' end), '/panel/peritajes/' || new.id, 'media');
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_peritaje_notificar_completado on public.peritajes_lead;
create trigger trg_peritaje_notificar_completado
after update on public.peritajes_lead
for each row execute function public.peritaje_notificar_completado();
