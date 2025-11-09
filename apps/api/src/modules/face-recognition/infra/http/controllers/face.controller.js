import express from 'express';
import { EnrollDto, VerifyDto } from '../dtos/face.dtos.js';
import { enroll, verify } from '../../../domain/services/face.service.js';
const router = express.Router();

router.post('/face/enroll', async (req, res) => {
  try { const p = EnrollDto.parse(req.body); const out = await enroll(p); res.json({ ok:true, ...out }); }
  catch (e) { res.status(400).json({ ok:false, error: e.message }); }
});

router.post('/face/verify', async (req, res) => {
  try { const p = VerifyDto.parse(req.body); const out = await verify(p); res.json(out); }
  catch (e) { res.status(400).json({ ok:false, error: e.message }); }
});

export default router;
