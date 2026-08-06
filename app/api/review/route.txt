import { NextResponse } from "next/server";

export async function GET() {
  const PLACE_ID = "TU_PLACE_ID"; // ID de tu lugar en Google Maps (ej: ChI. ..)
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY || "TU_GOOGLE_API_KEY";

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&language=es&key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json({ error: "No se pudieron obtener las reseñas de Google" }, { status: 500 });
    }

    // Adaptamos el formato de Google al que usa tu componente
    const reviews = (data.result.reviews || []).map((rev: any, index: number) => ({
      id: index + 1,
      name: rev.author_name,
      date: rev.relative_time_description, // Ej: "hace 2 semanas"
      text: rev.text,
      initials: rev.author_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    }));

    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}