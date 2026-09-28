"use client";

import dynamic from "next/dynamic";

// page.tsx es server component -- wrapper client para poder usar
// "ssr: false" y sacar recharts del bundle inicial de esta pagina.
const InstagramMetricsClient = dynamic(() => import("./InstagramMetricsClient"), { ssr: false });

export default InstagramMetricsClient;
