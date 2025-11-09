import { pool } from '../db.js'; // ruta relativa a este repo
import bcrypt from 'bcrypt';

async function ensureUserId({ 
  user_id, 
  email, 
  password, 
  firstName, 
  lastName, 
  address,
  city, 
  country, 
  walletUrl, 
  keyId,
  privateKey,
  pin 
}) {
  if (user_id) return user_id;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Verificar si el email ya existe
    let result = await client.query('SELECT id FROM users WHERE email=$1', [email]);
    
    if (result.rows[0]) {
      throw new Error('El email ya está registrado');
    }
    
    console.log(`👤 Creando nuevo usuario: ${firstName} ${lastName} <${email}>`);
    
    // Hash de password y PIN
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedPin = await bcrypt.hash(pin, 10);
    
    // 1. Crear usuario en tabla users
    result = await client.query(
      `INSERT INTO users (email, password, nip, is_client, is_vendor) 
       VALUES ($1, $2, $3, true, false) 
       RETURNING id`,
      [email, hashedPassword, hashedPin]
    );
    
    const newUserId = result.rows[0].id;
    
    // 2. Crear perfil de cliente en client_profile
    await client.query(
      `INSERT INTO client_profile (user_id, nombre, apellido, direccion, ciudad, pais) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [newUserId, firstName, lastName, address, city, country]
    );
    
    // 3. Guardar llaves de Interledger en client_keys
    // TODO: Cifrar la private_key antes de guardarla
    const hashedPrivateKey = privateKey ? await bcrypt.hash(privateKey, 10) : '';
    
    await client.query(
      `INSERT INTO client_keys (client_user_id, key_id, url, public_key, private_key) 
       VALUES ($1, $2, $3, $4, $5)`,
      [newUserId, keyId, walletUrl, '', hashedPrivateKey]
    );
    
    await client.query('COMMIT');
    console.log(`✅ Usuario creado exitosamente con ID: ${newUserId}`);
    
    return newUserId;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en ensureUserId:', error);
    throw new Error(`No se pudo crear usuario: ${error.message}`);
  } finally {
    client.release();
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
    `SELECT fe.user_id, 
            cp.nombre || ' ' || cp.apellido AS nombre, 
            u.email, 
            1 - (fe.emb <#> $1::vector) AS score
     FROM face_embeddings fe
     JOIN users u ON fe.user_id = u.id
     JOIN client_profile cp ON fe.user_id = cp.user_id
     ORDER BY fe.emb <#> $1::vector
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
