alter table public.leads_tasacion drop constraint if exists leads_tasacion_tipo_check;
alter table public.leads_tasacion add constraint leads_tasacion_tipo_check check (tipo in ('tasacion', 'permuta', 'financiacion'));
