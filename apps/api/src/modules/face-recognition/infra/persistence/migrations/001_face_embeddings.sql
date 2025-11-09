-- Embeddings ONNX 512D por usuario
CREATE TABLE IF NOT EXISTS face_embeddings (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emb         VECTOR(512) NOT NULL,   -- L2 normalizado
  quality     REAL,                   -- 0..1 opcional
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Índice ANN para coseno (usa emb normalizado)
CREATE INDEX IF NOT EXISTS face_embeddings_hnsw_cos
ON face_embeddings USING hnsw (emb vector_cosine_ops);

-- Logs de autenticación facial
CREATE TABLE IF NOT EXISTS face_auth_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     INT,
  pos_id      TEXT,
  score       REAL,
  liveness_ok BOOLEAN,
  decision    TEXT,                   -- accept|gray|reject|no-candidate
  created_at  TIMESTAMPTZ DEFAULT now()
);
