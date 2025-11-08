import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useAppStore } from "@store/useAppStore.js";

export default function MapboxView() {
  const { lat, lon, setCoords } = useAppStore();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    if (map.current) return;

    // Crear mapa sin token usando OpenStreetMap
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        "version": 8,
        "sources": {
          "osm": {
            "type": "raster",
            "tiles": [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            ],
            "tileSize": 256,
            "attribution": "© OpenStreetMap contributors"
          }
        },
        "layers": [
          {
            "id": "osm",
            "type": "raster",
            "source": "osm"
          }
        ]
      },
      center: [lon, lat],
      zoom: 3,
      antialias: true
    });

    // Esperar a que el mapa se cargue
    map.current.on("load", () => {
      // Crear marcador inicial
      marker.current = new mapboxgl.Marker({
        color: "#EF4444",
        scale: 1.2
      })
        .setLngLat([lon, lat])
        .addTo(map.current);

      // Event listener para clicks en el mapa
      map.current.on("click", (e) => {
        const { lng, lat: clickedLat } = e.lngLat;
        
        // Actualizar coordenadas en el store
        setCoords(clickedLat, lng);
        
        // Mover el marcador
        if (marker.current) {
          marker.current.setLngLat([lng, clickedLat]);
        }
        
        // Centrar el mapa en el nuevo punto
        map.current.flyTo({
          center: [lng, clickedLat],
          zoom: Math.max(map.current.getZoom(), 6),
          duration: 1000
        });
      });

      // Configurar controles de navegación
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Actualizar posición cuando cambian las coordenadas desde el store
  useEffect(() => {
    if (map.current && marker.current) {
      marker.current.setLngLat([lon, lat]);
      map.current.flyTo({
        center: [lon, lat],
        zoom: Math.max(map.current.getZoom(), 6),
        duration: 1000
      });
    }
  }, [lat, lon]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div 
        ref={mapContainer} 
        style={{ 
          width: "100%", 
          height: "100%",
          borderRadius: "inherit"
        }} 
      />
      
      {/* Loading indicator */}
      <div 
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(255,255,255,0.9)",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#666",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        🗺️ Vista 3D - OpenStreetMap
      </div>
    </div>
  );
}