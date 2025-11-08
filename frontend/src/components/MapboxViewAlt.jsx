import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useAppStore } from "@store/useAppStore.js";

// Token público de Mapbox - para producción obtén tu propio token en https://mapbox.com
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

export default function MapboxViewAlt() {
  const { lat, lon, setCoords, panelVisible } = useAppStore();
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);

  useEffect(() => {
    if (map.current) return;

    // Configuración básica que debería funcionar
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'simple-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'simple-tiles',
            minzoom: 0,
            maxzoom: 22
          }
        ]
      },
      center: [lon, lat],
      zoom: 2,
      projection: 'globe'
    });

    // Configuración del globo con atmospheric scattering
    map.current.on('style.load', () => {
      console.log('Alternative Mapbox style loaded');
      try {
        map.current.setFog({
          'color': 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6
        });
      } catch (error) {
        console.warn('Could not set fog:', error);
      }
    });

    // Crear marcador
    marker.current = new mapboxgl.Marker({
      color: '#EF4444',
      scale: 1.2
    })
    .setLngLat([lon, lat])
    .addTo(map.current);

    // Event listener para clicks
    map.current.on('click', (e) => {
      const { lng, lat: clickLat } = e.lngLat;
      setCoords(clickLat, lng);
      marker.current.setLngLat([lng, clickLat]);
      map.current.flyTo({
        center: [lng, clickLat],
        duration: 1000
      });
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Sincronizar coordenadas
  useEffect(() => {
    if (!map.current || !marker.current) return;
    
    marker.current.setLngLat([lon, lat]);
    map.current.flyTo({
      center: [lon, lat],
      duration: 1000
    });
  }, [lat, lon]);

  // Redimensionar con panel
  useEffect(() => {
    if (!map.current) return;
    
    const timer = setTimeout(() => {
      map.current.resize();
    }, 300);

    return () => clearTimeout(timer);
  }, [panelVisible]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '100%' }}
      className="mapbox-container"
    />
  );
}