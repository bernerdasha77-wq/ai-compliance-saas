async def analyze_contract(text: str) -> dict:
    """Анализирует текст договора на основе ключевых слов (локализованная версия)"""
    
    text_lower = text.lower()
    
    # Новые, более точные проверки
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
    
    # Рекомендации
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
        "summary": {
            "total": total,
            "passed": passed,
            "failed": total - passed
        }
    }