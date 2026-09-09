// Grupo de rutas aparte del (public): el link de presupuesto del panel que
// se comparte con el cliente es un documento autónomo — sin header/nav ni
// footer del sitio, sin chatbot flotante. Ruta /presupuestos/[token]
// (plural) para no chocar con /presupuesto/[token] (singular, legado).
export default function PresupuestoPublicoLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F1F5F9]">{children}</div>;
}
