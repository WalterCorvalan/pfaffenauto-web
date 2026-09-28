"use client";

import dynamic from "next/dynamic";

// page.tsx es server component -- wrapper client para poder usar
// "ssr: false" y sacar recharts del bundle inicial de esta pagina (el tab
// "Metricas" de este board es lo unico que usa recharts, pero se importaba
// entero igual).
const TareasLeadBoard = dynamic(() => import("./TareasLeadBoard"), { ssr: false });

export default TareasLeadBoard;
