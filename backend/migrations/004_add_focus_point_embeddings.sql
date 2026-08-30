-- Предвычисленные эмбеддинги фиксированных focus_points (DOC_CONFIGS в
-- services/prompts.py) — раньше эмбеддинг query_text считался "на лету"
-- через sentence-transformers при каждом вызове search_relevant_chunks()
-- (services/retrieval.py), хотя query_text не зависит от содержимого
-- документа, только от doc_type. Предвычисляется офлайн-скриптом
-- scripts/precompute_focus_embeddings.py — рабочий процесс на Fly.io
-- больше не должен держать torch/sentence-transformers в памяти.

CREATE TABLE IF NOT EXISTS focus_point_embeddings (
    id SERIAL PRIMARY KEY,
    doc_type VARCHAR(50) NOT NULL,
    focus_point TEXT NOT NULL,
    embedding vector(384) NOT NULL,  -- та же модель, что в law_chunks: paraphrase-multilingual-MiniLM-L12-v2
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (doc_type, focus_point)
);
