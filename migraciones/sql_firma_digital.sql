-- Firma digital: el cliente firma con el dedo en la pantalla (tablet/celu) en
-- vez de firmar en papel. Se guarda como imagen en R2 igual que cualquier
-- otro documento (vía /api/upload-documento, ya existente). Arranca en señas;
-- el mismo componente (FirmaCanvas.tsx) sirve para sumarlo a boletos/resp-civil
-- después con la misma columna en cada tabla.
alter table senas add column if not exists firma_url text;
alter table boletos_venta add column if not exists firma_url text;
