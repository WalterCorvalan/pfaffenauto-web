"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function TrackerLogic() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = searchParams.get("utm_source");
    const medium = searchParams.get("utm_medium"); // ej: "ads", "stories"
    
    if (source) {
      const origenFinal = medium ? `${source} (${medium})` : source;
      localStorage.setItem("origen_lead", origenFinal.toUpperCase());
    } else if (!localStorage.getItem("origen_lead") && document.referrer) {
       // Si no hay link con UTM, pero detectamos que vino de otra red social
       if (document.referrer.includes("instagram.com")) localStorage.setItem("origen_lead", "INSTAGRAM ORGÁNICO");
       if (document.referrer.includes("facebook.com")) localStorage.setItem("origen_lead", "FACEBOOK ORGÁNICO");
       if (document.referrer.includes("google.com")) localStorage.setItem("origen_lead", "GOOGLE BÚSQUEDA");
    }
  }, [searchParams]);

  return null;
}

export default function UtmTracker() {
  return <Suspense fallback={null}><TrackerLogic /></Suspense>;
}