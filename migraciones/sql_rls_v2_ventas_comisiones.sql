-- Auditoría de RLS en panel-v2 (2026-09-02): las políticas de ventas,
-- venta_senas, venta_permutas, venta_cuotas y comisiones son permisivas
-- (`using (true)` / `with check (true)`) sin chequear dueño — cualquier
-- usuario autenticado puede, llamando directo a Supabase sin pasar por
-- ninguna pantalla: reasignarse/editar una venta ajena (precio, %
-- comisión, vendedor_id, estado), insertar señas/permutas/cuotas contra
-- una venta ajena, borrar la seña de otro, o marcar como "cobrada" la
-- comisión de un compañero. El flujo de Autorizaciones para editar %
-- comisión (VentaDetalleModal) es solo UI — la API queda abierta igual.
--
-- Mismo patrón que ya se usó en el proyecto viejo (sql_rls_restringir_
-- edicion_ajena.sql / sql_rls_critico_financiero.sql), adaptado al schema
-- de panel-v2 (perfiles.roles es array, no perfiles.rol).
--
-- Postgres combina políticas permisivas con OR, así que agregar otra
-- permisiva no arregla nada — usamos políticas RESTRICTIVE (AND con todas
-- las permisivas existentes) para no tocar/adivinar las que ya están, solo
-- les suman un candado extra encima. Solo restringen ESCRITURA (insert/
-- update/delete) — la lectura (select) queda como estaba: varias pantallas
-- ya dependen de leer ventas/comisiones de otros (ranking, reportes, etc).
--
-- Las funciones security definer (registrar_movimiento_caja,
-- generar_comisiones_al_cerrar_venta, abrir_expediente_al_cerrar_venta,
-- marcar_comision_cobrada, etc.) siguen funcionando igual: corren como
-- dueño de la tabla y RLS no las afecta.

-- ============================================================
-- ventas — dueño = vendedor_id o vendedor_compartido_id; admin/finanzas/
-- gestoria pueden todo (mismos roles que ya tocan la venta en el resto
-- del panel: Autorizaciones, Tesorería, Gestoría).
-- ============================================================
drop policy if exists "restringir_escritura_ajena" on public.ventas;
drop policy if exists "restringir_escritura_ajena_ins" on public.ventas;
drop policy if exists "restringir_escritura_ajena_upd" on public.ventas;
create policy "restringir_escritura_ajena_ins" on public.ventas as restrictive for insert to authenticated
with check (
  vendedor_id is null
  or vendedor_id = auth.uid()
  or vendedor_compartido_id = auth.uid()
  or exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles)))
);
create policy "restringir_escritura_ajena_upd" on public.ventas as restrictive for update to authenticated
using (
  vendedor_id is null
  or vendedor_id = auth.uid()
  or vendedor_compartido_id = auth.uid()
  or exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles)))
)
with check (
  vendedor_id is null
  or vendedor_id = auth.uid()
  or vendedor_compartido_id = auth.uid()
  or exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles)))
);

-- ============================================================
-- venta_senas / venta_permutas / venta_cuotas — dueño = el vendedor de la
-- venta padre (venta_id). venta_senas también tenía "borrar" abierto.
-- ============================================================
drop policy if exists "restringir_escritura_ajena" on public.venta_senas;
drop policy if exists "restringir_escritura_ajena_ins" on public.venta_senas;
drop policy if exists "restringir_escritura_ajena_del" on public.venta_senas;
create policy "restringir_escritura_ajena_ins" on public.venta_senas as restrictive for insert to authenticated
with check (
  exists (select 1 from public.ventas v where v.id = venta_id and (v.vendedor_id = auth.uid() or v.vendedor_compartido_id = auth.uid()))
  or exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles)))
);
create policy "restringir_escritura_ajena_del" on public.venta_senas as restrictive for delete to authenticated
using (
  exists (select 1 from public.ventas v where v.id = venta_id and (v.vendedor_id = auth.uid() or v.vendedor_compartido_id = auth.uid()))
  or exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles)))
);

drop policy if exists "restringir_escritura_ajena" on public.venta_permutas;
create policy "restringir_escritura_ajena" on public.venta_permutas as restrictive for insert to authenticated
with check (
  exists (select 1 from public.ventas v where v.id = venta_id and (v.vendedor_id = auth.uid() or v.vendedor_compartido_id = auth.uid()))
  or exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles)))
);

drop policy if exists "restringir_escritura_ajena" on public.venta_cuotas;
create policy "restringir_escritura_ajena" on public.venta_cuotas as restrictive for insert to authenticated
with check (
  exists (select 1 from public.ventas v where v.id = venta_id and (v.vendedor_id = auth.uid() or v.vendedor_compartido_id = auth.uid()))
  or exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles) or 'gestoria' = any(p.roles)))
);

-- ============================================================
-- comisiones — insert solo admin/finanzas (el resto pasa por
-- crear_bono_comision, security definer). Update: dueño (beneficiario) o
-- admin/finanzas — cierra el hueco de "marcar cobrada la comisión de un
-- compañero" vía llamada directa a Supabase. El resto de las reglas de
-- negocio (exigir reseña, etc.) las siguen aplicando las funciones.
-- ============================================================
drop policy if exists "restringir_escritura_ajena" on public.comisiones;
create policy "restringir_escritura_ajena" on public.comisiones as restrictive for insert to authenticated
with check (
  exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles)))
);

drop policy if exists "restringir_escritura_ajena_upd" on public.comisiones;
create policy "restringir_escritura_ajena_upd" on public.comisiones as restrictive for update to authenticated
using (
  beneficiario_id = auth.uid()
  or exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles)))
)
with check (
  beneficiario_id = auth.uid()
  or exists (select 1 from public.perfiles p where p.id = auth.uid() and ('admin' = any(p.roles) or 'finanzas' = any(p.roles)))
);

-- ============================================================
-- Bug relacionado encontrado en la misma auditoría: marcar_comision_cobrada
-- no chequeaba que quien llama sea el beneficiario o admin/finanzas —
-- cualquier autenticado podía marcar cobrada la comisión de un compañero
-- (la función es security definer, así que ni RLS la frenaba).
-- ============================================================
create or replace function public.marcar_comision_cobrada(p_comision_id uuid, p_forzar_sin_resena boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_comision record;
  v_tipo_resena text;
  v_tiene_resena boolean;
  v_exige boolean;
  v_soy_admin boolean;
begin
  select * into v_comision from public.comisiones where id = p_comision_id;
  if v_comision is null then
    raise exception 'Comisión no encontrada.';
  end if;

  select exists(select 1 from public.perfiles where id = auth.uid() and ('admin' = any(roles) or 'finanzas' = any(roles))) into v_soy_admin;

  if not v_soy_admin and auth.uid() <> v_comision.beneficiario_id then
    raise exception 'No tenés permiso para marcar cobrada esta comisión.';
  end if;

  select exigir_resena_comision into v_exige from public.configuracion_empresa where id = true;

  if v_exige and v_comision.venta_id is not null and v_comision.tipo in ('vendedor', 'vendedor_compartido', 'consignacion') then
    v_tipo_resena := case when v_comision.tipo = 'consignacion' then 'ex_dueno' else 'comprador' end;
    select exists(select 1 from public.venta_resenas_solicitudes where venta_id = v_comision.venta_id and tipo = v_tipo_resena) into v_tiene_resena;

    if not v_tiene_resena then
      if p_forzar_sin_resena and v_soy_admin then
        update public.comisiones set aprobado_sin_resena_por = auth.uid(), aprobado_sin_resena_en = now() where id = p_comision_id;
      else
        raise exception 'Pedí la reseña antes de cobrar (o forzá el pago como admin/finanzas).';
      end if;
    end if;
  end if;

  update public.comisiones
  set estado = 'cobrada', monto_pagado = monto, fecha_cobro = coalesce(fecha_cobro, current_date), aprobacion_pendiente = false, updated_at = now()
  where id = p_comision_id;
end;
$$;
