-- Bug encontrado por el usuario (30/9): Cecilia Cordoba (rol "gestoria", no
-- vendedora) aparecía en "Ranking de velocidad", "Clientes por Vendedor" y
-- "Operaciones por Vendedor" en Reportes, junto a los vendedores reales.
--
-- Causa: las 4 vistas que arman estos rankings hacen "FROM perfiles p ...
-- WHERE p.activo = true" -- sin filtrar por rol. Cualquier perfil activo
-- (gestoría, finanzas, taller, etc.) entra igual, aunque nunca tenga un
-- cliente/venta/cotización asignada -- por eso aparecía siempre en 0, no es
-- que Cecilia haya recibido leads de verdad, es que la vista lista a TODOS
-- los perfiles activos como si fueran vendedores.
--
-- Fix: agregar el mismo filtro de roles que ya se usa en el resto del panel
-- (ver comisiones/page.tsx, permisos #19 de la auditoría del 24/9) --
-- roles && ARRAY['ventas','encargado','admin'] -- admin se incluye porque
-- puede terminar como vendedor_id de fallback en el round-robin.
--
-- Correr una vez en el SQL editor de Supabase y borrar este archivo del
-- repo después (mismo criterio que el resto de migraciones/*.sql).

CREATE OR REPLACE VIEW v_reportes_clientes_por_vendedor AS
SELECT p.id AS vendedor_id,
    p.nombre AS vendedor_nombre,
    count(c.id) AS clientes
FROM perfiles p
    LEFT JOIN clientes c ON c.vendedor_id = p.id
WHERE p.activo = true AND p.roles && ARRAY['ventas','encargado','admin']
GROUP BY p.id, p.nombre
ORDER BY (count(c.id)) DESC;

CREATE OR REPLACE VIEW v_reportes_cotizaciones_por_vendedor AS
SELECT p.id AS vendedor_id,
    p.nombre AS vendedor_nombre,
    count(c.id) AS cotizaciones
FROM perfiles p
    JOIN cotizaciones c ON c.vendedor_id = p.id
WHERE p.roles && ARRAY['ventas','encargado','admin']
GROUP BY p.id, p.nombre
ORDER BY (count(c.id)) DESC;

CREATE OR REPLACE VIEW v_reportes_operaciones_por_vendedor AS
SELECT p.id AS vendedor_id,
    p.nombre AS vendedor_nombre,
    COALESCE(sum(vp.peso) FILTER (WHERE vp.estado = 'cerrada'::text AND date_trunc('month'::text, vp.fecha_cierre::timestamp with time zone) = date_trunc('month'::text, now())), 0::numeric) AS ventas_mes
FROM perfiles p
    LEFT JOIN v_ventas_ponderadas vp ON vp.vendedor_id = p.id
WHERE p.activo = true AND p.roles && ARRAY['ventas','encargado','admin']
GROUP BY p.id, p.nombre
ORDER BY (COALESCE(sum(vp.peso) FILTER (WHERE vp.estado = 'cerrada'::text AND date_trunc('month'::text, vp.fecha_cierre::timestamp with time zone) = date_trunc('month'::text, now())), 0::numeric)) DESC;

CREATE OR REPLACE VIEW v_reportes_ranking_velocidad AS
WITH primer_contacto AS (
    SELECT ca.cliente_id,
        min(ca.created_at) AS contactado_en
    FROM cliente_actividades ca
    WHERE ca.tipo = 'llamada'::text AND ca.descripcion = 'Primer contacto (automático)'::text
    GROUP BY ca.cliente_id
), tiempos AS (
    SELECT c.vendedor_id,
        c.id AS cliente_id,
        c.created_at,
        pc.contactado_en,
        EXTRACT(epoch FROM pc.contactado_en - c.created_at) / 60::numeric AS minutos_respuesta
    FROM clientes c
        LEFT JOIN primer_contacto pc ON pc.cliente_id = c.id
    WHERE c.vendedor_id IS NOT NULL AND date_trunc('month'::text, c.created_at) = date_trunc('month'::text, now())
)
SELECT p.id AS vendedor_id,
    p.nombre AS vendedor_nombre,
    round(avg(t.minutos_respuesta) FILTER (WHERE t.minutos_respuesta IS NOT NULL)) AS tiempo_medio_minutos,
    round(100.0 * count(*) FILTER (WHERE t.minutos_respuesta IS NOT NULL AND t.minutos_respuesta <= 60::numeric)::numeric / NULLIF(count(*) FILTER (WHERE t.minutos_respuesta IS NOT NULL), 0)::numeric) AS pct_bajo_1h,
    count(*) FILTER (WHERE t.contactado_en IS NOT NULL) AS contactados,
    count(*) FILTER (WHERE t.contactado_en IS NULL) AS sin_contactar,
    COALESCE((SELECT count(*) AS count
        FROM cliente_reasignaciones r
        WHERE r.vendedor_anterior_id = p.id AND date_trunc('month'::text, r.created_at) = date_trunc('month'::text, now())), 0::bigint) AS soltados
FROM perfiles p
    LEFT JOIN tiempos t ON t.vendedor_id = p.id
WHERE p.activo = true AND p.roles && ARRAY['ventas','encargado','admin']
GROUP BY p.id, p.nombre;
