import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

// Cargamos Montserrat una sola vez para TODO el proyecto
const montserrat = Montserrat({ 
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

// ================= METADATA SEO OPTIMIZADA =================
export const metadata: Metadata = {
  title: "Pfaffen Autos | Concesionaria de 0KM y Usados en Zona Norte",
  description: "Comprá o vendé tu auto de forma fácil y segura. Amplio catálogo de 0KM y usados seleccionados de alta gama (Toyota, Volkswagen, BMW, Audi). Sucursales en Olivos y Villa de Mayo.",
  keywords: [
    // Identidad
    "pfaffen", "fafen", "pfaffen autos", "fafen autos", "agencia pfaffen",
    // Intención de compra/venta
    "comprar auto 0km", "vender mi auto usado", "comprar auto usado buenos aires", "cotizar auto online", "venta de autos usados",
    // SEO Local (¡Clave!)
    "concesionaria zona norte", "agencia de autos olivos", "concesionaria villa de mayo", "autos usados panamericana", "agencia de autos gran buenos aires", "concesionaria oficial",
    // Competencia / Alternativas (Oculto en código)
    "mejor que kavak", "alternativa a kavak", "vender auto rapido",
    // Marcas y Categorías
    "autos alta gama buenos aires", "comprar suv usada", "camionetas 4x4 usadas", "toyota", "volkswagen", "bmw", "audi", "mercedes benz", "ford"
  ],
  authors: [{ name: "Pfaffen Autos" }],
  creator: "Pfaffen Autos",
  publisher: "Pfaffen Autos",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema JSON-LD Mejorado para SEO Local
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "name": "Pfaffen Autos",
    "image": "https://pfaffenautos.com.ar/logo.png",
    "@id": "https://pfaffenautos.com.ar",
    "url": "https://pfaffenautos.com.ar",
    "telephone": "+541145001200",
    "priceRange": "$$$",
    "areaServed": [
      "Zona Norte, Buenos Aires",
      "Olivos, Buenos Aires",
      "Villa de Mayo, Malvinas Argentinas"
    ],
    "description": "Concesionaria de autos 0KM y usados seleccionados de alta gama en Buenos Aires."
  };

  return (
    <html lang="es" className={`${montserrat.variable} scroll-smooth`}>
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans bg-background text-foreground antialiased flex flex-col min-h-screen">
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}