-- Carga fotos ilustrativas (Unsplash, uso libre) a los vehículos ficticios de
-- QA que no tenían imagen. 2 fotos por auto: exterior (según categoría de
-- carrocería) + interior genérico. Solo toca los ficticios reales por
-- patente — no toca "Nissan Kicks" (ya tiene foto real cargada) ni las filas
-- QA-* de testing.

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1756664825749-d481c5a94a57?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'SI700TL'; -- Toyota Yaris XLS (hatchback)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1756664825749-d481c5a94a57?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'SJ915ZV'; -- VW Gol Trend Trendline (hatchback)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'DK235TF'; -- Jeep Compass Longitude (SUV)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'AD397QQ'; -- Nissan Kicks Exclusive (SUV)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'ME176RT'; -- Honda HR-V EX (SUV)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1756664825749-d481c5a94a57?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'QX889FH'; -- Peugeot 208 Feline (hatchback)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'HW771WV'; -- Renault Duster Iconic (SUV)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1756664825749-d481c5a94a57?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'LV955AH'; -- Renault Sandero Life (hatchback)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1761019646882-e898aea8017c?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'SN816RZ'; -- Fiat Toro Freedom 4x4 (pickup)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1756664825749-d481c5a94a57?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'EP127IO'; -- Chevrolet Onix Joy Plus (hatchback)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1567784431148-dbcd19d0ddce?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'KS887QE'; -- Chevrolet Cruze LTZ (sedán)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'RI959CL'; -- Ford EcoSport Titanium (SUV)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1761019646882-e898aea8017c?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'GW646MK'; -- Ford Ranger XLT (pickup)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1567784431148-dbcd19d0ddce?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'JY389UB'; -- VW Vento GLI (sedán)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1567784431148-dbcd19d0ddce?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'MM167JV'; -- Toyota Corolla XEI (sedán)

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1761019646882-e898aea8017c?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente = 'UO445VO'; -- Toyota Hilux SRX 4x4 (pickup)
