import type { NextConfig } from "next";

// Solo en producción: en dev, Turbopack necesita 'unsafe-eval' para el HMR y
// no vale la pena pelear con eso en local. Dominios: Turnstile (script+iframe
// del captcha), Google Maps (iframe embed de sucursales), R2/Wikimedia/Unsplash
// (imágenes, mismos hosts que ya están en images.remotePatterns abajo).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: blob: https://*.b-cdn.net https://upload.wikimedia.org https://images.unsplash.com https://*.r2.dev https://*.r2.cloudflarestorage.com",
  "media-src 'self'",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src https://challenges.cloudflare.com https://www.google.com https://maps.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.2.*', '192.168.2.111', '*.devtunnels.ms', '*.brs.devtunnels.ms', '*.trycloudflare.com'],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "*.b-cdn.net" }, // URLs viejas en la DB (zone de Bunny borrada, dominio queda para no romper next/image)
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "images.unsplash.com" }, // <-- Dominio agregado
      { protocol: "https", hostname: "*.r2.dev" }, // Cloudflare R2 (dominio público por defecto)
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Content-Security-Policy", value: CSP }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;