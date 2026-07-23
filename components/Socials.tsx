export default function Socials() {
  return (
    <section className="py-16 bg-[#050505] border-t border-white/5 text-center relative overflow-hidden">
      {/* Brillo de fondo sutil general */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-white/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="max-w-[75rem] mx-auto px-6 relative z-10">
        
        {/* Título único y directo */}
        <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-10">
          Nuestras Redes
        </h2>

        {/* Grid compacta (6 columnas en PC, 3 en Tablet, 2 en Celular) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          
          {/* WhatsApp */}
          <a
            href="https://wa.me/5491100000000"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-[#09090b] rounded-2xl border border-white/5 hover:border-[#25D366]/50 p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(37,211,102,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#25D366]/0 to-[#25D366]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg
              className="w-7 h-7 fill-current text-gray-500 group-hover:text-[#25D366] group-hover:scale-110 transition-all duration-300 relative z-10"
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors relative z-10">
              WhatsApp
            </span>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-[#09090b] rounded-2xl border border-white/5 hover:border-pink-500/50 p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-pink-500/0 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg
              className="w-7 h-7 fill-current text-gray-500 group-hover:text-pink-500 group-hover:scale-110 transition-all duration-300 relative z-10"
              viewBox="0 0 24 24"
            >
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors relative z-10">
              Instagram
            </span>
          </a>

          {/* Facebook */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-[#09090b] rounded-2xl border border-white/5 hover:border-blue-600/50 p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(37,99,235,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/0 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg
              className="w-7 h-7 fill-current text-gray-500 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300 relative z-10"
              viewBox="0 0 24 24"
            >
              <path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.37 14.5 5 15.5 5H18V0h-3.808C10.592 0 9 1.582 9 4.75V8z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors relative z-10">
              Facebook
            </span>
          </a>

          {/* Mercado Libre */}
          <a
            href="https://www.mercadolibre.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-[#09090b] rounded-2xl border border-white/5 hover:border-yellow-400/50 p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(250,204,21,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/0 to-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg
              className="w-7 h-7 fill-current text-gray-500 group-hover:text-yellow-400 group-hover:scale-110 transition-all duration-300 relative z-10"
              viewBox="0 0 24 24"
            >
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3.125 17.518c-1.396 0-2.483-.418-3.262-1.254-.779-.836-1.168-1.996-1.168-3.48v-2.002h2.234v2.002c0 .762.207 1.34.62 1.734.414.394.974.591 1.678.591.704 0 1.264-.197 1.678-.591.413-.394.62-.972.62-1.734v-2.002h2.234v2.002c0 1.484-.389 2.644-1.168 3.48-.779.836-1.866 1.254-3.262 1.254zm-4.717-9.522v-2.234h6.318v2.234h-6.318z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors relative z-10">
              Mercado Libre
            </span>
          </a>

          {/* TikTok */}
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-[#09090b] rounded-2xl border border-white/5 hover:border-cyan-400/50 p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/0 to-cyan-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg
              className="w-7 h-7 fill-current text-gray-500 group-hover:text-cyan-400 group-hover:scale-110 transition-all duration-300 relative z-10"
              viewBox="0 0 24 24"
            >
              <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.242V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.144-4.53v-3.49a6.341 6.341 0 0 0-6.035 6.347 6.342 6.342 0 0 0 6.67 6.331 6.344 6.344 0 0 0 5.955-6.331V9.08a8.17 8.17 0 0 0 4.634 1.446V7.082a4.816 4.816 0 0 1-1.002-.396z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors relative z-10">
              TikTok
            </span>
          </a>

          {/* YouTube */}
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-[#09090b] rounded-2xl border border-white/5 hover:border-red-600/50 p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-red-600/0 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <svg
              className="w-7 h-7 fill-current text-gray-500 group-hover:text-red-600 group-hover:scale-110 transition-all duration-300 relative z-10"
              viewBox="0 0 24 24"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors relative z-10">
              YouTube
            </span>
          </a>
          
        </div>
      </div>
    </section>
  );
}