#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Загрузка текста закона в law_chunks для RAG (см. services/retrieval.py).

Использование:
    python ingest_laws.py 152-fz

Идемпотентно: повторный запуск обновляет существующие строки (по UNIQUE
(law, article)), а не плодит дубли — можно перезапускать при обновлении
текста источника.
"""
import os
import re
import sys

from lxml import html as lhtml
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import engine  # noqa: E402
from services.retrieval import EMBEDDING_MODEL  # noqa: E402

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def parse_152fz(raw_html: str) -> list[tuple[str, str]]:
    """Разбивает текст 152-ФЗ на (номер_статьи, текст_статьи).

    Формат источника — экспорт с pravo.gov.ru. Важный нюанс: "вставные"
    статьи (18.1, 22.1 и т.п.) закодированы как надстрочный индекс —
    18<span class="W9">1</span>. — иначе номер схлопывается в мусорное "181".
    """
    raw_html = re.sub(r'<span class="W9">(.*?)</span>', r'.\1', raw_html)

    tree = lhtml.fromstring(raw_html)
    for bad in tree.xpath("//style | //script | //comment()"):
        bad.getparent().remove(bad)

    text = tree.text_content()
    text = re.sub(r"\s+", " ", text).strip()

    marker_re = re.compile(r"Статья\s+(\d+(?:\.\d+)?)\.")
    matches = list(marker_re.finditer(text))

    articles = []
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        segment = text[start:end].strip()
        # обрезаем случайно попавший в хвост заголовок следующей главы
        segment = re.sub(r"\s*Глава\s+\d+\.\s*[А-ЯЁ][^.]*$", "", segment).strip()
        articles.append((m.group(1), segment))

    return articles


def parse_eurlex(raw_html: str) -> list[tuple[str, str]]:
    """Разбивает текст акта ЕС (EUR-Lex) на (номер_статьи, текст_статьи).

    EUR-Lex размечает каждую статью явно: <div class="eli-subdivision"
    id="art_N"> — это надёжнее регулярки по тексту "Article N", потому что
    в самом тексте акта полно ссылок вида "Article 32" на другие статьи и
    даже на статьи Договора о ЕС (в преамбуле/recitals), которые не являются
    заголовками статей.
    """
    tree = lhtml.fromstring(raw_html)
    art_divs = tree.xpath('//div[@class="eli-subdivision" and starts-with(@id, "art_")]')

    articles = []
    for div in art_divs:
        num = div.get("id").replace("art_", "")
        text = div.text_content()
        text = re.sub(r"\s+", " ", text).strip()
        articles.append((num, text))

    return articles


LAW_REGISTRY = {
    "152-fz": {
        "law": "152-ФЗ",
        "source_file": os.path.join(SCRIPT_DIR, "law_sources", "152-fz.html"),
        "source_url": None,
        "parser": parse_152fz,
    },
    "gdpr": {
        "law": "GDPR",
        "source_file": os.path.join(SCRIPT_DIR, "law_sources", "gdpr.html"),
        "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679",
        "parser": parse_eurlex,
    },
    "nis2": {
        "law": "NIS2",
        "source_file": os.path.join(SCRIPT_DIR, "law_sources", "nis2.html"),
        "source_url": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022L2555",
        "parser": parse_eurlex,
    },
}


def ingest(law_key: str) -> None:
    config = LAW_REGISTRY[law_key]

    with open(config["source_file"], encoding="utf-8") as f:
        raw = f.read()
    articles = config["parser"](raw)
    print(f"[ingest_laws] {config['law']}: найдено {len(articles)} статей")

    model = SentenceTransformer(EMBEDDING_MODEL)
    embeddings = model.encode([text for _, text in articles], show_progress_bar=True)

    conn = engine.raw_connection()
    try:
        register_vector(conn)
        cur = conn.cursor()
        for (article, text), embedding in zip(articles, embeddings):
            cur.execute(
                """
                INSERT INTO law_chunks (law, article, text, embedding, source_url)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (law, article) DO UPDATE SET
                    text = EXCLUDED.text,
                    embedding = EXCLUDED.embedding,
                    source_url = EXCLUDED.source_url
                """,
                (config["law"], article, text, embedding, config["source_url"]),
            )
        conn.commit()
        print(f"[ingest_laws] {config['law']}: записано/обновлено {len(articles)} строк")
    finally:
        conn.close()


if __name__ == "__main__":
    if len(sys.argv) != 2 or sys.argv[1] not in LAW_REGISTRY:
        available = ", ".join(LAW_REGISTRY)
        print(f"Использование: python ingest_laws.py <{available}>")
        sys.exit(1)
    ingest(sys.argv[1])
