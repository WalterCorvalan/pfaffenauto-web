-- El cron cheques-alerta-vencimiento comparaba fecha_cobro = hoy+3 exacto:
-- se perdía el aviso si el cheque se cargó con menos de 3 días de plazo, si
-- el cron no corrió justo ese día, o si el cheque ya venció. Se pasa a un
-- rango (<= hoy+3) con estos dos flags para no re-avisar todos los días.
alter table cheques add column if not exists aviso_vencimiento_enviado boolean not null default false;
alter table cheques add column if not exists aviso_vencido_enviado boolean not null default false;
