-- Financiaciones: asignar un vendedor a cada solicitud, para que no queden
-- "sueltas" en la lista sin nadie responsable de hacerles seguimiento.
-- Reutiliza leads_tasacion (misma tabla de Cotizaciones/Peritajes), agregando
-- la misma columna que ya tiene "cotizaciones".

alter table public.leads_tasacion
  add column if not exists vendedor_id uuid references public.perfiles(id);
