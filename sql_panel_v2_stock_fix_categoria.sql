-- Fix (2026-09-03, a pedido): alinear las categorías de vehículo de v2 con
-- las de v1 (Auto/Pickup-Camioneta/SUV/Utilitario) — v2 tenía Auto/Camioneta/
-- SUV/Moto/Otro, un set distinto que además el bot de WhatsApp usa para
-- filtrar stock por tipo. Sin datos en Moto/Otro actualmente — solo hay
-- que migrar Camioneta → Pickup/Camioneta.

alter table public.vehiculos drop constraint if exists vehiculos_categoria_check;

update public.vehiculos set categoria = 'Pickup/Camioneta' where categoria = 'Camioneta';

alter table public.vehiculos add constraint vehiculos_categoria_check
  check (categoria in ('Auto', 'Pickup/Camioneta', 'SUV', 'Utilitario'));
