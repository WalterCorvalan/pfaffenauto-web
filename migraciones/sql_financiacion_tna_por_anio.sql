-- TNA agrupada por año del vehículo además de por plazo (pedido de la
-- reunión del 22/9). Antes financiacion_tna era un objeto plano
-- {"12": 76, ...} (una sola tasa por plazo, sin importar el año). Ahora es
-- un array de grupos por rango de años, cada uno con su propia tabla de
-- tasas por plazo: [{"anioDesde": 0, "anioHasta": 9999, "tna": {"12": 76, ...}}].
--
-- Convierte el valor existente (si sigue en el formato viejo) envolviéndolo
-- en un único grupo que cubre todos los años -- no se pierde ningún valor
-- ya cargado, el admin lo separa en más rangos desde Financiaciones >
-- Configuración cuando quiera.
update public.configuracion_empresa
set financiacion_tna = jsonb_build_array(
  jsonb_build_object('anioDesde', 0, 'anioHasta', 9999, 'tna', financiacion_tna)
)
where jsonb_typeof(financiacion_tna) = 'object';

alter table public.configuracion_empresa
  alter column financiacion_tna set default '[
    {"anioDesde": 0, "anioHasta": 9999, "tna": {"12": 76, "18": 70, "24": 65, "36": 60, "48": 57}}
  ]'::jsonb;
