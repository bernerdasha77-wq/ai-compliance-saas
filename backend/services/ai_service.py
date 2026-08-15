async def analyze_contract(text: str) -> dict:
    """Анализирует текст договора на основе ключевых слов (без OpenAI)"""
    
    text_lower = text.lower()
    
    # Проверяем наличие ключевых слов
    checks = {
        "Уведомление 24ч": ["уведомл", "24", "час", "роскомнадзор"],
        "Шифрование данных": ["шифр", "aes", "tls", "ssl", "крипт"],
        "Хранение логов 1 год": ["лог", "хра", "год"],
        "Уничтожение данных": ["уничтож", "удал", "срок"],
        "Запрет передачи данных": ["запрет", "передач", "страна"]
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
    if not checklist["Уведомление 24ч"]:
        recommendations.append("Добавьте пункт об уведомлении Роскомнадзора в течение 24 часов")
    if not checklist["Шифрование данных"]:
        recommendations.append("Укажите использование шифрования AES-256 и TLS")
    if not checklist["Хранение логов 1 год"]:
        recommendations.append("Добавьте требование хранить логи доступа минимум 1 год")
    if not checklist["Уничтожение данных"]:
        recommendations.append("Пропишите процедуру уничтожения данных после контракта")
    if not checklist["Запрет передачи данных"]:
        recommendations.append("Запретите передачу данных в страны без адекватной защиты")
    
    # Подсчёт результата
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
