import type { Metadata } from "next";
// Importamos las fuentes de Google
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

// Configuramos la fuente Serif para títulos
const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair" 
});

// Configuramos la fuente Sans-serif para el cuerpo de texto
const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

export const metadata: Metadata = {
  title: "Pfaffen Autos",
  description: "La forma más fácil de comprar o vender tu auto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Inyectamos las variables CSS de las fuentes en el HTML
    <html lang="es" className={`${playfair.variable} ${inter.variable} scroll-smooth`}>
      {/* 
        Ajuste clave: Usamos el fondo #050505 y text-white para que 
        coincida exactamente con la Landing Page y no sobreescriba nada.
      */}
      <body className="font-sans bg-[#050505] text-white antialiased">
        {children}
      </body>
    </html>
  );
}