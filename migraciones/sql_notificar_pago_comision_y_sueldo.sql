-- El trigger de comisiones (sql_notificaciones_gaps.sql) solo avisaba al
-- generarse o anularse -- nada avisaba cuando efectivamente se le PAGABA
-- (estado -> 'cobrada') o se le revertía el pago (estado -> 'pendiente'
-- de vuelta). El vendedor tenía que entrar solo a revisar. Y liquidaciones
-- de sueldo no tenía NINGÚN trigger de notificación.

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

  if tg_op = 'UPDATE' and new.estado = 'cobrada' and old.estado is distinct from 'cobrada' then
    if new.beneficiario_id is not null then
      insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
      values (new.beneficiario_id, 'comision_pagada', 'Te pagaron una comisión — ' || new.moneda || ' ' || new.monto::text, '/panel/comisiones', 'media');
    end if;
  end if;

  if tg_op = 'UPDATE' and old.estado = 'cobrada' and new.estado is distinct from 'cobrada' then
    if new.beneficiario_id is not null then
      insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
      values (new.beneficiario_id, 'comision_pago_revertido', 'Se revirtió el pago de una comisión — ' || new.moneda || ' ' || new.monto::text, '/panel/comisiones', 'alta');
    end if;
  end if;

  return new;
end;
$function$;

-- (el trigger ya existe con este nombre desde sql_notificaciones_gaps.sql,
-- solo se reemplaza la función)

create or replace function public.liquidaciones_sueldo_notificar_pago()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.estado = 'pagada' and old.estado is distinct from 'pagada' then
    if new.perfil_id is not null then
      insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
      values (new.perfil_id, 'sueldo_pagado', 'Se pagó tu liquidación de sueldo — ' || coalesce(new.moneda_total, '') || ' ' || coalesce(new.total_final::text, ''), '/panel/mi-espacio', 'media');
    end if;
  end if;

  if old.estado = 'pagada' and new.estado is distinct from 'pagada' then
    if new.perfil_id is not null then
      insert into public.alertas (destinatario_id, tipo, titulo, link, prioridad)
      values (new.perfil_id, 'sueldo_pago_revertido', 'Se revirtió el pago de tu liquidación de sueldo', '/panel/mi-espacio', 'alta');
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists trg_liquidaciones_sueldo_notificar_pago on public.liquidaciones_sueldo;
create trigger trg_liquidaciones_sueldo_notificar_pago
after update on public.liquidaciones_sueldo
for each row execute function public.liquidaciones_sueldo_notificar_pago();
