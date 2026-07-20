export async function uploadAutoImage(file: File): Promise<string> {
  try {
    // 1. Pedirle permiso a nuestro servidor (Next.js) para subir esta foto
    const authResponse = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
      }),
    });

    if (!authResponse.ok) {
      throw new Error('No se pudo obtener la autorización del servidor');
    }

    // Recibimos la llave temporal (signedUrl) y la URL final (publicUrl)
    const { signedUrl, publicUrl } = await authResponse.json();

    // 2. Subir el archivo físico DIRECTAMENTE a Cloudflare R2 usando la llave temporal
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type, // Es crucial enviar el tipo de archivo correcto
      },
    });

    if (!uploadResponse.ok) {
      throw new Error('Error al subir la imagen a Cloudflare');
    }

    // 3. Si todo salió bien, devolvemos la URL pública para guardarla en Supabase
    return publicUrl;
    
  } catch (error) {
    console.error('Error en uploadAutoImage:', error);
    throw error; // Lanzamos el error para que el formulario sepa que falló
  }
}