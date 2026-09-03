alter table public.configuracion_empresa
  add column if not exists branding_nombre text,
  add column if not exists branding_domicilio text,
  add column if not exists branding_telefono text,
  add column if not exists branding_cuit text,
  add column if not exists resumen_diario_activo boolean not null default true,
  add column if not exists resumen_diario_hora numeric not null default 8 check (resumen_diario_hora between 0 and 23),
  add column if not exists resumen_diario_dias_expediente_atrasado numeric not null default 15,
  add column if not exists resumen_diario_nombre text,
  add column if not exists resumen_diario_whatsapp_activo boolean not null default false,
  add column if not exists resumen_diario_telefono_dueno text,
  add column if not exists resumen_diario_plantilla_meta text not null default 'resumen_diario',
  add column if not exists resumen_diario_idioma text not null default 'es';
