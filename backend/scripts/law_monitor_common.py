#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Общая логика для check_law_updates.py (152-ФЗ, обычный httpx) и
check_eu_law_updates.py (GDPR/NIS2, Playwright — единственный способ
пройти WAF-защиту EUR-Lex). Два разных скрипта с разными способами
получения страницы, но "посчитать хэш / сравнить с сохранённым /
уведомить при расхождении" — общая логика, дублировать её незачем.
"""
import hashlib
import os
from datetime import datetime

from services.telegram import send_message

NOTIFY_TEMPLATE = (
    "Текст источника {source} изменился ({url}). "
    "Проверьте вручную перед переиндексацией RAG."
)


def check_source(cur, source_name: str, url: str, content: bytes, log_prefix: str) -> None:
    """content — уже загруженное тело страницы (байты), откуда именно оно
    получено (httpx или Playwright) — не забота этой функции."""
    new_hash = hashlib.sha256(content).hexdigest()
    now = datetime.utcnow()

    cur.execute("SELECT hash FROM law_source_hashes WHERE source_name = %s", (source_name,))
    row = cur.fetchone()

    if row is None:
        # Первый запуск для этого источника — фиксируем базовую линию,
        # сравнивать пока не с чем, уведомление не отправляем.
        cur.execute(
            "INSERT INTO law_source_hashes (source_name, url, hash, last_checked_at, last_changed_at) "
            "VALUES (%s, %s, %s, %s, %s)",
            (source_name, url, new_hash, now, now),
        )
        print(f"[{log_prefix}] {source_name}: первый запуск, базовая линия зафиксирована")
        return

    old_hash = row[0]
    if new_hash == old_hash:
        cur.execute(
            "UPDATE law_source_hashes SET last_checked_at = %s WHERE source_name = %s",
            (now, source_name),
        )
        print(f"[{log_prefix}] {source_name}: без изменений")
        return

    # Хэш изменился — уведомляем и сразу обновляем сохранённый хэш, чтобы
    # при следующем запуске не отправить то же самое уведомление повторно,
    # если источник больше не менялся.
    chat_id = os.getenv("TELEGRAM_ADMIN_CHAT_ID")
    if chat_id:
        send_message(chat_id, NOTIFY_TEMPLATE.format(source=source_name, url=url))
    else:
        print(f"[{log_prefix}] TELEGRAM_ADMIN_CHAT_ID не задан — уведомление о {source_name} не отправлено")

    cur.execute(
        "UPDATE law_source_hashes SET hash = %s, last_checked_at = %s, last_changed_at = %s "
        "WHERE source_name = %s",
        (new_hash, now, now, source_name),
    )
    print(f"[{log_prefix}] {source_name}: ИЗМЕНЕНИЕ обнаружено, уведомление отправлено")
