-- Fix: reasignar_leads_vencidos no tenía tope — un lead que nadie contesta
-- se reasigna cada 10 min PARA SIEMPRE, generando una alerta nueva cada
-- ciclo (con solo 2-3 vendedores disponibles, termina rebotando entre ellos
-- en loop infinito). Le sumamos un máximo de reasignaciones por lead; al
-- llegar al tope, deja de rotar vendedores y avisa una sola vez a
-- encargados/admin en vez de seguir generando ruido.

alter table public.clientes add column if not exists reasignacion_tope_alertada boolean not null default false;

create or replace function public.reasignar_leads_vencidos(umbral_minutos int default 60, max_reasignaciones int default 3)
returns int
language plpgsql
as $$
declare
  fila record;
  candidato uuid;
  total int := 0;
  v_reasignaciones_previas int;
  v_encargado record;
begin
  for fila in
    select c.id, c.vendedor_id, c.canal_ingreso, c.created_at, c.reasignacion_tope_alertada
    from public.clientes c
    where c.pipeline_stage = 'sin_contactar'
      and c.vendedor_id is not null
      and coalesce(c.ultima_reasignacion_en, c.created_at) < now() - (umbral_minutos || ' minutes')::interval
  loop
    select count(*) into v_reasignaciones_previas from public.cliente_reasignaciones where cliente_id = fila.id;

    if v_reasignaciones_previas >= max_reasignaciones then
      -- Tope alcanzado: no rota más vendedores. Avisa a encargados UNA sola
      -- vez (no repite en cada corrida del cron).
      if not fila.reasignacion_tope_alertada then
        for v_encargado in select id from public.perfiles where ('encargado' = any(roles) or 'admin' = any(roles)) and activo = true loop
          insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
          values (v_encargado.id, 'cliente', 'alta', 'Lead sin contactar tras varias reasignaciones', 'Ya se reasignó ' || v_reasignaciones_previas || ' veces y sigue sin respuesta — necesita seguimiento manual.', '/panel-v2/clientes');
        end loop;
        update public.clientes set reasignacion_tope_alertada = true where id = fila.id;
      end if;
      continue;
    end if;

    select p.id into candidato
    from public.perfiles p
    left join public.disponibilidad_vendedor d on d.vendedor_id = p.id
    left join lateral (
      select max(cl.created_at) as ultimo
      from public.clientes cl
      where cl.vendedor_id = p.id and cl.canal_ingreso = fila.canal_ingreso
    ) u on true
    where p.activo = true
      and p.id <> fila.vendedor_id
      and (d.recibir_leads is null or d.recibir_leads = true)
    order by u.ultimo asc nulls first
    limit 1;

    if candidato is not null then
      insert into public.cliente_reasignaciones (cliente_id, vendedor_anterior_id, vendedor_nuevo_id)
      values (fila.id, fila.vendedor_id, candidato);

      update public.clientes
      set vendedor_id = candidato, ultima_reasignacion_en = now()
      where id = fila.id;

      insert into public.alertas (destinatario_id, tipo, prioridad, titulo, mensaje, link)
      values (candidato, 'cliente', 'novedad', 'Te reasignaron un lead sin contactar', 'Pasó ' || umbral_minutos || ' minutos sin respuesta con el vendedor anterior.', '/panel-v2/clientes');

      total := total + 1;
    end if;
  end loop;

  return total;
end;
$$;

-- pipeline_stage_manual=true (contactado a mano) o cambio de estado ya
-- resetea el flag solo, para que si vuelve a "sin_contactar" en el futuro
-- (poco probable pero por las dudas) el tope se pueda volver a activar.
create or replace function public.resetear_tope_reasignacion()
returns trigger
language plpgsql
as $$
begin
  if new.pipeline_stage <> 'sin_contactar' and old.pipeline_stage = 'sin_contactar' then
    new.reasignacion_tope_alertada := false;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_resetear_tope_reasignacion on public.clientes;
create trigger trg_resetear_tope_reasignacion
  before update of pipeline_stage on public.clientes
  for each row execute function public.resetear_tope_reasignacion();
