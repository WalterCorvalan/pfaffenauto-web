"use client";

import dynamic from "next/dynamic";

// page.tsx es server component -- "ssr: false" en next/dynamic no se puede
// usar ahi directo (Next lo prohibe), por eso este wrapper client chico.
// Saca recharts del bundle inicial de la pagina de Embudo.
const EmbudoCanalChart = dynamic(() => import("./EmbudoCanalChart"), { ssr: false });

export default EmbudoCanalChart;
