import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Cloudflare R2 (compatible con la API S3) — reemplazo de Bunny CDN para
// todo lo que se suba de acá en adelante. Lo ya subido a Bunny queda ahí,
// no se migra. Si faltan las env vars, r2Configurado() da false y cada
// ruta de upload cae de nuevo a Bunny (fallback, no rompe nada).

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}

export function r2Configurado(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}

// key ejemplo: "vehiculos/1699999999-foto.jpg"
export async function subirArchivoR2(buffer: Buffer, key: string, contentType = "application/octet-stream"): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
