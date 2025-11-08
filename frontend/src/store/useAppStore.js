import { create } from "zustand";
import { dateISOToDoy } from "@lib/mapping.js";
import { fetchSample } from "@lib/fetchLocal.js";

export const useAppStore = create((set, get) => ({
  lat: 19.4326,
  lon: -99.1332,
  date_of_interest: "2023-07-15",
  engine: "logistic",
  window_days: 7,
  spatial_mode: "nearest",
  area_km: 25,
  // Map mode: 2d | 3d
  mapMode: "2d",

  panelVisible: true,
  thresholds: { very_hot_C: 32, very_wet_mm: 10, very_windy_ms: 10 },

  // Area selection states
  selectionMode: null, // 'circle' | 'pen' | null
  selectionShape: null, // GeoJSON Polygon
  selectionCenter: null, // [lng, lat]
  radiusKm: 10, // Default radius for circle mode
  isDrawing: false,
  drawingPoints: [], // Temporary points while drawing

  data: null, loading: false, error: null,

  setMapMode: (m) => set({ mapMode: m }),
  togglePanel: () => set((state) => ({ panelVisible: !state.panelVisible })),
  setCoords: (lat, lon) => set({ lat, lon }),
  setDate: (date) => set({ date_of_interest: date }),
  setEngine: (engine) => set({ engine }),
  setWindow: (n) => set({ window_days: n }),
  setSpatialMode: (m) => set({ spatial_mode: m }),
  setAreaKm: (v) => set({ area_km: v }),
  setThresholds: (t) => set({ thresholds: t }),
  setData: (d) => set({ data: d }),

  // Area selection actions
  setSelectionMode: (mode) => set({ selectionMode: mode, isDrawing: mode !== null, drawingPoints: [] }),
  setRadiusKm: (radius) => set({ radiusKm: Math.min(radius, 22.5) }), // Limit to 22.5km
  addDrawingPoint: (point) => set((state) => {
    const newPoints = [...state.drawingPoints, point];
    return { drawingPoints: newPoints };
  }),
  clearDrawing: () => set({ 
    isDrawing: false, 
    drawingPoints: [], 
    selectionMode: null, 
    selectionShape: null, 
    selectionCenter: null 
  }),
  completeSelection: (shape, center) => set({ 
    selectionShape: shape, 
    selectionCenter: center, 
    isDrawing: false, 
    selectionMode: null,
    drawingPoints: [],
    lat: center[1], // Update coordinates to center
    lon: center[0]
  }),

  calculate: async () => {
    set({ loading: true, error: null });
    const { date_of_interest, lat, lon } = get();
    
    try {
      const doy = dateISOToDoy(date_of_interest);
      
      // Mapear ubicaciones aproximadas a archivos de datos disponibles
      const sampleFiles = [
        { file: 'cdmx_doy20', lat: 19.32, lon: -99.15, doy: 20, region: 'México Central' },
        { file: 'puebla_doy190', lat: 19.04, lon: -98.20, doy: 190, region: 'México Central' },  
        { file: 'texas_doy355', lat: 31.26, lon: -98.55, doy: 355, region: 'Texas' },
        { file: 'españa_doy200', lat: 39.33, lon: -4.84, doy: 200, region: 'España' },
        { file: 'tamaulipas_doy1', lat: 23.99, lon: -98.70, doy: 1, region: 'México Norte' }
      ];
      
      // Encontrar el archivo más cercano por ubicación geográfica
      let bestMatch = sampleFiles[0];
      let minDistance = Math.sqrt(Math.pow(lat - bestMatch.lat, 2) + Math.pow(lon - bestMatch.lon, 2));
      
      for (const sample of sampleFiles) {
        const distance = Math.sqrt(Math.pow(lat - sample.lat, 2) + Math.pow(lon - sample.lon, 2));
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = sample;
        }
      }
      
      // Si no hay coincidencia exacta de DOY, usar el más cercano pero adaptar los datos
      let selectedFile = bestMatch.file;
      let dataAdaptation = {};
      
      // Si el DOY es muy diferente, intentar encontrar uno más cercano
      const doyDifference = Math.abs(doy - bestMatch.doy);
      if (doyDifference > 100) {
        // Buscar archivo con DOY más cercano
        let closestDoy = bestMatch;
        let minDoyDiff = doyDifference;
        
        for (const sample of sampleFiles) {
          const dayDiff = Math.abs(doy - sample.doy);
          if (dayDiff < minDoyDiff) {
            minDoyDiff = dayDiff;
            closestDoy = sample;
          }
        }
        
        if (minDoyDiff < doyDifference) {
          selectedFile = closestDoy.file;
          bestMatch = closestDoy;
        }
      }
      
      console.log(`🎯 Cargando datos de: ${selectedFile} (${bestMatch.region})`);
      console.log(`📍 Ubicación solicitada: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      console.log(`📍 Ubicación de datos: ${bestMatch.lat.toFixed(4)}, ${bestMatch.lon.toFixed(4)}`);
      console.log(`📅 DOY solicitado: ${doy}, DOY de datos: ${bestMatch.doy}`);
      
      const json = await fetchSample(`/data/samples/${selectedFile}.json`);
      
      // Adaptar datos para reflejar la ubicación y fecha solicitada
      const adaptedData = {
        ...json,
        originalLat: json.lat,
        originalLon: json.lon,
        originalDoy: json.doy,
        requestedLat: lat,
        requestedLon: lon,
        requestedDoy: doy,
        adaptationInfo: {
          region: bestMatch.region,
          locationDistance: minDistance.toFixed(2),
          dayDifference: Math.abs(doy - bestMatch.doy),
          dataSource: selectedFile
        }
      };
      
      set({ data: adaptedData, loading: false });
      
    } catch (error) {
      console.error('Error cargando datos de prueba:', error);
      set({ 
        loading: false, 
        error: "No hay datos disponibles para esta ubicación. Usando datos de prueba de Puebla." 
      });
      
      // Fallback a Puebla como último recurso
      try {
        const fallbackData = await fetchSample('/data/samples/puebla_doy190.json');
        set({ data: fallbackData, loading: false, error: null });
      } catch {
        set({ 
          loading: false, 
          error: "Error cargando datos de prueba. Verificar archivos en /public/data/samples/" 
        });
      }
    }
  },
}));
