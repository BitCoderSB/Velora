import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';

const app = express();

// Configurar CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use(express.json());

// Endpoint de salud simple
app.get('/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Endpoints mock para pruebas
app.post('/api/face/enroll', (req, res) => {
  console.log('📝 Enroll request:', req.body);
  res.json({ 
    ok: true, 
    user_id: Math.floor(Math.random() * 1000),
    message: 'Mock enrolamiento exitoso' 
  });
});

app.post('/api/face/verify', (req, res) => {
  console.log('🔍 Verify request:', req.body);
  res.json({ 
    match: true, 
    score: 0.85, 
    user_id: 123,
    decision: 'accept',
    message: 'Mock verificación exitosa' 
  });
});

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`🚀 Servidor mock funcionando en puerto ${port}`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor mock...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});