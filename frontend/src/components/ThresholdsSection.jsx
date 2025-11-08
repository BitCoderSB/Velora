import { useAppStore } from "@store/useAppStore.js";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";

export default function ThresholdsSection() {
  const { thresholds, setThresholds } = useAppStore();

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Define los valores límite para considerar condiciones extremas en cada variable climática.
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="text-sm text-slate-700 dark:text-white font-medium block mb-2">
            Muy caliente (°C): {thresholds.very_hot_C}
          </label>
          <ProximityGlow className="rounded-lg">
            <input 
              type="number" 
              className="bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={thresholds.very_hot_C}
              onChange={(e)=>setThresholds({ ...thresholds, very_hot_C: Number(e.target.value) })}
            />
          </ProximityGlow>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Temperatura considerada extremadamente alta
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-700 dark:text-white font-medium block mb-2">
            Muy húmedo (mm): {thresholds.very_wet_mm}
          </label>
          <ProximityGlow className="rounded-lg">
            <input 
              type="number" 
              className="bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={thresholds.very_wet_mm}
              onChange={(e)=>setThresholds({ ...thresholds, very_wet_mm: Number(e.target.value) })}
            />
          </ProximityGlow>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Precipitación considerada extremadamente alta
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-700 dark:text-white font-medium block mb-2">
            Muy ventoso (m/s): {thresholds.very_windy_ms}
          </label>
          <ProximityGlow className="rounded-lg">
            <input 
              type="number" 
              className="bg-black/60 backdrop-blur-sm border border-white/20 text-white rounded-lg px-3 py-2 w-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={thresholds.very_windy_ms}
              onChange={(e)=>setThresholds({ ...thresholds, very_windy_ms: Number(e.target.value) })}
            />
          </ProximityGlow>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Velocidad del viento considerada extremadamente alta
          </div>
        </div>
      </div>
    </div>
  );
}