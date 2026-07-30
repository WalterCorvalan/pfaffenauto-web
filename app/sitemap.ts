import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pfaffenautos.com.ar'; 

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/catalogo`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    // Reemplazos de sucursales
    { url: `${baseUrl}/sucursales/casa-central`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/sucursales/olivos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/sucursales/don-torcuato`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 }
  ];
}