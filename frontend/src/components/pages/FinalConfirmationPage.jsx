import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";

export default function FinalConfirmationPage({ onBack, onComplete, confirmationUrl }) {
  const phrases = [
    "Tu puerta de entrada al futuro de los pagos globales con Interledger Protocol. Envía, recibe y conecta activos sin fronteras",
    "Conecta el mundo financiero sin límites. Pagos instantáneos entre cualquier red de blockchain",
    "La revolución de las transferencias digitales. Intercambia valor a través de múltiples protocolos sin fricciones",
    "Uniendo ecosistemas financieros. Tu dinero fluye libremente entre diferentes plataformas y monedas"
  ];
  
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  
  // URL de confirmación - por ahora usamos una de ejemplo
  const finalConfirmationUrl = confirmationUrl || "https://www.liverpool.com.mx/tienda/home";
  
  // Ejemplo de notificaciones
  const notifications = [
    { id: 1, message: "Nueva transacción recibida: 50 USD", time: "Hace 5 min", unread: true },
    { id: 2, message: "Transferencia completada exitosamente", time: "Hace 1 hora", unread: true },
    { id: 3, message: "Tu wallet ha sido actualizada", time: "Hace 2 horas", unread: false },
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simular carga del iframe
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // Listener para mensajes del iframe o URL externa
    const handleMessage = (event) => {
      // Validar origen en producción
      // if (event.origin !== "https://tu-dominio-ilp.com") return;
      
      console.log('Mensaje recibido:', event.data);
      
      // Cuando la URL externa confirme, recibirá un mensaje
      if (event.data && event.data.type === 'PAYMENT_AUTHORIZED') {
        console.log('Pago autorizado, redirigiendo al ticket...');
        // Llamar al callback con los datos de la transacción
        if (onComplete && event.data.transactionData) {
          onComplete(event.data.transactionData);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    // Simular autorización automática después de 10 segundos (solo para demo)
    // En producción, esto vendría de la URL externa
    const autoCompleteTimer = setTimeout(() => {
      console.log('Auto-completando para demo...');
      // Simular datos de transacción ILP
      const mockTransactionData = {
        transactionId: `TXN-ILP-${Date.now()}`,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
      };
      if (onComplete) {
        onComplete(mockTransactionData);
      }
    }, 10000); // 10 segundos

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCompleteTimer);
      window.removeEventListener('message', handleMessage);
    };
  }, [onComplete]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIframeError(true);
  };

  const handleOpenInNewTab = () => {
    window.open(finalConfirmationUrl, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div 
      className="relative min-h-screen overflow-x-hidden overflow-y-auto"
      style={{ 
        background: 'linear-gradient(135deg, #FFE5B4 0%, #FFB6C1 50%, #F0E68C 100%)'
      }}
    >
      {/* Top Navigation Panel */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <motion.h2 
            className="text-2xl font-bold cursor-pointer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            onClick={onBack}
          >
            <motion.span 
              className="bg-clip-text text-transparent inline-block"
              animate={{
                backgroundImage: [
                  'linear-gradient(to right, #FF7F50, #DDA0DD, #98FB98)',
                  'linear-gradient(to right, #98FB98, #F0E68C, #FF7F50)',
                  'linear-gradient(to right, #DDA0DD, #98FB98, #F0E68C)',
                  'linear-gradient(to right, #F0E68C, #FF7F50, #DDA0DD)',
                  'linear-gradient(to right, #FF7F50, #DDA0DD, #98FB98)',
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{ 
                WebkitTextStroke: '1px black',
                paintOrder: 'stroke fill'
              }}
            >
              Velora
            </motion.span>
          </motion.h2>

          {/* Right side - Greeting and Notification */}
          <div className="flex items-center space-x-4">
            {/* Greeting */}
            <motion.p 
              className="text-sm font-medium text-gray-700 hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Hola, <span className="font-bold">Usuario</span>
            </motion.p>

            {/* Notification Bell */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 text-gray-700" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                  />
                </svg>
                {/* Unread badge */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                    </div>
                    
                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 ${
                            notif.unread ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="text-sm text-gray-900 font-medium">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <button className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full text-center">
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </nav>

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
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl"
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
          className="absolute top-3/4 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(221, 160, 221, 0.08)' }}
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
          className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full blur-3xl"
          style={{ backgroundColor: 'rgba(152, 251, 152, 0.08)' }}
        />
      </div>

      {/* Main content - Full page card */}
      <div className="relative z-10 min-h-screen pt-24 pb-8 px-6">
        {/* White card surface - Full page content */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/50 mx-auto max-w-5xl"
        >
          <div className="p-8 md:p-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 text-center"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                🌐 Confirmación Final
              </h1>
              <p className="text-gray-600">
                Completa el proceso de autorización en la página del proveedor
              </p>
            </motion.div>

            {/* Info Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Se requiere autorización externa
                </p>
                <p className="text-xs text-blue-700">
                  Serás redirigido a la página del proveedor de pagos para completar la autorización. 
                  Si el contenido no se carga correctamente, usa el botón "Abrir en nueva pestaña".
                </p>
              </div>
            </motion.div>

            {/* Auto-redirect Notice */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4 flex items-start"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-green-900 font-medium mb-1">
                  🔄 Redirección Automática
                </p>
                <p className="text-xs text-green-700">
                  Una vez que aceptes la autorización en la página externa, serás redirigido automáticamente 
                  a tu comprobante de pago. No necesitas hacer nada más.
                </p>
              </div>
            </motion.div>

            {/* Loading State */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-6 flex flex-col items-center justify-center py-12"
              >
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Cargando página de confirmación...</p>
              </motion.div>
            )}

            {/* Error State */}
            {iframeError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-red-900 font-semibold mb-2">No se pudo cargar la página</p>
                <p className="text-red-700 text-sm mb-4">
                  Por favor, usa el botón de abajo para abrir la página en una nueva pestaña
                </p>
                <button
                  onClick={handleOpenInNewTab}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Abrir en nueva pestaña
                </button>
              </motion.div>
            )}

            {/* Iframe Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: isLoading ? 0.5 : 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-6 bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-300"
              style={{ height: '600px' }}
            >
              <iframe
                src={finalConfirmationUrl}
                title="Confirmación de pago"
                className="w-full h-full"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                allow="payment"
              />
            </motion.div>

            {/* URL Display */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">URL de confirmación:</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-900 font-mono break-all flex-1">{finalConfirmationUrl}</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(finalConfirmationUrl);
                    alert('URL copiada al portapapeles');
                  }}
                  className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                  title="Copiar URL"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-3"
            >
              {/* Open in New Tab Button */}
              <button
                onClick={handleOpenInNewTab}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Abrir en nueva pestaña
              </button>

              {/* Cancel Button */}
              <button
                onClick={onBack}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
              >
                Cancelar transacción
              </button>
            </motion.div>

            {/* Help Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-6 text-center"
            >
              <p className="text-xs text-gray-500">
                💡 Si tienes problemas para ver el contenido, intenta abrir la página en una nueva pestaña
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(255, 229, 180, 0.5), transparent)' }} />
    </div>
  );
}
