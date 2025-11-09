import { useState } from 'react';
import FaceCaptureSimple from '@components/FaceCaptureSimple.jsx';

/**
 * Página de prueba para el componente de reconocimiento facial simple
 * Permite probar registro y reconocimiento de usuarios
 */
export default function FaceTestPage({ onBack }) {
  const [mode, setMode] = useState('register'); // 'register' | 'recognize'
  const [testUser, setTestUser] = useState({
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@example.com',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="mb-4 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            🧪 Prueba de Reconocimiento Facial
          </h1>
          <p className="text-slate-300">
            Sistema simple con face-api.js
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              mode === 'register'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            📝 Modo Registro
          </button>
          <button
            onClick={() => setMode('recognize')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              mode === 'recognize'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            🔍 Modo Reconocimiento
          </button>
        </div>

        {/* Info Panel */}
        <div className="mb-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">
            {mode === 'register' ? '📝 Modo Registro' : '🔍 Modo Reconocimiento'}
          </h3>
          {mode === 'register' ? (
            <>
              <p className="text-slate-300 text-sm mb-3">
                Registra nuevos usuarios capturando sus características faciales.
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-sm text-slate-400">Nombre:</label>
                  <input
                    type="text"
                    value={testUser.firstName}
                    onChange={(e) =>
                      setTestUser({ ...testUser, firstName: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Apellido:</label>
                  <input
                    type="text"
                    value={testUser.lastName}
                    onChange={(e) =>
                      setTestUser({ ...testUser, lastName: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400">Email:</label>
                  <input
                    type="email"
                    value={testUser.email}
                    onChange={(e) =>
                      setTestUser({ ...testUser, email: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded text-white"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-slate-300 text-sm">
              Detecta y reconoce usuarios previamente registrados. El sistema comparará
              tu rostro con la base de datos local.
            </p>
          )}
        </div>

        {/* Face Component */}
        <FaceCaptureSimple
          modelsPath="/models"
          threshold={0.6}
          userData={mode === 'register' ? testUser : null}
          onUserRegistered={(user) => {
            console.log('✅ Usuario registrado:', user);
          }}
          onUserRecognized={(user) => {
            console.log('✅ Usuario reconocido:', user);
          }}
        />

        {/* Instructions */}
        <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <h4 className="font-semibold text-white mb-2">📋 Instrucciones:</h4>
          <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
            <li>Haz clic en "Activar Cámara"</li>
            <li>Coloca tu rostro frente a la cámara</li>
            <li>
              {mode === 'register'
                ? 'Haz clic en "Registrar Usuario" cuando detecte tu rostro'
                : 'Haz clic en "Reconocer Usuario" para verificar tu identidad'}
            </li>
            <li>Espera el resultado del procesamiento</li>
          </ol>
        </div>

        {/* Technical Info */}
        <div className="mt-6 p-4 bg-slate-900 border border-slate-700 rounded-lg">
          <h4 className="font-semibold text-white mb-2">🔧 Información Técnica:</h4>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• <strong>Detección:</strong> TinyFaceDetector (rápido y ligero)</li>
            <li>• <strong>Landmarks:</strong> 68 puntos faciales</li>
            <li>• <strong>Descriptores:</strong> 128 dimensiones por rostro</li>
            <li>• <strong>Distancia:</strong> Euclidiana (umbral: 0.6)</li>
            <li>• <strong>Expresiones:</strong> Feliz, triste, enojado, sorprendido, neutral</li>
            <li>• <strong>Base de datos:</strong> Local (en memoria del navegador)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
