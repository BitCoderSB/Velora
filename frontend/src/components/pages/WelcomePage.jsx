import { motion } from "framer-motion";
import { useState } from "react";
import ProximityGlow from "@components/ui/ProximityGlow.jsx";
import Cookies from "js-cookie";

export default function WelcomePage({ onStartVendor, onStartClient, onDevRegistroFacial }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-white">
      {/* Centered Login Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Velora Title - Big and Bold at top */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-6xl font-bold text-center mb-12 text-slate-900"
          >
            Velora
          </motion.h1>

          {/* Login Form */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="w-full"
            >
              <ProximityGlow className="rounded-2xl" c1="rgba(255,127,80,0.3)" c2="rgba(221,160,221,0.25)">
                <div className="relative overflow-hidden bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl p-8 shadow-lg" style={{ borderColor: 'rgba(255, 127, 80, 0.4)' }}>
                  {/* Background gradient */}
                  <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(to bottom right, rgba(255, 127, 80, 0.2), rgba(255, 99, 71, 0.2))' }} />
                  
                  {/* Content */}
                  <div className="relative z-10 flex flex-col">
                    {/* Identificate Title */}
                    <h3 className="text-3xl font-bold text-slate-900 mb-6 text-center">
                      Identifícate
                    </h3>
                    
                    {/* Email Input */}
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    {/* Login Button */}
                    <ProximityGlow 
                      className="rounded-xl w-full mb-4" 
                      c1="rgba(79,70,229,0.5)" 
                      c2="rgba(236,72,153,0.4)" 
                      radius={200} 
                      intensity={0.5}
                    >
                      <button
                        onClick={() => {
                          Cookies.set('userEmail', email, { expires: 7 }); // Store email for 7 days
                          onStartClient();
                        }}
                        className="w-full px-8 py-4 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        style={{ 
                          background: 'linear-gradient(to right, #4F46E5, #7C3AED, #EC4899)',
                        }}
                      >
                        Iniciar sesión
                      </button>
                    </ProximityGlow>

                    {/* Divider */}
                    <div className="my-6 text-center text-sm text-gray-600">
                      ¿No tienes cuenta?
                    </div>

                    {/* Create Account Button */}
                    <ProximityGlow 
                      className="rounded-xl w-full" 
                      c1="rgba(255,127,80,0.5)" 
                      c2="rgba(221,160,221,0.4)" 
                      radius={200} 
                      intensity={0.5}
                    >
                      <button
                        onClick={onStartVendor}
                        className="w-full px-8 py-4 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                        style={{ 
                          background: 'linear-gradient(to right, #FF7F50, #DDA0DD, #F0E68C)',
                        }}
                      >
                        Crear cuenta
                      </button>
                    </ProximityGlow>

                    {/* Dev Shortcut Button */}
                    <button
                      onClick={onDevRegistroFacial}
                      className="mt-4 w-full px-4 py-2 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                    >
                      dev probar registro cara
                    </button>
                  </div>
                </div>
              </ProximityGlow>
            </motion.div>
          </div>
        </div>
      </div>

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
    </div>
  );
}