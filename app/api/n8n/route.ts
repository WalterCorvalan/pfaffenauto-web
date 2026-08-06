import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, payload, isTest } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Falta el endpoint" }, { status: 400 });
    }

    // Si le pasamos isTest: true desde el front, usa webhook-test, sino usa webhook normal
    const path = isTest ? "webhook-test" : "webhook";
    const n8nUrl = `https://n8n-pfaffen.onrender.com/${path}/${endpoint}`;

    console.log("Intentando enviar a n8n ->", n8nUrl);

    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`N8N RECHAZÓ LA PETICIÓN (Status: ${response.status}):`, errorText);
      throw new Error(`N8N Error: ${response.status}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("ERROR CATASTRÓFICO EN EL PUENTE:", error.message);
    return NextResponse.json({ error: "Error de servidor interno", details: error.message }, { status: 500 });
  }
}