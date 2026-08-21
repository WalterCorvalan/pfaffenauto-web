import { NextResponse } from "next/server";
import { rateLimit, ipDesdeRequest } from "@/lib/rateLimit";
import { registrarError } from "@/lib/logger";

export async function GET(req: Request) {
  const limite = rateLimit(ipDesdeRequest(req), { limite: 30, ventanaMs: 60 * 1000 });
  if (!limite.ok) {
    return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 });
  }

  const PLACE_ID = process.env.GOOGLE_PLACE_ID;
  const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!PLACE_ID || !API_KEY) {
    return NextResponse.json({ error: "Faltan GOOGLE_PLACE_ID / GOOGLE_MAPS_API_KEY" }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&language=es&key=${API_KEY}`;

    const response = await fetch(url, { next: { revalidate: 3600 } });
    const data = await response.json();

    if (data.status !== "OK") {
  console.error("Google Places API error:", data.status, data.error_message);
  return NextResponse.json(
    { error: "No se pudieron obtener las reseñas de Google", detail: data.status, message: data.error_message },
    { status: 500 }
  );
}

    const reviews = (data.result.reviews || []).map((rev: { author_name: string; relative_time_description: string; text: string; rating: number }, index: number) => ({
      id: index + 1,
      name: rev.author_name,
      date: rev.relative_time_description,
      source: "Google Reviews",
      rating: rev.rating,
      text: rev.text,
      initials: rev.author_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase(),
    }));

    return NextResponse.json({
      reviews,
      rating: data.result.rating,
      total: data.result.user_ratings_total,
    });
  } catch (err) {
  registrarError("api/reviews", err);
  return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
}
}
