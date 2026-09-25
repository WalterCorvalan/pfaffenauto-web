-- El cron "resumen-empresa" (corría cada hora, mandaba una alerta aparte
-- "Resumen del día — fecha" solo a admins) se fusionó dentro de "mi-resumen"
-- (corre 1 vez por día, 8am ARG) -- ahora es una sola alerta por persona.
-- Este job ya no debe correr más; el endpoint que llamaba fue borrado.
select cron.unschedule('panel-resumen-empresa');
