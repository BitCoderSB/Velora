import { useState, useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { getAllUsers } from '../services/database.js';

/**
 * Componente simple de reconocimiento facial usando face-api.js
 * - Detecta rostros en tiempo real
 * - Registra usuarios con sus descriptores faciales
 * - Reconoce usuarios previamente registrados
 */
export default function FaceCaptureSimple({
  modelsPath = "/models",
  threshold = 0.6, // Umbral de similitud para reconocimiento (0-1)
  onUserRegistered = null,
  onUserRecognized = null,
  userData = null, // { firstName, lastName, email, etc. } para registro
}) {
  // Estados
  const [status, setStatus] = useState("loading"); // loading | ready | camera | detecting | processing | error
  const [errorMsg, setErrorMsg] = useState("");
  const [detectedFace, setDetectedFace] = useState(null);
  const [result, setResult] = useState(null);
  
  // Base de datos local de usuarios registrados - Ahora usa localStorage
  const [usersDatabase, setUsersDatabase] = useState([]);
  
  // Cargar usuarios de localStorage al inicio y periódicamente
  useEffect(() => {
    const loadUsers = () => {
      const users = getAllUsers();
      console.log('📂 Usuarios cargados desde localStorage:', users.length);
      setUsersDatabase(users);
    };
    
    loadUsers();
    
    // Recargar cada 2 segundos para detectar nuevos registros
    const interval = setInterval(loadUsers, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Referencias
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  /**
   * Carga los modelos de face-api.js al montar el componente
   */
  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        setStatus("loading");
        setErrorMsg("");

        // Cargar modelos necesarios
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelsPath),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
          faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
          faceapi.nets.faceExpressionNet.loadFromUri(modelsPath),
        ]);

        if (!mounted) return;
        console.log("✅ Modelos de face-api.js cargados");
        setStatus("ready");
      } catch (error) {
        if (!mounted) return;
        console.error("❌ Error cargando modelos:", error);
        setErrorMsg(`Error al cargar modelos: ${error.message}`);
        setStatus("error");
      }
    };

    loadModels();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [modelsPath]);

  /**
   * Inicia la cámara web
   */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStatus("camera");

        // Esperar a que el video esté listo y comenzar detección
        videoRef.current.onloadedmetadata = () => {
          startDetection();
        };
      }
    } catch (error) {
      setErrorMsg(`No se pudo acceder a la cámara: ${error.message}`);
      setStatus("error");
    }
  };

  /**
   * Detiene la cámara web
   */
  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("ready");
    setDetectedFace(null);
  };

  /**
   * Inicia la detección continua de rostros
   */
  const startDetection = () => {
    setStatus("detecting");

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      try {
        // Detectar rostro con landmarks y descriptor
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor()
          .withFaceExpressions();

        if (detection) {
          setDetectedFace(detection);
          drawDetection(detection);
        } else {
          setDetectedFace(null);
          clearCanvas();
        }
      } catch (error) {
        console.error("Error en detección:", error);
      }
    }, 100); // Detectar cada 100ms
  };

  /**
   * Dibuja la detección en el canvas
   */
  const drawDetection = (detection) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video) return;

    const displaySize = {
      width: video.videoWidth,
      height: video.videoHeight,
    };

    faceapi.matchDimensions(canvas, displaySize);

    const resizedDetections = faceapi.resizeResults(detection, displaySize);
    
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar caja del rostro
    faceapi.draw.drawDetections(canvas, resizedDetections);
    
    // Dibujar landmarks (puntos faciales)
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    
    // Dibujar expresiones
    faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
  };

  /**
   * Limpia el canvas
   */
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  /**
   * Registra un nuevo usuario
   */
  const handleRegister = async () => {
    if (!userData) {
      setErrorMsg("Faltan datos del usuario para registrar");
      return;
    }

    if (!detectedFace) {
      setErrorMsg("No se detecta ningún rostro. Colócate frente a la cámara.");
      return;
    }

    try {
      setStatus("processing");
      setResult(null);

      // Capturar múltiples descriptores para mayor precisión
      const descriptors = [];
      
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const detection = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          descriptors.push(detection.descriptor);
        }
      }

      if (descriptors.length === 0) {
        throw new Error("No se pudieron capturar descriptores faciales");
      }

      // Crear nuevo usuario
      const newUser = {
        id: Date.now().toString(),
        ...userData,
        descriptors: descriptors,
        registeredAt: new Date().toISOString(),
      };

      // Agregar a la base de datos local
      setUsersDatabase((prev) => [...prev, newUser]);

      setResult({
        type: "register",
        success: true,
        user: newUser,
      });

      if (onUserRegistered) {
        onUserRegistered(newUser);
      }

      console.log("✅ Usuario registrado:", newUser);
      setStatus("detecting");
    } catch (error) {
      setErrorMsg(`Error al registrar: ${error.message}`);
      setStatus("error");
      setTimeout(() => setStatus("detecting"), 3000);
    }
  };

  /**
   * Reconoce un usuario registrado
   */
  const handleRecognize = async () => {
    if (!detectedFace) {
      setErrorMsg("No se detecta ningún rostro. Colócate frente a la cámara.");
      return;
    }

    // Recargar usuarios desde localStorage antes de reconocer
    const freshUsers = getAllUsers();
    console.log('🔄 Recargando usuarios desde localStorage:', freshUsers.length);
    setUsersDatabase(freshUsers);

    if (freshUsers.length === 0) {
      setErrorMsg("No hay usuarios registrados en la base de datos");
      return;
    }

    try {
      setStatus("processing");
      setResult(null);

      const currentDescriptor = detectedFace.descriptor;

      // Comparar con todos los usuarios registrados
      let bestMatch = null;
      let bestDistance = Infinity;

      for (const user of freshUsers) {
        // Verificar que el usuario tenga descriptores
        if (!user.faceDescriptors || user.faceDescriptors.length === 0) {
          console.warn('⚠️ Usuario sin descriptores:', user.email);
          continue;
        }
        
        // Comparar con todos los descriptores del usuario
        for (const userDescriptor of user.faceDescriptors) {
          try {
            // Verificar que ambos descriptores tengan la misma longitud
            if (!userDescriptor || userDescriptor.length !== currentDescriptor.length) {
              console.warn(`⚠️ Descriptor inválido para ${user.firstName}: longitud ${userDescriptor?.length} vs ${currentDescriptor.length}`);
              continue;
            }
            
            const distance = faceapi.euclideanDistance(currentDescriptor, userDescriptor);
            
            console.log(`📊 Comparando con ${user.firstName}: distancia ${distance.toFixed(3)}`);
            
            if (distance < bestDistance) {
              bestDistance = distance;
              bestMatch = user;
            }
          } catch (err) {
            console.error(`❌ Error comparando con ${user.firstName}:`, err.message);
          }
        }
      }

      console.log(`🎯 Mejor coincidencia: ${bestMatch ? bestMatch.firstName : 'ninguna'}, distancia: ${bestDistance.toFixed(3)}, threshold: ${threshold}`);

      // Verificar si la distancia está dentro del umbral
      const similarity = 1 - bestDistance; // Convertir distancia a similitud
      const recognized = bestDistance < threshold;

      setResult({
        type: "recognize",
        success: recognized,
        user: recognized ? bestMatch : null,
        distance: bestDistance,
        similarity: similarity,
        confidence: (similarity * 100).toFixed(1),
      });

      if (recognized && onUserRecognized) {
        // Enviar datos adicionales para debugging
        onUserRecognized({
          ...bestMatch,
          id: bestMatch.faceId, // Usar faceId como id principal
          descriptor: currentDescriptor,
          matchDistance: bestDistance
        });
      }

      console.log(
        recognized
          ? `✅ Usuario reconocido: ${bestMatch.firstName} ${bestMatch.lastName} (distancia: ${bestDistance.toFixed(3)})`
          : `❌ Usuario no reconocido (distancia mínima: ${bestDistance.toFixed(3)}, threshold: ${threshold})`
      );

      setStatus("detecting");
    } catch (error) {
      console.error('❌ Error completo:', error);
      setErrorMsg(`Error al reconocer: ${error.message}`);
      setStatus("error");
      setTimeout(() => setStatus("detecting"), 3000);
    }
  };

  /**
   * Limpia la base de datos local
   */
  const clearDatabase = () => {
    if (confirm("¿Estás seguro de eliminar todos los usuarios registrados?")) {
      setUsersDatabase([]);
      setResult(null);
      console.log("🗑️ Base de datos limpiada");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-4 md:p-6 bg-white rounded-xl sm:rounded-2xl shadow-xl">
      {/* Header - Responsive */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {userData ? "Registro Facial" : "Verificación de Cliente"}
        </h2>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs sm:text-sm text-gray-600">
            Estado: <span className="font-semibold capitalize">{status}</span>
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            face-api.js
          </span>
        </div>
      </div>

      {/* Error Message - Responsive */}
      {errorMsg && (
        <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-xs sm:text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Video Container - Responsive */}
      <div className="relative mb-4 sm:mb-6 bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />

        {/* Guía de posicionamiento - Responsive */}
        {status === "detecting" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-64 sm:w-64 sm:h-80 border-2 sm:border-4 border-green-400 rounded-full opacity-30" />
          </div>
        )}

        {/* Indicador de no rostro detectado - Responsive */}
        {status === "detecting" && !detectedFace && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 p-4">
            <p className="text-white text-base sm:text-xl font-bold text-center">
              👤 Colócate frente a la cámara
            </p>
          </div>
        )}

        {/* Indicador de procesando - Responsive */}
        {status === "processing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center p-4">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-white border-t-transparent mx-auto mb-3 sm:mb-4" />
              <p className="text-white text-sm sm:text-base font-semibold">Procesando...</p>
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls - Responsive */}
      {status === "ready" && (
        <button
          onClick={startCamera}
          className="w-full mb-3 sm:mb-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 sm:py-3 text-sm sm:text-base rounded-lg transition"
        >
          📷 Activar Cámara
        </button>
      )}

      {(status === "camera" || status === "detecting" || status === "processing") && (
        <button
          onClick={stopCamera}
          className="w-full mb-3 sm:mb-4 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-semibold py-3 sm:py-3 text-sm sm:text-base rounded-lg transition"
        >
          ⏸️ Detener Cámara
        </button>
      )}

      {/* User Info for Registration - Responsive */}
      {userData && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm sm:text-base font-semibold text-blue-800 mb-2">Usuario a registrar:</h3>
          <p className="text-xs sm:text-sm text-blue-700 break-words">
            <span className="font-medium">Nombre:</span> {userData.firstName}{" "}
            {userData.lastName}
          </p>
          <p className="text-xs sm:text-sm text-blue-700 break-all">
            <span className="font-medium">Email:</span> {userData.email}
          </p>
        </div>
      )}

      {/* Instructions for Verification Mode - Responsive */}
      {!userData && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm sm:text-base font-semibold text-green-800 mb-2 flex items-center gap-2">
            <span>💡</span> Instrucciones
          </h3>
          <ol className="text-xs sm:text-sm text-green-700 space-y-1 list-decimal list-inside pl-1">
            <li>Activa la cámara</li>
            <li>Colócate frente a la cámara para que detecte tu rostro</li>
            <li>Haz clic en "Verificar y Cobrar" cuando esté listo</li>
            <li>El sistema verificará tu identidad</li>
          </ol>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 mb-6">
        {userData ? (
          <button
            onClick={handleRegister}
            disabled={status !== "detecting" || !detectedFace}
            className="w-full text-white font-bold py-4 rounded-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{
              background:
                status === "detecting" && detectedFace
                  ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
                  : "#9CA3AF",
            }}
          >
            📝 Registrar Usuario
          </button>
        ) : (
          <button
            onClick={handleRecognize}
            disabled={status !== "detecting" || !detectedFace}
            className="w-full text-white font-bold text-2xl py-6 rounded-2xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg hover:shadow-2xl transform hover:scale-105"
            style={{
              background:
                status === "detecting" && detectedFace
                  ? "linear-gradient(135deg, #10B981 0%, #34D399 100%)"
                  : "#9CA3AF",
            }}
          >
            � Verificar y Cobrar
          </button>
        )}
      </div>

      {/* Database Info - Solo mostrar en modo desarrollo/test (cuando userData no es null) - Responsive */}
      {userData !== null && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2 gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">
              Base de datos local ({usersDatabase.length} usuarios)
            </h3>
            {usersDatabase.length > 0 && (
              <button
                onClick={clearDatabase}
                className="text-xs text-red-600 hover:text-red-700 active:text-red-800 font-medium flex-shrink-0"
              >
                🗑️ Limpiar
              </button>
            )}
          </div>
          {usersDatabase.length > 0 ? (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {usersDatabase.map((user) => (
                <div
                  key={user.id}
                  className="text-xs sm:text-sm text-gray-600 bg-white p-2 rounded break-words"
                >
                  👤 {user.firstName} {user.lastName} <span className="break-all">({user.email})</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-gray-500">No hay usuarios registrados</p>
          )}
        </div>
      )}

      {/* Results - Responsive */}
      {result && (
        <div
          className={`p-3 sm:p-4 rounded-lg border-2 ${
            result.success
              ? "bg-green-50 border-green-300"
              : "bg-red-50 border-red-300"
          }`}
        >
          <h3 className="font-bold text-base sm:text-lg mb-2">
            {result.type === "register" ? "📝 Registro" : "🔍 Reconocimiento"}
          </h3>

          {result.type === "register" && result.success && (
            <div className="text-xs sm:text-sm space-y-1">
              <p className="text-green-600 font-bold">✅ Usuario registrado exitosamente</p>
              <p className="break-words">
                Nombre:{" "}
                <span className="font-semibold">
                  {result.user.firstName} {result.user.lastName}
                </span>
              </p>
              <p className="text-xs text-gray-500 font-mono break-all">ID: {result.user.id}</p>
            </div>
          )}

          {result.type === "recognize" && (
            <div className="text-xs sm:text-sm space-y-1">
              {result.success ? (
                <>
                  <p className="text-green-600 font-bold text-sm sm:text-base">
                    ✅ Usuario reconocido
                  </p>
                  <p className="break-words">
                    Nombre:{" "}
                    <span className="font-semibold">
                      {result.user.firstName} {result.user.lastName}
                    </span>
                  </p>
                  <p className="break-all">
                    Email:{" "}
                    <span className="font-mono text-xs">{result.user.email}</span>
                  </p>
                  <p>
                    Confianza: <span className="font-mono">{result.confidence}%</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Distancia: {result.distance.toFixed(3)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-600 font-bold text-sm sm:text-base">
                    ❌ Usuario no reconocido
                  </p>
                  <p className="text-gray-600">
                    No hay coincidencia con usuarios registrados
                  </p>
                  <p className="text-xs text-gray-500">
                    Distancia mínima: {result.distance.toFixed(3)} (umbral: {threshold})
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State - Responsive */}
      {status === "loading" && (
        <div className="text-center py-6 sm:py-8">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3 sm:mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Cargando modelos de IA...</p>
        </div>
      )}
    </div>
  );
}
