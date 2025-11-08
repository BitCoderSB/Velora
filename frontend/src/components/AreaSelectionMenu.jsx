import { motion, AnimatePresence } from "framer-motion";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";

export default function AreaSelectionMenu({ 
  isOpen, 
  position, 
  onSelectCircle, 
  onSelectPen, 
  onClose 
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="fixed z-[99999] pointer-events-auto"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <ProximityGlow className="rounded-xl" c1="rgba(59,130,246,0.3)" c2="rgba(168,85,247,0.2)">
          <div className="bg-slate-900/95 backdrop-blur-lg border border-white/20 rounded-xl p-4 shadow-2xl min-w-[200px]">
            <div className="text-white font-semibold text-sm mb-3">Seleccionar Área</div>
            
            <div className="space-y-2">
              <button
                onClick={onSelectCircle}
                className="w-full flex items-center space-x-3 px-3 py-2 text-white hover:bg-blue-600/20 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 rounded-full border-2 border-blue-400 flex items-center justify-center group-hover:border-blue-300">
                  <div className="w-3 h-3 rounded-full bg-blue-400 group-hover:bg-blue-300"></div>
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">Área Circular</div>
                  <div className="text-xs text-slate-400">Define radio (máx. 22.5 km)</div>
                </div>
              </button>

              <button
                onClick={onSelectPen}
                className="w-full flex items-center space-x-3 px-3 py-2 text-white hover:bg-purple-600/20 rounded-lg transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg border-2 border-purple-400 flex items-center justify-center group-hover:border-purple-300">
                  <svg className="w-4 h-4 text-purple-400 group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">Pluma Libre</div>
                  <div className="text-xs text-slate-400">Dibuja polígono (≤ 40 km)</div>
                </div>
              </button>
            </div>

            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </ProximityGlow>
      </motion.div>
    </AnimatePresence>
  );
}