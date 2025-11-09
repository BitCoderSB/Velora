// FaceCaptureONNX.jsx
import { useState, useRef, useEffect } from "react";
import * as ort from "onnxruntime-web";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

/* ---------- ONNX Runtime Web: WASM paths y opciones ---------- */
ort.env.wasm.wasmPaths = {
  "ort-wasm.wasm": "/wasm/ort-wasm.wasm",
  "ort-wasm-simd.wasm": "/wasm/ort-wasm-simd.wasm",
  "ort-wasm-threaded.wasm": "/wasm/ort-wasm-threaded.wasm",
  "ort-wasm-simd-threaded.wasm": "/wasm/ort-wasm-simd-threaded.wasm",
};
ort.env.wasm.proxy = false;
ort.env.wasm.numThreads = 1;

export default function FaceCaptureONNX({
  modelPath = "/models/arcface.onnx",
  embeddingDim = 512,
  endpoints = { enroll: "/api/face/enroll", verify: "/api/face/verify" },
  onEnrolled = null,
  onVerified = null,
  enableLivenessCheck = true,
  userData = null,
  // ArcFace suele usar 112x112 RGB y normalización [-1,1]
  inputSize = 112,
  colorOrder = "RGB", // "RGB" | "BGR" si tu modelo lo exige
}) {
  /* ---------- State ---------- */
  const [status, setStatus] = useState("loadingModels"); // loadingModels|cameraOn|noFace|ready|inferencing|error
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);
  const [livenessCheck, setLivenessCheck] = useState(null); // 'blink'|'turn'|null
  const [enrollmentProgress, setEnrollmentProgress] = useState(0);
  const [provider, setProvider] = useState("");

  /* ---------- Refs ---------- */
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const sessionRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const lastLandmarksRef = useRef(null);
  const rafIdRef = useRef(null);
  const detectAbortRef = useRef({ aborted: false });

  /* ---------- Utils ---------- */
  const l2norm = (vec) => {
    const sum = vec.reduce((a, v) => a + v * v, 0);
    const n = Math.sqrt(sum) || 1e-10;
    return vec.map((v) => v / n);
  };

  const averageEmbeddings = (embList) => {
    const dim = embList[0].length;
    const acc = new Float32Array(dim);
    for (const emb of embList) {
      for (let i = 0; i < dim; i++) acc[i] += emb[i];
    }
    for (let i = 0; i < dim; i++) acc[i] /= embList.length;
    return Array.from(l2norm(Array.from(acc)));
  };

  // canvas -> Float32 NCHW [1,3,H,W] con normalización [-1,1]
  const toNCHWFloat32 = (canvas) => {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const { width, height } = canvas;
    const img = ctx.getImageData(0, 0, width, height).data;
    const plane = width * height;
    const out = new Float32Array(3 * plane);

    // Canal order y normalización
    // x_norm = (x/255 - 0.5)/0.5  => [-1,1]
    const norm = (v) => (v / 255 - 0.5) / 0.5;

    for (let i = 0; i < plane; i++) {
      const r = img[i * 4];
      const g = img[i * 4 + 1];
      const b = img[i * 4 + 2];

      let c0 = r,
        c1 = g,
        c2 = b;
      if (colorOrder === "BGR") {
        c0 = b;
        c1 = g;
        c2 = r;
      }

      out[i] = norm(c0);
      out[plane + i] = norm(c1);
      out[2 * plane + i] = norm(c2);
    }
    return out;
  };

  // Alineación simple por ojos
  const alignByLandmarks = (videoEl, lm) => {
    if (!videoEl || !lm || !Array.isArray(lm)) return null;
    const vw = videoEl.videoWidth || 0;
    const vh = videoEl.videoHeight || 0;
    if (vw <= 0 || vh <= 0) return null;

    const leftEye = lm[33];
    const rightEye = lm[263];
    const nose = lm[1];
    const ok = (p) =>
      p &&
      typeof p.x === "number" &&
      typeof p.y === "number" &&
      p.x >= 0 &&
      p.x <= 1 &&
      p.y >= 0 &&
      p.y <= 1;
    if (!ok(leftEye) || !ok(rightEye) || !ok(nose)) return null;

    const leftPx = { x: leftEye.x * vw, y: leftEye.y * vh };
    const rightPx = { x: rightEye.x * vw, y: rightEye.y * vh };

    const dx = rightPx.x - leftPx.x;
    const dy = rightPx.y - leftPx.y;
    const angle = Math.atan2(dy, dx);

    const eyeCx = (leftPx.x + rightPx.x) / 2;
    const eyeCy = (leftPx.y + rightPx.y) / 2;

    const eyeDist = Math.hypot(dx, dy);
    const desiredEyeDist = 40; // píxeles dentro de 112x112
    const scale = desiredEyeDist / Math.max(eyeDist, 1e-10);

    const out = document.createElement("canvas");
    out.width = inputSize;
    out.height = inputSize;

    const ctx = out.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.save();
    ctx.translate(inputSize / 2, inputSize / 2);
    ctx.rotate(-angle);
    ctx.scale(scale, scale);
    ctx.translate(-eyeCx, -eyeCy);
    ctx.drawImage(videoEl, 0, 0, vw, vh);
    ctx.restore();

    return out;
  };

  const checkLivenessMovement = (curr) => {
    if (!lastLandmarksRef.current) {
      lastLandmarksRef.current = curr;
      return false;
    }
    const idx = [33, 263, 1];
    let d = 0;
    for (const i of idx) {
      const a = curr[i];
      const b = lastLandmarksRef.current[i];
      if (a && b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        d += Math.hypot(dx, dy);
      }
    }
    lastLandmarksRef.current = curr;
    return d > 0.02;
  };

  /* ---------- Carga de modelos ---------- */
  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        setStatus("loadingModels");
        setErrorMsg("");

        // MediaPipe Face Landmarker
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        if (!mounted) return;
        faceLandmarkerRef.current = landmarker;

        // ONNX: intenta WebGPU y cae a WASM
        let session = null;
        let epUsed = "mock";
        try {
          if ("gpu" in navigator) {
            try {
              session = await ort.InferenceSession.create(modelPath, {
                executionProviders: ["webgpu"],
                graphOptimizationLevel: "all",
              });
              epUsed = "webgpu";
            } catch {
              // fallback a WASM
              session = await ort.InferenceSession.create(modelPath, {
                executionProviders: ["wasm"],
                graphOptimizationLevel: "all",
              });
              epUsed = "wasm";
            }
          } else {
            session = await ort.InferenceSession.create(modelPath, {
              executionProviders: ["wasm"],
              graphOptimizationLevel: "all",
            });
            epUsed = "wasm";
          }
        } catch (e) {
          console.warn("ArcFace ONNX no cargó. Uso MOCK. Detalle:", e?.message);
          session = null;
          epUsed = "mock";
        }

        if (!mounted) return;
        sessionRef.current = session;
        setProvider(epUsed);
        setStatus("ready");
      } catch (e) {
        if (!mounted) return;
        setErrorMsg(`Error al cargar modelos: ${e?.message || e}`);
        setStatus("error");
      }
    };

    setup();

    return () => {
      mounted = false;
      detectAbortRef.current.aborted = true;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (faceLandmarkerRef.current) {
        try {
          faceLandmarkerRef.current.close();
        } catch {}
        faceLandmarkerRef.current = null;
      }
    };
  }, [modelPath, inputSize, colorOrder]);

  /* ---------- Cámara ---------- */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 30 },
        },
        audio: false,
      });
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setStatus("cameraOn");

      videoRef.current.onloadedmetadata = () => {
        if (!videoRef.current) return;
        if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          detectAbortRef.current.aborted = false;
          detectFaceLoop();
        } else {
          setErrorMsg("Video sin dimensiones válidas");
          setStatus("error");
        }
      };
    } catch (e) {
      setErrorMsg(`No se pudo acceder a la cámara: ${e?.message || e}`);
      setStatus("error");
    }
  };

  const stopCamera = () => {
    detectAbortRef.current.aborted = true;
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setStatus("ready");
  };

  /* ---------- Detección ---------- */
  const detectFaceLoop = () => {
    const video = videoRef.current;
    const lm = faceLandmarkerRef.current;
    if (!video || !lm) return;

    const tick = () => {
      if (detectAbortRef.current.aborted) return;

      if (!video.videoWidth || !video.videoHeight) {
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      try {
        const res = lm.detectForVideo(video, performance.now());
        if (res.faceLandmarks && res.faceLandmarks.length > 0) {
          if (status !== "inferencing") setStatus("ready");
          drawLandmarks(res.faceLandmarks[0]);
        } else {
          setStatus("noFace");
          clearCanvas();
        }
      } catch {
        // ignora frame con error y continúa
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);
  };

  const clearCanvas = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
  };

  const drawLandmarks = (landmarks) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const w = video.videoWidth || 0;
    const h = video.videoHeight || 0;
    if (w <= 0 || h <= 0) return;

    const ctx = canvas.getContext("2d");
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = "#00ff00";
    for (const p of landmarks) {
      if (p && typeof p.x === "number" && typeof p.y === "number") {
        const x = p.x * w;
        const y = p.y * h;
        if (x >= 0 && x <= w && y >= 0 && y <= h) {
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  };

  /* ---------- Inferencia ---------- */
  const captureEmbedding = async () => {
    const video = videoRef.current;
    const lm = faceLandmarkerRef.current;
    if (!video || !lm) throw new Error("Modelos no listos");

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("Video no tiene dimensiones válidas");
    }

    const res = lm.detectForVideo(video, performance.now());
    if (!res.faceLandmarks || res.faceLandmarks.length === 0) {
      throw new Error("No se detectó rostro");
    }

    // Mock si no hay sesión real
    if (!sessionRef.current || provider === "mock") {
      const L = res.faceLandmarks[0];
      const le = L[33],
        re = L[263],
        n = L[1];
      const eyeD = Math.hypot(re.x - le.x, re.y - le.y);
      const noseD = Math.hypot(n.x - (le.x + re.x) / 2, n.y - (le.y + re.y) / 2);
      const seed = Math.floor((eyeD + noseD) * 10000) % 1000;
      const v = Array.from({ length: embeddingDim }, (_, i) => {
        const r = Math.sin(seed + i * 0.13) * Math.cos(seed + i * 0.07);
        return r;
      });
      return l2norm(v);
    }

    // Con modelo
    const L = res.faceLandmarks[0];
    const aligned = alignByLandmarks(video, L);
    if (!aligned) throw new Error("Error en alineación facial");

    // Redimensiona por si acaso
    if (aligned.width !== inputSize || aligned.height !== inputSize) {
      const tmp = document.createElement("canvas");
      tmp.width = inputSize;
      tmp.height = inputSize;
      const tctx = tmp.getContext("2d");
      tctx.drawImage(aligned, 0, 0, inputSize, inputSize);
      aligned.width = inputSize;
      aligned.height = inputSize;
    }

    const data = toNCHWFloat32(aligned);
    const tensor = new ort.Tensor("float32", data, [1, 3, inputSize, inputSize]);

    const inputName = sessionRef.current.inputNames[0];
    const outputs = await sessionRef.current.run({ [inputName]: tensor });

    const keys = Object.keys(outputs);
    let k =
      keys.find((s) => /embedding|feat|fc1|output/i.test(s)) ?? keys[0];

    let emb = Array.from(outputs[k].data);
    if (emb.length !== embeddingDim) {
      // Ajuste simple
      emb = emb.length > embeddingDim ? emb.slice(0, embeddingDim) : emb.concat(new Array(embeddingDim - emb.length).fill(0));
    }
    return l2norm(emb);
  };

  /* ---------- Enrolamiento ---------- */
  const handleEnroll = async () => {
    if (!userData) {
      setErrorMsg("Faltan datos de usuario");
      return;
    }
    try {
      setStatus("inferencing");
      setEnrollmentProgress(0);
      setResult(null);

      if (enableLivenessCheck) {
        setLivenessCheck("blink");
        await new Promise((r) => setTimeout(r, 1200));
      }

      const embs = [];
      for (let i = 0; i < 3; i++) {
        if (enableLivenessCheck) setLivenessCheck(i % 2 === 0 ? "blink" : "turn");
        await new Promise((r) => setTimeout(r, 450));

        if (enableLivenessCheck) {
          const res = faceLandmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now()
          );
          if (res.faceLandmarks?.length) checkLivenessMovement(res.faceLandmarks[0]);
        }

        embs.push(await captureEmbedding());
        setEnrollmentProgress(((i + 1) / 3) * 100);
      }
      setLivenessCheck(null);

      const payload = { ...userData, embeddings: embs };
      const resp = await fetch(endpoints.enroll, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await resp.text();
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text}`);

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Respuesta inválida del servidor");
      }

      if (!data.ok) throw new Error(data.error || "Error en enrolamiento");
      setResult({ type: "enroll", success: true, user_id: data.user_id });
      onEnrolled && onEnrolled(data.user_id);
      setStatus("ready");
    } catch (e) {
      setErrorMsg(e?.message || String(e));
      setStatus("error");
      setTimeout(() => setStatus("ready"), 3000);
    }
  };

  /* ---------- Verificación ---------- */
  const handleVerify = async () => {
    try {
      setStatus("inferencing");
      setResult(null);

      setLivenessCheck("blink");
      await new Promise((r) => setTimeout(r, 1200));

      const res = faceLandmarkerRef.current.detectForVideo(
        videoRef.current,
        performance.now()
      );
      if (res.faceLandmarks?.length) {
        const moved = checkLivenessMovement(res.faceLandmarks[0]);
        if (!moved) throw new Error("Liveness falló: parpadea o muévete levemente");
      }
      setLivenessCheck(null);

      const emb = await captureEmbedding();

      const resp = await fetch(endpoints.verify, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emb, pos_id: "POS-WEB", liveness_ok: true }),
      });
      const data = await resp.json();

      setResult({ type: "verify", ...data, success: !!data.match });
      onVerified && onVerified(data);
      setStatus("ready");
    } catch (e) {
      setErrorMsg(e?.message || String(e));
      setStatus("error");
      setTimeout(() => setStatus("ready"), 3000);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Reconocimiento Facial</h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Estado: <span className="font-semibold">{status}</span>
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {provider.toUpperCase()}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{errorMsg}</p>
        </div>
      )}

      <div className="relative mb-6 bg-gray-900 rounded-lg overflow-hidden">
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

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-80 border-4 border-green-400 rounded-full opacity-50" />
        </div>

        {status === "noFace" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white text-xl font-bold">No se detecta rostro</p>
          </div>
        )}

        {livenessCheck && (
          <div className="absolute top-4 left-0 right-0 flex justify-center">
            <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold">
              {livenessCheck === "blink" ? "👁️ Parpadea" : "↔️ Gira levemente"}
            </div>
          </div>
        )}

        {status === "inferencing" && (
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

      {status === "ready" && !streamRef.current && (
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

      {userData && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">Cliente a registrar:</h3>
          <p className="text-blue-700">
            <span className="font-medium">Nombre:</span> {userData.firstName} {userData.lastName}
          </p>
          <p className="text-blue-700">
            <span className="font-medium">Email:</span> {userData.email}
          </p>
          <p className="text-blue-700">
            <span className="font-medium">Ciudad:</span> {userData.city}, {userData.country}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {userData ? (
          <button
            onClick={handleEnroll}
            disabled={status !== "ready" || !streamRef.current}
            className="w-full text-white font-bold text-2xl py-6 rounded-2xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg hover:shadow-2xl transform hover:scale-105"
            style={{
              background:
                status === "ready" && streamRef.current
                  ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 50%, #1E40AF 100%)"
                  : "#9CA3AF",
            }}
          >
            📸 Registrar Cliente
          </button>
        ) : (
          <button
            onClick={handleVerify}
            disabled={status !== "ready" || !streamRef.current}
            className="w-full text-white font-bold text-2xl py-6 rounded-2xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 shadow-lg hover:shadow-2xl transform hover:scale-105"
            style={{
              background:
                status === "ready" && streamRef.current
                  ? "linear-gradient(135deg, #10B981 0%, #34D399 50%, #6EE7B7 100%)"
                  : "#9CA3AF",
            }}
          >
            💰 Cobrar
          </button>
        )}
      </div>

      {result && (
        <div
          className={`mt-6 p-4 rounded-lg border-2 ${
            result.success ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
          }`}
        >
          <h3 className="font-bold text-lg mb-2">
            {result.type === "enroll" ? "📝 Enrolamiento" : "🔍 Verificación"}
          </h3>

          {result.type === "enroll" && result.success && (
            <div className="text-sm space-y-1">
              <p>✅ Usuario enrolado exitosamente</p>
              <p className="font-mono text-xs bg-white p-2 rounded">ID: {result.user_id}</p>
            </div>
          )}

          {result.type === "verify" && (
            <div className="text-sm space-y-1">
              {result.match ? (
                <>
                  <p className="text-green-600 font-bold text-base">✅ Cliente reconocido</p>
                  {result.cliente && (
                    <>
                      <p>
                        Nombre: <span className="font-semibold">{result.cliente.nombre}</span>
                      </p>
                      <p>
                        Email: <span className="font-mono text-xs">{result.cliente.email}</span>
                      </p>
                    </>
                  )}
                  <p>
                    Confianza:{" "}
                    <span className="font-mono">
                      {typeof result.score === "number" ? (result.score * 100).toFixed(1) : "—"}%
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-red-600 font-bold text-base">❌ Cliente no registrado</p>
                  <p className="text-gray-500 text-xs">
                    Score:{" "}
                    {typeof result.score === "number" ? (result.score * 100).toFixed(1) : "—"}%
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {status === "loadingModels" && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Cargando modelos de IA...</p>
        </div>
      )}
    </div>
  );
}
