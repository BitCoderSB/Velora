import express from 'express';
import { EnrollDto, VerifyDto } from '../dtos/face.dtos.js';
import { enroll, verify } from '../../../domain/services/face.service.js';
const router = express.Router();

router.post('/face/enroll', async (req, res) => {
  try {
    console.log('📨 Recibiendo request de enroll');
    console.log('📦 Body keys:', Object.keys(req.body));
    console.log('📋 Body values:', JSON.stringify(req.body, null, 2));
    
    const p = EnrollDto.parse(req.body);
    console.log('✅ Validación de DTO exitosa');
    console.log('📝 Datos parseados:', { ...p, password: '***', privateKey: '***', embeddings: `${p.embeddings.length} embeddings` });
    
    const out = await enroll(p);
    console.log('✅ Enrolamiento exitoso:', out);
    
    res.json({ ok: true, ...out });
  } catch (e) {
    console.error('❌ Error en /face/enroll:', e.message);
    console.error('📍 Stack:', e.stack);
    
    // Si es error de validación de Zod, devolver 400, si no 500
    const statusCode = e.name === 'ZodError' ? 400 : 500;
    res.status(statusCode).json({ ok: false, error: e.message });
  }
});

router.post('/face/verify', async (req, res) => {
  try { const p = VerifyDto.parse(req.body); const out = await verify(p); res.json(out); }
  catch (e) { res.status(400).json({ ok:false, error: e.message }); }
});

export default router;
