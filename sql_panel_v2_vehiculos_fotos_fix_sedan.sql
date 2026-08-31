-- Corrige la foto de sedán: la primera elegida era en realidad una foto de
-- un estacionamiento lleno de autos (mal verificada). Reemplaza por una
-- foto real de un sedán (BMW serie 5 blanco) en los 3 autos que la usan.

update public.vehiculos set fotos = array[
  'https://images.unsplash.com/photo-1567784431148-dbcd19d0ddce?w=1200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1678305346329-8d24240d0bf6?w=1200&q=80&auto=format&fit=crop'
] where patente in ('KS887QE', 'JY389UB', 'MM167JV'); -- Cruze LTZ, Vento GLI, Corolla XEI
