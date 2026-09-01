import asyncio

from .deepseek_client import call_deepseek
from .prompts import build_prompt, DOC_CONFIGS
from .scoring import parse_and_score, build_local_result

DOC_TYPE = "contract"

# Чек-лист для бесплатного (локального) анализа без DeepSeek.
LOCAL_CHECKS = [
    {
        "name": "Утечка данных (152-ФЗ / GDPR)",
        "keywords": ["персональные данные", "пдн", "субъект", "согласие", "обработка",
                     "конфиденциальность", "утечка", "инцидент"],
        "standard": "152-ФЗ",
        "article": "152-ФЗ, ст. 19",
        "recommendation": "Добавьте раздел о защите персональных данных в соответствии с 152-ФЗ",
    },
    {
        "name": "Контроль доступа",
        "keywords": ["доступ", "права", "роль", "авторизация", "аутентификация",
                     "пароль", "2fa", "mfa", "двухфактор"],
        "standard": "ISO 27001",
        "article": "ISO 27001, A.9",
        "recommendation": "Пропишите процедуру управления доступом и ролями",
    },
    {
        "name": "Ответственность сторон",
        "keywords": ["ответственность", "штраф", "убыток", "компенсация", "санкция",
                     "неустойка", "пеня", "риск"],
        "standard": "152-ФЗ",
        "article": "152-ФЗ, ст. 24",
        "recommendation": "Укажите ответственность за утечку и штрафы",
    },
    {
        "name": "Шифрование данных (AES-256 / TLS)",
        "keywords": ["шифр", "aes", "tls", "ssl", "крипт", "защита", "канал"],
        "standard": "ISO 27001",
        "article": "ISO 27001, A.10",
        "recommendation": "Обязательно укажите использование шифрования AES-256 и TLS",
    },
    {
        "name": "Уведомление регулятора (24 часа)",
        "keywords": ["уведомл", "24", "час", "роскомнадзор", "регулятор", "инцидент"],
        "standard": "152-ФЗ",
        "article": "152-ФЗ, ст. 21",
        "recommendation": "Добавьте пункт об уведомлении регулятора в течение 24 часов",
    },
]


async def local_analyze(text: str) -> dict:
    """Базовый анализ без использования API (бесплатный)"""
    return build_local_result(text, LOCAL_CHECKS)


async def deepseek_analyze(text: str, standards: list[str]) -> dict:
    """Анализ через DeepSeek. При сбое запроса или нечитаемом ответе — тихий
    откат на локальный анализ по ключевым словам, чтобы пользователь получил
    хоть какой-то результат, а не ошибку (см. build_local_result)."""
    # to_thread: build_prompt() делает синхронный CPU-bound энкодинг эмбеддинга
    # и синхронный psycopg2-запрос (см. services/retrieval.py) — без этого
    # блокировал бы event loop так же, как раньше блокировал call_deepseek.
    system_prompt, user_prompt, is_truncated = await asyncio.to_thread(build_prompt, DOC_TYPE, text, standards)
    if is_truncated:
        print(f"[DeepSeek] Документ обрезан для анализа (doc_type={DOC_TYPE})")

    async def _fallback(reason: str) -> dict:
        print(f"[DeepSeek] {reason} (doc_type={DOC_TYPE}) — используем локальный анализ как запасной вариант.")
        result = await local_analyze(text)
        result["degraded"] = True
        return result

    try:
        raw = await call_deepseek(system_prompt, user_prompt)
    except Exception as e:
        return await _fallback(f"Ошибка запроса к DeepSeek: {e}")

    result = parse_and_score(raw, standards, DOC_CONFIGS[DOC_TYPE].get("always_active_category"))
    if result.get("error"):
        return await _fallback("Не удалось разобрать ответ DeepSeek")

    return result
