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
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      {/* 
        Aplicamos el fondo carbón (#0A0A0A) y el texto blanco roto (#F5F5F3) 
        por defecto a toda la página
      */}
      <body className="font-sans bg-[#0A0A0A] text-[#F5F5F3] antialiased">
        {children}
      </body>
    </html>
  );
}