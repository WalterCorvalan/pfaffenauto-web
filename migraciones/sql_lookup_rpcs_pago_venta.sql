select proname, pg_get_functiondef(oid) as definicion
from pg_proc
where proname in ('registrar_pago_comprador_venta', 'registrar_extra_cobrado_venta', 'registrar_pago_vendedor_venta')
and pronamespace = 'public'::regnamespace;
