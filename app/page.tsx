import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Phone, MessageCircle, Eye, ArrowRight, Mail, MapPin } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export const revalidate = 0;

const getImageUrl = (ruta: string) => {
  if (ruta.startsWith("http")) return ruta;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/autos/${ruta}`;
};

export default async function HomePage() {
  const { data: autos } = await supabase
    .from("autos")
    .select("*")
    .in("estado", ["Disponible", "Reservado"])
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans scroll-smooth">
      
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 py-6 bg-gradient-to-b from-black/80 to-transparent">
        <div className="max-w-[95%] mx-auto px-4 flex justify-between items-center">
          <Link href="/"><img src="/logo.png" alt="Pfaffen Autos" className="h-8 md:h-10 w-auto" /></Link>
          <div className="hidden lg:flex space-x-8 uppercase text-xs font-black tracking-[0.2em] text-white/90">
            <Link href="#stock" className="hover:text-[#1E6FD9] transition-colors">Stock</Link>
            <Link href="#sucursales" className="hover:text-[#1E6FD9] transition-colors">Sucursales</Link>
            <Link href="#contacto" className="hover:text-[#1E6FD9] transition-colors">Contacto</Link>
          </div>
          <Link href="#contacto" className="bg-[#0055A4] hover:bg-[#1E6FD9] text-white font-black uppercase text-xs tracking-widest py-3 px-6 rounded-full transition-all flex items-center gap-2">
            <Phone className="w-4 h-4" /> CONTACTO
          </Link>
        </div>
      </nav>

      {/* HERO - RESPONSIVO Y CONTENIDO */}
      <section id="inicio" className="relative h-screen w-full flex flex-col justify-center items-center text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=2000&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Contenedor máximo para evitar cortes */}
        <div className="relative z-20 max-w-7xl w-full flex flex-col items-center gap-2">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.9] w-full">
           LA FORMA MÁS <span className="text-[#0055A4]">CONFIABLE</span>
          </h1>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9] w-full">
            DE COMPRAR O VENDER TU AUTO
          </h1>
          <p className="mt-8 text-sm md:text-lg font-serif italic text-gray-300">
            Vehículos premium seleccionados. Garantía absoluta en Zona Norte.
          </p>
        </div>
      </section>

      {/* SUCURSALES */}
      <section id="sucursales" className="py-20 bg-[#050505]">
        <div className="max-w-[95%] mx-auto px-4">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-10 text-center">Nuestras Sucursales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Casa Central", "Panamericana", "La Lucila"].map((s, i) => (
              <Link key={i} href={`/sucursales/${s.toLowerCase().replace(' ', '-')}`} className="bg-[#111] p-8 rounded-2xl border border-white/5 hover:border-[#0055A4] transition-all text-center">
                <h3 className="text-md font-black uppercase">{s}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="py-16 bg-[#080808]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl font-black uppercase text-center mb-10">Contacto</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#111] p-8 rounded-2xl border border-white/5">
            <input type="text" placeholder="Nombre" className="bg-[#050505] border border-white/10 p-4 rounded-xl text-sm" />
            <input type="tel" placeholder="Teléfono" className="bg-[#050505] border border-white/10 p-4 rounded-xl text-sm" />
            <textarea placeholder="Mensaje" className="md:col-span-2 bg-[#050505] border border-white/10 p-4 rounded-xl text-sm h-32"></textarea>
            <button className="md:col-span-2 bg-[#0055A4] hover:bg-[#1E6FD9] py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all">Enviar Consulta</button>
          </form>
        </div>
      </section>

      {/* STOCK (Fuente chica) */}
      <section id="stock" className="py-20 bg-[#050505]">
        <div className="max-w-[95%] mx-auto px-4">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-12">Nuestro Stock</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {autos?.map((auto) => (
              <div key={auto.id} className="bg-[#111] rounded-2xl overflow-hidden border border-white/5">
                <div className="h-48 bg-gray-900">{auto.fotos?.[0] && <img src={getImageUrl(auto.fotos[0])} className="w-full h-full object-cover" />}</div>
                <div className="p-4">
                  <h3 className="text-sm font-black uppercase mb-1">{auto.marca} {auto.modelo}</h3>
                  <p className="text-md font-bold text-[#1E6FD9] mb-4">${auto.precio.toLocaleString()}</p>
                  <a href={`https://wa.me/5491100000000?text=Consulta%20por%20${auto.marca}`} className="text-[10px] font-bold uppercase border border-[#0055A4] px-4 py-2 rounded-full hover:bg-[#0055A4] transition-colors">Consultar</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 text-center">
        <div className="flex justify-center gap-8 mb-8 text-gray-400">
          
          <a href="#" className="font-black text-xs hover:text-[#FFE600]">MELI</a>
          <a href="#" className="font-black text-xs hover:text-[#00F2EA]">TIKTOK</a>
        </div>
        <p className="text-[10px] text-gray-600 uppercase tracking-widest">© 2026 Pfaffen Autos</p>
      </footer>

      <a href="https://wa.me/5491100000000" target="_blank" className="fixed bottom-8 right-8 bg-[#25D366] text-white p-4 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"><MessageCircle className="w-6 h-6" /></a>
    </div>
  );
}