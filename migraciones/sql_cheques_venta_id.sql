-- Cheques que recibe el comprador para pagar la venta -- hasta ahora no
-- tenían ningún vínculo con la venta ni con la tabla "cheques": se elegía
-- "Cheque" como método de pago en el expediente y la plata se acreditaba
-- al instante, sin registro de librador/banco/número/fecha de cobro, y sin
-- nada que revertir si el cheque rebotaba. Con este vínculo, el cheque se
-- registra en estado "pendiente" (no acredita caja todavía) y recién se
-- confirma el pago del comprador cuando alguien lo marca "Cobrado" desde
-- Cheques (ver ChequesTab.tsx).
alter table cheques add column if not exists venta_id uuid references ventas(id) on delete set null;
