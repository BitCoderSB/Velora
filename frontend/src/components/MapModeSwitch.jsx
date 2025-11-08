import { useAppStore } from "@store/useAppStore.js";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";

export default function MapModeSwitch() {
  const { mapMode, setMapMode } = useAppStore();
  return (
    <ProximityGlow className="rounded-2xl">
    <div className="flex items-center rounded-2xl p-1 bg-white/70 dark:bg-white/5 border border-white/60 dark:border-white/10 backdrop-blur-md shadow-sm">
      <button
        onClick={() => setMapMode("2d")}
        className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
          mapMode === "2d"
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-200"
            : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <span className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 5.447-2.724A1 1 0 0121 5.382v8.764a1 1 0 01-.553.894L15 17l-6-3z" />
          </svg>
          <span>2D</span>
        </span>
      </button>
      
      <button
        onClick={() => setMapMode("3d")}
        className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
          mapMode === "3d"
            ? "bg-white text-slate-900 shadow-sm dark:bg-slate-200"
            : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        }`}
      >
        <span className="flex items-center justify-center space-x-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9a9 9 0 01-9-9m9 0a9 9 0 00-9 9" />
          </svg>
          <span>3D</span>
        </span>
      </button>
    </div>
    </ProximityGlow>
  );
}
