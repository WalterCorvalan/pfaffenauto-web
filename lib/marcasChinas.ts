// Único lugar donde vive esta lista -- Stock.tsx (home) y VehiculosGrid.tsx
// (catálogo/mundo-chino/sucursales) la importan de acá, no uno del otro,
// para no crear una dependencia circular entre esos dos componentes.
export const MARCAS_CHINAS = new Set([
  "baic", "changan", "chery", "jac", "haval", "gwm", "great wall",
  "dfsk", "dfm", "mg", "byd", "geely", "foton", "jetour", "omoda",
]);
