import { useAppStore } from "@store/useAppStore.js";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";
import Downloads from "@components/Downloads.jsx";

export default function ActionsSection({ data, loading }) {
  const { calculate, error, lat, lon } = useAppStore();

  return (
    <div className="space-y-4">
      {/* Botón principal de cálculo */}
      <ProximityGlow className="rounded-lg" c1="rgba(34,197,94,0.32)" c2="rgba(59,130,246,0.28)">
        <button 
          onClick={calculate} 
          disabled={loading} 
          className="w-full px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Calculando...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Calcular Probabilidades</span>
            </>
          )}
        </button>
      </ProximityGlow>

      {/* Información del estado */}
      <div className="bg-slate-900/40 rounded-lg p-3 border border-slate-700">
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">Estado del análisis:</div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : data ? 'bg-green-500' : 'bg-slate-500'}`}></div>
          <span className="text-sm text-slate-700 dark:text-white">
            {loading ? 'Procesando datos...' : data ? 'Datos listos' : 'Esperando cálculo'}
          </span>
        </div>
        {data && (
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Coordenadas: {lat.toFixed(4)}, {lon.toFixed(4)}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-red-400">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Error en el cálculo</span>
          </div>
          <div className="text-xs text-red-300 mt-1">{error}</div>
        </div>
      )}

      {/* Downloads section */}
      {data && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-white mb-3">Descargas</h4>
          <Downloads />
        </div>
      )}
    </div>
  );
}