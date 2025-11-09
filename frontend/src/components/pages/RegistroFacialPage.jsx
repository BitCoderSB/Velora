import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import FaceCaptureONNX from "@components/FaceCaptureONNX.jsx";

export default function RegistroFacialPage({ onBack, onComplete, userData }) {
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [userId, setUserId] = useState('');

  // Debug: Verificar que los datos del usuario están llegando
  useEffect(() => {
    console.log('RegistroFacialPage - userData recibida:', userData);
    if (!userData) {
      console.error('⚠️ RegistroFacialPage: No se recibieron datos del usuario');
    }
  }, [userData]);

  const handleEnrolled = (userIdGenerado) => {
    console.log('✅ Cliente registrado con ID:', userIdGenerado);
    setUserId(userIdGenerado);
    setRegistroExitoso(true);
    
    // Redirigir automáticamente después de 3 segundos
    setTimeout(() => {
      console.log('⏰ Redirigiendo a dashboard...');
      if (onComplete) {
        onComplete({
          ...userData,
          userId: userIdGenerado
        });
      }
    }, 3000);
  };

  const resetForm = () => {
    setRegistroExitoso(false);
    setUserId('');
  };

  // Si no hay datos del usuario, mostrar mensaje de error
  if (!userData) {
    return (
      <div className="relative min-h-screen overflow-x-hidden overflow-y-auto flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #FFE5B4 0%, #FFB6C1 50%, #F0E68C 100%)' }}>
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/50 p-12 text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error de Datos
          </h2>
          <p className="text-gray-600 mb-6">
            No se encontraron los datos de registro. Por favor, completa el registro desde el inicio.
          </p>
          <button
            onClick={onBack}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-300"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  if (registroExitoso) {
    return (
      <div className="relative min-h-screen overflow-x-hidden overflow-y-auto" style={{ background: 'linear-gradient(135deg, #FFE5B4 0%, #FFB6C1 50%, #F0E68C 100%)' }}>
        {/* Background animado */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -100, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-coral-300/30 rounded-full blur-3xl"
            style={{ backgroundColor: 'rgba(255, 127, 80, 0.08)' }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,127,80,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,127,80,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        {/* Página de éxito */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/50 p-12 text-center max-w-md"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-6xl mb-6"
            >
              ✅
            </motion.div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Registro Exitoso!
            </h2>
            
            <p className="text-gray-600 mb-2">
              <span className="font-semibold">{userData?.firstName} {userData?.lastName}</span> ha sido registrado correctamente.
            </p>
            
            <p className="text-sm text-gray-500 mb-2">
              Email: {userData?.email}
            </p>
            
            <p className="text-sm text-gray-500 mb-4">
              ID: {userId}
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700 text-sm">
                🎉 Tu cuenta ha sido creada exitosamente con reconocimiento facial
              </p>
              <p className="text-green-600 text-xs mt-2">
                Redirigiendo al dashboard en 3 segundos...
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  if (onComplete) {
                    onComplete({
                      ...userData,
                      userId: userId
                    });
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-300 transform hover:scale-105"
              >
                ✨ Ir al Dashboard Ahora
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto" style={{ background: 'linear-gradient(135deg, #FFE5B4 0%, #FFB6C1 50%, #F0E68C 100%)' }}>
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-coral-300/30 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(255, 127, 80, 0.08)' }}
        />
        <motion.div
          animate={{
            x: [0, -150, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-200/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 80, 0],
            y: [0, -80, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 right-1/3 w-64 h-64 bg-green-200/25 rounded-full blur-3xl"
        />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,127,80,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,127,80,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Header */}
      <div className="relative z-10 pt-8 px-6">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📸 Registro Facial
          </h1>
          <p className="text-lg text-gray-600">
            Registra un nuevo cliente para reconocimiento automático
          </p>
        </motion.div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen pt-8 pb-8 px-6">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/50 mx-auto max-w-4xl"
        >
          <div className="p-8 md:p-12">
            
            {/* Resumen de datos del cliente */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                📝 Resumen de tu Información
              </h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Nombre:</span>{' '}
                    <span className="text-gray-900">{userData?.firstName} {userData?.lastName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>{' '}
                    <span className="text-gray-900">{userData?.email}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Ciudad:</span>{' '}
                    <span className="text-gray-900">{userData?.city}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">País:</span>{' '}
                    <span className="text-gray-900">{userData?.country}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-700">Wallet URL:</span>{' '}
                    <span className="text-gray-900 break-all">{userData?.walletUrl}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Componente de captura facial */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🎯 Captura Facial
              </h2>
              
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm">
                  ℹ️ Tu rostro será utilizado para autenticación biométrica segura en futuras transacciones.
                </p>
              </div>
              
              <FaceCaptureONNX
                modelPath="/models/arcface.onnx"
                embeddingDim={512}
                endpoints={{
                  enroll: '/api/face/enroll',
                  verify: '/api/face/verify'
                }}
                onEnrolled={handleEnrolled}
                enableLivenessCheck={false}
                userData={userData}
              />
            </div>
            
            {/* Botón de volver */}
            {onBack && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={onBack}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition duration-300"
                >
                  ← Volver al Menú Principal
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
