import Header from "@/components/layout/Header";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* La barra de navegación que armaste se mostrará en todas las páginas públicas */}
      <Header />
      
      {/* Acá adentro Next.js va a inyectar la página en la que esté el usuario 
          (Ej: el Home, el Catálogo, o el detalle del auto) */}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}