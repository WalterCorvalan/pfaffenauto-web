"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Car, SearchX, Loader2 } from "lucide-react";

// Inicializamos el cliente de Supabase para el cliente (navegador)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface Vehicle {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  precio_publicado_ars: number;
  tipo: string;
  kilometraje: number;
  estado: string;
}

export default function VehicleCatalog() {
  const [vehiculos, setVehiculos] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Función que consulta directamente a la Base de Datos de Supabase
  useEffect(() => {
    async function consultarBaseDeDatos() {
      setLoading(true);

      let query = supabase
        .from("vehiculos")
        .select("*")
        .eq("estado", "Disponible");

      // Si el usuario escribe algo en el buscador, filtramos en la base de datos
      if (busqueda.trim() !== "") {
        query = query.or(
          `marca.ilike.%${busqueda}%,modelo.ilike.%${busqueda}%`,
        );
      }

      // Si selecciona un tipo específico
      if (filtroTipo !== "todos") {
        query = query.eq("tipo", filtroTipo);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error al consultar Supabase:", error);
      } else {
        setVehiculos(data || []);
      }
      setLoading(false);
    }

    // Un pequeño "debounce" para no saturar la base de datos mientras escribe
    const delayDebounce = setTimeout(() => {
      consultarBaseDeDatos();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [busqueda, filtroTipo]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Barra de filtros conectada a la Base de Datos */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Buscá en la base de datos (ej. Peugeot, Hilux...)"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm outline-none focus:border-[#0145F2]"
        />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm outline-none focus:border-[#0145F2]"
        >
          <option value="todos">Todos los tipos</option>
          <option value="SUV">SUV</option>
          <option value="Pickup">Pickup</option>
          <option value="Sedan">Sedán</option>
        </select>
      </div>

      {/* Indicador de carga */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0145F2]" />
        </div>
      ) : vehiculos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehiculos.map((auto) => (
            <div
              key={auto.id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-black text-lg text-slate-900">
                {auto.marca} {auto.modelo}
              </h3>
              <p className="text-slate-500 text-sm">
                {auto.anio} • {auto.tipo} • {auto.kilometraje} km
              </p>
              <p className="text-[#0145F2] font-extrabold mt-4 text-xl">
                ${auto.precio_publicado_ars?.toLocaleString("es-AR")}
              </p>
            </div>
          ))}
        </div>
      ) : (
        /* Caso vacío cuando la base de datos no arroja resultados */
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 text-center max-w-xl mx-auto my-12">
          <div className="w-16 h-16 bg-blue-50 text-[#0145F2] rounded-full flex items-center justify-center mx-auto mb-4">
            <SearchX className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            No encontramos vehículos en la base de datos
          </h3>
          <p className="text-slate-600 text-sm mb-6">
            No hay coincidencias exactas en este momento. Podés probar limpiando
            los filtros o consultarle a nuestro asistente virtual.
          </p>
          <button
            onClick={() => {
              setBusqueda("");
              setFiltroTipo("todos");
            }}
            className="bg-[#0145F2] hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Car className="w-4 h-4" /> Ver todo el stock disponible
          </button>
        </div>
      )}
    </div>
  );
}
