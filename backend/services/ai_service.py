import os
import json
from openai import OpenAI

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1"
)

async def local_analyze(text: str) -> dict:
    text_lower = text.lower()
    checks = {
        "Утечка данных (152-ФЗ / GDPR)": [
            "персональные данные", "пдн", "субъект", "согласие", "обработка",
            "конфиденциальность", "утечка", "инцидент"
        ],
        "Контроль доступа": [
            "доступ", "права", "роль", "авторизация", "аутентификация",
            "пароль", "2fa", "mfa", "двухфактор"
        ],
        "Ответственность сторон": [
            "ответственность", "штраф", "убыток", "компенсация", "санкция",
            "неустойка", "пеня", "риск"
        ],
        "Шифрование данных (AES-256 / TLS)": [
            "шифр", "aes", "tls", "ssl", "крипт", "защита", "канал"
        ],
        "Уведомление регулятора (24 часа)": [
            "уведомл", "24", "час", "роскомнадзор", "регулятор", "инцидент"
        ]
    }
    results = []
    checklist = {}
    for name, keywords in checks.items():
        found = any(kw in text_lower for kw in keywords)
        status = "🟢 Соответствует" if found else "🔴 Нарушено"
        results.append({"name": name, "status": status})
        checklist[name] = found
    recommendations = []
    if not checklist["Утечка данных (152-ФЗ / GDPR)"]:
        recommendations.append("Добавьте раздел о защите персональных данных в соответствии с 152-ФЗ")
    if not checklist["Контроль доступа"]:
        recommendations.append("Пропишите процедуру управления доступом и ролями")
    if not checklist["Ответственность сторон"]:
        recommendations.append("Укажите ответственность за утечку и штрафы")
    if not checklist["Шифрование данных (AES-256 / TLS)"]:
        recommendations.append("Обязательно укажите использование шифрования AES-256 и TLS")
    if not checklist["Уведомление регулятора (24 часа)"]:
        recommendations.append("Добавьте пункт об уведомлении регулятора в течение 24 часов")
    total = len(checklist)
    passed = sum(1 for v in checklist.values() if v)
    if passed == total:
        overall = "✅ Документ полностью соответствует требованиям"
    elif passed >= total - 1:
        overall = "🟡 Требует незначительной доработки"
    else:
        overall = "🔴 Требует серьёзной доработки"
    return {
        "overall_status": overall,
        "full_analysis": f"Найдено {passed} из {total} пунктов",
        "rules": results,
        "recommendations": recommendations if recommendations else ["Все пункты соблюдены"],
        "summary": {"total": total, "passed": passed, "failed": total - passed}
    }

async def deepseek_analyze(text: str, law: str = "152-ФЗ") -> dict:
    law_prompts = {
        "152-ФЗ": "Проверь договор на соответствие 152-ФЗ (защита персональных данных). Укажи конкретные статьи.",
        "GDPR": "Проверь договор на соответствие GDPR (General Data Protection Regulation). Укажи конкретные статьи.",
        "HIPAA": "Проверь договор на соответствие HIPAA (медицинские данные). Укажи конкретные статьи.",
        "ISO-27001": "Проверь договор на соответствие ISO 27001 (информационная безопасность)."
    }
    law_prompt = law_prompts.get(law, law_prompts["152-ФЗ"])
    prompt = f"""
    Ты — юридический AI-эксперт по кибербезопасности и комплаенсу.
    {law_prompt}
    Договор:
    {text[:8000]}
    Выдай ОТВЕТ ТОЛЬКО В ФОРМАТЕ JSON (без дополнительного текста, без кавычек вокруг JSON, только чистый JSON).
    Формат ответа:
    {{
        "status": "🟢 Соответствует" или "🟡 Требует доработки" или "🔴 Нарушено",
        "violations": [
            {{
                "description": "Описание нарушения",
                "law": "152-ФЗ, статья ...",
                "risk": "Высокий / Средний / Низкий"
            }}
        ],
        "recommendations": [
            "Рекомендация 1",
            "Рекомендация 2"
        ]
    }}
    Будь максимально конкретным и полезным. Пиши на русском языке.
    """
    try:
        response = deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "Ты — юридический AI-эксперт. Отвечай только в формате JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=4000,
        )
        raw = response.choices[0].message.content
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return {
                "overall_status": "⚠️ Ошибка формата ответа",
                "full_analysis": raw,
                "rules": [],
                "recommendations": ["Попробуйте ещё раз"],
                "summary": {"total": 0, "passed": 0, "failed": 0}
            }
        rules = []
        for v in data.get("violations", []):
            rules.append({
                "name": v.get("description", "Нарушение"),
                "status": f"🔴 {v.get('risk', 'Риск')}"
            })
        return {
            "overall_status": data.get("status", "❌ Статус не определён"),
            "full_analysis": "\n".join(data.get("recommendations", [])),
            "rules": rules,
            "recommendations": data.get("recommendations", []),
            "summary": {"total": len(rules), "passed": 0, "failed": len(rules)}
        }
    except Exception as e:
        return {
            "overall_status": "❌ Ошибка DeepSeek",
            "full_analysis": f"Не удалось выполнить анализ: {str(e)}",
            "rules": [],
            "recommendations": ["Попробуйте позже или используйте бесплатный тариф"],
            "summary": {"total": 0, "passed": 0, "failed": 0}
        }

async def analyze_contract(text: str, is_pro: bool = False, law: str = "152-ФЗ") -> dict:
    if is_pro:
        return await deepseek_analyze(text, law)
    else:
        return await local_analyze(text)
