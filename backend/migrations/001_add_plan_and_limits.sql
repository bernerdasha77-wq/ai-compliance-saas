-- Миграция для новой тарифной логики (лимит бесплатных проверок + превью-отчёты).
-- ВАЖНО: database.py использует Base.metadata.create_all(), который создаёт
-- только ОТСУТСТВУЮЩИЕ таблицы и НЕ добавляет новые колонки в уже существующие
-- таблицы. Если БД уже развёрнута (продакшен на Render), это нужно применить
-- вручную ДО деплоя нового кода — иначе бэкенд упадёт при первом же запросе,
-- пытаясь прочитать несуществующие колонки users.plan / users.free_checks_used
-- / reports.is_full_report.

ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_checks_used INTEGER DEFAULT 0;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_full_report BOOLEAN DEFAULT TRUE;

-- На всякий случай подчищаем NULL у уже существующих строк (DEFAULT применяется
-- только к новым INSERT, не к уже существующим NULL-значениям после ALTER).
UPDATE users SET plan = 'free' WHERE plan IS NULL;
UPDATE users SET free_checks_used = 0 WHERE free_checks_used IS NULL;
UPDATE reports SET is_full_report = TRUE WHERE is_full_report IS NULL;
