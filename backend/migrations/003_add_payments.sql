-- Инфраструктура для оплаты через ЮKassa (см. services/payments.py).
-- Как и в 001/002: Base.metadata.create_all() в database.py не добавляет
-- новые колонки в уже существующие таблицы и не создаёт новые таблицы для
-- уже развёрнутой БД сам по себе — на проде (Render) применить вручную до
-- деплоя кода, который читает/пишет эти поля.

ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS period_checks_used INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS one_time_credits INTEGER DEFAULT 0;

UPDATE users SET period_checks_used = 0 WHERE period_checks_used IS NULL;
UPDATE users SET one_time_credits = 0 WHERE one_time_credits IS NULL;

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    yookassa_payment_id VARCHAR(64) NOT NULL UNIQUE,
    tariff VARCHAR(20) NOT NULL,        -- 'one_time' | 'basic' | 'pro'
    amount_rub NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | succeeded | canceled
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP
);
