import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { paymentsRouter } from './modules/payments/infra/http/routes.js';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import { mountFace } from './modules/face-recognition/infra/http/index.js';
import { createFaceRecognitionTables } from './modules/face-recognition/infra/persistence/migrations/setup.js';

const app = express();
// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use('/api/payments', express.json({ limit: '1mb' }), paymentsRouter);

mountFace(app);
app.get('/health', (_req,res)=>res.json({ ok:true }));


const port = process.env.PORT || 3000;

// Inicializar servidor con setup de base de datos
async function startServer() {
  try {
    // Crear tablas necesarias para reconocimiento facial
    await createFaceRecognitionTables();
    
    // Iniciar servidor
    const server = app.listen(port, () => {
      console.log(`🚀 API funcionando en puerto ${port}`);
      console.log('📊 Base de datos configurada para reconocimiento facial');
    });

    // Manejar errores del servidor
    server.on('error', (error) => {
      console.error('❌ Error del servidor:', error);
    });

    // Mantener el proceso vivo
    process.on('SIGINT', () => {
      console.log('\n🛑 Cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    console.error('Stack trace:', error.stack);
    
    // No salir inmediatamente, intentar iniciar sin migración
    console.log('⚠️ Intentando iniciar servidor sin migración...');
    app.listen(port, () => {
      console.log(`🚀 API funcionando en puerto ${port} (sin migración DB)`);
    });
  }
}

startServer();
