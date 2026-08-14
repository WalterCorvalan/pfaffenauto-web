import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google"; // <-- Nueva fuente
import "./globals.css";
import Footer from "@/components/Footer";

// Cargamos Plus Jakarta Sans una sola vez para TODO el proyecto
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"], // Sin peso 900 porque esta fuente es más gruesa por defecto
});

// ================= METADATA SEO OPTIMIZADA =================
export const metadata: Metadata = {
  metadataBase: new URL("https://pfaffenautos.com.ar"),
  title: "Pfaffen Autos | Concesionaria de 0KM y Usados en Zona Norte",
  description:
    "Comprá o vendé tu auto de forma fácil y segura. Amplio catálogo de 0KM y usados seleccionados de alta gama (Toyota, Volkswagen, BMW, Audi). Sucursales en Casa Central y Don Torcuato.",
  keywords: [
    "pfaffen",
    "fafen",
    "pfaffen autos",
    "fafen autos",
    "agencia pfaffen",
    "comprar auto 0km",
    "vender mi auto usado",
    "comprar auto usado buenos aires",
    "cotizar auto online",
    "venta de autos usados",
    "concesionaria zona norte",
    "concesionaria casa central",
    "autos usados don torcuato",
    "agencia de autos gran buenos aires",
    "concesionaria oficial",
    "mejor que kavak",
    "alternativa a kavak",
    "vender auto rapido",
    "autos alta gama buenos aires",
    "comprar suv usada",
    "camionetas 4x4 usadas",
    "toyota",
    "volkswagen",
    "bmw",
    "audi",
    "mercedes benz",
    "ford",
    "rely",
    "karry",
    "concesionario oficial rely",
    "concesionario oficial karry",
  ],
  authors: [{ name: "Pfaffen Autos" }],
  creator: "Pfaffen Autos",
  publisher: "Pfaffen Autos",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Pfaffen Autos | Concesionaria de 0KM y Usados en Zona Norte",
    description:
      "Comprá o vendé tu auto de forma fácil y segura. Amplio catálogo de 0KM y usados seleccionados de alta gama.",
    url: "https://pfaffenautos.com.ar",
    siteName: "Pfaffen Autos",
    images: [
      {
        url: "https://pfaffenautos.com.ar/logo.png",
        width: 1200,
        height: 630,
        alt: "Pfaffen Autos",
      },
    ],
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pfaffen Autos | Concesionaria de 0KM y Usados en Zona Norte",
    description:
      "Comprá o vendé tu auto de forma fácil y segura. Amplio catálogo de 0KM y usados seleccionados de alta gama.",
    images: ["https://pfaffenautos.com.ar/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: "Pfaffen Autos",
    image: "https://pfaffenautos.com.ar/logo.png",
    "@id": "https://pfaffenautos.com.ar",
    url: "https://pfaffenautos.com.ar",
    telephone: "+541145001200",
    priceRange: "$$$",
    areaServed: [
      "Zona Norte, Buenos Aires",
      "Casa Central, Malvinas Argentinas",
      "Don Torcuato, Tigre"
    ],
    description:
      "Concesionaria de autos 0KM y usados seleccionados de alta gama en Buenos Aires.",
  };

  return (
    // Inyectamos la variable de la NUEVA fuente
    <html lang="es" className={`${jakarta.variable} scroll-smooth`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans bg-background text-foreground antialiased flex flex-col min-h-screen">
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
