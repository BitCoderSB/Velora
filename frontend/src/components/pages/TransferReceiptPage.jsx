import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";

export default function TransferReceiptPage({ onBack, transferResult }) {
  const phrases = [
    "Tu puerta de entrada al futuro de los pagos globales con Interledger Protocol. Envía, recibe y conecta activos sin fronteras",
    "Conecta el mundo financiero sin límites. Pagos instantáneos entre cualquier red de blockchain",
    "La revolución de las transferencias digitales. Intercambia valor a través de múltiples protocolos sin fricciones",
    "Uniendo ecosistemas financieros. Tu dinero fluye libremente entre diferentes plataformas y monedas"
  ];
  
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const ticketRef = useRef(null);
  
  // Datos simulados de la respuesta ILP - En producción vendrán del backend
  // Usar datos de transferResult si existen, sino usar datos demo
  const receiptData = {
    transactionId: transferResult?.transactionId || `TXN-ILP-${Date.now()}`,
    status: transferResult?.status || 'COMPLETED',
    amount: transferResult?.amount?.toString() || '100.00',
    currency: transferResult?.currency || 'USD',
    senderWallet: transferResult?.senderWallet || '$wallet.velora.app/usuario',
    receiverWallet: transferResult?.receiverWallet || transferResult?.walletUrl || '$wallet.example.com/destinatario',
    description: transferResult?.description || 'Pago por servicios',
    timestamp: transferResult?.timestamp || new Date().toISOString(),
    ilpPacket: transferResult?.ilpPacket || {
      amount: transferResult?.amount ? (parseFloat(transferResult.amount) * 1000000).toString() : '100000000',
      destination: transferResult?.receiverWallet ? `g.crypto.${transferResult.receiverWallet.split('/')[1] || 'recipient'}` : 'g.crypto.recipient',
      executionCondition: 'uzoYx3K6u+Nt6kZjbN6KmH4LcipUsRcYHRO8CU2VRIg=',
      expiresAt: new Date(Date.now() + 30000).toISOString(),
    },
    fulfillment: transferResult?.fulfillment || 'HS8e5Ew02XKAglyus2dh2Ohabuqmy3HDM8EXMLz22ok=',
    fee: transferResult?.fee || '0.01',
    exchangeRate: transferResult?.exchangeRate || '1.00',
    connectorRoute: transferResult?.connectorRoute || 'velora.connector -> destination.connector',
    paymentPointer: transferResult?.paymentPointer || transferResult?.receiverWallet || '$ilp.rafiki.money/destinatario',
  };
  
  // Ejemplo de notificaciones
  const notifications = [
    { id: 1, message: "Transferencia completada exitosamente", time: "Ahora", unread: true },
    { id: 2, message: "Nueva transacción recibida: 50 USD", time: "Hace 5 min", unread: true },
    { id: 3, message: "Tu wallet ha sido actualizada", time: "Hace 2 horas", unread: false },
  ];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const handleDownloadReceipt = () => {
    // Crear un canvas y convertir el ticket a imagen
    alert('Función de descarga de ticket - Por implementar');
    // Aquí se implementaría la lógica para generar PDF o imagen del ticket
  };

  const handleShareReceipt = () => {
    // Compartir el ticket
    if (navigator.share) {
      navigator.share({
        title: 'Comprobante de Transferencia',
        text: `Transferencia completada: ${receiptData.amount} ${receiptData.currency}`,
        url: window.location.href,
      });
    } else {
      alert('Compartir no está disponible en este navegador');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };
  
  return (
    <div 
      className="relative min-h-screen overflow-x-hidden overflow-y-auto"
      style={{ 
        background: 'linear-gradient(135deg, #FFE5B4 0%, #FFB6C1 50%, #F0E68C 100%)'
      }}
    >
      {/* Top Navigation Panel */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm print:hidden">
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
      <div className="absolute inset-0 pointer-events-none print:hidden">
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

      {/* Main content - Receipt Ticket */}
      <div className="relative z-10 min-h-screen pt-24 pb-8 px-6">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: 0.2,
            type: "spring",
            stiffness: 200,
            damping: 15
          }}
          className="text-center mb-6 print:hidden"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Transferencia Exitosa!
          </h1>
          <p className="text-gray-600">
            Tu pago ha sido procesado correctamente
          </p>
        </motion.div>

        {/* Receipt Ticket Card */}
        <motion.div
          ref={ticketRef}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative bg-white rounded-3xl shadow-2xl border-2 border-gray-200 mx-auto max-w-2xl overflow-hidden"
        >
          {/* Perforated edge effect at top */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-100 to-transparent print:hidden" 
               style={{
                 backgroundImage: 'radial-gradient(circle, white 50%, transparent 50%)',
                 backgroundSize: '20px 20px',
                 backgroundPosition: '0 0'
               }}
          />

          <div className="p-8 md:p-12 mt-4">
            {/* Header con logo y fecha */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-dashed border-gray-300">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Velora</h2>
                <p className="text-sm text-gray-600">Comprobante de Transferencia</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Fecha</p>
                <p className="text-sm text-gray-900 font-mono">
                  {new Date(receiptData.timestamp).toLocaleString('es-MX', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>

            {/* Transaction Status */}
            <div className="mb-6 text-center">
              <span className="inline-flex items-center px-6 py-2 rounded-full text-sm font-bold bg-green-100 text-green-800 border-2 border-green-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {receiptData.status}
              </span>
            </div>

            {/* Amount - Destacado */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 mb-8 text-center border-2 border-green-200">
              <p className="text-sm text-gray-600 mb-2 uppercase font-semibold">Monto Transferido</p>
              <p className="text-5xl font-bold text-green-600 mb-2">
                ${parseFloat(receiptData.amount).toFixed(2)}
              </p>
              <p className="text-lg text-gray-700 font-semibold">{receiptData.currency}</p>
              {receiptData.fee && parseFloat(receiptData.fee) > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Comisión: ${parseFloat(receiptData.fee).toFixed(2)} {receiptData.currency}
                </p>
              )}
            </div>

            {/* Transaction Details */}
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Detalles de la Transacción
              </h3>

              {/* Transaction ID */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">ID de Transacción</p>
                <p className="text-sm text-gray-900 font-mono break-all">{receiptData.transactionId}</p>
              </div>

              {/* Sender */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">De (Remitente)</p>
                <p className="text-sm text-gray-900 font-mono break-all">{receiptData.senderWallet}</p>
              </div>

              {/* Receiver */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">Para (Destinatario)</p>
                <p className="text-sm text-gray-900 font-mono break-all">{receiptData.receiverWallet}</p>
              </div>

              {/* Description */}
              {receiptData.description && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">Descripción</p>
                  <p className="text-sm text-gray-900">{receiptData.description}</p>
                </div>
              )}

              {/* Payment Pointer */}
              {receiptData.paymentPointer && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1 font-semibold uppercase">Payment Pointer (ILP)</p>
                  <p className="text-sm text-gray-900 font-mono break-all">{receiptData.paymentPointer}</p>
                </div>
              )}
            </div>

            {/* ILP Technical Details - Collapsible */}
            <details className="mb-8 bg-blue-50 rounded-lg border border-blue-200">
              <summary className="p-4 cursor-pointer font-semibold text-blue-900 hover:bg-blue-100 rounded-lg transition-colors">
                📊 Detalles Técnicos de ILP (Interledger Protocol)
              </summary>
              <div className="p-4 pt-0 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Paquete ILP - Monto</p>
                  <p className="text-blue-900 font-mono break-all">{receiptData.ilpPacket.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Destino ILP</p>
                  <p className="text-blue-900 font-mono break-all">{receiptData.ilpPacket.destination}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Condición de Ejecución</p>
                  <p className="text-blue-900 font-mono break-all text-xs">{receiptData.ilpPacket.executionCondition}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Fulfillment</p>
                  <p className="text-blue-900 font-mono break-all text-xs">{receiptData.fulfillment}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Ruta de Conectores</p>
                  <p className="text-blue-900">{receiptData.connectorRoute}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 font-semibold uppercase mb-1">Tasa de Cambio</p>
                  <p className="text-blue-900">{receiptData.exchangeRate}</p>
                </div>
              </div>
            </details>

            {/* Footer con QR Code placeholder */}
            <div className="pt-6 border-t-2 border-dashed border-gray-300">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <p className="text-xs text-gray-500 mb-1">Powered by</p>
                  <p className="text-sm font-bold text-gray-900">Interledger Protocol</p>
                </div>
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Perforated edge effect at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-100 to-transparent print:hidden" 
               style={{
                 backgroundImage: 'radial-gradient(circle, white 50%, transparent 50%)',
                 backgroundSize: '20px 20px',
                 backgroundPosition: '0 0'
               }}
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 max-w-2xl mx-auto space-y-3 print:hidden"
        >
          {/* Download Button */}
          <button
            onClick={handleDownloadReceipt}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar Comprobante
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrintReceipt}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Imprimir Ticket
          </button>

          {/* Share Button */}
          <button
            onClick={handleShareReceipt}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Compartir
          </button>

          {/* Return Home Button */}
          <button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Volver al Inicio
          </button>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none print:hidden" style={{ background: 'linear-gradient(to top, rgba(255, 229, 180, 0.5), transparent)' }} />
    </div>
  );
}
