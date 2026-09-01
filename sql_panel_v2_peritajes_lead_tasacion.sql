-- Suma leads_tasacion como tercer origen posible de un peritaje (además de
-- WhatsApp e Instagram) — 100% aditivo, no toca las columnas existentes.

alter table public.peritajes_lead add column if not exists lead_tasacion_id uuid references public.leads_tasacion(id) on delete set null;
create unique index if not exists peritajes_lead_tasacion_unq on public.peritajes_lead(lead_tasacion_id) where lead_tasacion_id is not null;

create or replace function public.crear_peritaje_desde_lead(
  p_cotizacion_id uuid default null,
  p_whatsapp_conversacion_id uuid default null,
  p_instagram_conversacion_id uuid default null,
  p_realizado_por uuid default null,
  p_lead_tasacion_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if (p_cotizacion_id is not null)::int + (p_whatsapp_conversacion_id is not null)::int + (p_instagram_conversacion_id is not null)::int + (p_lead_tasacion_id is not null)::int <> 1 then
    raise exception 'Un peritaje nace de exactamente un lead: cotización, WhatsApp, Instagram o lead de tasación.';
  end if;

  insert into public.peritajes_lead (cotizacion_id, whatsapp_conversacion_id, instagram_conversacion_id, lead_tasacion_id, realizado_por)
  values (p_cotizacion_id, p_whatsapp_conversacion_id, p_instagram_conversacion_id, p_lead_tasacion_id, p_realizado_por)
  returning id into v_id;

  insert into public.peritaje_lead_items (peritaje_id, categoria, item, orden)
  values
    (v_id, 'Motor', 'Estado general', 1),
    (v_id, 'Transmisión', 'Embrague', 2),
    (v_id, 'Transmisión', 'Caja', 3),
    (v_id, 'Transmisión', 'Tren delantero', 4),
    (v_id, 'Electricidad', 'Techo', 5),
    (v_id, 'Electricidad', 'Diversos', 6),
    (v_id, 'Elementos de seguridad', 'Frenos', 7),
    (v_id, 'Elementos de seguridad', 'Suspensión', 8),
    (v_id, 'Elementos de seguridad', 'Dirección', 9),
    (v_id, 'Elementos de seguridad', 'Cinturón de seguridad', 10),
    (v_id, 'Aspecto', 'Chapa', 11),
    (v_id, 'Aspecto', 'Pintura', 12),
    (v_id, 'Aspecto', 'Tapicería', 13),
    (v_id, 'Observaciones', 'Prueba en ruta', 14),
    (v_id, 'Neumáticos', 'Delantero derecho', 15),
    (v_id, 'Neumáticos', 'Delantero izquierdo', 16),
    (v_id, 'Neumáticos', 'Trasero derecho', 17),
    (v_id, 'Neumáticos', 'Trasero izquierdo', 18),
    (v_id, 'Neumáticos', 'Rueda de auxilio', 19);

  if p_lead_tasacion_id is not null then
    update public.leads_tasacion set peritaje_id = v_id, estado = 'en_gestion' where id = p_lead_tasacion_id;
  end if;

  return v_id;
end;
$$;
