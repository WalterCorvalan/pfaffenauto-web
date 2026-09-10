select event_object_table as tabla, trigger_name
from information_schema.triggers
where trigger_schema = 'public'
and trigger_name in (
  'trg_mensajes_notificar_nuevo',
  'trg_movimientos_caja_notificar_saldo_negativo',
  'trg_comisiones_notificar_beneficiario',
  'trg_clientes_notificar_convertido',
  'trg_peritaje_notificar_completado'
);
