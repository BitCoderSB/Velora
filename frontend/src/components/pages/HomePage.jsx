import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";

export default function HomePage({ onBack, onCobrar, onSkipToTransfer }) {
  const phrases = [
    "Tu puerta de entrada al futuro de los pagos globales con Interledger Protocol. Envía, recibe y conecta activos sin fronteras",
    "Conecta el mundo financiero sin límites. Pagos instantáneos entre cualquier red de blockchain",
    "La revolución de las transferencias digitales. Intercambia valor a través de múltiples protocolos sin fricciones",
    "Uniendo ecosistemas financieros. Tu dinero fluye libremente entre diferentes plataformas y monedas"
  ];
  
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMovements, setShowMovements] = useState(false);
  
  // Estados para monto a cobrar
  const [chargeAmount, setChargeAmount] = useState('');
  const [chargeCurrency, setChargeCurrency] = useState('USD');
  const [serviceProduct, setServiceProduct] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  
  // Ejemplo de notificaciones
  const notifications = [
    { id: 1, message: "Nueva transacción recibida: 50 USD", time: "Hace 5 min", unread: true },
    { id: 2, message: "Transferencia completada exitosamente", time: "Hace 1 hora", unread: true },
    { id: 3, message: "Tu wallet ha sido actualizada", time: "Hace 2 horas", unread: false },
  ];
  
  // Movimientos recientes
  const recentMovements = [
    { id: 1, title: 'Recibido 50 USD', subtitle: 'Hace 5 minutos', amount: '+50 USD', type: 'income' },
    { id: 2, title: 'Enviado 20 USD', subtitle: 'Hace 1 hora', amount: '-20 USD', type: 'expense' },
    { id: 3, title: 'Pago completado', subtitle: 'Hace 2 días', amount: '+100 USD', type: 'income' },
    { id: 4, title: 'Transferencia a cuenta externa', subtitle: 'Hace 3 días', amount: '-75 USD', type: 'expense' },
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto" style={{ background: 'linear-gradient(135deg, #FFE5B4 0%, #FFB6C1 50%, #F0E68C 100%)' }}>
      {/* Top Navigation Panel */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Left side: Logo + Greeting */}
          <div className="flex items-center space-x-4">
            {/* Logo Placeholder */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ 
                background: 'linear-gradient(135deg, #FF7F50, #DDA0DD)',
                boxShadow: '0 4px 10px rgba(255, 127, 80, 0.3)'
              }}
            >
              <span className="text-white text-xl font-bold">V</span>
            </motion.div>
            
            {/* Greeting */}
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl font-bold text-slate-900"
            >
              Hola, Usuario
            </motion.h2>
          </div>
          
          {/* Right side: Notifications Bell */}
          <div className="relative">
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onClick={() => setShowNotifications(!showNotifications)}
              onMouseEnter={() => setShowNotifications(true)}
              className="relative p-3 rounded-full hover:bg-slate-100 transition-colors"
            >
              {/* Bell Icon */}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 text-slate-700" 
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
              
              {/* Notification badge */}
              {notifications.filter(n => n.unread).length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </motion.button>
            
            {/* Notifications Panel */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onMouseLeave={() => setShowNotifications(false)}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden"
                  style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900">Notificaciones</h3>
                  </div>
                  
                  {/* Notifications List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                            notification.unread ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {notification.unread && (
                              <div className="w-2 h-2 rounded-full bg-coral-500 mt-2 flex-shrink-0" style={{ backgroundColor: '#FF7F50' }} />
                            )}
                            <div className="flex-1">
                              <p className="text-sm text-slate-800">{notification.message}</p>
                              <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-slate-500">
                        <p>No tienes notificaciones</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                      <button className="text-sm text-slate-600 hover:text-slate-900 font-medium w-full text-center">
                        Ver todas las notificaciones
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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

      {/* Main content - Full page card */}
      <div className="relative z-10 min-h-screen pt-24 pb-8 px-6">
        {/* White card surface - Full page content */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/50 mx-auto max-w-7xl"
        >
          <div className="p-8 md:p-12 flex flex-col min-h-full">

            {/* Sección de Cobro */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
              className="mb-12 flex flex-col items-center"
            >
              {/* Título "To charge" - Rectángulo con degradado verde estático */}
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mb-6 px-12 py-4 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
                }}
              >
                <h1 className="text-4xl md:text-5xl font-black text-white text-center tracking-wide">
                  To Charge
                </h1>
              </motion.div>

              {/* Formulario de Cobro */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-md space-y-4"
              >
                {/* Campo: Servicio o Producto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    Servicio o Producto
                  </label>
                  <input
                    type="text"
                    value={serviceProduct}
                    onChange={(e) => setServiceProduct(e.target.value)}
                    placeholder="Ej: Consultoría, Producto X, etc."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white"
                  />
                </div>

                {/* Campo: Monto a Cobrar */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    Ingresa el monto a cobrar
                  </label>
                  <div className="flex gap-3">
                    {/* Input para el monto */}
                    <div className="flex-1 relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={chargeAmount}
                        onChange={(e) => setChargeAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white text-lg font-semibold"
                      />
                    </div>

                    {/* Selector de divisa */}
                    <select
                      value={chargeCurrency}
                      onChange={(e) => setChargeCurrency(e.target.value)}
                      className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white font-semibold cursor-pointer"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="MXN">MXN</option>
                      <option value="BTC">BTC</option>
                      <option value="ETH">ETH</option>
                    </select>
                  </div>
                </div>

                {/* Campo: Descripción del Servicio/Producto */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">
                    Descripción del servicio/producto
                  </label>
                  <textarea
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder="Describe los detalles del servicio o producto..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-900 bg-white resize-none"
                  />
                </div>

                {/* Botón Get Cash - Rectangular con Degradado Dinámico */}
                <motion.button
                  onClick={onCobrar}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    backgroundPosition: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear"
                    }
                  }}
                  className="w-full py-5 rounded-2xl shadow-2xl border-2 border-white/50 font-black text-2xl text-white transition-all duration-300 hover:shadow-3xl"
                  style={{
                    background: 'linear-gradient(90deg, #10b981, #34d399, #6ee7b7, #34d399, #10b981)',
                    backgroundSize: '200% 100%',
                  }}
                >
                  GET CASH
                </motion.button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Completa la información para generar el cobro
                </p>
              </motion.div>
            </motion.div>

            {/* Explora tu Reporte Financiero Section */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="mt-6 max-w-2xl mx-auto w-full px-4"
            >
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 text-center mb-3">
                  ¡Explora tu reporte financiero!
                </h2>
                <p className="text-sm text-gray-600 text-center">
                  Visualiza tus gastos, ingresos y tendencias financieras
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 w-full text-white font-semibold py-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-lg"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #34d399 0%, #6ee7b7 50%, #a7f3d0 100%)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)';
                  }}
                >
                  Ver reporte completo →
                </motion.button>
              </div>
            </motion.div>

            {/* Movimientos Recientes - Panel Colapsable */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-6 max-w-2xl mx-auto w-full px-4"
            >
              <div className="bg-white border-2 border-gray-300 rounded-xl shadow-lg overflow-hidden">
                {/* Header del panel - Clickeable */}
                <button
                  onClick={() => setShowMovements(!showMovements)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition-colors duration-200 group"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                        />
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-black transition-colors">
                      Movimientos recientes
                    </h3>
                  </div>
                  
                  {/* Ícono de flecha */}
                  <motion.svg
                    animate={{ rotate: showMovements ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-600 group-hover:text-black"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                
                {/* Contenido expandible */}
                <AnimatePresence>
                  {showMovements && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {recentMovements.map((movement, index) => (
                          <motion.div
                            key={movement.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center justify-between bg-slate-50 hover:bg-blue-50 p-3 rounded-lg border border-slate-200 hover:border-blue-300 transition-all duration-200 cursor-pointer group"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              {/* Ícono según tipo */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                movement.type === 'income' 
                                  ? 'bg-green-100 group-hover:bg-green-200' 
                                  : 'bg-rose-100 group-hover:bg-rose-200'
                              } transition-colors`}>
                                {movement.type === 'income' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                  </svg>
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors truncate">
                                  {movement.title}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                  {movement.subtitle}
                                </div>
                              </div>
                            </div>
                            
                            <div className={`text-sm font-bold flex-shrink-0 ml-2 ${
                              movement.type === 'income' ? 'text-green-600' : 'text-rose-600'
                            }`}>
                              {movement.amount}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Footer del panel */}
                      <div className="px-4 pb-3">
                        <button className="w-full py-2 text-blue-600 hover:text-blue-700 font-semibold text-xs hover:bg-blue-50 rounded-lg transition-colors">
                          Ver todos los movimientos →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
