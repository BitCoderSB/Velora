import { useEffect, useRef } from "react";
import { useAppStore } from "@store/useAppStore.js";

export default function SimpleGlobeView() {
  const { lat, lon, setCoords } = useAppStore();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Configurar canvas
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let rotation = 0;

    const drawGlobe = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.8;

      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dibujar fondo espacial
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0f0f15');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dibujar océanos (base del globo)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#2563eb';
      ctx.fill();
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Dibujar continentes simplificados
      ctx.fillStyle = '#10b981';
      
      // América
      ctx.beginPath();
      ctx.ellipse(centerX - radius * 0.3, centerY - radius * 0.2, radius * 0.15, radius * 0.4, rotation * 0.01, 0, 2 * Math.PI);
      ctx.fill();

      // Europa/África
      ctx.beginPath();
      ctx.ellipse(centerX + radius * 0.1, centerY - radius * 0.1, radius * 0.2, radius * 0.3, rotation * 0.01, 0, 2 * Math.PI);
      ctx.fill();

      // Asia
      ctx.beginPath();
      ctx.ellipse(centerX + radius * 0.4, centerY + radius * 0.1, radius * 0.25, radius * 0.2, rotation * 0.01, 0, 2 * Math.PI);
      ctx.fill();

      // Marcador de ubicación
      const markerX = centerX + Math.cos(lon * Math.PI / 180 + rotation * 0.01) * radius * 0.6 * Math.cos(lat * Math.PI / 180);
      const markerY = centerY - Math.sin(lat * Math.PI / 180) * radius * 0.6;

      ctx.beginPath();
      ctx.arc(markerX, markerY, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Líneas de latitud/longitud
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      
      // Líneas de latitud
      for (let i = -60; i <= 60; i += 30) {
        if (i !== 0) {
          const y = centerY - Math.sin(i * Math.PI / 180) * radius * 0.8;
          const width = Math.cos(i * Math.PI / 180) * radius * 0.8;
          ctx.beginPath();
          ctx.ellipse(centerX, y, width, width * 0.1, 0, 0, 2 * Math.PI);
          ctx.stroke();
        }
      }

      // Ecuador
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 0.8, radius * 0.08, 0, 0, 2 * Math.PI);
      ctx.stroke();

      rotation += 0.5;
      animationRef.current = requestAnimationFrame(drawGlobe);
    };

    drawGlobe();

    // Manejar clicks
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Convertir coordenadas de click a lat/lon aproximadas
      const relX = (x - centerX) / (canvas.width * 0.4);
      const relY = (centerY - y) / (canvas.height * 0.4);
      
      const newLon = Math.max(-180, Math.min(180, relX * 180));
      const newLat = Math.max(-90, Math.min(90, relY * 90));
      
      setCoords(newLat, newLon);
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('click', handleClick);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [lat, lon, setCoords]);

  return (
    <div className="relative w-full h-full bg-gray-900">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        style={{ background: 'radial-gradient(circle, #1a1a2e 0%, #0f0f15 100%)' }}
      />
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-sm">
        <div>Lat: {lat.toFixed(4)}°</div>
        <div>Lon: {lon.toFixed(4)}°</div>
      </div>
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg text-xs">
        Globe 3D - Click para cambiar ubicación
      </div>
    </div>
  );
}