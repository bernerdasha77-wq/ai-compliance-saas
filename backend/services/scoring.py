import json

# Вес штрафа за одно нарушение того или иного уровня риска.
# Используется и для общего score, и для score по каждому стандарту.
RISK_WEIGHTS = {"high": 15, "medium": 7, "low": 2}

VALID_RISK_LEVELS = set(RISK_WEIGHTS.keys())


def _risk_label(score: int) -> str:
    if score >= 80:
        return "низкий"
    if score >= 50:
        return "средний"
    return "высокий"


def _match_standard(name: str, standards: list[str]) -> str | None:
    """Сопоставляет строку 'standard' из нарушения со списком применимых
    стандартов (на случай, если модель немного изменила формулировку)."""
    if not name:
        return None
    name_l = name.strip().lower()
    for s in standards:
        s_l = s.strip().lower()
        if name_l == s_l or name_l in s_l or s_l in name_l:
            return s
    return None


def compute_scores(violations: list[dict], standards: list[str]) -> tuple[int, str, list[dict]]:
    """Считает общий score (0-100), текстовую метку риска и score по
    каждому стандарту — детерминированно, на основе весов risk_level.
    Не зависит от того, как DeepSeek сформулировал общий вывод, поэтому
    исключает рассинхронизацию текста и цифр."""
    overall = 100
    per_standard = {s: 100 for s in standards}

    for v in violations:
        weight = RISK_WEIGHTS.get(v.get("risk_level"), RISK_WEIGHTS["medium"])
        overall -= weight
        matched = _match_standard(v.get("standard", ""), standards)
        if matched:
            per_standard[matched] -= weight

    overall = max(0, min(100, overall))
    per_standard = {k: max(0, min(100, v)) for k, v in per_standard.items()}

    standards_out = [{"name": name, "score": score} for name, score in per_standard.items()]
    return overall, _risk_label(overall), standards_out


def _normalize_suggested_wording(value) -> list[str]:
    """suggested_wording теперь всегда list[str] на выходе — модель обычно
    уже присылает массив (см. RESPONSE_JSON_EXAMPLE в prompts.py), но на
    случай отклонения от формата (или старых данных) приводим сами:
    список — берём как есть (только непустые строки), любое другое
    непустое значение — оборачиваем в список из одного элемента, пусто/
    отсутствует — пустой список."""
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if value:
        return [str(value).strip()]
    return []


def normalize_violation(raw: dict, index: int) -> dict | None:
    """Приводит одно нарушение из ответа модели к внутреннему формату.
    Возвращает None, если запись повреждена настолько, что её нельзя
    показать пользователю (нет risk_level и standard)."""
    risk_level = str(raw.get("risk_level", "")).strip().lower()
    if risk_level not in VALID_RISK_LEVELS:
        risk_level = "medium"

    standard = raw.get("standard")
    if not standard:
        return None

    return {
        "id": index,
        "risk_level": risk_level,
        "standard": standard,
        "article": raw.get("article", ""),
        "title": raw.get("title", "Нарушение"),
        "description": raw.get("description", ""),
        "quote": raw.get("quote"),
        "recommendation": raw.get("recommendation", ""),
        "suggested_wording": _normalize_suggested_wording(raw.get("suggested_wording")),
    }


def build_error_result(message: str) -> dict:
    return {
        "score": 0,
        "risk_label": "неизвестно",
        "standards": [],
        "violations": [],
        "action_checklist": [message],
        "error": message,
    }


def parse_and_score(raw: str, standards: list[str], always_active: str | None = None) -> dict:
    """Полный пайплайн: parse JSON -> нормализация нарушений -> подсчёт score.
    Используется всеми ai_*.py после получения сырого ответа от DeepSeek.

    standards — стандарты, выбранные пользователем. always_active — категория
    doc_type, которая проверяется всегда независимо от выбора (сейчас только
    "Договорная практика EULA" у eula) — допускается в находках, но не
    участвует в подсчёте score (см. compute_scores ниже)."""
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return build_error_result("Не удалось разобрать ответ модели. Попробуйте ещё раз.")

    allowed = list(standards) + ([always_active] if always_active else [])
    raw_applicable = data.get("applicable_standards") or list(allowed)
    # Пересечение с allowed — не даём модели "протащить" стандарт, который
    # пользователь не выбирал (даже если она сама его предложила), и заодно
    # приводим к канонической форме через _match_standard (модель иногда
    # немного меняет формулировку).
    applicable = []
    for s in raw_applicable:
        matched = _match_standard(s, allowed)
        if matched and matched not in applicable:
            applicable.append(matched)

    raw_violations = data.get("violations", [])
    violations = []
    for i, item in enumerate(raw_violations):
        normalized = normalize_violation(item, index=i)
        if normalized and _match_standard(normalized["standard"], allowed):
            violations.append(normalized)

    # always_active (если есть) исключается и из набора стандартов для
    # compute_scores, и из находок, которые в него передаются — находки по
    # ней не влияют на числовой score и не получают строку в разбивке.
    scored_standards = [s for s in applicable if s != always_active]
    scored_violations = [
        v for v in violations if not (always_active and _match_standard(v["standard"], [always_active]))
    ]
    score, risk_label, standards_out = compute_scores(scored_violations, scored_standards)

    return {
        "score": score,
        "risk_label": risk_label,
        "standards": standards_out,
        "violations": violations,
        "action_checklist": data.get("action_checklist", []),
    }


def build_local_result(text: str, checks: list[dict]) -> dict:
    """Бесплатный анализ по ключевым словам (без DeepSeek).

    checks — список словарей:
        {"name", "keywords", "standard", "article", "recommendation"}
    Каждый непройденный чек (нет ни одного ключевого слова в тексте)
    становится нарушением уровня "medium" — у локального анализа нет
    возможности точно оценить серьёзность, поэтому используется
    усреднённый уровень риска.
    """
    text_lower = text.lower()
    standards = sorted({c["standard"] for c in checks})
    violations = []

    for i, check in enumerate(checks):
        found = any(kw in text_lower for kw in check["keywords"])
        if not found:
            violations.append({
                "id": i,
                "risk_level": "medium",
                "standard": check["standard"],
                "article": check.get("article", ""),
                "title": check["name"],
                "description": f"В документе не найдены признаки раздела «{check['name']}».",
                "quote": None,
                "recommendation": check["recommendation"],
                "suggested_wording": [],
            })

    score, risk_label, standards_out = compute_scores(violations, standards)

    return {
        "score": score,
        "risk_label": risk_label,
        "standards": standards_out,
        "violations": violations,
        "action_checklist": [v["recommendation"] for v in violations] or ["Все пункты соблюдены"],
    }
