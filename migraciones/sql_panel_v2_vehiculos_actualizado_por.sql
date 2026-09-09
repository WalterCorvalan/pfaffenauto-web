-- Quién hizo la última edición de la ficha del vehículo -- "creado_por" ya
-- existe pero es el que lo dio de alta, no quién lo tocó por última vez.

alter table vehiculos
  add column if not exists actualizado_por uuid references perfiles(id);

comment on column vehiculos.actualizado_por is
  'Último usuario que editó la ficha (se pisa en cada guardado, distinto de creado_por que es el alta original).';
