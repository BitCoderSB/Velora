import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useAppStore } from "@store/useAppStore.js";

// Token de Mapbox desde variables de entorno (Vite)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapboxView() {
  const { lat, lon, setCoords, panelVisible, setMapMode } = useAppStore();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Estado y refs para auto-rotación
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateOnlyWhenGlobe, setRotateOnlyWhenGlobe] = useState(true);
  const rafId = useRef(null);
  const lastTs = useRef(0);
  const resumeTimer = useRef(null);
  const interacting = useRef(false);
  // Rotar solo cuando el globo se ve completo (zoom bajo)
  const ROTATE_ZOOM_MAX = 2.0; // ajusta este valor a tu preferencia

  // Estado para el punto seleccionado
  const [selectedPoint, setSelectedPoint] = useState(null);

  // Función para cambiar a modo 2D simplificada
  const switchTo2DWithAreaSelection = () => {
    if (!selectedPoint) {
      alert('Primero haz clic en un punto del mapa para seleccionar la ubicación');
      return;
    }
    
    // Actualizar coordenadas del store con el punto seleccionado
    setCoords(selectedPoint.lat, selectedPoint.lng);
    
    // Cambiar a modo 2D
    setMapMode('2d');
  };

  const handleMapClick = (e) => {
    // Click para seleccionar punto y mover pin
    const { lng, lat: clickedLat } = e.lngLat;
    
    // Guardar el punto seleccionado
    setSelectedPoint({ lng, lat: clickedLat });
    
    stopRotation();
    if (resumeTimer.current) clearTimeout(resumeTimer.current);

    setCoords(clickedLat, lng);
    markerRef.current?.setLngLat([lng, clickedLat]);
    mapRef.current.flyTo({ center: [lng, clickedLat], zoom: Math.max(mapRef.current.getZoom(), 6), duration: 1000 });
  };



  const stopRotation = () => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    lastTs.current = 0;
  };

  const step = (ts) => {
    const map = mapRef.current;
    if (!map || !autoRotate) return;
    if (!lastTs.current) lastTs.current = ts;
    const dt = (ts - lastTs.current) / 1000; // segundos
    lastTs.current = ts;
    const speedDegPerSec = 2; // velocidad de rotación
    const c = map.getCenter();
    map.setCenter([c.lng + speedDegPerSec * dt, c.lat]);
    rafId.current = requestAnimationFrame(step);
  };

  const startRotation = () => {
    if (!mapRef.current || !autoRotate) return;
    // Evitar competir con una interacción en curso
    if (interacting.current) return;
    // Solo rotar si el zoom está lo suficientemente alejado
    const z = mapRef.current.getZoom();
    if (rotateOnlyWhenGlobe && z > ROTATE_ZOOM_MAX) return;
    if (rafId.current) return;
    rafId.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (mapRef.current) return; // solo una vez

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      // Usar estilo con etiquetas sobre satélite
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      projection: "globe",
      center: [lon, lat],
      zoom: 2,
      pitch: 0,
      bearing: 0,
      antialias: true,
    });
    mapRef.current = map;

    map.on("style.load", () => {
      try {
        if (map.setFog) {
          map.setFog({
            range: [0.5, 10],
            color: "#ffffff",
            "horizon-blend": 0.1,
            "high-color": "#add8e6",
            "space-color": "#000000",
            "star-intensity": 0.15,
          });
        }
        // Asegurar visibilidad de etiquetas en el globo
        if (map.getStyle && map.setLayoutProperty) {
          const layers = map.getStyle().layers || [];
          layers.forEach((ly) => {
            if (
              ly.type === "symbol" ||
              (ly.id && /label|place|country|state|settlement|poi/i.test(ly.id))
            ) {
              try { map.setLayoutProperty(ly.id, "visibility", "visible"); } catch {}
            }
          });
        }
        // Habilitar paneo y rotación manual SIEMPRE (independiente del zoom)
        map.dragPan.enable();
        map.dragRotate.enable();
        if (map.touchZoomRotate && typeof map.touchZoomRotate.enable === "function") {
          map.touchZoomRotate.enable(true);
        }
        // Cambiar proyección según zoom y controlar solo la detención por acercamiento
        map.on("zoom", () => {
          const z = map.getZoom();
          if (z > 5 && map.setProjection) map.setProjection("mercator");
          else if (map.setProjection) map.setProjection("globe");

          // Si el usuario se acerca, parar rotación. El arranque se decide en 'idle'.
          if (rotateOnlyWhenGlobe && z > ROTATE_ZOOM_MAX) {
            stopRotation();
          }
        });
        // Iniciar rotación si está activada
        startRotation();
        
        // Click para mover pin y cambio de modo (incluye Ctrl+Click)
        map.on("click", handleMapClick);
      } catch (e) {
        console.warn("Globe features not available:", e);
      }
    });

    // Marcador inicial
    markerRef.current = new mapboxgl.Marker({ color: "#EF4444", scale: 1.2 })
      .setLngLat([lon, lat])
      .addTo(map);



    // Controles de navegación
  // Controles de navegación con brújula (indica que se puede rotar)
  map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

  // Pausar en cualquier inicio de interacción y marcar estado
    const onInteractStart = () => {
      interacting.current = true;
      stopRotation();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
    map.on("dragstart", onInteractStart);
    map.on("zoomstart", onInteractStart);
    map.on("rotatestart", onInteractStart);
    map.on("pitchstart", onInteractStart);
    map.on("mousedown", onInteractStart);
    map.on("touchstart", onInteractStart);
    map.on("wheel", onInteractStart);

    // Reconsiderar reanudar sólo cuando el mapa esté completamente en reposo
    map.on("idle", () => {
      interacting.current = false;
      if (!autoRotate) return;
      const z = map.getZoom();
      if (rotateOnlyWhenGlobe && z > ROTATE_ZOOM_MAX) return;
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      resumeTimer.current = setTimeout(() => {
        if (!interacting.current) startRotation();
      }, 600);
    });

    return () => {
      stopRotation();
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Ajustar el canvas del mapa cuando cambie el tamaño del contenedor (p.ej., al ocultar/mostrar panel)
  useEffect(() => {
    const el = mapContainerRef.current;
    const map = mapRef.current;
    if (!el || !map) return;
    const ro = new ResizeObserver(() => {
      try { map.resize(); } catch {}
    });
    ro.observe(el);
    const onTransitionEnd = () => { try { map.resize(); } catch {} };
    el.addEventListener("transitionend", onTransitionEnd);
    window.addEventListener("resize", onTransitionEnd);
    return () => {
      ro.disconnect();
      el.removeEventListener("transitionend", onTransitionEnd);
      window.removeEventListener("resize", onTransitionEnd);
    };
  }, []);

  // Tras el toggle del panel, esperar el fin de la animación y forzar resize
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const timeout = setTimeout(() => {
      try { map.resize(); } catch {}
    }, 320); // coincide con Tailwind duration-300
    return () => clearTimeout(timeout);
  }, [panelVisible]);

  // Seguir cambios de coordenadas desde el store
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (map && marker) {
      marker.setLngLat([lon, lat]);
      map.flyTo({ center: [lon, lat], zoom: Math.max(map.getZoom(), 6), duration: 1000 });
    }
  }, [lat, lon]);





  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", borderRadius: "inherit" }} />
      
      {/* Indicaciones visuales */}
      <div className="absolute bottom-4 left-4 z-[99999]">
        <div className="bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium border border-white/20 pointer-events-none mb-2">
          🌍 Modo 3D • Haz clic en un punto del mapa
        </div>
        
        {selectedPoint && (
          <button
            onClick={switchTo2DWithAreaSelection}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 pointer-events-auto shadow-lg border border-white/20"
          >
            📍 Seleccionar área personalizada
          </button>
        )}
      </div>
    </div>
  );
}
