import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";

// Importamos las tipografías que elegiste
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Pfaffen Autos | La forma más fácil de comprar tu auto",
  description: "Concesionaria premium con sucursales en Casa Central, Panamericana y La Lucila.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-[#0A0A0A] text-[#F5F5F3] antialiased min-h-screen pt-20`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}