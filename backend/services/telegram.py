# ============================================
# TELEGRAM-БОТ (уведомления + ссылки на сайт)
# ============================================
# Первая версия сознательно простая: бот НЕ принимает и не анализирует
# файлы — только /start с приветствием и двумя ссылками на сайт. Тот же
# send_message() используется отдельно для уведомлений об изменении
# источников законов (см. scripts/check_law_updates.py).

import os

import httpx

WELCOME_TEXT = (
    "Привет! Я бот AI Compliance Checker.\n\n"
    "Пока я не умею принимать и анализировать документы сам — "
    "для проверки перейдите на сайт по кнопке ниже."
)

ANALYZE_URL = "https://ai-compliance.online/analyze"
PRICING_URL = "https://ai-compliance.online/pricing"


def _api_base() -> str | None:
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    return f"https://api.telegram.org/bot{token}" if token else None


def send_message(chat_id: int | str, text: str, inline_keyboard: list[list[dict]] | None = None) -> None:
    """Отправляет сообщение через Telegram Bot API. Не бросает исключений
    наружу — сбой отправки уведомления не должен ронять вызывающий код
    (ни вебхук бота, ни скрипт проверки источников)."""
    base = _api_base()
    if not base:
        print("[telegram] TELEGRAM_BOT_TOKEN не задан — сообщение не отправлено")
        return

    payload: dict = {"chat_id": chat_id, "text": text}
    if inline_keyboard:
        payload["reply_markup"] = {"inline_keyboard": inline_keyboard}

    try:
        response = httpx.post(f"{base}/sendMessage", json=payload, timeout=10)
        if response.status_code != 200:
            print(f"[telegram] sendMessage вернул {response.status_code}: {response.text}")
    except httpx.HTTPError as e:
        print(f"[telegram] sendMessage не удался: {e}")


def send_start_message(chat_id: int | str) -> None:
    send_message(
        chat_id,
        WELCOME_TEXT,
        inline_keyboard=[
            [{"text": "Проверить документ →", "url": ANALYZE_URL}],
            [{"text": "Тарифы →", "url": PRICING_URL}],
        ],
    )
