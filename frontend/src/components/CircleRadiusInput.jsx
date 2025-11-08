import { useState } from "react";
import { motion } from "framer-motion";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";
import { useAppStore } from "@store/useAppStore.js";

export default function CircleRadiusInput({ onConfirm, onCancel }) {
  const { radiusKm, setRadiusKm } = useAppStore();
  const [localRadius, setLocalRadius] = useState(radiusKm);

  const handleConfirm = () => {
    setRadiusKm(localRadius);
    onConfirm(localRadius);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[99999]"
    >
      <ProximityGlow className="rounded-xl" c1="rgba(59,130,246,0.4)" c2="rgba(34,197,94,0.3)">
        <div className="bg-slate-900/95 backdrop-blur-lg border border-white/20 rounded-xl p-6 shadow-2xl">
          <div className="text-white font-semibold text-lg mb-4">Definir Radio del Círculo</div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Radio (km)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  max="22.5"
                  step="0.1"
                  value={localRadius}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      setLocalRadius(Math.min(22.5, Math.max(0.1, value)));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirm();
                    } else if (e.key === 'Escape') {
                      onCancel();
                    }
                  }}
                  className="w-full bg-black text-white border border-slate-600 rounded-lg px-4 py-2 pr-12 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
                  placeholder="Ingresa el radio"
                  autoFocus
                />
                <div className="absolute right-3 top-2 text-slate-400 text-sm pointer-events-none">km</div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Máximo: 22.5 km (diámetro 45 km)
              </div>
            </div>

            <div className="bg-slate-800/30 rounded-lg p-3">
              <div className="text-xs text-slate-300">
                <strong>Área aproximada:</strong> {(Math.PI * Math.pow(localRadius, 2)).toFixed(1)} km²
              </div>
              <div className="text-xs text-slate-300">
                <strong>Diámetro:</strong> {(localRadius * 2).toFixed(1)} km
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-500 hover:to-green-500 transition-all duration-200"
              >
                Crear Círculo
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </ProximityGlow>
    </motion.div>
  );
}