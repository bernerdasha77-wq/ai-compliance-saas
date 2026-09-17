#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Еженедельный мониторинг изменений GDPR/NIS2 на EUR-Lex. Работает так же,
как scripts/check_law_updates.py (152-ФЗ) — сравнивает хэш текущей страницы
с последним сохранённым в law_source_hashes, уведомляет в Telegram при
расхождении, НЕ переиндексирует RAG автоматически (см. общую логику и
ручную процедуру после уведомления в law_monitor_common.py и
check_law_updates.py).

Единственное отличие — способ получения страницы. eur-lex.europa.eu стоит
за AWS WAF с JS-челленджем: обычный HTTP-запрос (httpx/curl) получает
вместо текста регламента пустую страницу-"проверяем, не робот ли вы"
(HTTP 202, x-amzn-waf-action: challenge) — проверено на нескольких
URL-паттернах и наборах заголовков, защита на уровне всего домена.
Playwright же проходит такой челлендж как настоящий браузер (реально
выполняет JS, получает токен, страница сама делает reload на настоящий
контент) — проверено вручную: 847 КБ текста регламента вместо пустышки.

Запускается через GitHub Actions по расписанию
(.github/workflows/check-eu-law-updates.yml), не через Fly — здесь нужен
headless Chromium (~280 МБ), это не стоит держать в основном образе
бэкенда ради скрипта, который выполняется раз в неделю.

Требует переменные окружения: DATABASE_URL, TELEGRAM_BOT_TOKEN,
TELEGRAM_ADMIN_CHAT_ID (как GitHub Actions secrets, не Fly secrets — это
отдельное хранилище, см. .github/workflows/check-eu-law-updates.yml).
"""
import os
import sys

import psycopg2
from playwright.sync_api import Error as PlaywrightError
from playwright.sync_api import sync_playwright

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from law_monitor_common import check_source  # noqa: E402

SOURCES = {
    "GDPR": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679",
    "NIS2": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022L2555",
}

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)


MIN_CONTENT_LENGTH = 50_000  # страница-заглушка WAF — около 2 КБ, настоящий текст акта — сотни КБ
CONTENT_SELECTOR = "#docHtml"  # основной блок документа на EUR-Lex, без бокового оглавления


def fetch_content(page, url: str) -> bytes:
    page.goto(url, timeout=30000)
    # WAF-челлендж делает свой reload после получения токена — ждём, пока
    # на странице реально появится текст акта, а не просто "networkidle"
    # (страница-заглушка тоже быстро становится "idle", но это не значит,
    # что настоящий контент уже загрузился). Ждём по длине текста, а не по
    # конкретной фразе вроде "Article 1" — в реальной вёрстке между словом
    # и номером статьи неразрывный пробел (\xa0), а не обычный, и такая
    # проверка не сработала бы для части документов (проверено на NIS2).
    page.wait_for_function(
        f"document.body && document.body.innerText.length > {MIN_CONTENT_LENGTH}", timeout=20000
    )
    # Хэшируем только #docHtml (сам текст документа), НЕ всю страницу —
    # проверено вручную: боковое оглавление и часть <script>-тегов
    # дозагружаются асинхронно и по-разному от запроса к запросу даже без
    # реального изменения закона, а два fetch'а #docHtml подряд дают
    # побайтово идентичный текст.
    page.wait_for_timeout(2000)
    return page.inner_text(CONTENT_SELECTOR).encode("utf-8")


def main() -> None:
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    try:
        cur = conn.cursor()
        with sync_playwright() as p:
            browser = p.chromium.launch()
            browser_page = browser.new_page(user_agent=USER_AGENT)
            for source_name, url in SOURCES.items():
                try:
                    content = fetch_content(browser_page, url)
                    check_source(cur, source_name, url, content, log_prefix="check_eu_law_updates")
                    conn.commit()
                except PlaywrightError as e:
                    conn.rollback()
                    print(f"[check_eu_law_updates] {source_name}: не удалось загрузить страницу — {e}")
            browser.close()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
