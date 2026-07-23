"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const marcasDisponibles = [
  "Audi", "BMW", "Chery", "Chevrolet", "Citroen", "Fiat", "Ford", 
  "Honda", "Hyundai", "Jeep", "Mercedes Benz", "Morris", "Nissan", 
  "Peugeot", "Renault", "Toyota", "Volkswagen", "Otro"
];

export default function CotizadorForm() {
  const [step, setStep] = useState(1);
  const [isLightMode, setIsLightMode] = useState(false);
  const [mockId, setMockId] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  
  // Estados del formulario
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [anio, setAnio] = useState("");
  const [version, setVersion] = useState("");
  const [km, setKm] = useState("");
  const [nombre, setNombre] = useState("");
  const [tel, setTel] = useState("");
  const [sucursal, setSucursal] = useState("");
  
  // Sugerencias de marca
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredMaras, setFilteredMarcas] = useState(marcasDisponibles);
  
  // Estados de carga/envío
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    // Inicializar fecha y ID aleatorio al montar
    const hoy = new Date();
    setCurrentDate(hoy.toLocaleDateString("es-AR"));
    setMockId(String(Math.floor(Math.random() * 90000) + 10000));

    // Detectar preferencia de tema del sistema
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    if (prefersLight) {
      setIsLightMode(true);
      document.body.classList.add("light-mode");
    }
  }, []);

  const toggleTheme = () => {
    setIsLightMode(!isLightMode);
    document.body.classList.toggle("light-mode");
  };

  const handleMarcaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMarca(val);
    if (!val) {
      setFilteredMarcas(marcasDisponibles);
    } else {
      setFilteredMarcas(marcasDisponibles.filter(m => m.toLowerCase().includes(val.toLowerCase())));
    }
    setShowSuggestions(true);
  };

  const handleNextStep = (current: number) => {
    if (current === 1) {
      if (!marca || !modelo.trim() || !anio.trim()) {
        alert("Por favor, completá la Marca, el Modelo y el Año del vehículo para continuar.");
        return;
      }
    }
    setStep(current + 1);
  };

  const handlePrevStep = (current: number) => {
    setStep(current - 1);
  };

  const submitForm = async () => {
    if (!nombre.trim() || !tel.trim()) {
      alert("Por favor, ingresá tu Nombre y Teléfono para enviar la cotización.");
      return;
    }

    setLoading(true);
    const data = {
      marca,
      modelo,
      anio,
      version,
      km,
      nombre: nombre.trim(),
      tel: tel.trim(),
      sucursal,
      doc_ref: mockId,
      origen: "Cotizador Web Factura"
    };

    try {
      const response = await fetch("https://n8n-pfaffen.onrender.com/webhook/1999b53e-8ab2-4223-b71e-226575a4ac46", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setEnviado(true);
      } else {
        throw new Error("Servidor no respondió");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al enviar. Asegurate de que el workflow en n8n esté activo.");
    } finally {
      setLoading(false);
    }
  };

  const enviarWhatsApp = () => {
    if (!nombre.trim() || !tel.trim()) {
      alert("Por favor, completá tu Nombre y Teléfono para enviarlo por WhatsApp.");
      return;
    }

    const numeroDestino = "5491133727066";
    const mensaje = `¡Hola! Soy ${nombre.trim()}. Me gustaría cotizar mi vehículo:%0A
🚗 *Vehículo:* ${marca} ${modelo} ${version}%0A
📅 *Año:* ${anio}%0A
🛣️ *Kilometraje:* ${km} km%0A
📍 *Sucursal de preferencia:* ${sucursal}%0A
📞 *Mi teléfono:* ${tel.trim()}`;

    window.open(`https://wa.me/${numeroDestino}?text=${mensaje}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-20 relative font-sans">
      {/* Botón alternar tema */}
      <button 
        className="fixed top-20 right-6 bg-[#1e1e1e] text-white border border-white/10 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer z-50 shadow-lg hover:scale-105 transition-transform"
        onClick={toggleTheme}
      >
        <i className={`ti ${isLightMode ? "ti-moon" : "ti-sun"} text-xl`}></i>
      </button>

      <div className="max-w-xl mx-auto px-4">
        
        {/* Contenedor tipo Factura/Comprobante */}
        <div className="bg-[#121212] data-[theme=light]:bg-white border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8 relative overflow-hidden transition-colors duration-300"
             style={{ backgroundColor: isLightMode ? "#ffffff" : "#1e1e1e" }}>
          
          {/* Franja superior de color */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-[#0055A4]"></div>

          {/* CABECERA Y LOGO */}
          <div className="flex justify-between items-center pb-4 border-b border-white/10 mb-4">
            <Link href="/">
              <span className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1">
                <i className="ti ti-arrow-left"></i> Volver al inicio
              </span>
            </Link>
            <div className="font-mono text-xs text-gray-400">
              <strong>Nº DOC:</strong> <span className="text-[#0055A4]">{mockId}</span> | <strong>FECHA:</strong> {currentDate}
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <h1 className="text-2xl md:text-3xl font-black uppercase text-[#0055A4] tracking-tight">
              PFAFFEN <span className="text-white data-[theme=light]:text-black">COTIZADOR</span>
            </h1>
          </div>

          {!enviado ? (
            <div id="pf-form">
              
              {/* PASO 1: HERO / INICIO */}
              {step === 1 && (
                <div className="text-center py-8 animate-fadeIn">
                  <h2 className="text-3xl font-black text-[#0055A4] uppercase mb-4 tracking-tight">
                    Vender tu auto nunca fue tan fácil
                  </h2>
                  <p className="text-gray-400 text-sm mb-8">
                    Dejanos los datos de tu vehículo y te garantizamos la venta en tiempo récord.
                  </p>
                  <button 
                    type="button" 
                    className="w-full py-4 bg-[#0055A4] hover:bg-[#1E6FD9] text-white font-bold rounded-xl uppercase tracking-wider text-sm transition-all shadow-lg flex items-center justify-center gap-2"
                    onClick={() => setStep(2)}
                  >
                    COTIZAR MI AUTO AHORA <i className="ti ti-arrow-right text-lg"></i>
                  </button>
                </div>
              )}

              {/* PASO 2: DATOS DEL VEHÍCULO */}
              {step === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-xs font-bold text-[#0055A4] uppercase tracking-widest mb-3">1. Datos del vehículo</h3>
                  
                  <div className="bg-[#0A0F16] data-[theme=light]:bg-gray-50 rounded-xl p-4 border border-white/5 space-y-4">
                    
                    {/* Marca con Autocompletado */}
                    <div className="relative flex items-center gap-4">
                      <label className="w-28 text-xs font-bold text-gray-400 uppercase">Marca *</label>
                      <input 
                        type="text" 
                        value={marca}
                        onChange={handleMarcaChange}
                        onClick={() => setShowSuggestions(true)}
                        placeholder="Buscar o escribir..." 
                        className="flex-1 bg-transparent border-b border-white/20 pb-1 text-sm outline-none focus:border-[#0055A4]"
                        required 
                        autoComplete="off"
                      />
                      {showSuggestions && filteredMaras.length > 0 && (
                        <div className="absolute top-full left-28 right-0 bg-[#1e1e1e] border border-white/10 shadow-xl z-50 max-h-48 overflow-y-auto rounded-b-lg">
                          {filteredMaras.map((m, i) => (
                            <div 
                              key={i} 
                              onClick={() => { setMarca(m); setShowSuggestions(false); }}
                              className="px-4 py-2.5 text-xs hover:bg-[#0055A4] hover:text-white cursor-pointer border-b border-white/5"
                            >
                              {m}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="w-28 text-xs font-bold text-gray-400 uppercase">Modelo *</label>
                      <input 
                        type="text" 
                        value={modelo}
                        onChange={(e) => setModelo(e.target.value)}
                        placeholder="Ej: Corolla, Gol..." 
                        className="flex-1 bg-transparent border-b border-white/20 pb-1 text-sm outline-none focus:border-[#0055A4]"
                        required 
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="w-28 text-xs font-bold text-gray-400 uppercase">Año *</label>
                      <input 
                        type="number" 
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                        placeholder="Ej: 2020" 
                        className="flex-1 bg-transparent border-b border-white/20 pb-1 text-sm outline-none focus:border-[#0055A4]"
                        required 
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="w-28 text-xs font-bold text-gray-400 uppercase">Versión</label>
                      <input 
                        type="text" 
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="Ej: XEI, 1.4..." 
                        className="flex-1 bg-transparent border-b border-white/20 pb-1 text-sm outline-none focus:border-[#0055A4]"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="w-28 text-xs font-bold text-gray-400 uppercase">Kilometraje</label>
                      <input 
                        type="text" 
                        value={km}
                        onChange={(e) => setKm(e.target.value)}
                        placeholder="Ej: 45.000 km" 
                        className="flex-1 bg-transparent border-b border-white/20 pb-1 text-sm outline-none focus:border-[#0055A4]"
                      />
                    </div>

                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors"
                      onClick={() => handlePrevStep(2)}
                    >
                      <i className="ti ti-arrow-left"></i> Volver
                    </button>
                    <button 
                      type="button" 
                      className="flex-1 py-3 bg-[#0055A4] hover:bg-[#1E6FD9] text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-all shadow-lg"
                      onClick={() => handleNextStep(2)}
                    >
                      Siguiente <i className="ti ti-arrow-right"></i>
                    </button>
                  </div>
                </div>
              )}

              {/* PASO 3: TUS DATOS Y ENVÍO */}
              {step === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <h3 className="text-xs font-bold text-[#0055A4] uppercase tracking-widest mb-3">2. Tus datos de contacto</h3>
                  
                  <div className="bg-[#0A0F16] data-[theme=light]:bg-gray-50 rounded-xl p-4 border border-white/5 space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="w-28 text-xs font-bold text-gray-400 uppercase">Nombre *</label>
                      <input 
                        type="text" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre completo" 
                        className="flex-1 bg-transparent border-b border-white/20 pb-1 text-sm outline-none focus:border-[#0055A4]"
                        required 
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="w-28 text-xs font-bold text-gray-400 uppercase">Teléfono *</label>
                      <input 
                        type="tel" 
                        value={tel}
                        onChange={(e) => setTel(e.target.value)}
                        placeholder="Ej: 11 2345 6789" 
                        className="flex-1 bg-transparent border-b border-white/20 pb-1 text-sm outline-none focus:border-[#0055A4]"
                        required 
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="w-28 text-xs font-bold text-gray-400 uppercase">Sucursal</label>
                      <select 
                        value={sucursal}
                        onChange={(e) => setSucursal(e.target.value)}
                        className="flex-1 bg-transparent border-b border-white/20 pb-1 text-sm outline-none focus:border-[#0055A4] text-white data-[theme=light]:text-black"
                      >
                        <option value="" className="bg-[#121212]">Seleccionar sucursal</option>
                        <option value="Villa de Mayo" className="bg-[#121212]">Casa Central (Villa de Mayo)</option>
                        <option value="Panamericana" className="bg-[#121212]">Panamericana (Don Torcuato)</option>
                        <option value="Olivos" className="bg-[#121212]">Olivos (Vicente López)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button 
                      type="button" 
                      onClick={submitForm}
                      disabled={loading}
                      className="w-full py-4 bg-[#0055A4] hover:bg-[#1E6FD9] text-white font-bold rounded-xl uppercase tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <i className="ti ti-loader animate-spin text-lg"></i> : <i className="ti ti-file-check text-lg"></i>}
                      {loading ? "PROCESANDO..." : "ENVIAR SOLICITUD"}
                    </button>

                    <button 
                      type="button" 
                      onClick={enviarWhatsApp}
                      className="w-full py-4 bg-[#25d366] hover:bg-[#1ea952] text-white font-bold rounded-xl uppercase tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <i className="ti ti-brand-whatsapp text-lg"></i> ENVIAR POR WHATSAPP
                    </button>

                    <button 
                      type="button" 
                      onClick={() => handlePrevStep(3)}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase text-xs tracking-wider transition-colors"
                    >
                      <i className="ti ti-arrow-left"></i> Modificar Vehículo
                    </button>
                  </div>
                </div>
              )}

              {/* BANNER LA CAJA */}
              <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4 mt-8">
                <div className="w-12 h-12 relative flex-shrink-0">
                  <Image src="/Logo_La_Caja_Generali.png" alt="Seguros La Caja" fill className="object-contain" />
                </div>
                <div className="flex-1">
                  <strong className="block text-xs font-bold text-white">Asegurá tu auto con La Caja</strong>
                  <span className="text-[11px] text-gray-400">Cotizá online con beneficios exclusivos.</span>
                </div>
                <a 
                  href="https://cotizadorsocios.lacaja.com.ar/seguro-auto-socios/?socio=22791&utm_source=ig&utm_medium=social&utm_content=link_in_bio" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-lg transition-colors"
                >
                  Cotizar
                </a>
              </div>

            </div>
          ) : (
            /* ÉXITO */
            <div className="text-center py-12 animate-fadeIn relative">
              <div className="absolute top-2 right-4 border-2 border-emerald-500/40 text-emerald-500/40 font-black text-2xl px-3 py-1 rounded-lg transform -rotate-12">
                RECIBIDO
              </div>
              <h3 className="text-2xl font-black text-[#0055A4] uppercase mb-2">¡Cotización en proceso!</h3>
              <p className="text-gray-400 text-sm mb-6">Hemos recibido los datos. Un asesor se contactará a la brevedad.</p>
              <Link href="/" className="inline-block py-3 px-6 bg-[#0055A4] text-white font-bold rounded-xl text-xs uppercase tracking-wider">
                Volver al inicio
              </Link>
            </div>
          )}

          {/* FOOTER LEGAL */}
          <div className="mt-8 pt-4 border-t border-white/10 text-center text-[10px] text-gray-500 space-y-1 font-mono">
            <p><strong>Pfaffen Cars S.R.L</strong> | CUIT: 33-71906015-9</p>
            <p>Documento no válido como factura. Sujeto a inspección física.</p>
          </div>

        </div>
      </div>
    </div>
  );
}