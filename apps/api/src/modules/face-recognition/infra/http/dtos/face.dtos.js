import { z } from 'zod';
const Emb = z.array(z.number()).min(128);
const EnrollDto = z.object({
  user_id: z.number().int().optional(),
  email: z.string().email().optional(),
  embeddings: z.array(Emb).min(1).max(5),
  quality: z.number().min(0).max(1).optional()
}).refine(v => v.user_id || v.email, { message:'user_id or email required', path:['user_id'] });
const VerifyDto = z.object({
  emb: Emb, pos_id: z.string().optional(), liveness_ok: z.boolean().default(false)
});
export { EnrollDto, VerifyDto };
