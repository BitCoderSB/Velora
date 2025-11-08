import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import { useAppStore } from "@store/useAppStore.js";

const makePoint = (lat, lon) => [{ lat, lng: lon }];

export default function GlobeView() {
  const { lat, lon, setCoords } = useAppStore();
  const elRef = useRef(null);
  const globeRef = useRef(null);

  useEffect(() => {
    console.log("GlobeView mounting...");
    if (!elRef.current) {
      console.log("No element ref available");
      return;
    }

    try {
      console.log("Initializing Globe...", Globe);
      if (!Globe) {
        console.error("Globe.gl library not available");
        return;
      }
      
      const g = Globe({
        rendererConfig: {
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }
      })(elRef.current)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundColor("#ffffff")
        .pointOfView({ lat, lng: lon, altitude: 1.8 })
        .rendererSize(
          elRef.current.clientWidth * window.devicePixelRatio, 
          elRef.current.clientHeight * window.devicePixelRatio
        )
        // capa de puntos (pin)
        .pointsData(makePoint(lat, lon))
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointAltitude(() => 0.01)   // altura del pin
        .pointRadius(() => 0.6)      // tamaño del pin
        .pointColor(() => "#EF4444") // color del pin
        .onGlobeClick(({ lat: la, lng: lo }) => {
          setCoords(la, lo);                // actualiza store
          g.pointsData(makePoint(la, lo));  // mueve el pin
          g.pointOfView({ lat: la, lng: lo, altitude: 1.8 }, 600);
        });

      globeRef.current = g;

      const ro = new ResizeObserver(() => {
        if (elRef.current) {
          const width = elRef.current.clientWidth;
          const height = elRef.current.clientHeight;
          g.width(width)
           .height(height)
           .rendererSize(width * window.devicePixelRatio, height * window.devicePixelRatio);
        }
      });
      ro.observe(elRef.current);

      return () => ro.disconnect();
    } catch (error) {
      console.error("Error initializing Globe:", error);
    }
  }, []);

  // si lat/lon cambian por búsqueda o inputs, reubica el pin
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    g.pointsData(makePoint(lat, lon));
    g.pointOfView({ lat, lng: lon, altitude: 1.8 }, 600);
  }, [lat, lon]);



  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={elRef} style={{ width: "100%", height: "100%" }} />
      <div 
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#666",
          fontSize: "14px"
        }}
      >
        {!globeRef.current && "Cargando globo 3D..."}
      </div>
    </div>
  );
}
