import { pool } from '../db.js';

export async function createFaceRecognitionTables() {
  try {
    console.log('🗄️ Creando tablas para reconocimiento facial...');

    // Crear extensión vector si no existe
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    console.log('✅ Extensión vector habilitada');

    // Crear tabla de clientes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clientes (
          id SERIAL PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          telefono VARCHAR(20),
          user_id VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla clientes creada');

    // Crear tabla face_embeddings
    await pool.query(`
      CREATE TABLE IF NOT EXISTS face_embeddings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          emb VECTOR(512) NOT NULL,
          quality FLOAT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES clientes(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Tabla face_embeddings creada');

    // Crear índice para búsqueda vectorial
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_face_embeddings_cosine 
      ON face_embeddings USING ivfflat (emb vector_cosine_ops)
    `);
    console.log('✅ Índice vectorial creado');

    // Crear tabla face_auth_logs
    await pool.query(`
      CREATE TABLE IF NOT EXISTS face_auth_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          pos_id VARCHAR(50),
          score FLOAT,
          liveness_ok BOOLEAN NOT NULL DEFAULT false,
          decision VARCHAR(20) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla face_auth_logs creada');

    // Crear índices adicionales
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON clientes(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_face_embeddings_user_id ON face_embeddings(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_face_auth_logs_user_id ON face_auth_logs(user_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_face_auth_logs_created_at ON face_auth_logs(created_at)
    `);
    console.log('✅ Índices adicionales creados');

    console.log('🎉 Tablas de reconocimiento facial configuradas correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error creando tablas:', error);
    throw error;
  }
}