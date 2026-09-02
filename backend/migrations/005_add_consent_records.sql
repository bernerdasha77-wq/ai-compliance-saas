-- Фиксация факта согласия пользователя при регистрации (три отдельных
-- чекбокса на форме — см. app/components/AuthModal.tsx): обработка
-- персональных данных, условия/оферта, трансграничная передача в США.
-- NULL у существующих пользователей — они регистрировались до появления
-- этого трекинга, это ожидаемо, не бэкфиллим фиктивной датой.
--
-- Как и в 001/003: Base.metadata.create_all() в database.py не добавляет
-- новые колонки в уже существующие таблицы — на проде применить вручную
-- до деплоя кода, который их читает/пишет.

ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_personal_data_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_terms_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_us_transfer_at TIMESTAMP;
