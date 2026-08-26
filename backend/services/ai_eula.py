import os
import json
from openai import OpenAI

deepseek_client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com/v1"
)

# ============================================
# ЛОКАЛЬНЫЙ AI ДЛЯ EULA / TERMS (БЕСПЛАТНЫЙ)
# ============================================
async def local_analyze(text: str) -> dict:
    """Базовый анализ EULA / Terms (бесплатный)"""
    text_lower = text.lower()

    checks = {
        "Лицензионные ограничения (EULA)": [
            "лицензия", "пользование", "копирование", "распространение",
            "запрещается", "разрешается", "право использования", "неисключительная"
        ],
        "Условия использования (Terms)": [
            "условия использования", "правила", "запрещено", "обязанности",
            "поведение", "контент", "ответственность пользователя", "аккаунт"
        ],
        "Сбор и обработка данных": [
            "персональные данные", "собирать", "хранить", "обработка",
            "пользовательские данные", "информация о пользователе"
        ],
        "Ответственность и гарантии": [
            "как есть", "без гарантий", "ответственность", "ущерб",
            "ограничение ответственности", "максимальная сумма"
        ],
        "Расторжение и изменение условий": [
            "расторжение", "изменение", "уведомление", "отказ",
            "прекращение", "аннулирование", "закрытие аккаунта"
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
    if not checklist["Лицензионные ограничения (EULA)"]:
        recommendations.append("Добавьте чёткие лицензионные ограничения (запрет на модификацию, обратную разработку)")
    if not checklist["Условия использования (Terms)"]:
        recommendations.append("Пропишите правила поведения пользователей и ответственность за нарушение")
    if not checklist["Сбор и обработка данных"]:
        recommendations.append("Опишите, какие данные собираются, как они используются и хранятся")
    if not checklist["Ответственность и гарантии"]:
        recommendations.append("Укажите ограничения ответственности и исключения гарантий")
    if not checklist["Расторжение и изменение условий"]:
        recommendations.append("Опишите процедуру расторжения и уведомления об изменениях")

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

# ============================================
# DEEPSEEK AI ДЛЯ EULA / TERMS (ПЛАТНЫЙ)
# ============================================
async def deepseek_analyze(text: str, law: str = "152-ФЗ") -> dict:
    """Глубокий анализ EULA / Terms через DeepSeek"""

    prompt = f"""
    Ты — юридический AI-эксперт по лицензионным соглашениям (EULA) и условиям использования (Terms).

    Проанализируй приложенный документ по 5 ключевым пунктам:

    1. Лицензионные ограничения (EULA)
    2. Условия использования (Terms)
    3. Сбор и обработка данных
    4. Ответственность и гарантии
    5. Расторжение и изменение условий

    {law}

    Текст документа:
    {text[:8000]}

    Выдай ОТВЕТ ТОЛЬКО В ФОРМАТЕ JSON (без дополнительного текста, только чистый JSON).

    Формат ответа:
    {{
        "общий_риск": "низкий | средний | высокий",
        "срочность_исправления": "немедленно | в ближайшее время | планово",
        "пункты": [
            {{
                "пункт_проверки": "название пункта",
                "статус": "соответствует | требует_доработки | нарушено",
                "цитата_из_документа": "конкретная фраза (если есть, иначе null)",
                "статья_закона": "ссылка на закон",
                "риск_для_бизнеса": "описание последствий",
                "рекомендация": "что исправить",
                "готовая_формулировка": "текст для копирования в документ"
            }}
        ],
        "чеклист_действий": ["действие 1", "действие 2", "действие 3"]
    }}

    Правила:
    - Только факты, без воды.
    - Если пункт соответствует – в "цитата_из_документа" поставь null.
    - Формулировки должны быть готовы к копированию.
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
        print("[DeepSeek RAW EULA/TERMS]", raw)

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
                "quote": item.get("цитата_из_документа"),
                "law": item.get("статья_закона", ""),
                "risk": item.get("риск_для_бизнеса", ""),
                "recommendation": item.get("рекомендация", ""),
                "formulation": item.get("готовая_формулировка", "")
            })

        full_text = f"Общий риск: {data.get('общий_риск', 'не определён')}\n"
        full_text += f"Срочность: {data.get('срочность_исправления', 'не определена')}\n\n"
        full_text += "Чек-лист действий:\n" + "\n".join([f"- {a}" for a in data.get("чеклист_действий", [])])

        return {
            "overall_status": data.get('общий_риск', 'Анализ завершён'),
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