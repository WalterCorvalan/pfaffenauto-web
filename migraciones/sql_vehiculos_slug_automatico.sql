-- BUG CRÍTICO: TODOS los vehículos (77 disponibles verificado, probablemente
-- el total del stock) tienen slug = null. Todo link del sitio público a una
-- ficha de auto se arma como `/catalogo/${auto.slug}` (Stock.tsx,
-- favoritos/page.tsx, etc.) -- con slug null en la fila, ese link queda
-- literalmente "/catalogo/null" para CADA auto. Nadie generaba el slug en
-- ningún lado: ni NuevoVehiculoModal, ni ImportarXlsxModal, ni el alta desde
-- permuta, ni /api/panel-v2/vehiculos/crear-incompleto -- se asumía que
-- existía pero nunca se escribió el código que lo crea.
--
-- Fix en dos partes:
--   1. Backfill: generar slug para todo lo que hoy está en null.
--   2. Trigger BEFORE INSERT/UPDATE: si slug queda null, lo genera solo --
--      cubre TODOS los caminos de alta presentes y futuros, sin tener que
--      tocar cada formulario/import uno por uno.
--
-- Formato: marca-modelo-anio-XXXXXX (6 caracteres del id, que es uuid, así
-- que la colisión de slug es prácticamente imposible sin necesitar un loop
-- de "ya existe, probá con -2, -3...").

create or replace function public.generar_slug_vehiculo()
returns trigger
language plpgsql
as $$
declare
  base text;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  base := lower(coalesce(new.marca, '') || '-' || coalesce(new.modelo, '') || '-' || coalesce(new.anio::text, ''));
  -- saca acentos comunes en español
  base := translate(base, 'áéíóúñü', 'aeiounu');
  -- todo lo que no sea letra/número pasa a guión, colapsa guiones repetidos
  base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');
  base := regexp_replace(base, '-+', '-', 'g');
  base := trim(both '-' from base);
  if base = '' then base := 'auto'; end if;

  new.slug := base || '-' || substr(new.id::text, 1, 6);
  return new;
end;
$$;

drop trigger if exists trg_generar_slug_vehiculo on public.vehiculos;
create trigger trg_generar_slug_vehiculo
before insert or update of slug on public.vehiculos
for each row
execute function public.generar_slug_vehiculo();

-- Backfill de lo que ya está en null -- dispara el mismo trigger (UPDATE
-- OF slug con el mismo valor null no lo dispara, así que forzamos con un
-- update real seteando explícitamente a null primero no hace falta: alcanza
-- con recorrer las filas y llamar directo a la función).
update public.vehiculos v
set slug = (
  select trim(both '-' from regexp_replace(regexp_replace(translate(lower(coalesce(v.marca,'') || '-' || coalesce(v.modelo,'') || '-' || coalesce(v.anio::text,'')), 'áéíóúñü', 'aeiounu'), '[^a-z0-9]+', '-', 'g'), '-+', '-', 'g'))
    || '-' || substr(v.id::text, 1, 6)
)
where v.slug is null;
