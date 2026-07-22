import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // En app/robots.ts cambia esto:
        disallow: ['/panel/', '/api/'], // Protege el panel interno de vendedores/admins
      },
      {
        userAgent: 'GPTBot', // Permiso explícito para OpenAI (ChatGPT) - GEO
        allow: '/',
      },
      {
        userAgent: 'PerplexityBot', // Permiso explícito para Perplexity AI - GEO
        allow: '/',
      },
      {
        userAgent: 'Google-Extended', // Permiso para entrenar y responder con Gemini - GEO
        allow: '/',
      },
    ],
    sitemap: 'https://pfaffenautos.com.ar/sitemap.xml',
  };
}