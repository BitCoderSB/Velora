import { useAppStore } from "@store/useAppStore.js";
import dayjs from "dayjs";
import { dateISOToDoy } from "@lib/mapping.js";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";

export default function ConfigurationSection() {
  const {
    lat, lon, date_of_interest, engine, window_days,
    spatial_mode, area_km,
    setDate, setEngine, setWindow, setSpatialMode, setAreaKm
  } = useAppStore();

  const nice = dayjs(date_of_interest).format("DD/MM/YYYY");
  const doy = dateISOToDoy(date_of_interest);

  return (
    <div className="space-y-4">
      {/* Información de coordenadas actuales */}
      <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium mb-1 text-slate-800 dark:text-white text-sm">Ubicación Actual</div>
            <div className="text-slate-600 dark:text-slate-300 text-xs">Lat: {lat.toFixed(4)} · Lon: {lon.toFixed(4)}</div>
          </div>
        </div>
      </div>

      {/* Configuración de parámetros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="font-medium block mb-2 text-slate-700 dark:text-white text-sm">Fecha</label>
          <ProximityGlow className="rounded-lg">
            <input 
              type="date" 
              value={date_of_interest} 
              onChange={(e)=>setDate(e.target.value)} 
              className="bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </ProximityGlow>
          <div className="text-slate-500 dark:text-slate-300 mt-1 text-xs">Seleccionada: {nice} · DOY: {doy}</div>
        </div>

        <div>
          <label className="font-medium block mb-2 text-slate-700 dark:text-white text-sm">Modelo</label>
          <ProximityGlow className="rounded-lg">
            <select 
              value={engine} 
              onChange={(e)=>setEngine(e.target.value)} 
              className="bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="logistic">Logístico</option>
              <option value="climatology">Climatología</option>
              <option value="gev">GEV</option>
            </select>
          </ProximityGlow>
        </div>

        <div>
          <label className="font-medium block mb-2 text-slate-700 dark:text-white text-sm">Ventana ± días: {window_days}</label>
          <ProximityGlow className="rounded-lg">
            <input 
              type="range" 
              min="5" 
              max="45" 
              value={window_days} 
              onChange={(e)=>setWindow(parseInt(e.target.value))} 
              className="w-full custom-slider" 
            />
          </ProximityGlow>
        </div>

        <div>
          <label className="font-medium block mb-2 text-slate-700 dark:text-white text-sm">Modo espacial</label>
          <ProximityGlow className="rounded-lg">
            <select 
              value={spatial_mode} 
              onChange={(e)=>setSpatialMode(e.target.value)} 
              className="bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="nearest">Punto más cercano</option>
              <option value="box_avg">Promedio de área</option>
            </select>
          </ProximityGlow>
          
          {spatial_mode === "box_avg" && (
            <div className="mt-3">
              <label className="text-sm text-slate-700 dark:text-white font-medium block mb-1">Área (km)</label>
              <ProximityGlow className="rounded-lg">
                <input 
                  type="number" 
                  min="1" 
                  value={area_km}
                  onChange={(e)=>setAreaKm(Number(e.target.value))}
                  className="bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </ProximityGlow>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}