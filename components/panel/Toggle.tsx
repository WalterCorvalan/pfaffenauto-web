"use client";

// Switch tipo iOS para reemplazar los <input type="checkbox"> nativos del
// panel (Configuración > Empresa, sobre todo) -- mismo comportamiento
// (controlado, disabled), solo cambia la presentación.
export default function Toggle({
  checked,
  onChange,
  disabled,
  color = "azul",
  title,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  color?: "azul" | "rosa";
  title?: string;
}) {
  const bgOn = color === "rosa" ? "bg-rose-600" : "bg-[#0145F2]";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      title={title}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${checked ? bgOn : "bg-slate-300 dark:bg-white/10"}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-6" : "translate-x-0.5"}`} />
    </button>
  );
}
