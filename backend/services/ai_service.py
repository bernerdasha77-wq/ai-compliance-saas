import os
import json
from openai import OpenAI

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1"
)

async def local_analyze(text: str) -> dict:
    """Базовый анализ без использования API (бесплатный)"""
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
    """Глубокий анализ через DeepSeek API (платный)"""
    
    law_prompts = {
        "152-ФЗ": "Проверь договор на соответствие 152-ФЗ (защита персональных данных). Укажи конкретные статьи.",
        "GDPR": "Проверь договор на соответствие GDPR (General Data Protection Regulation). Укажи конкретные статьи.",
        "HIPAA": "Проверь договор на соответствие HIPAA (медицинские данные). Укажи конкретные статьи.",
        "ISO-27001": "Проверь договор на соответствие ISO 27001 (информационная безопасность)."
    }
    
    law_prompt = law_prompts.get(law, law_prompts["152-ФЗ"])

    prompt = f"""
    Ты — юридический AI-эксперт по комплаенсу и кибербезопасности с 15-летним опытом.
    
    Проанализируй приложенный договор по 5 ключевым пунктам:
    
    1. Утечка данных (152-ФЗ / GDPR)
    2. Контроль доступа
    3. Ответственность сторон
    4. Шифрование данных (AES-256 / TLS)
    5. Уведомление регулятора (24 часа)
    
    {law_prompt}
    
    Договор:
    {text[:8000]}
    
    Выдай ОТВЕТ ТОЛЬКО В ФОРМАТЕ JSON (без дополнительного текста, без кавычек вокруг JSON, только чистый JSON).
    
    Формат ответа:
    {{
        "общий_риск": "низкий | средний | высокий",
        "срочность_исправления": "немедленно | в ближайшее время | планово",
        "пункты": [
            {{
                "пункт_проверки": "название пункта",
                "статус": "соответствует | требует_доработки | нарушено",
                "цитата_из_договора": "конкретная фраза или раздел, где найдено нарушение (если есть, иначе null)",
                "статья_закона": "ссылка на 152-ФЗ, GDPR, ISO 27001 с указанием статьи и пункта",
                "риск_для_бизнеса": "описание последствий (штраф, репутация, блокировка)",
                "рекомендация": "конкретное действие по исправлению",
                "готовая_формулировка": "текст, который можно скопировать и вставить в договор (юридически корректный)"
            }}
        ],
        "чеклист_действий": ["действие 1", "действие 2", "действие 3"]
    }}
    
    Правила:
    - Никакой воды, только факты и конкретика.
    - Если пункт соответствует – в "цитата_из_договора" поставь null, а в "риск_для_бизнеса" напиши "Нарушений не обнаружено".
    - Формулировки должны быть готовы к копированию в юридические документы.
    - Ссылки на законы давай с указанием конкретных статей и пунктов (например, "152-ФЗ, ст. 19, ч. 2").
    - В "готовая_формулировка" используй юридически корректный язык, без канцелярита, но с соблюдением формальностей.
    """

    try:
        response = deepseek_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "Ты — юридический AI-эксперт. Отвечай только в формате JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=5000,
        )

        raw = response.choices[0].message.content
        print("[DeepSeek RAW]", raw)

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
        for item in data.get("пункты", []):
            status = item.get("статус", "неизвестно")
            if status == "соответствует":
                status_icon = "🟢 Соответствует"
            elif status == "требует_доработки":
                status_icon = "🟡 Требует доработки"
            elif status == "нарушено":
                status_icon = "🔴 Нарушено"
            else:
                status_icon = "❓ Неизвестно"

            rules.append({
                "name": item.get("пункт_проверки", "Пункт"),
                "status": status_icon,
                "quote": item.get("цитата_из_договора"),
                "law": item.get("статья_закона", ""),
                "risk": item.get("риск_для_бизнеса", ""),
                "recommendation": item.get("рекомендация", ""),
                "formulation": item.get("готовая_формулировка", "")
            })

        full_text = f"Общий риск: {data.get('общий_риск', 'не определён')}\n"
        full_text += f"Срочность: {data.get('срочность_исправления', 'не определена')}\n\n"
        full_text += "Чек-лист действий:\n" + "\n".join([f"- {a}" for a in data.get("чеклист_действий", [])])

        return {
            "overall_status": f"🟢 {data.get('общий_риск', 'Анализ завершён')}".capitalize(),
            "full_analysis": full_text,
            "rules": rules,
            "recommendations": data.get("чеклист_действий", []),
            "summary": {
                "total": len(rules),
                "passed": sum(1 for r in rules if "Соответствует" in r["status"]),
                "failed": sum(1 for r in rules if "Нарушено" in r["status"])
            }
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