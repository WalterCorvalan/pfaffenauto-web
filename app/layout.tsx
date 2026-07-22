import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-playfair" 
});

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-inter" 
});

// ================= METADATA SEO 2026 =================
export const metadata: Metadata = {
  title: "Pfaffen Autos | Compra y Venta de Vehículos de Alta Gama y 0KM",
  description: "La forma más confiable de comprar o vender tu auto en Buenos Aires. Unidades 0KM y usados seleccionados con garantía. Sucursales en Villa de Mayo, Olivos y Panamericana.",
  keywords: [
    "pfaffen", "fafen", "pfaffen autos", "fafen autos",
    "autos usados seleccionados buenos aires",
    "concesionario alta gama",
    "comprar auto 0km",
    "vender mi auto usado",
    "alternativa a kavak autos",
    "sote automotores"
  ],
  authors: [{ name: "Pfaffen Autos" }],
  creator: "Pfaffen Autos",
  publisher: "Pfaffen Autos",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://pfaffenautos.com.ar",
    title: "Pfaffen Autos | Vehículos de Alta Gama y 0KM",
    description: "Concesionario líder en compra, venta y financiación de vehículos seleccionados en Buenos Aires.",
    siteName: "Pfaffen Autos",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Schema JSON-LD para AIO y GEO (Ayuda a las IA y Google a entender la empresa)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "name": "Pfaffen Autos",
    "image": "https://pfaffenautos.com.ar/logo.png",
    "@id": "https://pfaffenautos.com.ar",
    "url": "https://pfaffenautos.com.ar",
    "telephone": "+541145001200",
    "priceRange": "$$$",
    "address": [
      {
        "@type": "PostalAddress",
        "streetAddress": "Villa de Mayo",
        "addressLocality": "Buenos Aires",
        "addressCountry": "AR"
      },
      {
        "@type": "PostalAddress",
        "streetAddress": "Maipú 567",
        "addressLocality": "Olivos",
        "addressRegion": "Buenos Aires",
        "addressCountry": "AR"
      },
      {
        "@type": "PostalAddress",
        "streetAddress": "Panamericana km 28",
        "addressLocality": "Don Torcuato",
        "addressRegion": "Buenos Aires",
        "addressCountry": "AR"
      }
    ],
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
      ],
      "opens": "09:00",
      "closes": "19:00"
    },
    "sameAs": [
      "https://instagram.com/pfaffenautos", // Reemplazar con links reales
      "https://facebook.com/pfaffenautos",
      "https://www.mercadolibre.com.ar"
    ]
  };

  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable} scroll-smooth`}>
      <head>
        {/* Inyectamos el Schema Structured Data para los motores de búsqueda e IA */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans bg-[#050505] text-white antialiased flex flex-col min-h-screen">
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}