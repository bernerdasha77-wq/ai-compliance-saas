#!/usr/bin/env python3
"""
Регрессионный тест на реальных документах (см. fix-analysis-quality.md, часть C).

Прогоняет фикстуры из tests/fixtures/ через ПОЛНЫЙ реальный пайплайн — без
дублирования логики на Python:

  1. Анонимизация — настоящий frontend/app/lib/anonymize.ts (тот же код,
     что использует сайт в браузере), вызванный через node (tests/anonymize_runner.js).
  2. Промпт — настоящий backend/services/prompts.py (build_prompt).
  3. Анализ — настоящий backend/services/ai_privacy.deepseek_analyze
     (реальный вызов DeepSeek, не мок).
  4. Проверка ожидаемых/неожиданных находок и (опционально) минимального score.

Запуск:
  backend/venv/bin/python3 tests/regression_gorstom.py [--runs N] [--doc gorstom|own-privacy|all]
"""
import argparse
import asyncio
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIXTURES_DIR = ROOT / "tests" / "fixtures"
COMPILED_DIR = FIXTURES_DIR / ".compiled"
ANONYMIZE_TS = ROOT / "frontend" / "app" / "lib" / "anonymize.ts"
TSC = ROOT / "frontend" / "node_modules" / ".bin" / "tsc"
RUNNER_JS = ROOT / "tests" / "anonymize_runner.js"

sys.path.insert(0, str(ROOT / "backend"))


def compile_anonymize() -> Path:
    """Компилирует anonymize.ts в CommonJS, чтобы вызвать его из Node —
    без дублирования логики анонимизации на Python. Файл не имеет внешних
    импортов, поэтому компилируется автономно."""
    COMPILED_DIR.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        [
            str(TSC), str(ANONYMIZE_TS),
            "--module", "commonjs", "--target", "es2020",
            "--outDir", str(COMPILED_DIR), "--skipLibCheck",
        ],
        check=True, cwd=ROOT,
    )
    return COMPILED_DIR / "anonymize.js"


def run_anonymize(compiled_js: Path, text_path: Path) -> dict:
    proc = subprocess.run(
        ["node", str(RUNNER_JS), str(compiled_js), str(text_path)],
        check=True, capture_output=True, text=True,
    )
    return json.loads(proc.stdout)


def _joined(v: dict) -> str:
    parts = [v.get("title") or "", v.get("description") or "", v.get("quote") or "", v.get("recommendation") or ""]
    return " ".join(parts).lower()


# Проверки для gorstom-policy.txt подобраны по РЕАЛЬНОМУ содержимому файла
# (см. историю в чате) — не по описанию в fix-analysis-quality.md буквально: та
# формулировка сценария ("info@www.gorstom.ru в одном документе, info@gorstom.ru
# в соседнем") описывала сравнение ДВУХ разных документов с сайта, а у нас
# только один файл (gorstom-policy.docx) — внутри него email везде одинаковый,
# поэтому этот конкретный кейс не воспроизводим на одной фикстуре. Вместо него
# — реальное внутреннее противоречие, которое документ действительно содержит:
# заявление "данные никогда не передаются третьим лицам" при одновременном
# использовании Яндекс.Метрики.
GORSTOM_CHECKS = [
    {
        "name": "Оператор не назван как юрлицо (назван только сайт)",
        "expect_found": True,
        "match": lambda v: (
            ("юридическ" in _joined(v) or "юрлиц" in _joined(v) or "оператор" in v.get("title", "").lower())
            and ("сайт" in _joined(v) or "домен" in _joined(v) or "gorstom" in _joined(v))
        ),
    },
    {
        "name": "Неограниченный/бессрочный срок хранения",
        "expect_found": True,
        "match": lambda v: "хранен" in _joined(v) and ("неогранич" in _joined(v) or "бессроч" in _joined(v)),
    },
    {
        "name": "Согласие через факт заполнения формы (не отдельное действие)",
        "expect_found": True,
        "match": lambda v: "согласи" in _joined(v) and "форм" in _joined(v),
    },
    {
        "name": "Рассылки/уведомления без предварительного согласия",
        "expect_found": True,
        "match": lambda v: ("рассылк" in _joined(v) or "уведомлен" in _joined(v)) and "согласи" in _joined(v),
    },
    {
        "name": 'Внутреннее противоречие: "никогда не передаём третьим лицам" vs Яндекс.Метрика',
        "expect_found": True,
        "match": lambda v: "третьим лицам" in _joined(v) and (
            "метрик" in _joined(v) or "аналит" in _joined(v) or "статистик" in _joined(v) or "противоречи" in _joined(v)
        ),
    },
    {
        "name": "НЕ должно быть находки о трансграничной передаче (Яндекс.Метрика — российский сервис)",
        "expect_found": False,
        # Только по заголовку: заголовок показывает, что находка ПОСВЯЩЕНА
        # трансграничной передаче — в отличие от description/recommendation,
        # где слово иногда всплывает мимоходом в рекомендации к ДРУГОЙ находке
        # (не являясь отдельным нарушением), что раньше давало ложный FAIL теста.
        "match": lambda v: "трансгранич" in (v.get("title") or "").lower(),
    },
]

# Общая проверка "нет находки о трансграничной передаче" — переиспользуется для
# любого документа, где в тексте нет ни одного упоминания зарубежного
# получателя/сервиса/государства (см. правило в prompts.py: DOC_CONFIGS
# ["privacy"]["law_152_checklist"], пункт 11 + правило после списка).
NO_CROSS_BORDER_CHECK = {
    "name": "НЕ должно быть находки о трансграничной передаче (в тексте нет упоминаний зарубежных получателей)",
    "expect_found": False,
    "match": lambda v: "трансгранич" in (v.get("title") or "").lower(),
}

# Документ явно пишет "не обрабатывает данные о здоровье, за исключением
# случаев, предусмотренных законодательством" — оговорка с отрицанием и
# исключением, не признание нарушения (см. общее правило в prompts.py:
# "Фраза с отрицанием и исключением... САМА ПО СЕБЕ не является признанием
# нарушения"). Допустима находка не выше medium про неконкретность оговорки,
# но не high про "обработку без основания".
NO_HIGH_HEALTH_DATA_CHECK = {
    "name": 'Нет high-находки про данные о здоровье (это оговорка-исключение, не признание нарушения)',
    "expect_found": False,
    "match": lambda v: v.get("risk_level") == "high" and "здоров" in _joined(v),
}

# Собственная политика конфиденциальности сервиса (ai-compliance.online/privacy)
# — эталонный "хороший" документ: ожидаем высокий score и отсутствие находок
# высокого риска. Если найдутся — это сигнал либо о реальной проблеме в
# документе, либо о ложном срабатывании модели, разбираем по факту вывода.
OWN_PRIVACY_CHECKS = [
    {
        "name": "Нет находок высокого риска (risk_level=high)",
        "expect_found": False,
        "match": lambda v: v.get("risk_level") == "high",
    },
]

DOCUMENTS = {
    "gorstom": {
        "label": "Горстом (gorstom.ru/policy)",
        "fixture": FIXTURES_DIR / "gorstom-policy.txt",
        "standards": ["152-ФЗ"],
        "checks": GORSTOM_CHECKS,
        "min_score": None,
    },
    "own-privacy": {
        "label": "Собственная политика (ai-compliance.online/privacy)",
        "fixture": FIXTURES_DIR / "ai-compliance-privacy.txt",
        "standards": ["152-ФЗ"],
        "checks": OWN_PRIVACY_CHECKS,
        "min_score": 80,
    },
    # Два реальных документа независимой компании (сеть стоматологических
    # клиник «Камелия-Мед») — без заранее заданных ожиданий по конкретным
    # находкам (в отличие от gorstom/own-privacy, для них никто не формулировал
    # "должно/не должно быть найдено"), просто дополнительные точки данных для
    # наблюдения за score на разных по качеству реальных документах.
    "kamelia-privacy-policy": {
        "label": "Камелия-Мед — Политика конфиденциальности (типовая, 4 стр.)",
        "fixture": FIXTURES_DIR / "kamelia-privacy-policy.txt",
        "standards": ["152-ФЗ"],
        "checks": [],
        "min_score": None,
    },
    "kamelia-pd-position": {
        "label": "Камелия-Мед — Политика в отношении обработки ПДн (формальная, 13 стр.)",
        "fixture": FIXTURES_DIR / "kamelia-pd-position.txt",
        "standards": ["152-ФЗ"],
        # В тексте документа нет ни одного упоминания зарубежного сервиса,
        # подрядчика или государства (единственное близкое по написанию слово —
        # "знание иностранных языков" в анкете сотрудника, к передаче данных
        # отношения не имеющее) — модель раньше всё равно создавала находку
        # "отсутствие уведомления о трансграничной передаче" (см. историю в чате).
        "checks": [NO_CROSS_BORDER_CHECK, NO_HIGH_HEALTH_DATA_CHECK],
        "min_score": None,
    },
}


async def run_once(anonymized_text: str, standards: list[str]) -> dict:
    from services.ai_privacy import deepseek_analyze
    return await deepseek_analyze(anonymized_text, standards)


def evaluate(result: dict, checks: list[dict], min_score: int | None) -> list[dict]:
    violations = result.get("violations", [])
    outcomes = []
    for check in checks:
        matches = [v for v in violations if check["match"](v)]
        found = len(matches) > 0
        passed = found == check["expect_found"]
        outcomes.append({
            "name": check["name"], "expect_found": check["expect_found"],
            "found": found, "passed": passed, "matches": matches,
        })
    if min_score is not None:
        score = result.get("score", 0)
        passed = score >= min_score
        outcomes.append({
            "name": f"Score >= {min_score}", "expect_found": True,
            "found": passed, "passed": passed, "matches": [], "score": score,
        })
    return outcomes


def run_document(doc_key: str, doc: dict, runs: int, compiled_js: Path) -> bool:
    print(f"\n{'#' * 70}\n# ДОКУМЕНТ: {doc['label']}\n{'#' * 70}")

    if not doc["fixture"].exists():
        print(f"Фикстура не найдена: {doc['fixture']}", file=sys.stderr)
        return False

    anonymize_out = run_anonymize(compiled_js, doc["fixture"])
    anonymized_text = anonymize_out["text"]
    print(f"Анонимизация: {anonymize_out['total']} замен, категории: {anonymize_out['counts']}")
    print(f"Стандарты: {doc['standards']}")

    all_outcomes = []

    for i in range(1, runs + 1):
        print(f"\n{'=' * 70}\nЗАПУСК {i}/{runs}\n{'=' * 70}")
        result = asyncio.run(run_once(anonymized_text, doc["standards"]))

        print(f"Score: {result.get('score')} ({result.get('risk_label')})")
        print(f"degraded (фолбэк без DeepSeek): {result.get('degraded', False)}")
        print(f"Найдено нарушений: {len(result.get('violations', []))}")
        for v in result.get("violations", []):
            print(f"  - [{v.get('risk_level')}] {v.get('standard')} ({v.get('article')}): {v.get('title')}")
            if v.get("quote"):
                print(f"      цитата: {v.get('quote')!r}")
        print(f"scope_note: {result.get('scope_note')}")

        outcomes = evaluate(result, doc["checks"], doc["min_score"])
        all_outcomes.append(outcomes)

        print("\nПроверки:")
        for o in outcomes:
            status = "OK" if o["passed"] else "FAIL"
            expect = "должна быть" if o["expect_found"] else "НЕ должна быть"
            actual = "есть" if o["found"] else "нет"
            print(f"  [{status}] {o['name']} (ожидание: {expect}, факт: {actual})")
            for m in o["matches"]:
                print(f"        -> [{m.get('risk_level')}] {m.get('title')}: {m.get('description')}")

    print(f"\n{'-' * 70}\nСТАБИЛЬНОСТЬ ПО {runs} ПРОГОНАМ — {doc['label']}\n{'-' * 70}")
    all_ok = True
    num_checks = len(all_outcomes[0])
    for idx in range(num_checks):
        name = all_outcomes[0][idx]["name"]
        passed_count = sum(1 for run in all_outcomes if run[idx]["passed"])
        marker = "OK" if passed_count == runs else "НЕСТАБИЛЬНО"
        if passed_count != runs:
            all_ok = False
        print(f"  {passed_count}/{runs} [{marker}] — {name}")

    return all_ok


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--doc", type=str, default="all", choices=[*DOCUMENTS.keys(), "all"])
    args = parser.parse_args()

    from dotenv import load_dotenv
    load_dotenv(ROOT / "backend" / ".env")

    print("Компилирую anonymize.ts...")
    compiled_js = compile_anonymize()

    doc_keys = list(DOCUMENTS.keys()) if args.doc == "all" else [args.doc]
    all_ok = True
    for key in doc_keys:
        ok = run_document(key, DOCUMENTS[key], args.runs, compiled_js)
        all_ok = all_ok and ok

    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
