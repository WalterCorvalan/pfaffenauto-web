import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

// 1. Conectamos con tu cuenta de Cloudflare R2
const s3Client = new S3Client({
  region: "auto", // R2 siempre requiere que la región sea "auto"
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    // 2. Recibimos el nombre y el tipo de la foto que el vendedor quiere subir
    const { filename, contentType } = await request.json();

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "Faltan datos del archivo" },
        { status: 400 }
      );
    }

    // 3. Generamos un nombre único. 
    // Si dos vendedores suben una foto llamada "frente.jpg", esto evita que se pisen.
    const uniqueFileName = `${crypto.randomUUID()}-${filename.replace(/\s+/g, '_')}`;

    // 4. Preparamos la instrucción para Cloudflare
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: contentType,
    });

    // 5. Firmamos la autorización. Esta URL mágica solo sirve para subir ESA foto y expira en 5 minutos (300 segs)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // 6. Armamos la URL final donde todo el mundo podrá ver la foto una vez subida
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`;

    // Devolvemos ambas URLs al panel del vendedor
    return NextResponse.json({ signedUrl, publicUrl });
    
  } catch (error) {
    console.error("Error al generar URL prefirmada:", error);
    return NextResponse.json(
      { error: "No se pudo autorizar la subida" },
      { status: 500 }
    );
  }
}