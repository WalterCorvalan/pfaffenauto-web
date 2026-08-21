// Única fuente de verdad de logos de marca — usado tanto en components/Marcas.tsx
// (grilla "Buscá por marca") como en las tarjetas de auto (Stock.tsx / catálogo),
// para no duplicar la lista en dos lugares y que se desincronicen.
export const LOGOS_MARCAS: Record<string, string> = {
  "Volkswagen": "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
  "Chevrolet": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Chevrolet-logo.png",
  "Toyota": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg",
  "Ford": "https://upload.wikimedia.org/wikipedia/commons/a/a0/Ford_Motor_Company_Logo.svg",
  "Peugeot": "https://upload.wikimedia.org/wikipedia/commons/f/f7/Peugeot_Logo.svg",
  "Renault": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Renault_2021.svg",
  "Nissan": "https://upload.wikimedia.org/wikipedia/commons/2/23/Nissan_2020_logo.svg",
  "Honda": "https://upload.wikimedia.org/wikipedia/commons/3/38/Honda.svg",
  "Citroën": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Citro%C3%ABn_2021.svg",
  "Citroen": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Citro%C3%ABn_2021.svg",
  "Hyundai": "https://upload.wikimedia.org/wikipedia/commons/b/b7/Hyundai_symbol.svg",
  "Kia": "https://upload.wikimedia.org/wikipedia/commons/4/47/KIA_logo2.svg",
  "Jeep": "https://upload.wikimedia.org/wikipedia/commons/7/7e/Jeep.svg",
  "RAM": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Ram_Trucks_2025_wordmark.svg",
  "Suzuki": "https://upload.wikimedia.org/wikipedia/commons/3/31/Suzuki_Motor_Corporation_logo.svg",
  "Mitsubishi": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Mitsubishi_logo.svg",
  "BAIC": "https://upload.wikimedia.org/wikipedia/commons/0/06/BAIC_logo_%282024%29.png",
  "Chery": "https://upload.wikimedia.org/wikipedia/commons/b/b6/Chery_logo.svg",
  "Changan": "https://upload.wikimedia.org/wikipedia/commons/d/da/Changan-mazda_logo.png",
  "BYD": "https://upload.wikimedia.org/wikipedia/commons/9/99/BYD_Company%2C_Ltd._-_Logo.svg",
  "Geely": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Geely_Auto_2023.svg",
  "Haval": "https://upload.wikimedia.org/wikipedia/commons/d/da/Haval_2023_logo.svg",
  "JAC": "https://upload.wikimedia.org/wikipedia/commons/d/de/New_Jac_motors_logo.png",
  "Audi": "https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg",
  "BMW": "https://upload.wikimedia.org/wikipedia/commons/f/f4/BMW_logo_%28gray%29.svg",
  "Fiat": "https://upload.wikimedia.org/wikipedia/commons/0/05/FIAT_logo_coloured.svg",
  "Mercedes-Benz": "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
  "Mercedes Benz": "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
};

export function getLogoMarca(marca: string | null | undefined): string | null {
  if (!marca) return null;
  return LOGOS_MARCAS[marca.trim()] || null;
}
