-- Инфраструктура для RAG по ссылкам на статьи закона (152-ФЗ, GDPR, NIS2 —
-- ISO 27001 сюда не индексируется, см. services/prompts.py).
-- Как и в 001_add_plan_and_limits.sql: Base.metadata.create_all() в
-- database.py не создаёт расширения и не запускается для уже развёрнутой
-- БД сам по себе — на проде (Render) это нужно применить вручную до деплоя
-- кода, который читает/пишет law_chunks.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS law_chunks (
    id SERIAL PRIMARY KEY,
    law VARCHAR(50) NOT NULL,        -- '152-ФЗ' | 'GDPR' | 'NIS2'
    article VARCHAR(100) NOT NULL,   -- например 'ст. 19' или 'Art. 32'
    text TEXT NOT NULL,
    embedding vector(384) NOT NULL,  -- paraphrase-multilingual-MiniLM-L12-v2
    source_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (law, article)
);
