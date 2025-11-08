import { useAppStore } from "@store/useAppStore.js";
import ThreeGlobeView from "@components/ThreeGlobeView.jsx";
import LeafletSatelliteView from "@components/LeafletSatelliteView.jsx";

export default function Globe3DSelector() {
  const { globe3DMode, setGlobe3DMode } = useAppStore();

  const renderGlobeView = () => {
    switch (globe3DMode) {
      case "three":
        return <ThreeGlobeView />;
      case "satellite":
      default:
        return <LeafletSatelliteView />;
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Selector de tipo de globo */}
      <div 
        style={{
          position: "absolute",
          top: "60px",
          left: "20px",
          background: "rgba(255,255,255,0.95)",
          padding: "12px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 1000,
          minWidth: "200px"
        }}
      >
        <div style={{ marginBottom: "8px", fontSize: "12px", fontWeight: "600", color: "#374151" }}>
          Tipo de Globo 3D:
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="radio"
              name="globeType"
              value="satellite"
              checked={globe3DMode === "satellite"}
              onChange={(e) => setGlobe3DMode(e.target.value)}
              style={{ margin: 0 }}
            />
            <span style={{ fontSize: "12px" }}>🛰️ Vista Satelital (Actual)</span>
          </label>
          

          
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="radio"
              name="globeType"
              value="three"
              checked={globe3DMode === "three"}
              onChange={(e) => setGlobe3DMode(e.target.value)}
              style={{ margin: 0 }}
            />
            <span style={{ fontSize: "12px" }}>🎮 Three.js (Interactivo)</span>
          </label>
        </div>
      </div>

      {/* Renderizar el globo seleccionado */}
      {renderGlobeView()}
    </div>
  );
}