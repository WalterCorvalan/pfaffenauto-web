import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { KARRY_VERSIONS } from '@/lib/karry-versions';
import { RELY_VERSIONS } from '@/lib/rely-versions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://pfaffenautos.com.ar';

  const [{ data: vehiculos }, { data: sucursales }] = await Promise.all([
    supabase
      .from('vehiculos')
      .select('slug, marca, updated_at')
      .in('estado', ['Disponible', 'Reservado']),
    supabase.from('sucursales').select('slug'),
  ]);

  const paginasEstaticas: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/catalogo`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/catalogo-v2`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/0km`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/outlet`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/mundo-chino`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/marcas`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${baseUrl}/nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/financiacion`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/cotizador`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/vender`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/consignacion`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/trabaja-con-nosotros`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const paginasSucursales: MetadataRoute.Sitemap = (sucursales || [])
    .filter((s) => s.slug)
    .map((s) => ({
      url: `${baseUrl}/sucursales/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  const paginasVehiculos: MetadataRoute.Sitemap = (vehiculos || [])
    .filter((v) => v.slug)
    .map((v) => ({
      url: `${baseUrl}/catalogo/${v.slug}`,
      lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const marcasUnicas = Array.from(
    new Set((vehiculos || []).map((v) => v.marca).filter(Boolean)),
  );
  const paginasMarcas: MetadataRoute.Sitemap = marcasUnicas.map((marca) => ({
    url: `${baseUrl}/marcas/${marca.toLowerCase().replace(/\s+/g, '-')}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const paginasKarry: MetadataRoute.Sitemap = KARRY_VERSIONS.map((v) => ({
    url: `${baseUrl}/karry/${v.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const paginasRely: MetadataRoute.Sitemap = RELY_VERSIONS.map((v) => ({
    url: `${baseUrl}/rely/${v.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [
    ...paginasEstaticas,
    ...paginasSucursales,
    ...paginasVehiculos,
    ...paginasMarcas,
    ...paginasKarry,
    ...paginasRely,
  ];
}
