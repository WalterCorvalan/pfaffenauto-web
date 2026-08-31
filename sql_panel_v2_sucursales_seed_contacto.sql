-- Carga la dirección real (confirmada por Google Maps), teléfono de la
-- sucursal (el mismo que ya usa el sitio público) y link de Maps.

update public.sucursales set
  direccion = 'Av. del Libertador Gral. San Martín 2067, C1614 Villa de Mayo, Buenos Aires',
  telefono_encargado = '011 3756-4398',
  google_maps_url = 'https://maps.app.goo.gl/366kNJebnDFRUGySA'
where nombre = 'Casa Central';

update public.sucursales set
  direccion = 'Colectora Este 1717, B1611 Don Torcuato, Buenos Aires',
  telefono_encargado = '011 5799-8065',
  google_maps_url = 'https://maps.app.goo.gl/my2Y2vhGHKMyCCNR8'
where nombre = 'Don Torcuato';
