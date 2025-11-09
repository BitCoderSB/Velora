import { pool } from '../db.js'; // ruta relativa a este repo

async function ensureUserId({ user_id, email }) {
  if (user_id) return user_id;
  if (!email) throw new Error('user_id or email required');
  
  try {
    // Buscar usuario existente
    let result = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    
    // Si no existe, crear uno nuevo
    if (!result.rows[0]) {
      console.log(`👤 Creando nuevo usuario con email: ${email}`);
      
      // Intentar con la estructura de tabla existente
      try {
        result = await pool.query(
          'INSERT INTO users (email, payment_pointer, nip) VALUES ($1, $2, $3) RETURNING id',
          [email, `$${email}`, '$2b$10$defaulthash'] // Valores por defecto temporales
        );
      } catch (insertError) {
        // Si falla, intentar con estructura más simple
        result = await pool.query(
          'INSERT INTO users (email) VALUES ($1) RETURNING id',
          [email]
        );
      }
    }
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error en ensureUserId:', error);
    throw new Error(`No se pudo crear/obtener usuario: ${error.message}`);
  }
}
async function insertTemplate({ user_id, emb, quality }) {
  const { rows } = await pool.query(
    'INSERT INTO face_embeddings (user_id, emb, quality) VALUES ($1, $2::vector, $3) RETURNING id',
    [user_id, emb.join(','), quality ?? null]
  );
  return rows[0].id;
}
async function topK({ emb, k=5 }) {
  const { rows } = await pool.query(
    `SELECT user_id, 1 - (emb <#> $1::vector) AS score
     FROM face_embeddings
     ORDER BY emb <#> $1::vector
     LIMIT $2`,
    [emb.join(','), k]
  );
  return rows;
}
async function logAuth({ user_id, pos_id, score, liveness_ok, decision }) {
  await pool.query(
    'INSERT INTO face_auth_logs (user_id,pos_id,score,liveness_ok,decision) VALUES ($1,$2,$3,$4,$5)',
    [user_id ?? null, pos_id ?? null, score ?? null, !!liveness_ok, decision]
  );
}
export { ensureUserId, insertTemplate, topK, logAuth };
