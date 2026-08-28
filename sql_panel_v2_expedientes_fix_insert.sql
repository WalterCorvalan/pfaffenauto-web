-- Fix: el trigger de auto-apertura de expediente solo escuchaba UPDATE OF
-- estado en ventas, pero "Carga manual" (NuevaVentaModal) inserta la venta
-- ya en estado 'cerrada' directo — el trigger nunca corría y el frontend
-- compensaba con un insert pelado del expediente (sin hitos ni alerta al
-- gestor). Ahora corre también en INSERT.

create or replace function public.abrir_expediente_al_cerrar_venta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expediente_id uuid;
begin
  if new.estado = 'cerrada'
     and (tg_op = 'INSERT' or old.estado is distinct from 'cerrada')
     and new.abre_expediente = true then
    insert into public.expedientes (venta_id, tipo, estado, gestor_asignado_id, creado_por)
    values (new.id, 'venta', 'abierto', new.gestor_asignado_id, new.vendedor_id)
    on conflict (venta_id) do nothing
    returning id into v_expediente_id;

    if v_expediente_id is not null then
      insert into public.expediente_hitos (expediente_id, nombre, orden)
      values
        (v_expediente_id, 'Datos de las partes cargados', 1),
        (v_expediente_id, 'Boleto generado', 2),
        (v_expediente_id, 'Documentación completa', 3),
        (v_expediente_id, 'Transferencia iniciada', 4),
        (v_expediente_id, 'Transferencia finalizada', 5);

      if new.gestor_asignado_id is not null then
        insert into public.alertas (destinatario_id, tipo, prioridad, titulo, link)
        values (new.gestor_asignado_id, 'expediente_nuevo', 'media', 'Nuevo expediente para gestionar', '/panel/expedientes?venta=' || new.id);
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_abrir_expediente on public.ventas;
create trigger trg_abrir_expediente
  after insert or update of estado on public.ventas
  for each row execute function public.abrir_expediente_al_cerrar_venta();
