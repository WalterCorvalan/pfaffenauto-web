import { 
  ShieldCheck, 
  Search, 
  Calculator, 
  MessageCircle, 
  HandCoins, 
  Banknote, 
  Clock3, 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle 
} from "lucide-react";
import SimuladorReal from "./SimuladorReal";

export const metadata = {
  title: "Financiación Oficial | Pfaffen Autos",
  description: "Créditos personales del Banco Nación con tasa preferencial. Simulá tu cuota sobre un auto real del stock y solicitalo online.",
};

const PASOS = [
  { 
    numero: "01",
    icono: Search, 
    titulo: "Elegí tu auto", 
    texto: "Seleccioná cualquier unidad disponible de nuestro inventario, ya sea 0KM o Usado Seleccionado." 
  },
  { 
    numero: "02",
    icono: Calculator, 
    titulo: "Simulá tu cuota", 
    texto: "Ajustá tu anticipo y la cantidad de meses para ver el valor exacto de la cuota estimada." 
  },
  { 
    numero: "03",
    icono: HandCoins, 
    titulo: "Completá tus datos", 
    texto: "Ingresá tu contacto para que verifiquemos la preaprobación de la línea oficial con el banco." 
  },
  { 
    numero: "04",
    icono: MessageCircle, 
    titulo: "Coordinamos la entrega", 
    texto: "Un asesor exclusivo de la sucursal te contacta por WhatsApp para cerrar los detalles y firmar." 
  },
];

const RESPALDOS = [
  { icono: Banknote, titulo: "Línea Oficial +Autos", texto: "Convenio con Banco Nación sin intermediarios" },
  { icono: ShieldCheck, titulo: "Sin Prenda", texto: "Préstamo personal: el auto sale 100% a tu nombre" },
  { icono: Clock3, titulo: "Aprobación Ágil", texto: "Validación digital de tu solicitud en 24 a 48 hs" },
];

const FAQS = [
  {
    q: "¿Necesito tener cuenta en el Banco Nación?",
    a: "No es obligatorio. Si ya cobrás tu sueldo en el BNA accedés a una tasa preferencial, pero la línea está disponible para clientes de cualquier banco.",
  },
  {
    q: "¿El préstamo tiene prenda sobre el vehículo?",
    a: "No. Es un préstamo personal del Banco Nación, lo que significa que el vehículo no queda embargado ni prendado a favor del banco.",
  },
  {
    q: "¿Puedo entregar mi auto actual en parte de pago?",
    a: "Sí, podés entregar tu usado como anticipo y financiar únicamente la diferencia restante en cuotas fijas.",
  },
];

export default function FinanciacionPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0f] text-slate-900 dark:text-white">
      
      {/* ================= HERO & SIMULADOR ================= */}
      <section className="pt-6 pb-16 lg:pt-8 lg:pb-24 bg-slate-50 dark:bg-[#0b1329] relative overflow-hidden">
        {/* Luces y patrones de fondo */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(1,69,242,0.12),transparent_60%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(1,69,242,0.3),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#0145F2]/10 dark:bg-[#0145F2]/20 border border-[#0145F2]/20 dark:border-sky-400/30 text-[#0145F2] dark:text-sky-300 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-full mb-5">
            <ShieldCheck className="w-4 h-4 text-[#0145F2] dark:text-sky-400" /> Línea Oficial Banco Nación
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white font-black tracking-tight leading-[1.1] mb-4">
            Financiá <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-[#0145F2] dark:from-sky-400 dark:to-[#0145F2]">
              en hasta 72 cuotas fijas.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium max-w-xl mx-auto mb-8 leading-relaxed">
            Elegí tu auto, simulá la cuota y te acompañamos con la aprobación.
          </p>

          {/* SIMULADOR EN VIVO */}
          <div className="relative">
            <SimuladorReal />
          </div>
        </div>
      </section>

      {/* ================= BENEFICIOS Y RESPALDO ================= */}
      <section className="py-12 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RESPALDOS.map((r) => (
              <div 
                key={r.titulo} 
                className="flex items-center gap-4 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-sky-400/10 text-[#0145F2] dark:text-sky-400 flex items-center justify-center shrink-0">
                  <r.icono className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{r.titulo}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PASO A PASO ================= */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[11px] font-black uppercase tracking-widest text-[#0145F2] dark:text-sky-400 block mb-2">
            Proceso Simple
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            ¿Cómo obtener tu financiación?
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-3">
            En 4 simples pasos coordinamos tu aprobación sin trámites engorrosos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {PASOS.map((p) => (
            <div 
              key={p.titulo} 
              className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 relative flex flex-col justify-between hover:border-[#0145F2] dark:hover:border-sky-400 transition-colors shadow-sm group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 text-[#0145F2] dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <p.icono className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-2xl font-black text-slate-200 dark:text-slate-700 group-hover:text-[#0145F2] dark:group-hover:text-sky-400 transition-colors">
                    {p.numero}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{p.titulo}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PREGUNTAS FRECUENTES ================= */}
      <section className="py-16 lg:py-24 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0145F2] dark:text-sky-400 block mb-2">
              Dudas Frecuentes
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Todo lo que tenés que saber sobre el crédito
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div 
                key={faq.q} 
                className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-2xl p-6 shadow-sm"
              >
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-start gap-3">
                  <HelpCircle className="w-4 h-4 text-[#0145F2] dark:text-sky-400 shrink-0 mt-0.5" />
                  {faq.q}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-7">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}