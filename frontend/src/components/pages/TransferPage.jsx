import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";

export default function TransferPage({ onBack, onSubmit, receiverUser }) {
  const phrases = [
    "Tu puerta de entrada al futuro de los pagos globales con Interledger Protocol. Envía, recibe y conecta activos sin fronteras",
    "Conecta el mundo financiero sin límites. Pagos instantáneos entre cualquier red de blockchain",
    "La revolución de las transferencias digitales. Intercambia valor a través de múltiples protocolos sin fricciones",
    "Uniendo ecosistemas financieros. Tu dinero fluye libremente entre diferentes plataformas y monedas"
  ];
  
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Estados del formulario - Pre-cargar con datos del receptor si están disponibles
  const [walletUrl, setWalletUrl] = useState(receiverUser?.walletUrl || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!walletUrl.trim()) {
      setError('Por favor ingresa una URL de wallet válida');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (!description.trim()) {
      setError('Por favor ingresa una descripción');
      return;
    }

    setIsSubmitting(true);

    try {
      // Aquí se llamará a la función onSubmit pasada como prop
      if (onSubmit) {
        await onSubmit({
          walletUrl: walletUrl.trim(),
          amount: parseFloat(amount),
          description: description.trim()
        });
      }
    } catch (err) {
      setError(err.message || 'Error al procesar la transferencia');
    } finally {
      setIsSubmitting(false);
    }
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
          className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/50 mx-auto max-w-2xl"
        >
          <div className="p-8 md:p-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-8 text-center"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                💸 Nueva Transferencia
              </h1>
              <p className="text-gray-600">
                Completa los datos para enviar tu pago
              </p>
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </motion.div>
            )}

            {/* Receiver Info */}
            {receiverUser && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 border-2 border-green-200"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cliente Verificado
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Nombre</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {receiverUser.firstName} {receiverUser.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Email</p>
                    <p className="text-sm text-gray-900 font-mono break-all">
                      {receiverUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase">Wallet</p>
                    <p className="text-sm text-gray-900 font-mono break-all">
                      {receiverUser.walletUrl}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Wallet URL */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔗 URL de Wallet Destino
                </label>
                <input
                  type="url"
                  value={walletUrl}
                  onChange={(e) => setWalletUrl(e.target.value)}
                  placeholder="https://wallet.example.com/user"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white disabled:bg-gray-100"
                  disabled={isSubmitting || !!receiverUser}
                  required
                  readOnly={!!receiverUser}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {receiverUser ? 'Wallet pre-cargado del cliente verificado' : 'Ingresa la URL del wallet del destinatario (Interledger Protocol)'}
                </p>
              </motion.div>

              {/* Amount */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💰 Monto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-500 font-medium text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white text-lg font-semibold"
                    disabled={isSubmitting}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cantidad a transferir (USD)
                </p>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📝 Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ej: Pago por servicios, transferencia personal, etc."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white resize-none"
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Describe el motivo de la transferencia
                </p>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Procesando...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Enviar Transferencia
                    </span>
                  )}
                </button>
              </motion.div>

              {/* Cancel Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <button
                  type="button"
                  onClick={onBack}
                  disabled={isSubmitting}
                  className="w-full bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(255, 229, 180, 0.5), transparent)' }} />
    </div>
  );
}
