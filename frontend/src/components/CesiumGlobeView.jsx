import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { useAppStore } from "@store/useAppStore.js";

// Token de Cesium - Necesitas registrarte en https://cesium.com/ion/ para obtener tu token gratuito
// Por ahora usaremos OpenStreetMap sin token
Cesium.Ion.defaultAccessToken = "tu-token-aqui";

export default function CesiumGlobeView() {
  const { lat, lon, setCoords } = useAppStore();
  const cesiumContainer = useRef(null);
  const viewer = useRef(null);
  const markerEntity = useRef(null);

  useEffect(() => {
    if (viewer.current) return;

    // Crear el visor de Cesium con OpenStreetMap
    viewer.current = new Cesium.Viewer(cesiumContainer.current, {
      // Usar OpenStreetMap en lugar de Ion
      imageryProvider: new Cesium.OpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org/'
      }),
      
      // UI Controls
      homeButton: false,
      sceneModePicker: false, // Mantener solo modo globo
      baseLayerPicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      vrButton: false,
      geocoder: false,
      infoBox: false,
      selectionIndicator: false,
      
      // Configuraciones visuales
      skyBox: new Cesium.SkyBox({
        sources: {
          positiveX: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg',
          negativeX: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg',
          positiveY: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg',
          negativeY: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg',
          positiveZ: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg',
          negativeZ: 'https://cesium.com/downloads/cesiumjs/releases/1.95/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'
        }
      }),
      contextOptions: {
        webgl: {
          alpha: false,
          antialias: true,
          preserveDrawingBuffer: true,
          failIfMajorPerformanceCaveat: false
        }
      }
    });

    // Configurar la cámara inicial
    viewer.current.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 20000000),
      orientation: {
        heading: 0.0,
        pitch: -Cesium.Math.PI_OVER_TWO,
        roll: 0.0
      }
    });

    // Crear marcador inicial con estilo personalizado
    markerEntity.current = viewer.current.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      billboard: {
        image: createPinIcon(),
        show: true,
        pixelOffset: new Cesium.Cartesian2(0, -40),
        eyeOffset: new Cesium.Cartesian3(0.0, 0.0, 0.0),
        horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        scale: 1.0,
        scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5)
      }
    });

    // Event listener para clicks en el globo
    viewer.current.cesiumWidget.canvas.addEventListener('click', (event) => {
      const pickedPosition = viewer.current.camera.pickEllipsoid(
        new Cesium.Cartesian2(event.clientX, event.clientY),
        viewer.current.scene.globe.ellipsoid
      );

      if (pickedPosition) {
        const cartographic = Cesium.Cartographic.fromCartesian(pickedPosition);
        const clickedLon = Cesium.Math.toDegrees(cartographic.longitude);
        const clickedLat = Cesium.Math.toDegrees(cartographic.latitude);

        // Actualizar coordenadas en el store
        setCoords(clickedLat, clickedLon);

        // Mover marcador
        markerEntity.current.position = Cesium.Cartesian3.fromDegrees(clickedLon, clickedLat);

        // Volar hacia la nueva posición
        viewer.current.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(clickedLon, clickedLat, 10000000),
          duration: 2.0
        });
      }
    });

    // Configuraciones adicionales de calidad
    viewer.current.scene.globe.enableLighting = true;
    viewer.current.scene.fog.enabled = true;
    viewer.current.scene.skyAtmosphere.show = true;

    // Cleanup
    return () => {
      if (viewer.current && !viewer.current.isDestroyed()) {
        viewer.current.destroy();
        viewer.current = null;
      }
    };
  }, []);

  // Actualizar posición cuando cambian las coordenadas
  useEffect(() => {
    if (viewer.current && markerEntity.current) {
      markerEntity.current.position = Cesium.Cartesian3.fromDegrees(lon, lat);
      viewer.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 10000000),
        duration: 2.0
      });
    }
  }, [lat, lon]);

  // Función para crear el icono del pin
  function createPinIcon() {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    // Dibujar pin rojo
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(24, 20, 18, 0, 2 * Math.PI);
    ctx.fill();

    // Borde blanco
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Punta del pin
    ctx.beginPath();
    ctx.moveTo(24, 38);
    ctx.lineTo(12, 20);
    ctx.lineTo(36, 20);
    ctx.closePath();
    ctx.fill();

    return canvas;
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div 
        ref={cesiumContainer} 
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
          background: "rgba(0,0,0,0.8)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "12px",
          fontWeight: "500",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
        }}
      >
        🌍 Globo 3D Real - Cesium
      </div>
    </div>
  );
}