-- Hallazgo 18 (auditoría de seguridad): la policy SELECT de "comisiones"
-- tenía qual = true, sin ninguna restricción -- cualquier usuario
-- autenticado podía leer las comisiones de TODOS los vendedores (via
-- supabase2 directo desde el navegador), no solo las propias. El filtro
-- por vendedorFiltro en ComisionesClient.tsx es solo UX del panel, la
-- protección real tiene que vivir acá.
--
-- Deja ver una fila de "comisiones" solo a: su propio beneficiario_id,
-- o admin/finanzas (que ya ven todo en el panel vía el selector "todos").

drop policy if exists "ver_comisiones" on public.comisiones;

create policy "ver_comisiones" on public.comisiones
for select
to authenticated
using (
  beneficiario_id = auth.uid()
  or exists (
    select 1 from public.perfiles p
    where p.id = auth.uid()
      and ('admin' = any(p.roles) or 'finanzas' = any(p.roles))
  )
);
