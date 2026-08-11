"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client"; 
import { ArrowLeft, Loader2, CheckCircle2, ChevronDown } from "lucide-react";

const marcasDisponibles = [
  "Audi", "BAIC", "BMW", "Changan", "Chery", "Chevrolet", "Citroen", 
  "Fiat", "Ford", "Honda", "Hyundai", "Jeep", "Mercedes Benz", 
  "Nissan", "Peugeot", "Renault", "Toyota", "Volkswagen", "Otro"
];

const modelosPorMarca: Record<string, string[]> = {
  "Chevrolet": ["Cruze", "Equinox", "Joy", "Montana Pick-up", "Onix", "S-10 Pick-up", "Silverado"],
  "Toyota": ["Hilux", "Corolla", "Etios", "Yaris", "SW4", "Corolla Cross"],
  "Volkswagen": ["Gol", "Amarok", "Polo", "T-Cross", "Taos", "Nivus"],
  "Ford": ["Focus", "Ranger", "Fiesta", "EcoSport", "Territory", "Kuga"],
  "Audi": ["A1", "A3", "A4", "Q3", "Q5"],
  "BMW": ["Serie 1", "Serie 3", "X1", "X3", "X5"],
  "Peugeot": ["208", "2008", "3008", "Partner"],
  "Renault": ["Sandero", "Logan", "Duster", "Alaskan", "Kangoo"],
  "Fiat": ["Cronos", "Pulse", "Fastback", "Toro", "Strada"],
  "Jeep": ["Renegade", "Compass", "Commander"],
};

const aniosDisponibles = Array.from({ length: 20 }, (_, i) => 2026 - i);

export default function VenderForm() {
  const [step, setStep] = useState(1);
  const [mockId, setMockId] = useState("");
  
  // Estados del vehículo
  const [anio, setAnio] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [version, setVersion] = useState("");
  const [km, setKm] = useState("");
  const [gnc, setGnc] = useState("");

  // Estados de Contacto y SMS
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [codigoSMS, setCodigoSMS] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState(false);

  // Controladores de Dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [busquedaMarca, setBusquedaMarca] = useState("");

  // Estados de carga/envío
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Estado del contador
  const [segundos, setSegundos] = useState(60);

  useEffect(() => {
    setMockId(String(Math.floor(Math.random() * 90000) + 10000));
  }, []);

  useEffect(() => {
    if (segundos > 1) {
      const timer = setInterval(() => {
        setSegundos((prev) => prev - 1);
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [segundos]);

  const marcasFiltradas = marcasDisponibles.filter(m => m.toLowerCase().includes(busquedaMarca.toLowerCase()));
  const modelosDisponibles = modeloPorMarcaSeleccionada(marca);

  function modeloPorMarcaSeleccionada(m: string) {
    return modelosPorMarca[m] || ["Base", "Full", "Sport", "Standard", "Otro"];
  }

  const validarPaso1 = () => {
    return anio && marca && modelo && version && km;
  };

  // =================================================================
  // 1. GENERAR CÓDIGO, GUARDAR EN SUPABASE Y ENVIAR A N8N
  // =================================================================
  const solicitarCodigoSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !tel.trim()) {
      alert("Por favor completá todos los campos de contacto.");
      return;
    }

    setLoading(true);

    try {
      const codigoGenerado = Math.floor(1000 + Math.random() * 9000).toString();

      const { error: dbError } = await supabase
        .from('verificaciones_sms')
        .insert({
          telefono: tel.trim(),
          codigo: codigoGenerado
        });

      if (dbError) throw dbError;

      await fetch("https://n8n-pfaffen.onrender.com/webhook/ENVIAR-CODIGO-SMS", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          telefono: tel.trim(), 
          nombre: nombre.trim(), 
          codigo: codigoGenerado 
        })
      });

      setCodigoEnviado(true);
      setStep(4); 

    } catch (error) {
      console.error("Error al solicitar SMS:", error);
      alert("No pudimos enviar el código. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // =================================================================
  // 2. VALIDAR CÓDIGO INGRESADO Y GUARDAR LA COTIZACIÓN FINAL
  // =================================================================
  const verificarCodigoYEnviar = async () => {
    if (codigoSMS.length < 4) {
      alert("Ingresá el código de verificación completo.");
      return;
    }

    setLoading(true);

    try {
      const { data: verificacion, error: fetchError } = await supabase
        .from('verificaciones_sms')
        .select('codigo')
        .eq('telefono', tel.trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !verificacion) {
        alert("No se encontró una solicitud para este número.");
        setLoading(false);
        return;
      }

      if (verificacion.codigo !== codigoSMS) {
        alert("El código ingresado es incorrecto.");
        setLoading(false);
        return;
      }

      const { data: cotizacion, error: dbError } = await supabase
        .from('cotizaciones')
        .insert({
          marca,
          modelo,
          anio: Number(anio),
          version: `${version} - GNC: ${gnc || 'No'}`,
          kilometraje: Number(km),
          nombre: `${nombre.trim()} ${apellido.trim()}`,
          email: email.trim(), 
          telefono: tel.trim(),
          telefono_verificado: true, 
          tipo_peritaje: 'venta', // <--- MARCADOR PARA VENTA DIRECTA
          sucursal_preferida: 'Casa Central',
          fotos_y_videos: []
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      const response = await fetch("https://n8n-pfaffen.onrender.com/webhook/1999b53e-8ab2-4223-b71e-226575a4ac46", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cotizacion_id: cotizacion.id })
      });

      if (response.ok) {
        setEnviado(true);
      } else {
        throw new Error("El webhook del CRM falló");
      }

    } catch (error) {
      console.error("Error al vender auto:", error);
      alert("Hubo un problema al verificar o guardar. Reintentá.");
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pt-16 pb-50 relative font-sans overflow-hidden flex flex-col justify-between">
      
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/5 blur-[120px] rounded-full"></div>
      </div>

      <header className="max-w-7xl mx-auto w-full px-10 py-2 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
          <span>DOC: <strong className="text-orange-600">{mockId}</strong></span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-8 relative z-10">
        
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-6 text-left">
          <div className="space-y-3">
            <span className="bg-orange-50 text-orange-700 border border-orange-200 text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full inline-block shadow-sm">
              Venta Directa y Transparente
            </span>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light text-navy tracking-tight leading-[1.08]">
              Vendé tu vehículo <br />
              <strong className="font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">al mejor precio.</strong>
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500 pt-2">
              EFECTIVO INMEDIATO Y TRANSFERENCIA SEGURA
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA: FORMULARIO */}
        <div className="lg:col-span-5 flex justify-center w-full">
          <div className="bg-white/70 backdrop-blur-2xl border border-white rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-6 md:p-8 w-full max-w-md relative">
            
            {!enviado && (
              <div className="mb-4">
                <h2 className="text-xl font-black text-navy tracking-tight">
                  Iniciá la venta en {segundos} {segundos === 1 ? "segundo" : "segundos"}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {step === 1 && "Ingresá los datos del vehículo que querés vender"}
                  {step === 2 && "¿Tu auto tiene o tuvo GNC?"}
                  {step === 3 && "Necesitamos tus datos para enviarte el código"}
                  {step === 4 && "Verificá tu número de teléfono"}
                </p>
              </div>
            )}

            {!enviado ? (
              <div>
                {/* PASO 1 */}
                {step === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="relative">
                      <div 
                        onClick={() => setOpenDropdown(openDropdown === 'anio' ? null : 'anio')}
                        className={`w-full bg-white/60 backdrop-blur-md border rounded-2xl px-4 py-3.5 text-sm font-semibold flex items-center justify-between cursor-pointer transition-all shadow-sm ${anio ? 'text-navy border-slate-300' : 'text-slate-400 border-white'}`}
                      >
                        <span>{anio ? anio : "Seleccioná el año"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openDropdown === 'anio' ? 'rotate-180 text-orange-600' : ''}`} />
                      </div>

                      {openDropdown === 'anio' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white rounded-2xl shadow-2xl z-50 max-h-56 overflow-y-auto p-1">
                          {aniosDisponibles.map((a) => (
                            <div 
                              key={a}
                              onClick={() => { setAnio(String(a)); setOpenDropdown(null); }}
                              className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-xl cursor-pointer transition-colors"
                            >
                              {a}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div 
                        onClick={() => setOpenDropdown(openDropdown === 'marca' ? null : 'marca')}
                        className={`w-full bg-white/60 backdrop-blur-md border rounded-2xl px-4 py-3.5 text-sm font-semibold flex items-center justify-between cursor-pointer transition-all shadow-sm ${marca ? 'text-navy border-slate-300' : 'text-slate-400 border-white'}`}
                      >
                        <span>{marca ? marca : "Seleccioná la marca"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openDropdown === 'marca' ? 'rotate-180 text-orange-600' : ''}`} />
                      </div>

                      {openDropdown === 'marca' && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white rounded-2xl shadow-2xl z-50 p-2">
                          <input 
                            type="text" 
                            placeholder="Buscá la marca..." 
                            value={busquedaMarca}
                            onChange={(e) => setBusquedaMarca(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none mb-2"
                            autoFocus
                          />
                          <div className="max-h-44 overflow-y-auto space-y-1">
                            {marcasFiltradas.map((m) => (
                              <div 
                                key={m}
                                onClick={() => { setMarca(m); setModelo(""); setOpenDropdown(null); }}
                                className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-xl cursor-pointer transition-colors"
                              >
                                {m}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <div 
                        onClick={() => marca && setOpenDropdown(openDropdown === 'modelo' ? null : 'modelo')}
                        className={`w-full bg-white/60 backdrop-blur-md border rounded-2xl px-4 py-3.5 text-sm font-semibold flex items-center justify-between transition-all shadow-sm ${marca ? 'cursor-pointer text-navy border-slate-300' : 'opacity-60 cursor-not-allowed text-slate-400 border-white'}`}
                      >
                        <span>{modelo ? modelo : "Seleccioná el modelo"}</span>
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${openDropdown === 'modelo' ? 'rotate-180 text-orange-600' : ''}`} />
                      </div>

                      {openDropdown === 'modelo' && marca && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-white rounded-2xl shadow-2xl z-50 max-h-52 overflow-y-auto p-1">
                          {modelosDisponibles.map((mod) => (
                            <div 
                              key={mod}
                              onClick={() => { setModelo(mod); setOpenDropdown(null); }}
                              className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-orange-50 hover:text-orange-700 rounded-xl cursor-pointer transition-colors"
                            >
                              {mod}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <input 
                        type="text" 
                        placeholder="Ingresá la versión (Ej: 1.6 MSI...)" 
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className="w-full bg-white/60 backdrop-blur-md border border-white rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all shadow-sm"
                      />
                    </div>

                    <div>
                      <input 
                        type="number" 
                        placeholder="Ingresá el kilometraje (Ej: 45000)" 
                        value={km}
                        onChange={(e) => setKm(e.target.value)}
                        className="w-full bg-white/60 backdrop-blur-md border border-white rounded-2xl px-4 py-3.5 text-sm font-semibold text-navy placeholder:text-slate-400 outline-none focus:border-orange-500 transition-all shadow-sm"
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="button" 
                        disabled={!validarPaso1()}
                        onClick={() => setStep(2)}
                        className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-amber-600 hover:to-orange-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95"
                      >
                        Continuar
                      </button>
                    </div>
                  </div>
                )}

                {/* PASO 2 */}
                {step === 2 && (
                  <div className="space-y-6 animate-fadeIn py-2">
                    <div>
                      <button onClick={() => setStep(1)} className="text-xs font-bold text-orange-600 flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver
                      </button>
                    </div>

                    <div className="space-y-3">
                      {["Sí, tiene GNC", "No, pero tenía antes", "No, nunca tuvo"].map((op) => (
                        <div 
                          key={op}
                          onClick={() => setGnc(op)}
                          className={`p-4 rounded-2xl border cursor-pointer font-bold text-xs transition-all shadow-sm ${gnc === op ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white/60 border-white text-slate-700 hover:bg-white'}`}
                        >
                          {op}
                        </div>
                      ))}
                    </div>

                    <button 
                      type="button"
                      disabled={!gnc}
                      onClick={() => setStep(3)}
                      className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-amber-600 hover:to-orange-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer active:scale-95"
                    >
                      Continuar
                    </button>
                  </div>
                )}

                {/* PASO 3 */}
                {step === 3 && (
                  <form onSubmit={solicitarCodigoSMS} className="space-y-4 animate-fadeIn">
                    <div>
                      <button type="button" onClick={() => setStep(2)} className="text-xs font-bold text-orange-600 flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" /> Volver
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Nombre</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ingresá tu nombre" 
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-white/60 backdrop-blur-md border border-white rounded-2xl px-4 py-3 text-xs font-semibold text-navy outline-none focus:border-orange-500 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Apellido</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ingresá tu apellido" 
                        value={apellido}
                        onChange={(e) => setApellido(e.target.value)}
                        className="w-full bg-white/60 backdrop-blur-md border border-white rounded-2xl px-4 py-3 text-xs font-semibold text-navy outline-none focus:border-orange-500 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Email</label>
                      <input 
                        type="email" 
                        required
                        placeholder="Ingresá tu correo" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/60 backdrop-blur-md border border-white rounded-2xl px-4 py-3 text-xs font-semibold text-navy outline-none focus:border-orange-500 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Teléfono celular</label>
                      <div className="flex gap-2">
                        <div className="bg-white/80 border border-white rounded-2xl px-3 py-3 text-xs font-bold text-slate-700 flex items-center shadow-sm">
                          AR +549
                        </div>
                        <input 
                          type="tel" 
                          required
                          placeholder="1112345678" 
                          value={tel}
                          onChange={(e) => setTel(e.target.value)}
                          className="flex-1 bg-white/60 backdrop-blur-md border border-white rounded-2xl px-4 py-3 text-xs font-semibold text-navy outline-none focus:border-orange-500 shadow-sm"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-center text-slate-400 font-medium pt-1">Recibirás un código de verificación por SMS</p>

                    <button 
                      type="submit" 
                      className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-amber-600 hover:to-orange-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      Enviar código por SMS
                    </button>
                  </form>
                )}

                {/* PASO 4 */}
                {step === 4 && (
                  <div className="space-y-6 animate-fadeIn py-2">
                    <div>
                      <button onClick={() => setStep(3)} className="text-xs font-bold text-orange-600 flex items-center gap-1 mb-2 hover:underline">
                        <ArrowLeft className="w-3.5 h-3.5" /> Cambiar número
                      </button>
                      <p className="text-xs text-slate-500 mt-1">
                        Enviamos un código de 4 dígitos por SMS al número <strong className="text-slate-900">+549 {tel}</strong>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-slate-500 uppercase block">Código de verificación</label>
                      <input 
                        type="text" 
                        maxLength={6}
                        placeholder="Ej: 1234" 
                        value={codigoSMS}
                        onChange={(e) => setCodigoSMS(e.target.value)}
                        className="w-full bg-white/80 border border-white rounded-2xl px-4 py-3.5 text-center text-2xl font-black tracking-widest text-navy outline-none focus:border-orange-500 shadow-inner"
                        autoFocus
                      />
                    </div>

                    <button 
                      type="button" 
                      onClick={verificarCodigoYEnviar}
                      disabled={loading || codigoSMS.length < 4}
                      className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-amber-600 hover:to-orange-500 disabled:opacity-50 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                      {loading ? "PROCESANDO..." : "Confirmar Venta"}
                    </button>
                  </div>
                )}

              </div>
            ) : (
              /* ÉXITO */
              <div className="text-center py-12 animate-fadeIn space-y-4">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-navy uppercase tracking-tighter">¡Solicitud de venta recibida!</h3>
                <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                  Tu número fue verificado. Hemos registrado tu interés en vender el vehículo y nos comunicaremos en la brevedad para coordinar la tasación presencial y la oferta final.
                </p>
                <div className="pt-4">
                  <Link href="/" className="inline-block py-3.5 px-8 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-orange-500/20">
                    Volver al inicio
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      <footer className="text-center text-[10px] font-bold text-slate-400 py-4 uppercase tracking-widest relative z-10">
        Pfaffen Autos &bull; Todos los derechos reservados
      </footer>

    </div>
  );
}