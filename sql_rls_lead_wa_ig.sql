-- La tarea de WhatsApp que creaste no aparecía en /panel/crm/tareas: existe en
-- la tabla (confirmado con service role) pero RLS la esconde para el usuario
-- logueado normal — las políticas existentes de estas tablas fueron escritas
-- pensando solo en cotizacion_id, y quedan ciegas a whatsapp_conversacion_id /
-- instagram_conversacion_id. Agregamos una política adicional (permisiva, se
-- suma con OR a la que ya existe, no la reemplaza) que habilita esos casos
-- para cualquier usuario logueado del staff.

do $$
declare
  t text;
begin
  foreach t in array array['tareas_lead', 'test_drives', 'eventos_lead', 'presupuestos', 'senas', 'boletos_venta', 'peritajes']
  loop
    execute format(
      'drop policy if exists "staff_acceso_lead_wa_ig" on %I',
      t
    );
    execute format(
      'create policy "staff_acceso_lead_wa_ig" on %I for all to authenticated using (whatsapp_conversacion_id is not null or instagram_conversacion_id is not null) with check (whatsapp_conversacion_id is not null or instagram_conversacion_id is not null)',
      t
    );
  end loop;
end $$;
