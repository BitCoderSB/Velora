import { useEffect, useRef } from "react";
import L from "leaflet";
import { useAppStore } from "@store/useAppStore.js";

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function LeafletSatelliteView() {
  const { lat, lon, setCoords } = useAppStore();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);

  useEffect(() => {
    if (mapInstance.current) return;

    // Crear mapa con vista satelital
    mapInstance.current = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: 3,
      zoomControl: true,
      attributionControl: true
    });

    // Capa satelital de Esri (gratuita)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri, Maxar, Earthstar Geographics',
        maxZoom: 18
      }
    );

    // Capa híbrida con etiquetas
    const labelsLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: '© Esri',
        maxZoom: 18
      }
    );

    // Agregar capas al mapa
    satelliteLayer.addTo(mapInstance.current);
    labelsLayer.addTo(mapInstance.current);

    // Crear marcador personalizado rojo
    const redIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 20px;
        height: 20px;
        background: #EF4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid #EF4444;
        "></div>
      </div>`,
      iconSize: [20, 28],
      iconAnchor: [10, 28]
    });

    // Agregar marcador inicial
    markerInstance.current = L.marker([lat, lon], { icon: redIcon })
      .addTo(mapInstance.current);

    // Event listener para clicks en el mapa
    mapInstance.current.on('click', (e) => {
      const { lat: clickedLat, lng } = e.latlng;
      
      // Actualizar coordenadas en el store
      setCoords(clickedLat, lng);
      
      // Mover marcador
      markerInstance.current.setLatLng([clickedLat, lng]);
      
      // Centrar mapa
      mapInstance.current.flyTo([clickedLat, lng], Math.max(mapInstance.current.getZoom(), 8), {
        duration: 1
      });
    });

    // Control de capas
    const baseLayers = {
      "Vista Satelital": L.layerGroup([satelliteLayer, labelsLayer]),
      "Solo Satelital": satelliteLayer
    };

    L.control.layers(baseLayers).addTo(mapInstance.current);

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Actualizar posición cuando cambian las coordenadas
  useEffect(() => {
    if (mapInstance.current && markerInstance.current) {
      markerInstance.current.setLatLng([lat, lon]);
      mapInstance.current.flyTo([lat, lon], Math.max(mapInstance.current.getZoom(), 8), {
        duration: 1
      });
    }
  }, [lat, lon]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: "100%", 
          height: "100%",
          borderRadius: "inherit"
        }} 
      />
      
      {/* Indicador de modo */}
      <div 
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          background: "rgba(255,255,255,0.95)",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#666",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          fontWeight: "500"
        }}
      >
        🛰️ Vista Satelital 3D
      </div>
    </div>
  );
}