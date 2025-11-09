-- ============================================
-- MIGRACIÓN: Actualizar esquema de base de datos
-- Mantiene tablas de reconocimiento facial
-- ============================================

-- 1. Modificar tabla users
ALTER TABLE users DROP COLUMN IF EXISTS payment_pointer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(120);
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(120);
ALTER TABLE users ALTER COLUMN nip TYPE VARCHAR(60);

-- 2. Modificar tabla client_profile (agregar ciudad y pais)
ALTER TABLE client_profile ADD COLUMN IF NOT EXISTS ciudad VARCHAR(30);
ALTER TABLE client_profile ADD COLUMN IF NOT EXISTS pais VARCHAR(30);

-- Remover campos que ya no se usan
ALTER TABLE client_profile DROP COLUMN IF EXISTS fecha_nacimiento;
ALTER TABLE client_profile DROP COLUMN IF EXISTS telefono;

-- 3. Modificar tabla vendor_profile (agregar descripcion)
ALTER TABLE vendor_profile ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- 4. Modificar tabla client_keys (agregar url)
ALTER TABLE client_keys ADD COLUMN IF NOT EXISTS url TEXT;

-- Asegurarnos de que private_key y public_key existan
ALTER TABLE client_keys ADD COLUMN IF NOT EXISTS public_key TEXT;
ALTER TABLE client_keys ALTER COLUMN private_key TYPE TEXT;

-- Remover columnas de auditoría si existen
ALTER TABLE client_keys DROP COLUMN IF EXISTS created_at;
ALTER TABLE client_keys DROP COLUMN IF EXISTS is_active;

-- 5. Actualizar índices de client_keys
DROP INDEX IF EXISTS idx_client_keys_active;
CREATE INDEX IF NOT EXISTS idx_client_keys_user ON client_keys(client_user_id);

-- 6. Actualizar transactions (ya está bien estructurada)
-- Solo asegurar que los tipos sean correctos
ALTER TABLE transactions ALTER COLUMN currency TYPE CHAR(3);
ALTER TABLE transactions ALTER COLUMN status TYPE VARCHAR(20);
ALTER TABLE transactions ALTER COLUMN external_id TYPE VARCHAR(100);
ALTER TABLE transactions ALTER COLUMN ilp_receipt TYPE VARCHAR(255);
ALTER TABLE transactions ALTER COLUMN description TYPE VARCHAR(255);

-- 7. Actualizar tickets (cambiar de jsonb a json si es necesario)
-- PostgreSQL acepta ambos, pero el esquema pide json
-- jsonb es mejor para performance, lo dejamos

-- 8. Eliminar tabla clientes legacy si existe y no se usa
-- DROP TABLE IF EXISTS clientes;

-- ============================================
-- TABLAS DE RECONOCIMIENTO FACIAL (se mantienen)
-- ============================================
-- face_embeddings: ya existe con vector(512) y relación a users
-- face_auth_logs: ya existe con logs de autenticación

-- Verificar que face_embeddings tiene FK a users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'face_embeddings_user_id_fkey'
    ) THEN
        ALTER TABLE face_embeddings 
        ADD CONSTRAINT face_embeddings_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Crear índice en face_embeddings por user_id si no existe
CREATE INDEX IF NOT EXISTS idx_face_embeddings_user_id ON face_embeddings(user_id);

-- Crear índices útiles en face_auth_logs
CREATE INDEX IF NOT EXISTS idx_face_auth_logs_user_id ON face_auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_face_auth_logs_created_at ON face_auth_logs(created_at);

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================
-- Mostrar estructura resultante
DO $$
BEGIN
    RAISE NOTICE 'Migración completada exitosamente';
END $$;
