import { useState } from 'react';
import FaceCaptureSimple from '@components/FaceCaptureSimple.jsx';
import { registerUser } from '../../services/database.js';

/**
 * Página de registro facial integrada en el flujo de registro de usuarios
 * Utiliza face-api.js para capturar y registrar características faciales
 */
export default function RegistroFacialPage({ userData, onBack, onComplete }) {
  const [registrationStatus, setRegistrationStatus] = useState(null); // null | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleUserRegistered = async (registeredUser) => {
    try {
      setRegistrationStatus('success');
      
      console.log('📸 Reconocimiento facial completado:', registeredUser);
      console.log('👤 Datos de usuario:', userData);
      
      // Combinar todos los datos del usuario con el reconocimiento facial
      const completeData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        address: userData.address,
        city: userData.city,
        country: userData.country,
        walletUrl: userData.walletUrl,
        keyId: userData.keyId,
        privateKey: userData.privateKey,
        pin: userData.pin,
        faceId: registeredUser.id,  // ID único del reconocimiento facial
        faceDescriptors: registeredUser.descriptors,  // Array de descriptores
        faceRegisteredAt: registeredUser.registeredAt
      };

      console.log('💾 Guardando usuario en base de datos local...');
      
      // Guardar en base de datos local (localStorage)
      const savedUser = registerUser(completeData);
      
      console.log('✅ Usuario registrado exitosamente:', savedUser);
      console.log('📝 ID:', savedUser.id, '| Email:', savedUser.email, '| FaceID:', savedUser.faceId);

      // Esperar un momento para mostrar el éxito antes de continuar
      setTimeout(() => {
        onComplete(savedUser);
      }, 2000);

    } catch (error) {
      console.error('❌ Error al completar registro:', error);
      setRegistrationStatus('error');
      setErrorMessage(error.message || 'Error al completar el registro');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={onBack}
            className="mb-3 sm:mb-4 px-3 sm:px-4 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-lg transition flex items-center gap-2 text-sm sm:text-base"
          >
            <span>←</span> Volver
          </button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            📸 Registro Facial
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            Último paso: registra tu rostro para poder usar el sistema de pagos
          </p>
        </div>

        {/* Progress Indicator - Responsive */}
        <div className="mb-4 sm:mb-6">
          {/* Desktop/Tablet Version */}
          <div className="hidden sm:flex items-center justify-center gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                ✓
              </div>
              <span className="text-slate-400 text-xs sm:text-sm">Datos personales</span>
            </div>
            <div className="w-8 sm:w-12 h-0.5 bg-green-500"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm">
                ✓
              </div>
              <span className="text-slate-400 text-xs sm:text-sm">Wallet</span>
            </div>
            <div className="w-8 sm:w-12 h-0.5 bg-blue-500"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <span className="text-white text-xs sm:text-sm font-semibold">Reconocimiento facial</span>
            </div>
          </div>

          {/* Mobile Version - Vertical */}
          <div className="sm:hidden flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                ✓
              </div>
              <span className="text-slate-400 text-sm">Datos personales</span>
            </div>
            <div className="w-0.5 h-4 bg-green-500 ml-4"></div>
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                ✓
              </div>
              <span className="text-slate-400 text-sm">Wallet</span>
            </div>
            <div className="w-0.5 h-4 bg-blue-500 ml-4"></div>
            <div className="flex items-center gap-3 w-full">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                3
              </div>
              <span className="text-white text-sm font-semibold">Reconocimiento facial</span>
            </div>
          </div>
        </div>

        {/* User Info Card - Responsive */}
        {userData && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-slate-800 border border-slate-700 rounded-xl">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span>👤</span> Datos del Usuario
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Nombre completo</p>
                <p className="text-sm sm:text-base text-white font-medium break-words">
                  {userData.firstName} {userData.lastName}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Email</p>
                <p className="text-sm sm:text-base text-white font-medium break-all">{userData.email}</p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-400">Ciudad</p>
                <p className="text-sm sm:text-base text-white font-medium">
                  {userData.city}, {userData.country}
                </p>
              </div>
              {userData.paymentPointer && (
                <div className="sm:col-span-2">
                  <p className="text-xs sm:text-sm text-slate-400">Payment Pointer</p>
                  <p className="text-xs sm:text-sm text-white font-mono break-all">{userData.paymentPointer}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Instructions - Responsive */}
        {!registrationStatus && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <h4 className="text-sm sm:text-base font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <span>💡</span> Instrucciones
            </h4>
            <ol className="text-xs sm:text-sm text-blue-200 space-y-1 list-decimal list-inside pl-1">
              <li>Haz clic en "Activar Cámara"</li>
              <li>Coloca tu rostro frente a la cámara dentro del óvalo guía</li>
              <li>Asegúrate de tener buena iluminación</li>
              <li>Cuando detecte tu rostro, haz clic en "Registrar Usuario"</li>
              <li>El sistema capturará múltiples imágenes para mayor precisión</li>
              <li>Espera la confirmación</li>
            </ol>
          </div>
        )}

        {/* Success Message - Responsive */}
        {registrationStatus === 'success' && (
          <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-green-900/30 border border-green-700 rounded-lg animate-pulse">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
              <div className="text-4xl sm:text-6xl">✅</div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-green-300 mb-1 sm:mb-2">
                  ¡Registro Completado!
                </h3>
                <p className="text-sm sm:text-base text-green-200">
                  Tu rostro ha sido registrado exitosamente. Redirigiendo...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message - Responsive */}
        {registrationStatus === 'error' && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <h3 className="text-base sm:text-lg font-bold text-red-300 mb-2">❌ Error</h3>
            <p className="text-sm sm:text-base text-red-200">{errorMessage}</p>
            <button
              onClick={() => {
                setRegistrationStatus(null);
                setErrorMessage('');
              }}
              className="mt-3 px-3 sm:px-4 py-2 bg-red-700 hover:bg-red-600 active:bg-red-500 text-white text-sm sm:text-base rounded-lg transition"
            >
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Face Capture Component */}
        {!registrationStatus && (
          <FaceCaptureSimple
            modelsPath="/models"
            threshold={0.6}
            userData={userData}
            onUserRegistered={handleUserRegistered}
            onUserRecognized={null}
          />
        )}

        {/* Security Notice - Responsive */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
          <h4 className="text-sm sm:text-base font-semibold text-slate-300 mb-2 flex items-center gap-2">
            <span>🔒</span> Privacidad y Seguridad
          </h4>
          <ul className="text-xs sm:text-sm text-slate-400 space-y-1">
            <li>• Tus datos biométricos están protegidos y encriptados</li>
            <li>• Solo se almacenan descriptores faciales, no imágenes</li>
            <li>• La información no se comparte con terceros</li>
            <li>• Cumplimos con las regulaciones de protección de datos</li>
            <li>• Puedes solicitar la eliminación de tus datos en cualquier momento</li>
          </ul>
        </div>

        {/* Technical Info - Responsive */}
        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-slate-900 border border-slate-700 rounded-lg">
          <details className="cursor-pointer">
            <summary className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-slate-300 py-1">
              🔧 Información técnica
            </summary>
            <ul className="mt-2 text-xs text-slate-500 space-y-1 pl-1">
              <li>• <strong>Tecnología:</strong> face-api.js con TensorFlow.js</li>
              <li>• <strong>Modelo:</strong> FaceRecognitionNet (128 dimensiones)</li>
              <li>• <strong>Detección:</strong> TinyFaceDetector (rápido y preciso)</li>
              <li>• <strong>Captura:</strong> 3 descriptores para mayor precisión</li>
              <li>• <strong>Comparación:</strong> Distancia euclidiana (umbral: 0.6)</li>
              <li>• <strong>Procesamiento:</strong> 100% en el navegador (privacidad)</li>
            </ul>
          </details>
        </div>
      </div>
    </div>
  );
}
