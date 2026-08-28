from .deepseek_client import call_deepseek
from .prompts import build_prompt, DOC_CONFIGS
from .scoring import parse_and_score, build_local_result

DOC_TYPE = "eula"

LOCAL_CHECKS = [
    {
        "name": "Лицензионные ограничения (EULA)",
        "keywords": ["лицензия", "пользование", "копирование", "распространение",
                     "запрещается", "разрешается", "право использования", "неисключительная"],
        "standard": "EULA Best Practices",
        "article": "Раздел о лицензионных ограничениях",
        "recommendation": "Добавьте чёткие лицензионные ограничения (запрет на модификацию, обратную разработку)",
    },
    {
        "name": "Условия использования (Terms)",
        "keywords": ["условия использования", "правила", "запрещено", "обязанности",
                     "поведение", "контент", "ответственность пользователя", "аккаунт"],
        "standard": "EULA Best Practices",
        "article": "Раздел об условиях использования",
        "recommendation": "Пропишите правила поведения пользователей и ответственность за нарушение",
    },
    {
        "name": "Сбор и обработка данных",
        "keywords": ["персональные данные", "собирать", "хранить", "обработка",
                     "пользовательские данные", "информация о пользователе"],
        "standard": "GDPR",
        "article": "GDPR Art. 13",
        "recommendation": "Опишите, какие данные собираются, как они используются и хранятся",
    },
    {
        "name": "Ответственность и гарантии",
        "keywords": ["как есть", "без гарантий", "ответственность", "ущерб",
                     "ограничение ответственности", "максимальная сумма"],
        "standard": "EULA Best Practices",
        "article": "Раздел об ограничении ответственности",
        "recommendation": "Укажите ограничения ответственности и исключения гарантий",
    },
    {
        "name": "Расторжение и изменение условий",
        "keywords": ["расторжение", "изменение", "уведомление", "отказ",
                     "прекращение", "аннулирование", "закрытие аккаунта"],
        "standard": "EULA Best Practices",
        "article": "Раздел о расторжении",
        "recommendation": "Опишите процедуру расторжения и уведомления об изменениях",
    },
]


async def local_analyze(text: str) -> dict:
    """Базовый анализ EULA / Terms (бесплатный)"""
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
