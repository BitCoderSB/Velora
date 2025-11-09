import { motion } from "framer-motion";

export default function RegistroFacialPage({ onBack, onComplete, userData }) {
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

      {/* Main content - Vacío */}
      <div className="relative z-10 min-h-screen py-12 px-6">
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/50 mx-auto max-w-4xl"
        >
          <div className="p-8 md:p-12">
            {/* Contenido vacío */}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
