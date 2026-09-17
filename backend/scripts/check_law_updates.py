#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Еженедельный мониторинг изменений источников законов, проиндексированных
в RAG (см. services/retrieval.py, scripts/ingest_laws.py). НЕ переиндексирует
ничего автоматически — только присылает уведомление в Telegram, когда текст
источника меняется, чтобы человек сам решил, нужна ли переиндексация.

Запуск (вручную для отладки или по расписанию — см. fly.toml):
    python scripts/check_law_updates.py

Требует переменные окружения: DATABASE_URL, TELEGRAM_BOT_TOKEN,
TELEGRAM_ADMIN_CHAT_ID (см. main.py/.env.example — тот же бот, что и в
Части A, chat_id получен через getUpdates после личного /start).

---------------------------------------------------------------------------
РУЧНАЯ ПРОЦЕДУРА ПОСЛЕ УВЕДОМЛЕНИЯ (сделать самостоятельно, не автоматически):
1. Открыть URL источника из уведомления.
2. Сравнить с тем, что сейчас в law_chunks (SELECT text FROM law_chunks
   WHERE law = '...') — что именно изменилось: формулировка статьи,
   нумерация, добавлена/удалена статья, или просто вёрстка/баннер страницы
   (в этом случае реального изменения текста закона нет — уведомление
   ложное, ничего переиндексировать не нужно).
3. Если изменение реально затрагивает уже проиндексированные статьи —
   обновить соответствующий файл в scripts/law_sources/ (например, заново
   сохранить HTML со страницы источника) и вручную перезапустить:
       python scripts/ingest_laws.py <gdpr|nis2|152-fz>
   Скрипт идемпотентен — обновит существующие строки по (law, article).
---------------------------------------------------------------------------

Важная оговорка: хэш считается от сырого HTML страницы целиком, не только
от текста статей закона — значит мелкая правка вёрстки/баннера на сайте
источника тоже может вызвать уведомление (ложное срабатывание). Еженедельная
частота проверки — сознательный выбор именно поэтому: реже, чем могли бы
успеть накопиться настоящие правки, но не настолько часто, чтобы тонуть в
шуме от разметки. Если ложные срабатывания станут частой проблемой на
практике — можно перейти на хэш только извлечённого текста статей (тем же
парсером, что в ingest_laws.py), это осознанно не сделано сейчас, чтобы не
тащить в лёгкий еженедельный скрипт тяжёлые зависимости (lxml тут не нужен,
поэтому и не импортируется).
"""
import hashlib
import os
import re
import sys
from datetime import datetime

import httpx
import psycopg2

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.telegram import send_message  # noqa: E402

# GDPR/NIS2 (EUR-Lex) НАМЕРЕННО не в списке: eur-lex.europa.eu стоит за
# AWS WAF с JS-челленджем (проверено: любой обычный HTTP-запрос —
# httpx/curl, с любыми заголовками — получает вместо текста закона пустую
# страницу-"проверяем, не робот ли вы", HTTP 202). Простым GET-запросом
# отсюда либо ничего не поймать, либо ловить исключительно ложные
# срабатывания на самой странице-заглушке. Именно поэтому ingest_laws.py
# тоже не скачивает эти страницы сам, а читает вручную сохранённый HTML.
# Мониторинг GDPR/NIS2 сделан отдельно, через GitHub Actions + Playwright
# (см. .github/workflows/check-eu-law-updates.yml) — headless-браузер
# проходит такие JS-челленджи, обычный httpx — нет.

# pravo.gov.ru хранит ВСЕ редакции (версии) одного закона под одним и тем
# же документом (nd=102108261), переключаемых параметром link_id в URL.
# link_id=0 — это "Исходная редакция", застывший текст 2006 года, который
# НИКОГДА не меняется — мониторить его бессмысленно (проверено вручную:
# именно на такой URL изначально и настроили мониторинг, обнаружили это
# при ручной проверке). Действующая (последняя) редакция — это каждый раз
# новый, растущий номер: на момент внедрения — 38-я (26.07.2026, № 265-ФЗ).
# Поэтому URL для 152-ФЗ не статичный — resolve_latest_152fz_url() каждый
# раз сама находит актуальный номер редакции перед проверкой хэша.
PRAVO_152FZ_BASE = (
    "http://pravo.gov.ru/proxy/ips/?docbody=&link_id={link_id}&nd=102108261&bpa=cd00000"
    "&bpas=cd00000&intelsearch=%F4%E7+152+%EE+%EF%E5%F0%F1%EE%ED%E0%EB%FC%ED%FB%F5"
    "+%E4%E0%ED%ED%FB%F5++&firstDoc=1"
)


def resolve_latest_152fz_url() -> str:
    response = httpx.get(
        PRAVO_152FZ_BASE.format(link_id=0), timeout=30, follow_redirects=True,
        headers={"User-Agent": "Mozilla/5.0"},
    )
    response.raise_for_status()
    text = response.content.decode("windows-1251", errors="replace")
    editions = [int(n) for n in re.findall(r"<option value='(\d+),102108261'", text)]
    if not editions:
        raise RuntimeError("Не нашла список редакций 152-ФЗ на странице pravo.gov.ru — вёрстка могла измениться")
    return PRAVO_152FZ_BASE.format(link_id=max(editions))


SOURCES = {
    "152-ФЗ": resolve_latest_152fz_url,
}

NOTIFY_TEMPLATE = (
    "Текст источника {source} изменился ({url}). "
    "Проверьте вручную перед переиндексацией RAG."
)


def fetch_hash(url: str) -> str:
    response = httpx.get(url, timeout=30, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0"})
    response.raise_for_status()
    return hashlib.sha256(response.content).hexdigest()


def check_source(cur, source_name: str, url: str) -> None:
    new_hash = fetch_hash(url)
    now = datetime.utcnow()

    cur.execute("SELECT hash FROM law_source_hashes WHERE source_name = %s", (source_name,))
    row = cur.fetchone()

    if row is None:
        # Первый запуск для этого источника — просто фиксируем базовую
        # линию, сравнивать пока не с чем, уведомление не отправляем.
        cur.execute(
            "INSERT INTO law_source_hashes (source_name, url, hash, last_checked_at, last_changed_at) "
            "VALUES (%s, %s, %s, %s, %s)",
            (source_name, url, new_hash, now, now),
        )
        print(f"[check_law_updates] {source_name}: первый запуск, базовая линия зафиксирована")
        return

    old_hash = row[0]
    if new_hash == old_hash:
        cur.execute(
            "UPDATE law_source_hashes SET last_checked_at = %s WHERE source_name = %s",
            (now, source_name),
        )
        print(f"[check_law_updates] {source_name}: без изменений")
        return

    # Хэш изменился — уведомляем и сразу обновляем сохранённый хэш, чтобы
    # при следующем запуске (через неделю) не отправить то же самое
    # уведомление повторно, если источник больше не менялся.
    chat_id = os.getenv("TELEGRAM_ADMIN_CHAT_ID")
    if chat_id:
        send_message(chat_id, NOTIFY_TEMPLATE.format(source=source_name, url=url))
    else:
        print(f"[check_law_updates] TELEGRAM_ADMIN_CHAT_ID не задан — уведомление о {source_name} не отправлено")

    cur.execute(
        "UPDATE law_source_hashes SET hash = %s, last_checked_at = %s, last_changed_at = %s "
        "WHERE source_name = %s",
        (new_hash, now, now, source_name),
    )
    print(f"[check_law_updates] {source_name}: ИЗМЕНЕНИЕ обнаружено, уведомление отправлено")


def main() -> None:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cur = conn.cursor()
        for source_name, resolve_url in SOURCES.items():
            try:
                url = resolve_url()
                check_source(cur, source_name, url)
                conn.commit()
            except (httpx.HTTPError, RuntimeError) as e:
                conn.rollback()
                print(f"[check_law_updates] {source_name}: не удалось загрузить страницу — {e}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
