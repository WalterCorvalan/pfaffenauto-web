import { NextResponse } from "next/server";

export async function GET() {
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
      return NextResponse.json({ error: "No se pudieron obtener las reseñas de Google" }, { status: 500 });
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
  } catch {
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
