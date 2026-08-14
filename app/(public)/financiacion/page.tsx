import BannerFinanciacion from "@/components/banners/BannerFinanciacion";

export const metadata = {
  title: "Financiación | Pfaffen Autos",
  description: "Créditos prendarios del Banco Nación con tasa preferencial. Simulá tu cuota y solicitalo online.",
};

export default function FinanciacionPage() {
  return (
    <div className="min-h-screen bg-white">
      <BannerFinanciacion />
    </div>
  );
}
