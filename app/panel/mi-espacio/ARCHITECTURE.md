# Mi Espacio — cómo funciona y con qué se conecta

Guía para no romper otra cosa al tocar este módulo. Si cambiás algo acá, revisá primero esta lista de conexiones.

## Bug corregido: "quién le debe a quién" invertido en Saldo con la agencia

`SaldoAgenciaTab.tsx` registra dos tipos de movimiento: `"saque"` (agencia → yo, saco plata de la caja para uso personal) y `"aporte"` (yo → agencia, pongo plata mía). Un `"saque"` significa que **yo** le debo esa plata a la agencia; un `"aporte"` significa que **la agencia** me la debe a mí. El cálculo de totales (`meDebe`/`leDebo`) tenía la asignación exactamente al revés: un `"saque"` sumaba a "Agencia me debe" y un `"aporte"` a "Yo debo a agencia" — mostraba el balance invertido. Corregido en el `useMemo` de `totales`.

**Mismo bug duplicado en `PatrimonioTab.tsx`**: esta pestaña calcula su propio `agenciaMeDebe`/`yoDeboAgencia` a partir de la misma tabla `espacio_movimientos_agencia`, en vez de reusar el cálculo de `SaldoAgenciaTab.tsx` — y tenía exactamente el mismo error de asignación (`"saque"` sumando a `agenciaMeDebe` en lugar de `yoDeboAgencia`). Corregido en paralelo. Si se vuelve a tocar esta lógica, hacerlo en los dos archivos o extraerla a un helper compartido para evitar que se repita el bug una tercera vez.

## No tocar sin revisar el resto

- `espacio_movimientos_agencia` es privada por perfil (RLS `perfil_id = auth.uid()`) — no hay vista de admin que consolide "cuánto le debe cada empleado a la agencia" todavía, cada uno solo ve/registra lo propio.
