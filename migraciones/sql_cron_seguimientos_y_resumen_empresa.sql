-- Programa los 2 crons nuevos: seguimientos (consignaciones/expedientes/
-- postventa) 1 vez por día, y resumen-empresa cada hora (se autolimita a
-- la hora configurada y a una sola vez por día, ver el código).
select cron.schedule(
  'panel-v2-seguimientos',
  '0 9 * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/seguimientos?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);

select cron.schedule(
  'panel-v2-resumen-empresa',
  '0 * * * *',
  $$
  select net.http_get(
    url := 'https://www.pfaffencars.com/api/cron/panel-v2/resumen-empresa?token=33864dbc0cd53d5b4ce97526401c0fc22ef766f1831f1403'
  );
  $$
);
