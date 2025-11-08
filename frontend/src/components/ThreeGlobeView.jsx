import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useAppStore } from "@store/useAppStore.js";

export default function ThreeGlobeView() {
  const { lat, lon, setCoords } = useAppStore();
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const globeRef = useRef(null);
  const markerRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    if (sceneRef.current) return;

    // Configurar escena
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0x000011, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Crear geometría de la esfera (globo)
    const geometry = new THREE.SphereGeometry(5, 64, 64);
    
    // Cargar textura de la Tierra
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-day.jpg',
      () => renderer.render(scene, camera)
    );
    const bumpTexture = textureLoader.load(
      'https://unpkg.com/three-globe/example/img/earth-topology.png'
    );

    // Material del globo
    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.3,
      shininess: 0
    });

    // Crear el globo
    const globe = new THREE.Mesh(geometry, material);
    globeRef.current = globe;
    scene.add(globe);

    // Agregar luces
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    // Crear marcador
    const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    markerRef.current = marker;
    scene.add(marker);

    // Posicionar cámara
    camera.position.z = 15;

    // Convertir coordenadas geográficas a posición 3D
    function latLonToVector3(lat, lon, radius = 5.1) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      return new THREE.Vector3(x, y, z);
    }

    // Posicionar marcador inicial
    const initialPosition = latLonToVector3(lat, lon);
    marker.position.copy(initialPosition);

    // Variables para la rotación
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    // Event listeners para interacción
    const handleMouseDown = (event) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseMove = (event) => {
      if (isDragging) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };

        const deltaRotationQuaternion = new THREE.Quaternion()
          .setFromEuler(new THREE.Euler(
            deltaMove.y * 0.01,
            deltaMove.x * 0.01,
            0,
            'XYZ'
          ));

        globe.quaternion.multiplyQuaternions(deltaRotationQuaternion, globe.quaternion);
        marker.quaternion.multiplyQuaternions(deltaRotationQuaternion, marker.quaternion);

        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleClick = (event) => {
      if (!isDragging) {
        // Raycast para detectar click en el globo
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(globe);
        
        if (intersects.length > 0) {
          const point = intersects[0].point.normalize().multiplyScalar(5.1);
          
          // Convertir punto 3D a coordenadas geográficas
          const lat = Math.asin(point.y / 5.1) * (180 / Math.PI);
          const lon = Math.atan2(point.z, -point.x) * (180 / Math.PI) - 180;
          
          setCoords(lat, lon);
          marker.position.copy(point);
        }
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('click', handleClick);

    // Función de animación
    function animate() {
      requestAnimationFrame(animate);
      
      // Rotación automática suave
      if (!isDragging) {
        globe.rotation.y += 0.002;
        marker.rotation.y += 0.002;
      }
      
      renderer.render(scene, camera);
    }
    animate();

    // Manejar redimensionamiento
    const handleResize = () => {
      if (mountRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('click', handleClick);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Actualizar marcador cuando cambien las coordenadas
  useEffect(() => {
    if (markerRef.current) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(5.1 * Math.sin(phi) * Math.cos(theta));
      const y = 5.1 * Math.cos(phi);
      const z = 5.1 * Math.sin(phi) * Math.sin(theta);
      
      markerRef.current.position.set(x, y, z);
    }
  }, [lat, lon]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div 
        ref={mountRef} 
        style={{ 
          width: "100%", 
          height: "100%",
          borderRadius: "inherit",
          cursor: "grab"
        }} 
      />
      
      {/* Controles */}
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
          fontWeight: "500"
        }}
      >
        🌍 Globo 3D Interactivo - Arrastra para rotar
      </div>
    </div>
  );
}