import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pfaffenautos.com.ar'; // Cambiar por tu dominio final en producción

  return [
    // 1. Home principal
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // 2. Catálogo General
    {
      url: `${baseUrl}/catalogo`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    // 3. Landing de Sucursal: Villa de Mayo
    {
      url: `${baseUrl}/sucursales/villa-de-mayo`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // 4. Landing de Sucursal: Olivos
    {
      url: `${baseUrl}/sucursales/olivos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // 5. Landing de Sucursal: Panamericana
    {
      url: `${baseUrl}/sucursales/panamericana`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }
  ];
}