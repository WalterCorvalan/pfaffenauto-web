-- Programa los 2 crons nuevos: seguimientos (consignaciones/expedientes/
-- postventa) 1 vez por día, y resumen-empresa cada hora (se autolimita a
-- la hora configurada y a una sola vez por día, ver el código).
select cron.schedule(
  'panel-v2-seguimientos',
  '0 9 * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/seguimientos?token=b3ec90977565359e55e1a6e9b55f092ecec20fe255d90cef602a05448b5e2863'
  );
  $$
);

select cron.schedule(
  'panel-v2-resumen-empresa',
  '0 * * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/resumen-empresa?token=b3ec90977565359e55e1a6e9b55f092ecec20fe255d90cef602a05448b5e2863'
  );
  $$
);
