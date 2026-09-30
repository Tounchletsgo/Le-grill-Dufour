-- Table pour stocker les sessions de mode test (remplace le stockage en mémoire)
CREATE TABLE IF NOT EXISTS test_mode_sessions (
  device_id TEXT PRIMARY KEY,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Nettoyage automatique des sessions expirees
CREATE INDEX IF NOT EXISTS idx_test_mode_expires ON test_mode_sessions (expires_at);
