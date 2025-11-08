import { MapContainer, TileLayer, Marker, useMap, useMapEvents, GeoJSON, Polyline } from "react-leaflet";
import { useState } from "react";
import L from "leaflet";
import { useAppStore } from "@store/useAppStore.js";
import AreaSelectionMenu from "@components/AreaSelectionMenu.jsx";
import CircleRadiusInput from "@components/CircleRadiusInput.jsx";
import { 
  generateCircleGeoJSON, 
  pointsToGeoJSON, 
  calculateCentroid, 
  validatePolygonDistance,
  isPointClose,
  calculateDistance 
} from "@lib/areaSelection.js";

// Icono personalizado rojo para el marcador
const customIcon = L.divIcon({
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

function ClickHandler({ onRightClick, onMapClick, onDoubleClick }) {
  const { setCoords, selectionMode, addDrawingPoint, drawingPoints, completeSelection, clearDrawing, selectionShape, selectionCenter } = useAppStore();
  
  useMapEvents({ 
    click(e) {
      if (selectionMode === 'pen') {
        onMapClick(e);
      } else if (!selectionMode) {
        // Si hay un área seleccionada, mostrar advertencia antes de cambiar coordenadas
        if (selectionShape && selectionCenter) {
          const areaType = selectionShape.geometry.type === 'Polygon' && 
            selectionShape.geometry.coordinates[0].length > 4 ? 'polígono dibujado' : 'área circular';
          
          const newLat = e.latlng.lat.toFixed(4);
          const newLon = e.latlng.lng.toFixed(4);
          const currentLat = selectionCenter[1].toFixed(4);
          const currentLon = selectionCenter[0].toFixed(4);
          
          const proceed = window.confirm(
            "⚠️ CAMBIO DE UBICACIÓN:\n\n" +
            `Tienes un ${areaType} seleccionado en:\n` +
            `📍 ${currentLat}, ${currentLon}\n\n` +
            "Si cambias a un nuevo punto:\n" +
            `📍 ${newLat}, ${newLon}\n\n` +
            "Se BORRARÁ tu área seleccionada.\n\n" +
            "¿Continuar y borrar el área?"
          );
          
          if (proceed) {
            clearDrawing();
            setCoords(e.latlng.lat, e.latlng.lng);
          }
        } else {
          setCoords(e.latlng.lat, e.latlng.lng);
        }
      }
    },
    dblclick(e) {
      if (selectionMode === 'pen' && drawingPoints.length >= 3) {
        onDoubleClick(e);
      }
    },
    contextmenu(e) {
      if (!selectionMode) {
        onRightClick(e);
      }
    }
  });
  return null;
}

function FollowCoords() {
  const { lat, lon } = useAppStore();
  const map = useMap();
  map.setView([lat, lon], map.getZoom());
  return null;
}

// Configuraciones de capas de mapa
const mapLayers = {
  street: {
    name: "🗺️ Mapa",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors"
  },
  satellite: {
    name: "🛰️ Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri, Maxar, Earthstar Geographics"
  }
};

export default function MapView() {
  const { 
    lat, lon, selectionMode, selectionShape, drawingPoints, mapMode,
    setSelectionMode, addDrawingPoint, completeSelection, clearDrawing 
  } = useAppStore();
  
  const [currentLayer, setCurrentLayer] = useState('street');
  const [showLabels, setShowLabels] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showRadiusInput, setShowRadiusInput] = useState(false);

  const selectedLayer = mapLayers[currentLayer];



  const handleRightClick = (e) => {
    // Convert map container coordinates to viewport coordinates
    const mapContainer = e.target.getContainer();
    const rect = mapContainer.getBoundingClientRect();
    setMenuPosition({ 
      x: rect.left + e.containerPoint.x, 
      y: rect.top + e.containerPoint.y 
    });
    setShowMenu(true);
  };

  const handleSelectCircle = () => {
    // Si ya hay un área seleccionada, preguntar si quiere reemplazarla
    if (selectionShape) {
      const currentAreaType = selectionShape.geometry.type === 'Polygon' && 
        selectionShape.geometry.coordinates[0].length > 4 ? 'polígono dibujado' : 'área circular';
      
      const replace = window.confirm(
        `⚠️ Ya tienes un ${currentAreaType} seleccionado.\n\n` +
        `Si continúas, se borrará y se creará un NUEVA ÁREA CIRCULAR.\n\n` +
        `¿Estás seguro de que quieres continuar?`
      );
      
      if (!replace) {
        setShowMenu(false);
        return;
      }
      clearDrawing();
    }
    
    setShowMenu(false);
    setShowRadiusInput(true);
    setSelectionMode('circle');
  };

  const handleSelectPen = () => {
    // Si ya hay un área seleccionada, preguntar si quiere reemplazarla
    if (selectionShape) {
      const currentAreaType = selectionShape.geometry.type === 'Polygon' && 
        selectionShape.geometry.coordinates[0].length > 4 ? 'polígono dibujado' : 'área circular';
      
      const replace = window.confirm(
        `⚠️ Ya tienes un ${currentAreaType} seleccionado.\n\n` +
        `Si continúas, se borrará y podrás DIBUJAR UN NUEVO POLÍGONO.\n\n` +
        `¿Estás seguro de que quieres continuar?`
      );
      
      if (!replace) {
        setShowMenu(false);
        return;
      }
      clearDrawing();
    }
    
    setShowMenu(false);
    setSelectionMode('pen');
  };

  const handleConfirmRadius = (radius) => {
    setShowRadiusInput(false);
    const shape = generateCircleGeoJSON(lat, lon, radius);
    completeSelection(shape, [lon, lat]);
  };

  const handleCancelRadius = () => {
    setShowRadiusInput(false);
    clearDrawing();
  };

  const handleMapClick = (e) => {
    if (selectionMode === 'pen') {
      const newPoint = { lat: e.latlng.lat, lon: e.latlng.lng };
      
      // Check if clicking near the first point to close polygon (increased threshold)
      if (drawingPoints.length >= 3) {
        const firstPoint = drawingPoints[0];
        if (isPointClose(newPoint, firstPoint, 1.5)) {
          // Close polygon
          if (validatePolygonDistance(drawingPoints)) {
            const shape = pointsToGeoJSON(drawingPoints);
            const center = calculateCentroid(drawingPoints);
            completeSelection(shape, center);
          } else {
            alert('El polígono excede el límite de 40 km desde el punto inicial');
            clearDrawing();
          }
          return;
        }
      }
      
      // Validate distance from first point
      if (drawingPoints.length > 0) {
        const distance = calculateDistance(
          drawingPoints[0].lat, drawingPoints[0].lon,
          newPoint.lat, newPoint.lon
        );
        if (distance > 40) {
          alert('El punto debe estar a menos de 40 km del punto inicial');
          return;
        }
      }
      
      addDrawingPoint(newPoint);
    }
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  // Función para finalizar polígono manualmente
  const handleFinishPolygon = () => {
    if (drawingPoints.length >= 3) {
      if (validatePolygonDistance(drawingPoints)) {
        const shape = pointsToGeoJSON(drawingPoints);
        const center = calculateCentroid(drawingPoints);
        completeSelection(shape, center);
      } else {
        alert('El polígono excede el límite de 40 km desde el punto inicial');
        clearDrawing();
      }
    } else {
      alert('Necesitas al menos 3 puntos para crear un polígono');
    }
  };

  // Manejador para doble clic que cierra el polígono
  const handleDoubleClick = (e) => {
    if (drawingPoints.length >= 3) {
      handleFinishPolygon();
    }
  };

  // Style for selected area
  const areaStyle = {
    color: '#ef4444', // Red border
    weight: 2,
    fillColor: '#ef4444',
    fillOpacity: 0.2
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Selector de capas */}
      <div 
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(15, 23, 42, 0.95)",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          zIndex: 1000,
          minWidth: "150px",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)"
        }}
      >
        <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600", color: "#f1f5f9" }}>
          Tipo de Mapa:
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {Object.entries(mapLayers).map(([key, layer]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="radio"
                name="mapLayer"
                value={key}
                checked={currentLayer === key}
                onChange={(e) => setCurrentLayer(e.target.value)}
                style={{ margin: 0 }}
              />
              <span style={{ fontSize: "12px", fontWeight: currentLayer === key ? "600" : "400", color: "#f1f5f9" }}>
                {layer.name}
              </span>
            </label>
          ))}
        </div>

        {/* Toggle para etiquetas en modo satélite */}
        {currentLayer === 'satellite' && (
          <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                style={{ margin: 0 }}
              />
              <span style={{ fontSize: "11px", color: "#f1f5f9" }}>📍 Mostrar etiquetas</span>
            </label>
          </div>
        )}
      </div>

      {/* Indicaciones visuales */}
      <div className="absolute bottom-4 left-4 z-[99999] mb-12">
        <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium border border-white/20 pointer-events-none">
          💡 Clic derecho para seleccionar área
        </div>
        {selectionShape && (
          <button
            onClick={() => {
              clearDrawing();
            }}
            className="mt-2 bg-red-600/90 hover:bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-medium border border-red-400/30 transition-colors pointer-events-auto"
          >
            🗑️ Limpiar área
          </button>
        )}
      </div>

      {/* Drawing instructions and controls */}
      {selectionMode === 'pen' && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[99999] flex flex-col items-center gap-2">
          <div className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium border border-red-400/30 shadow-lg pointer-events-none">
            ✏️ Dibuja el área • Máximo 40km del inicio • {drawingPoints.length >= 3 ? 'Doble clic o botón para finalizar' : `${drawingPoints.length}/3 puntos mínimos`}
          </div>
          {drawingPoints.length >= 3 && (
            <button
              onClick={handleFinishPolygon}
              className="bg-green-600/90 hover:bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium border border-green-400/30 shadow-lg transition-colors pointer-events-auto"
            >
              ✅ Finalizar Polígono ({drawingPoints.length} puntos)
            </button>
          )}
          <button
            onClick={() => clearDrawing()}
            className="mt-2 mx-auto block bg-gray-600/90 hover:bg-gray-500/90 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-medium border border-gray-400/30 transition-colors pointer-events-auto"
          >
            ❌ Cancelar
          </button>
        </div>
      )}

      {/* Mapa */}
      <MapContainer center={[lat, lon]} zoom={10} style={{ width:"100%", height:"100%" }}>
        {/* Capa base */}
        <TileLayer 
          key={currentLayer}
          attribution={selectedLayer.attribution} 
          url={selectedLayer.url}
        />
        
        {/* Capa de etiquetas para modo satélite */}
        {currentLayer === 'satellite' && showLabels && (
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution="&copy; Esri"
          />
        )}
        
        {/* Selected area shape */}
        {selectionShape && (
          <GeoJSON 
            key={JSON.stringify(selectionShape)}
            data={selectionShape} 
            style={areaStyle}
          />
        )}
        
        {/* Líneas de conexión mientras se dibuja */}
        {selectionMode === 'pen' && drawingPoints.length > 1 && (
          <Polyline
            positions={drawingPoints.map(point => [point.lat, point.lon])}
            pathOptions={{
              color: '#ef4444',
              weight: 2,
              opacity: 0.8,
              dashArray: '5, 5'
            }}
          />
        )}

        {/* Línea de cierre sugerida cuando hay 3+ puntos */}
        {selectionMode === 'pen' && drawingPoints.length >= 3 && (
          <Polyline
            positions={[
              [drawingPoints[drawingPoints.length - 1].lat, drawingPoints[drawingPoints.length - 1].lon],
              [drawingPoints[0].lat, drawingPoints[0].lon]
            ]}
            pathOptions={{
              color: '#10b981',
              weight: 2,
              opacity: 0.6,
              dashArray: '10, 5'
            }}
          />
        )}

        {/* Drawing points while in pen mode - Enhanced first point when ready to close */}
        {selectionMode === 'pen' && drawingPoints.map((point, index) => (
          <Marker 
            key={index}
            position={[point.lat, point.lon]} 
            icon={L.divIcon({
              className: 'drawing-point',
              html: `<div style="
                width: ${index === 0 && drawingPoints.length >= 3 ? '24px' : '20px'};
                height: ${index === 0 && drawingPoints.length >= 3 ? '24px' : '20px'};
                background: ${index === 0 && drawingPoints.length >= 3 ? '#10b981' : '#ef4444'};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                position: relative;
                ${index === 0 && drawingPoints.length >= 3 ? 'animation: pulse-glow 2s infinite;' : ''}
              "></div>
              ${index === 0 && drawingPoints.length >= 3 ? `
              <style>
                @keyframes pulse-glow {
                  0%, 100% { 
                    transform: scale(1); 
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 0 0 0 rgba(16, 185, 129, 0.7);
                  }
                  50% { 
                    transform: scale(1.1); 
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 8px rgba(16, 185, 129, 0);
                  }
                }
              </style>` : ''}`,
              iconSize: [index === 0 && drawingPoints.length >= 3 ? 24 : 20, index === 0 && drawingPoints.length >= 3 ? 24 : 20],
              iconAnchor: [index === 0 && drawingPoints.length >= 3 ? 12 : 10, index === 0 && drawingPoints.length >= 3 ? 12 : 10]
            })}
          />
        ))}
        
        {/* Marcador personalizado */}
        <Marker position={[lat, lon]} icon={customIcon} />
        
        {/* Manejadores de eventos */}
        <ClickHandler onRightClick={handleRightClick} onMapClick={handleMapClick} onDoubleClick={handleDoubleClick} />
        <FollowCoords />
      </MapContainer>

      {/* Area Selection Menu */}
      <AreaSelectionMenu
        isOpen={showMenu}
        position={menuPosition}
        onSelectCircle={handleSelectCircle}
        onSelectPen={handleSelectPen}
        onClose={handleCloseMenu}
      />

      {/* Circle Radius Input */}
      {showRadiusInput && (
        <CircleRadiusInput
          onConfirm={handleConfirmRadius}
          onCancel={handleCancelRadius}
        />
      )}
    </div>
  );
}
