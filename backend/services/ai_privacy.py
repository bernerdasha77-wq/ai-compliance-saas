from .deepseek_client import call_deepseek
from .prompts import build_prompt, DOC_CONFIGS
from .scoring import parse_and_score, build_local_result

DOC_TYPE = "privacy"

LOCAL_CHECKS = [
    {
        "name": "Сбор и обработка данных",
        "keywords": ["собирать", "обработка", "персональные данные", "пдн",
                     "какие данные", "цели обработки", "основание"],
        "standard": "152-ФЗ",
        "article": "152-ФЗ, ст. 5",
        "recommendation": "Чётко опишите, какие данные собираются, для каких целей и на каком основании",
    },
    {
        "name": "Передача данных третьим лицам",
        "keywords": ["третьим лицам", "передача", "раскрытие", "контрагенты",
                     "партнёры", "поставщики", "субподрядчики"],
        "standard": "GDPR",
        "article": "GDPR Art. 13(1)(e)",
        "recommendation": "Укажите, передаются ли данные третьим лицам, и если да — то кому и зачем",
    },
    {
        "name": "Согласие пользователя",
        "keywords": ["согласие", "разрешение", "пользователь соглашается",
                     "оптимизация", "отказ", "отозвать согласие"],
        "standard": "152-ФЗ",
        "article": "152-ФЗ, ст. 9",
        "recommendation": "Добавьте механизм получения согласия и возможность его отзыва",
    },
    {
        "name": "Сроки хранения данных",
        "keywords": ["срок хранения", "хранить", "удаление", "уничтожение",
                     "период", "после прекращения"],
        "standard": "GDPR",
        "article": "GDPR Art. 5(1)(e)",
        "recommendation": "Установите конкретные сроки хранения данных и порядок их удаления",
    },
    {
        "name": "Права субъекта данных",
        "keywords": ["права", "доступ", "исправление", "удаление",
                     "блокировка", "возражение", "транспортировка"],
        "standard": "GDPR",
        "article": "GDPR Art. 15-20",
        "recommendation": "Опишите права пользователей на доступ, исправление, удаление и блокировку данных",
    },
]


async def local_analyze(text: str) -> dict:
    """Базовый анализ политики конфиденциальности (бесплатный)"""
    return build_local_result(text, LOCAL_CHECKS)


async def deepseek_analyze(text: str, law: str = "152-ФЗ") -> dict:
    """Анализ через DeepSeek. При сбое запроса или нечитаемом ответе — тихий
    откат на локальный анализ по ключевым словам, чтобы пользователь получил
    хоть какой-то результат, а не ошибку (см. build_local_result)."""
    system_prompt, user_prompt, is_truncated = build_prompt(DOC_TYPE, text, law)
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

    result = parse_and_score(raw, law, DOC_CONFIGS[DOC_TYPE]["default_standards"])
    if result.get("error"):
        return await _fallback("Не удалось разобрать ответ DeepSeek")

    return result
