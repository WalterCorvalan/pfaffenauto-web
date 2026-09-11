-- Notificaciones de Mi Espacio: calendario personal (espacio_eventos) y
-- vencimientos de autos personales (espacio_autos_personales) -- hoy se
-- cargan los datos pero nada los usa para avisar. Estas columnas evitan
-- volver a notificar lo mismo cada vez que corre el cron.

alter table public.espacio_eventos add column if not exists recordatorio_enviado boolean not null default false;

-- Se guarda la FECHA de vencimiento que ya se avisó (no un booleano simple):
-- si el usuario actualiza vence_vtv a una fecha nueva (renovó), el valor
-- guardado deja de coincidir y se vuelve a avisar para la fecha nueva.
alter table public.espacio_autos_personales add column if not exists vtv_avisado_fecha date;
alter table public.espacio_autos_personales add column if not exists seguro_avisado_fecha date;
alter table public.espacio_autos_personales add column if not exists patente_avisado_fecha date;
