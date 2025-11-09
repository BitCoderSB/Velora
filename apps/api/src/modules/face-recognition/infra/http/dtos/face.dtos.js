import { z } from 'zod';
const Emb = z.array(z.number()).min(128);
const EnrollDto = z.object({
  // Datos de usuario existentes (para compatibility)
  user_id: z.number().int().optional(),
  
  // Datos del nuevo esquema de registro
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  
  // Datos de Interledger
  walletUrl: z.string().min(1),
  keyId: z.string().min(1),
  privateKey: z.string().optional(), // Private key de Interledger (opcional)
  pin: z.string().regex(/^\d{4}$/, 'PIN debe ser de 4 dígitos'),
  
  // Embeddings faciales
  embeddings: z.array(Emb).min(1).max(5),
  quality: z.number().min(0).max(1).optional()
});

const VerifyDto = z.object({
  emb: Emb, 
  pos_id: z.string().optional(), 
  liveness_ok: z.boolean().default(false)
});

export { EnrollDto, VerifyDto };
