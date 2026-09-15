-- Мониторинг изменений источников законов, проиндексированных в RAG (см.
-- scripts/check_law_updates.py). Отдельная таблица, не связана с law_chunks.
CREATE TABLE IF NOT EXISTS law_source_hashes (
    source_name VARCHAR(50) PRIMARY KEY,  -- 'GDPR', 'NIS2', '152-ФЗ'
    url TEXT NOT NULL,
    hash VARCHAR(64) NOT NULL,            -- SHA-256 hex
    last_checked_at TIMESTAMP DEFAULT NOW(),
    last_changed_at TIMESTAMP
);
