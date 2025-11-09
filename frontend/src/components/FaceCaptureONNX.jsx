import { useState, useRef, useEffect } from 'react';
import * as ort from 'onnxruntime-web';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * FaceCaptureONNX Component
 * 
 * Captura rostro con cámara, alinea por landmarks (MediaPipe), 
 * genera embeddings con ArcFace ONNX, y envía al backend.
 * 
 * Props:
 * - modelPath: ruta del modelo ONNX (default: "/models/arcface.onnx")
 * - embeddingDim: dimensión del embedding (default: 512)
 * - endpoints: { enroll, verify } URLs del backend
 * - onEnrolled: callback(userId) cuando enrolamiento exitoso
 * - onVerified: callback(result) cuando verificación exitosa
 */
export default function FaceCaptureONNX({
  modelPath = '/models/arcface.onnx',
  embeddingDim = 512,
  endpoints = {
    enroll: '/api/face/enroll',
    verify: '/api/face/verify'
  },
  onEnrolled = null,
  onVerified = null
}) {
  // Estados
  const [status, setStatus] = useState('loadingModels'); // loadingModels, cameraOn, noFace, ready, inferencing, error
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState(null);
  const [livenessCheck, setLivenessCheck] = useState(null); // 'blink' | 'turn' | null
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [provider, setProvider] = useState('');

  // Referencias
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const lastLandmarksRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Nombre y NIP para enrolamiento
  const [nombre, setNombre] = useState('');
  const [nipHash, setNipHash] = useState('');

  // ==================== HELPERS ====================

  /**
   * Normalización L2 de un vector
   */
  const l2norm = (vec) => {
    const sum = vec.reduce((acc, val) => acc + val * val, 0);
    const norm = Math.sqrt(sum);
    return vec.map(v => v / (norm + 1e-10));
  };

  /**
   * Promedia múltiples embeddings y normaliza
   */
  const averageEmbeddings = (embList) => {
    const dim = embList[0].length;
    const avg = new Array(dim).fill(0);
    for (const emb of embList) {
      for (let i = 0; i < dim; i++) {
        avg[i] += emb[i];
      }
    }
    for (let i = 0; i < dim; i++) {
      avg[i] /= embList.length;
    }
    return l2norm(avg);
  };

  /**
   * Convierte canvas a tensor NCHW Float32 [1,3,112,112] normalizado [0..1]
   */
  const toNCHWFloat32 = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, 112, 112);
    const data = imgData.data;
    const float32 = new Float32Array(1 * 3 * 112 * 112);

    for (let i = 0; i < 112 * 112; i++) {
      float32[i] = data[i * 4] / 255.0; // R
      float32[112 * 112 + i] = data[i * 4 + 1] / 255.0; // G
      float32[2 * 112 * 112 + i] = data[i * 4 + 2] / 255.0; // B
    }

    return float32;
  };

  /**
   * Alineación facial usando landmarks (ojos y nariz)
   * Aplica transformación afín a 112x112
   */
  const alignByLandmarks = (videoElement, landmarks) => {
    // MediaPipe devuelve landmarks normalizados [0..1]
    // Índices aproximados: ojo izq ~33, ojo der ~263, nariz ~1
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];
    const nose = landmarks[1];

    if (!leftEye || !rightEye || !nose) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 112;
    canvas.height = 112;
    const ctx = canvas.getContext('2d');

    const vw = videoElement.videoWidth;
    const vh = videoElement.videoHeight;

    // Convertir coordenadas normalizadas a píxeles
    const leftEyePx = { x: leftEye.x * vw, y: leftEye.y * vh };
    const rightEyePx = { x: rightEye.x * vw, y: rightEye.y * vh };
    const nosePx = { x: nose.x * vw, y: nose.y * vh };

    // Calcular ángulo de rotación
    const dx = rightEyePx.x - leftEyePx.x;
    const dy = rightEyePx.y - leftEyePx.y;
    const angle = Math.atan2(dy, dx);

    // Centro entre ojos
    const eyeCenterX = (leftEyePx.x + rightEyePx.x) / 2;
    const eyeCenterY = (leftEyePx.y + rightEyePx.y) / 2;

    // Escala: distancia entre ojos como referencia
    const eyeDist = Math.sqrt(dx * dx + dy * dy);
    const desiredEyeDist = 40; // píxeles en imagen 112x112
    const scale = desiredEyeDist / (eyeDist + 1e-10);

    // Aplicar transformación
    ctx.translate(56, 56); // centro del canvas
    ctx.rotate(-angle);
    ctx.scale(scale, scale);
    ctx.translate(-eyeCenterX, -eyeCenterY);
    ctx.drawImage(videoElement, 0, 0, vw, vh);

    return canvas;
  };

  /**
   * Verifica liveness: compara landmarks actuales con anteriores
   * Retorna true si hay suficiente cambio (movimiento)
   */
  const checkLivenessMovement = (currentLandmarks) => {
    if (!lastLandmarksRef.current) {
      lastLandmarksRef.current = currentLandmarks;
      return false;
    }

    // Comparar 3 puntos clave: ojos y nariz
    const indices = [33, 263, 1];
    let totalDist = 0;

    for (const idx of indices) {
      const curr = currentLandmarks[idx];
      const prev = lastLandmarksRef.current[idx];
      if (curr && prev) {
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        totalDist += Math.sqrt(dx * dx + dy * dy);
      }
    }

    lastLandmarksRef.current = currentLandmarks;

    // Umbral de movimiento
    const threshold = 0.02; // ajustable según pruebas
    return totalDist > threshold;
  };

  // ==================== CARGA DE MODELOS ====================

  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        setStatus('loadingModels');
        setErrorMsg('');

        // 1. Cargar MediaPipe Face Landmarker
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        if (!mounted) return;
        faceLandmarkerRef.current = landmarker;

        // 2. Cargar modelo ONNX ArcFace
        // Intentar WebGPU primero, luego WASM
        let session;
        let usedProvider = 'wasm';
        
        try {
          session = await ort.InferenceSession.create(modelPath, {
            executionProviders: ['webgpu']
          });
          usedProvider = 'webgpu';
        } catch (e) {
          console.warn('WebGPU no disponible, usando WASM:', e);
          session = await ort.InferenceSession.create(modelPath, {
            executionProviders: ['wasm']
          });
        }

        if (!mounted) return;
        sessionRef.current = session;
        setProvider(usedProvider);

        console.log('✅ Modelos cargados:', { provider: usedProvider });
        setStatus('ready');
      } catch (err) {
        console.error('Error cargando modelos:', err);
        if (mounted) {
          setErrorMsg(`Error al cargar modelos: ${err.message}`);
          setStatus('error');
        }
      }
    };

    loadModels();

    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [modelPath]);

  // ==================== CÁMARA ====================

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setStatus('cameraOn');
        detectFaceLoop();
      }
    } catch (err) {
      console.error('Error accediendo a cámara:', err);
      setErrorMsg(`No se pudo acceder a la cámara: ${err.message}`);
      setStatus('error');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setStatus('ready');
  };

  // ==================== DETECCIÓN DE ROSTRO ====================

  const detectFaceLoop = () => {
    const video = videoRef.current;
    if (!video || !faceLandmarkerRef.current) return;

    const detect = () => {
      if (status === 'inferencing' || !faceLandmarkerRef.current) {
        animationFrameRef.current = requestAnimationFrame(detect);
        return;
      }

      const results = faceLandmarkerRef.current.detectForVideo(
        video,
        performance.now()
      );

      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        setStatus('ready');
        // Dibujar landmarks en canvas (opcional)
        drawLandmarks(results.faceLandmarks[0]);
      } else {
        setStatus('noFace');
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const drawLandmarks = (landmarks) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;

    // Dibujar puntos clave
    landmarks.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, 2, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  // ==================== INFERENCIA ====================

  /**
   * Captura y genera embedding de una sola imagen
   */
  const captureEmbedding = async () => {
    const video = videoRef.current;
    if (!video || !faceLandmarkerRef.current || !sessionRef.current) {
      throw new Error('Modelos no listos');
    }

    // Detectar landmarks
    const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
    
    if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
      throw new Error('No se detectó rostro');
    }

    const landmarks = results.faceLandmarks[0];

    // Alinear rostro
    const alignedCanvas = alignByLandmarks(video, landmarks);
    if (!alignedCanvas) {
      throw new Error('Error en alineación facial');
    }

    // Convertir a tensor
    const inputTensor = toNCHWFloat32(alignedCanvas);
    const tensor = new ort.Tensor('float32', inputTensor, [1, 3, 112, 112]);

    // Inferencia
    const feeds = { input: tensor }; // Nota: el nombre "input" puede variar
    const outputs = await sessionRef.current.run(feeds);

    // Detectar output key automáticamente
    const outputKeys = Object.keys(outputs);
    let embeddingKey = outputKeys.find(k => k.includes('embedding') || k.includes('fc1'));
    if (!embeddingKey) embeddingKey = outputKeys[0]; // fallback al primero

    const outputTensor = outputs[embeddingKey];
    let embedding = Array.from(outputTensor.data);

    // Validar dimensión
    if (embedding.length !== embeddingDim) {
      console.warn(`Dimensión inesperada: ${embedding.length}, esperado: ${embeddingDim}`);
    }

    // Normalizar L2
    embedding = l2norm(embedding);

    return embedding;
  };

  // ==================== ENROLAMIENTO ====================

  const handleEnroll = async () => {
    if (!nombre.trim()) {
      alert('Ingresa un nombre');
      return;
    }

    if (!nipHash.trim()) {
      alert('Ingresa un NIP hash');
      return;
    }

    try {
      setStatus('inferencing');
      setEnrollmentProgress(0);
      setResult(null);

      // Pedir liveness check
      setLivenessCheck('blink');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const embeddings = [];

      // Capturar 3 embeddings con delay
      for (let i = 0; i < 3; i++) {
        setLivenessCheck(i % 2 === 0 ? 'blink' : 'turn');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Verificar movimiento (liveness básico)
        const video = videoRef.current;
        const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const moved = checkLivenessMovement(results.faceLandmarks[0]);
          if (!moved && i > 0) {
            throw new Error('Liveness check falló: no se detectó movimiento');
          }
        }

        const emb = await captureEmbedding();
        embeddings.push(emb);
        setEnrollmentProgress(((i + 1) / 3) * 100);
      }

      setLivenessCheck(null);

      // Enviar al backend
      const response = await fetch(endpoints.enroll, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          nip_hash: nipHash.trim(),
          embeddings: embeddings
        })
      });

      const data = await response.json();

      if (data.ok) {
        setResult({ type: 'enroll', success: true, user_id: data.user_id });
        if (onEnrolled) onEnrolled(data.user_id);
      } else {
        throw new Error(data.error || 'Error en enrolamiento');
      }

      setStatus('ready');
    } catch (err) {
      console.error('Error en enrolamiento:', err);
      setErrorMsg(err.message);
      setStatus('error');
      setTimeout(() => setStatus('ready'), 3000);
    }
  };

  // ==================== VERIFICACIÓN ====================

  const handleVerify = async () => {
    try {
      setStatus('inferencing');
      setResult(null);

      // Pedir liveness check
      setLivenessCheck('blink');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar movimiento
      const video = videoRef.current;
      const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const moved = checkLivenessMovement(results.faceLandmarks[0]);
        if (!moved) {
          throw new Error('Liveness check falló: parpadea o muévete levemente');
        }
      }

      setLivenessCheck(null);

      // Capturar embedding
      const embedding = await captureEmbedding();

      // Enviar al backend
      const response = await fetch(endpoints.verify, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emb: embedding,
          pos_id: 'POS-WEB',
          liveness_ok: true
        })
      });

      const data = await response.json();

      setResult({ 
        type: 'verify', 
        ...data,
        success: data.match 
      });

      if (onVerified) onVerified(data);
      setStatus('ready');
    } catch (err) {
      console.error('Error en verificación:', err);
      setErrorMsg(err.message);
      setStatus('error');
      setTimeout(() => setStatus('ready'), 3000);
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Reconocimiento Facial
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Estado: <span className="font-semibold">{status}</span>
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {provider.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Video Container */}
      <div className="relative mb-6 bg-gray-900 rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-auto"
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {/* Face Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-80 border-4 border-green-400 rounded-full opacity-50" />
        </div>

        {/* Status Overlays */}
        {status === 'noFace' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white text-xl font-bold">No se detecta rostro</p>
          </div>
        )}

        {livenessCheck && (
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
              {livenessCheck === 'blink' ? '👁️ Parpadea' : '↔️ Gira levemente'}
            </div>
          </div>
        )}

        {status === 'inferencing' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4" />
              <p className="text-white font-semibold">Procesando...</p>
              {enrollmentProgress > 0 && (
                <div className="mt-2 bg-gray-700 rounded-full h-2 w-48 mx-auto overflow-hidden">
                  <div 
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${enrollmentProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls */}
      {status === 'ready' && !streamRef.current && (
        <button
          onClick={startCamera}
          className="w-full mb-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
        >
          📷 Activar Cámara
        </button>
      )}

      {streamRef.current && (
        <button
          onClick={stopCamera}
          className="w-full mb-4 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded-lg transition"
        >
          ⏸️ Detener Cámara
        </button>
      )}

      {/* Enrollment Form */}
      {status !== 'loadingModels' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Juan Pérez"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={status === 'inferencing'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIP Hash (Argon2id)
            </label>
            <input
              type="password"
              value={nipHash}
              onChange={(e) => setNipHash(e.target.value)}
              placeholder="$argon2id$..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={status === 'inferencing'}
            />
            <p className="text-xs text-gray-500 mt-1">
              Hash debe ser generado previamente con Argon2id
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Botón Principal: Cobrar (Verificar) */}
        <button
          onClick={handleVerify}
          disabled={status !== 'ready' || !streamRef.current}
          className="w-full text-white font-bold text-2xl py-6 rounded-2xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg hover:shadow-2xl transform hover:scale-105"
          style={{
            background: status === 'ready' && streamRef.current
              ? 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)'
              : '#9CA3AF',
          }}
          onMouseEnter={(e) => {
            if (status === 'ready' && streamRef.current) {
              e.target.style.background = 'linear-gradient(135deg, #34D399 0%, #6EE7B7 50%, #A7F3D0 100%)';
            }
          }}
          onMouseLeave={(e) => {
            if (status === 'ready' && streamRef.current) {
              e.target.style.background = 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)';
            }
          }}
        >
          💰 Cobrar
        </button>

        {/* Botón Secundario: Ver Reporte Completo (Enrolar) */}
        <button
          onClick={handleEnroll}
          disabled={status !== 'ready' || !streamRef.current}
          className="w-full text-white font-semibold text-lg py-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-xl transform hover:scale-102"
          style={{
            background: status === 'ready' && streamRef.current
              ? 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)'
              : '#9CA3AF',
          }}
          onMouseEnter={(e) => {
            if (status === 'ready' && streamRef.current) {
              e.target.style.background = 'linear-gradient(135deg, #34D399 0%, #6EE7B7 50%, #A7F3D0 100%)';
            }
          }}
          onMouseLeave={(e) => {
            if (status === 'ready' && streamRef.current) {
              e.target.style.background = 'linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)';
            }
          }}
        >
          � Ver Reporte Completo
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`mt-6 p-4 rounded-lg border-2 ${
          result.success 
            ? 'bg-green-50 border-green-300' 
            : 'bg-red-50 border-red-300'
        }`}>
          <h3 className="font-bold text-lg mb-2">
            {result.type === 'enroll' ? '📝 Enrolamiento' : '🔍 Verificación'}
          </h3>
          
          {result.type === 'enroll' && result.success && (
            <div className="text-sm space-y-1">
              <p>✅ Usuario enrolado exitosamente</p>
              <p className="font-mono text-xs bg-white p-2 rounded">
                ID: {result.user_id}
              </p>
            </div>
          )}

          {result.type === 'verify' && (
            <div className="text-sm space-y-1">
              <p>Match: <span className="font-bold">{result.match ? 'SÍ' : 'NO'}</span></p>
              <p>Score: <span className="font-mono">{result.score?.toFixed(4)}</span></p>
              {result.user_id && <p>User ID: <span className="font-mono">{result.user_id}</span></p>}
              <p>Decisión: <span className="font-semibold">{result.decision}</span></p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {status === 'loadingModels' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Cargando modelos de IA...</p>
        </div>
      )}
    </div>
  );
}
