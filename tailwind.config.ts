// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Pfaffen Palette (Reemplazo total del rojo de referencia)
        primary: "#0055A4",    // Azul Pfaffen principal
        secondary: "#1E6FD9",  // Azul Pfaffen claro (Glow/Hover)
        background: "#050505", // Fondo premium
        foreground: "#FFFFFF",
      },
      fontFamily: {
        // Usaremos una fuente condensada para los titulares
        sans: ['Inter', 'sans-serif'],
        display: ['Anton', 'sans-serif'], // Recomendación: Importar 'Anton' en tu layout
      },
    },
  },
  plugins: [],
};
export default config;