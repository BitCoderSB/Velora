import { motion } from "framer-motion";
import { useState } from "react";

export default function Registro2Page({ onBack, onComplete, userData }) {
  // Estados para el formulario de la segunda parte del registro
  const [formData, setFormData] = useState({
    walletUrl: '',
    keyId: '',
    privateKey: '',
    pin: '',
    confirmPin: ''
  });

  const [errors, setErrors] = useState({});
  const [showBrowser, setShowBrowser] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar Wallet URL
    if (!formData.walletUrl.trim()) {
      newErrors.walletUrl = 'El Wallet URL es requerido';
    } else if (!formData.walletUrl.startsWith('$') && !formData.walletUrl.startsWith('https://')) {
      newErrors.walletUrl = 'El Wallet URL debe comenzar con $ o https://';
    }

    // Validar Key ID
    if (!formData.keyId.trim()) {
      newErrors.keyId = 'El Key ID es requerido';
    }

    // Validar Private Key
    if (!formData.privateKey.trim()) {
      newErrors.privateKey = 'La Private Key es requerida';
    }

    // Validar PIN
    if (!formData.pin) {
      newErrors.pin = 'El PIN es requerido';
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'El PIN debe ser de 4 dígitos';
    }

    // Validar confirmación de PIN
    if (!formData.confirmPin) {
      newErrors.confirmPin = 'Debes confirmar tu PIN';
    } else if (formData.pin !== formData.confirmPin) {
      newErrors.confirmPin = 'Los PINs no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Datos completos del registro:', { ...userData, ...formData });
      // Aquí se llamará al backend para completar el registro
      onComplete({ ...userData, ...formData });
    }
  };

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

      {/* Main content - Full page card */}
      <div className="relative z-10 min-h-screen py-12 px-6">
        {/* White card surface - Registration Form Part 2 */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/50 mx-auto max-w-4xl"
        >
          <div className="p-8 md:p-12">
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Información de tu cuenta Interledger</h1>
                <p className="text-sm text-gray-600 mt-2">Paso 2 de 2</p>
              </div>
              <motion.button
                onClick={onBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors"
              >
                ← Volver
              </motion.button>
            </div>

            {/* Registration Form Part 2 */}
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* No tienes cuenta en Interledger */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      ℹ️ ¿No tienes cuenta en Interledger?
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Crea tu cuenta en Interledger Test Wallet para obtener tu Wallet URL y Key ID.
                    </p>
                    <motion.button
                      type="button"
                      onClick={() => setShowBrowser(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                    >
                      🌐 Crear cuenta aquí
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Mini Browser Overlay */}
              {showBrowser && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                  onClick={() => setShowBrowser(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden"
                  >
                    {/* Browser Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                        </div>
                        <span className="text-white font-semibold text-sm">Interledger Test Wallet</span>
                      </div>
                      <motion.button
                        onClick={() => setShowBrowser(false)}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>

                    {/* Browser URL Bar */}
                    <div className="bg-gray-100 px-6 py-3 border-b border-gray-300">
                      <div className="bg-white rounded-lg px-4 py-2 flex items-center space-x-2 border border-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="text-sm text-gray-600 flex-1">https://wallet.interledger-test.dev</span>
                      </div>
                    </div>

                    {/* Browser Content - iframe */}
                    <div className="flex-1 bg-gray-50">
                      <iframe
                        src="https://wallet.interledger-test.dev"
                        className="w-full h-full border-0"
                        title="Interledger Test Wallet"
                      />
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Información de tu cuenta de Interledger Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-200">
                  🔗 Datos de tu cuenta de Interledger
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Wallet URL */}
                  <div className="md:col-span-2">
                    <label htmlFor="walletUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                      Wallet URL *
                    </label>
                    <input
                      type="text"
                      id="walletUrl"
                      name="walletUrl"
                      value={formData.walletUrl}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 ${errors.walletUrl ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="$ilp.rafiki.money/usuario"
                    />
                    {errors.walletUrl && <p className="text-red-500 text-xs mt-1">{errors.walletUrl}</p>}
                    <p className="text-xs text-gray-500 mt-1">Debe comenzar con $ o https://</p>
                  </div>

                  {/* Key ID */}
                  <div className="md:col-span-2">
                    <label htmlFor="keyId" className="block text-sm font-semibold text-gray-700 mb-2">
                      Key ID *
                    </label>
                    <input
                      type="text"
                      id="keyId"
                      name="keyId"
                      value={formData.keyId}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 ${errors.keyId ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    />
                    {errors.keyId && <p className="text-red-500 text-xs mt-1">{errors.keyId}</p>}
                  </div>

                  {/* Private Key */}
                  <div className="md:col-span-2">
                    <label htmlFor="privateKey" className="block text-sm font-semibold text-gray-700 mb-2">
                      Private Key *
                    </label>
                    <textarea
                      id="privateKey"
                      name="privateKey"
                      value={formData.privateKey}
                      onChange={handleInputChange}
                      rows="4"
                      className={`w-full px-4 py-3 border-2 ${errors.privateKey ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono text-sm`}
                      placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    />
                    {errors.privateKey && <p className="text-red-500 text-xs mt-1">{errors.privateKey}</p>}
                    <p className="text-xs text-gray-500 mt-1">Pega tu clave privada de Interledger aquí</p>
                  </div>

                  {/* PIN */}
                  <div>
                    <label htmlFor="pin" className="block text-sm font-semibold text-gray-700 mb-2">
                      PIN de 4 dígitos *
                    </label>
                    <input
                      type="password"
                      id="pin"
                      name="pin"
                      maxLength="4"
                      value={formData.pin}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 ${errors.pin ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest`}
                      placeholder="••••"
                    />
                    {errors.pin && <p className="text-red-500 text-xs mt-1">{errors.pin}</p>}
                    <p className="text-xs text-gray-500 mt-1">Este PIN protegerá tus transacciones</p>
                  </div>

                  {/* Confirmar PIN */}
                  <div>
                    <label htmlFor="confirmPin" className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmar PIN *
                    </label>
                    <input
                      type="password"
                      id="confirmPin"
                      name="confirmPin"
                      maxLength="4"
                      value={formData.confirmPin}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 ${errors.confirmPin ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest`}
                      placeholder="••••"
                    />
                    {errors.confirmPin && <p className="text-red-500 text-xs mt-1">{errors.confirmPin}</p>}
                  </div>
                </div>
              </div>

              {/* Resumen de Datos */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📝 Resumen de tu Información</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Nombre:</span>{' '}
                    <span className="text-gray-900">{userData?.firstName} {userData?.lastName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Ciudad:</span>{' '}
                    <span className="text-gray-900">{userData?.city}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">País:</span>{' '}
                    <span className="text-gray-900">{userData?.country}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Email:</span>{' '}
                    <span className="text-gray-900">{userData?.email}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
                  Continuar →
                </motion.button>
              </div>

            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
