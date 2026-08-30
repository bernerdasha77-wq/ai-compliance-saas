#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Предвычисление эмбеддингов фиксированных focus_points (DOC_CONFIGS в
services/prompts.py) для RAG-поиска (см. services/retrieval.py).

Использование:
    python precompute_focus_embeddings.py

НЕ часть продакшен-деплоя — запускается вручную локально при любом
изменении DOC_CONFIGS.focus_points. Нужен torch/sentence-transformers —
см. requirements-offline.txt, рабочий сервер их не устанавливает.

Идемпотентно: повторный запуск обновляет существующие строки (по UNIQUE
(doc_type, focus_point)), как и ingest_laws.py.
"""
import os
import sys

from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import engine  # noqa: E402
from services.retrieval import EMBEDDING_MODEL  # noqa: E402
from services.prompts import DOC_CONFIGS  # noqa: E402


def precompute() -> None:
    pairs = [
        (doc_type, point)
        for doc_type, config in DOC_CONFIGS.items()
        for point in config["focus_points"]
    ]
    print(f"[precompute_focus_embeddings] найдено {len(pairs)} пар (doc_type, focus_point)")

    model = SentenceTransformer(EMBEDDING_MODEL)
    embeddings = model.encode([point for _, point in pairs], show_progress_bar=True)

    conn = engine.raw_connection()
    try:
        register_vector(conn)
        cur = conn.cursor()
        for (doc_type, point), embedding in zip(pairs, embeddings):
            cur.execute(
                """
                INSERT INTO focus_point_embeddings (doc_type, focus_point, embedding)
                VALUES (%s, %s, %s)
                ON CONFLICT (doc_type, focus_point) DO UPDATE SET
                    embedding = EXCLUDED.embedding
                """,
                (doc_type, point, embedding),
            )
        conn.commit()
        print(f"[precompute_focus_embeddings] записано/обновлено {len(pairs)} строк")
    finally:
        conn.close()


if __name__ == "__main__":
    precompute()
