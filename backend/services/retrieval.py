# ============================================
# RAG: ПОИСК РЕЛЕВАНТНЫХ ФРАГМЕНТОВ ЗАКОНА
# ============================================
# Ищет в law_chunks (см. scripts/ingest_laws.py) статьи, ближайшие по смыслу
# к запросу — используется в build_prompt() (prompts.py), чтобы DeepSeek
# цитировал реальный текст закона вместо номеров статей по памяти.

from pgvector.psycopg2 import register_vector

from database import engine

EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

# Запросы формулируются по-русски (focus_points из prompts.py), а 152-ФЗ —
# единственный индексируемый закон на русском; GDPR/NIS2 — на английском.
# Кросс-языковой поиск у этой модели заметно шумнее (проверено вручную на
# Фазе 3: для запроса "Шифрование данных (AES-256 / TLS)" релевантная GDPR
# ст. 32 попадала только на 6-е место вместо 1-го при поиске по всем законам
# сразу — 5 более "близких" по расстоянию русских статей 152-ФЗ забивали её
# из общего top_k). Поэтому статьи на английском ищутся отдельным запросом с
# более широким лимитом — так у них гарантированно есть своя квота в выдаче,
# а не общая с русскоязычными статьями.
RU_LAWS = {"152-ФЗ"}
CROSS_LINGUAL_TOP_K = 8

# Единая точка правды "какие стандарты реально есть в law_chunks" — чтобы не
# дублировать этот список ещё и в prompts.py.
INDEXED_LAWS = RU_LAWS | {"GDPR", "NIS2"}

# query_text здесь всегда один из фиксированных focus_points (DOC_CONFIGS в
# services/prompts.py) — не зависит от содержимого загруженного документа
# (см. build_prompt() в prompts.py, вызывающий search_relevant_chunks() по
# каждому focus_point отдельно). Раньше это означало держать в рабочем
# процессе модель sentence-transformers ради инференса на лету — теперь
# эмбеддинги предвычислены офлайн (scripts/precompute_focus_embeddings.py) и
# просто читаются из focus_point_embeddings. Таблица маленькая (по одной
# строке на focus_point, не на документ) — грузим её всю в память лениво,
# один раз на процесс, вместо похода в БД на каждый вызов.
_focus_embeddings: dict[tuple[str, str], list[float]] | None = None


def _load_focus_embeddings() -> dict[tuple[str, str], list[float]]:
    global _focus_embeddings
    if _focus_embeddings is None:
        conn = engine.raw_connection()
        try:
            register_vector(conn)
            cur = conn.cursor()
            cur.execute("SELECT doc_type, focus_point, embedding FROM focus_point_embeddings")
            _focus_embeddings = {
                (doc_type, focus_point): embedding
                for doc_type, focus_point, embedding in cur.fetchall()
            }
        finally:
            conn.close()
    return _focus_embeddings


def _get_focus_embedding(doc_type: str, focus_point: str) -> list[float]:
    embedding = _load_focus_embeddings().get((doc_type, focus_point))
    if embedding is None:
        # Громко, а не молча return [] — иначе кто-то отредактирует
        # focus_points в DOC_CONFIGS, забудет перезапустить precompute-скрипт,
        # и RAG тихо перестанет находить фрагменты закона для этого пункта,
        # оставшись незамеченным.
        raise RuntimeError(
            f"Нет предвычисленного эмбеддинга для focus_point '{focus_point}' у "
            f"doc_type '{doc_type}' — запусти scripts/precompute_focus_embeddings.py"
        )
    return embedding


def _query_chunks(cur, embedding, laws: list[str], limit: int) -> list[dict]:
    if not laws:
        return []
    cur.execute(
        """
        SELECT law, article, text, source_url, embedding <=> %s AS distance
        FROM law_chunks
        WHERE law = ANY(%s)
        ORDER BY embedding <=> %s
        LIMIT %s
        """,
        (embedding, laws, embedding, limit),
    )
    return [
        {
            "law": law,
            "article": article,
            "text": text,
            "source_url": source_url,
            "distance": float(distance),
        }
        for law, article, text, source_url, distance in cur.fetchall()
    ]


def search_relevant_chunks(
    doc_type: str, standards: list[str], query_text: str, top_k: int = 5
) -> list[dict]:
    """Ищет ближайшие по смыслу статьи закона среди `standards`.

    Косинусное расстояние через pgvector (оператор `<=>`), меньше — ближе.
    Статьи на русском (152-ФЗ) и на английском (GDPR/NIS2) ищутся отдельно
    со своими лимитами (см. CROSS_LINGUAL_TOP_K выше), потом объединяются и
    сортируются по расстоянию — так и то, и другое гарантированно попадает в
    выдачу. Стандарты, для которых нет данных в law_chunks (например,
    ISO 27001 — он туда сознательно не индексируется), просто не дадут
    совпадений, отдельная проверка не нужна.
    """
    embedding = _get_focus_embedding(doc_type, query_text)
    ru_standards = [s for s in standards if s in RU_LAWS]
    other_standards = [s for s in standards if s not in RU_LAWS]

    conn = engine.raw_connection()
    try:
        register_vector(conn)
        cur = conn.cursor()
        results = _query_chunks(cur, embedding, ru_standards, top_k)
        results += _query_chunks(cur, embedding, other_standards, CROSS_LINGUAL_TOP_K)
    finally:
        conn.close()

    return sorted(results, key=lambda r: r["distance"])
