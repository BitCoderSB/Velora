import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";

export default function WelcomePage({ onStart }) {
  const phrases = [
    "Tu puerta de entrada al futuro de los pagos globales con Interledger Protocol. Envía, recibe y conecta activos sin fronteras",
    "Conecta el mundo financiero sin límites. Pagos instantáneos entre cualquier red de blockchain",
    "La revolución de las transferencias digitales. Intercambia valor a través de múltiples protocolos sin fricciones",
    "Uniendo ecosistemas financieros. Tu dinero fluye libremente entre diferentes plataformas y monedas"
  ];
  
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-white">
      {/* Top Navigation Panel */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-center">
          <motion.h2 
            className="text-2xl font-bold"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
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

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24">
        <div className="max-w-6xl mx-auto text-center">
          
          {/* Header */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="mb-16"
          >
            
            {/* Main heading with gradient text */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-center">
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
                  WebkitTextStroke: '1.5px black',
                  paintOrder: 'stroke fill'
                }}
              >
                Velora
              </motion.span>
            </h1>
            
            <div className="text-xl md:text-2xl text-slate-700 font-light max-w-3xl mx-auto leading-relaxed h-24 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPhraseIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {phrases[currentPhraseIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* User Login Card */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mb-16 max-w-md mx-auto"
          >
            <ProximityGlow className="rounded-2xl" c1="rgba(255,127,80,0.3)" c2="rgba(221,160,221,0.25)">
              <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-lg" style={{ borderColor: 'rgba(255, 127, 80, 0.4)' }}>
                {/* Background gradient */}
                <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(to bottom right, rgba(255, 127, 80, 0.2), rgba(255, 99, 71, 0.2))' }} />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  {/* Greeting and Profile Picture - Centered */}
                  <div className="flex flex-col items-center justify-center w-full mb-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 shadow-lg mb-4" style={{ borderColor: '#FF7F50' }}>
                      <svg className="w-full h-full text-slate-400 bg-slate-100" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900">
                      Hola <span className="text-4xl">usuario</span>
                    </h3>
                  </div>
                  
                  {/* Change User Option */}
                  <button className="mb-6 font-bold text-base hover:underline transition-colors" style={{ color: '#3B82F6' }}>
                    Cambiar de usuario
                  </button>
                  
                  {/* Enter Button */}
                  <ProximityGlow 
                    className="rounded-xl w-full" 
                    c1="rgba(255,127,80,0.5)" 
                    c2="rgba(221,160,221,0.4)" 
                    radius={200} 
                    intensity={0.5}
                  >
                    <button
                      onClick={onStart}
                      className="w-full px-8 py-4 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      style={{ 
                        background: 'linear-gradient(to right, #FF7F50, #DDA0DD, #F0E68C)',
                      }}
                    >
                      Entrar
                    </button>
                  </ProximityGlow>
                </div>
              </div>
            </ProximityGlow>
          </motion.div>

          {/* Features Info */}
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center"
          >
            <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#98FB98' }} />
                <span>100% Descentralizada</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F0E68C' }} />
                <span>Sin comisiones ocultas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#DDA0DD' }} />
                <span>Soporte multi-activos</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none" style={{ background: 'linear-gradient(to top, white, transparent)' }} />
    </div>
  );
}