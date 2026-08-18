import type { NextConfig } from "next";

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
        ],
      },
    ];
  },
};

export default nextConfig;