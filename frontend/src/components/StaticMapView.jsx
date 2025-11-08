import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

// Ícono personalizado para el marcador
const customIcon = L.divIcon({
  html: `<div style="
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
    position: relative;
    animation: pulse 2s infinite;
  "></div>
  <style>
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }
  </style>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function StaticMapView({ lat, lon, zoom = 10 }) {
  // Capas de mapa disponibles
  const mapLayers = {
    street: {
      name: "Mapa",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "&copy; OpenStreetMap contributors"
    },
    satellite: {
      name: "Satélite", 
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* Mapa estático sin interacciones */}
      <MapContainer 
        center={[lat, lon]} 
        zoom={zoom} 
        className="w-full h-full"
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        dragging={false}
        keyboard={false}
        boxZoom={false}
        attributionControl={false}
      >
        {/* Capa base - satélite por defecto para resultados */}
        <TileLayer 
          url={mapLayers.satellite.url}
          maxZoom={18}
        />
        
        {/* Marcador de la ubicación */}
        <Marker position={[lat, lon]} icon={customIcon} />
      </MapContainer>
    </div>
  );
}