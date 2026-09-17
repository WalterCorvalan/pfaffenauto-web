-- Módulo Leads: pestaña nueva "Lead basura" (leads fríos/sin calificar que
-- nadie -- ni la IA ni un vendedor -- respondió en 2+ días, o que un
-- vendedor mandó ahí a mano porque el lead era irrelevante). Además de la
-- regla automática (calculada en el cliente contra last_message_at +
-- dirección del último mensaje), un vendedor puede mandarlo ahí a mano en
-- cualquier momento -- para eso hace falta un flag persistido, la regla
-- automática sola no cubre "esto es basura ahora, sin esperar 2 días".
alter table public.whatsapp_conversaciones add column if not exists es_basura boolean not null default false;
alter table public.instagram_conversaciones add column if not exists es_basura boolean not null default false;
alter table public.rodi_conversaciones add column if not exists es_basura boolean not null default false;
alter table public.leads_manuales add column if not exists es_basura boolean not null default false;
