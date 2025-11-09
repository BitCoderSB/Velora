-- Tablas necesarias para reconocimiento facial

-- Extensión para vectores (requiere pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla para almacenar embeddings faciales
CREATE TABLE face_embeddings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emb VECTOR(512) NOT NULL, -- Vector de 512 dimensiones para ArcFace
    quality FLOAT, -- Calidad del embedding (0.0 a 1.0)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsqueda vectorial eficiente
CREATE INDEX idx_face_embeddings_cosine ON face_embeddings USING ivfflat (emb vector_cosine_ops);

-- Tabla para logs de autenticación facial
CREATE TABLE face_auth_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    pos_id VARCHAR(50), -- Identificador del punto de venta
    score FLOAT, -- Score de similitud (0.0 a 1.0)
    liveness_ok BOOLEAN NOT NULL DEFAULT false,
    decision VARCHAR(20) NOT NULL, -- 'accept', 'reject', 'gray', 'no-candidate'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para consultas eficientes
CREATE INDEX idx_face_auth_logs_user_id ON face_auth_logs(user_id);
CREATE INDEX idx_face_auth_logs_created_at ON face_auth_logs(created_at);
CREATE INDEX idx_face_auth_logs_decision ON face_auth_logs(decision);

-- Comentarios para documentación
COMMENT ON TABLE face_embeddings IS 'Almacena vectores (embeddings) faciales para reconocimiento biométrico';
COMMENT ON COLUMN face_embeddings.emb IS 'Vector facial de 512 dimensiones generado por ArcFace';
COMMENT ON COLUMN face_embeddings.quality IS 'Calidad del embedding, mayor valor = mejor calidad';

COMMENT ON TABLE face_auth_logs IS 'Registra todos los intentos de autenticación facial';
COMMENT ON COLUMN face_auth_logs.score IS 'Score de similitud: 1.0 = idéntico, 0.0 = completamente diferente';
COMMENT ON COLUMN face_auth_logs.decision IS 'Decisión tomada: accept (>=0.75), gray (0.60-0.75), reject (<0.60)';