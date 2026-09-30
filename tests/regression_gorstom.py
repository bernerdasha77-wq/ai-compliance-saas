#!/usr/bin/env python3
"""
Регрессионный тест на реальном документе (см. fix-analysis-quality.md, часть C).

Прогоняет tests/fixtures/gorstom-policy.txt через ПОЛНЫЙ реальный пайплайн —
без дублирования логики на Python:

  1. Анонимизация — настоящий frontend/app/lib/anonymize.ts (тот же код,
     что использует сайт в браузере), вызванный через node (tests/anonymize_runner.js).
  2. Промпт — настоящий backend/services/prompts.py (build_prompt).
  3. Анализ — настоящий backend/services/ai_privacy.deepseek_analyze
     (реальный вызов DeepSeek, не мок).
  4. Проверка ожидаемых/неожиданных находок по результату.

Запуск: backend/venv/bin/python3 tests/regression_gorstom.py [--runs N] [--standards 152-ФЗ,GDPR]
"""
import argparse
import asyncio
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FIXTURE = ROOT / "tests" / "fixtures" / "gorstom-policy.txt"
COMPILED_DIR = ROOT / "tests" / "fixtures" / ".compiled"
ANONYMIZE_TS = ROOT / "frontend" / "app" / "lib" / "anonymize.ts"
TSC = ROOT / "frontend" / "node_modules" / ".bin" / "tsc"
RUNNER_JS = ROOT / "tests" / "anonymize_runner.js"

sys.path.insert(0, str(ROOT / "backend"))


def compile_anonymize() -> Path:
    """Компилирует anonymize.ts в CommonJS, чтобы вызвать его из Node —
    без дублирования логики анонимизации на Python (см. требование к части C).
    Файл не имеет внешних импортов, поэтому компилируется автономно."""
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


# Проверки подобраны по РЕАЛЬНОМУ содержимому tests/fixtures/gorstom-policy.txt
# (см. отчёт в чате) — не по описанию в fix-analysis-quality.md буквально: та
# формулировка сценария ("info@www.gorstom.ru в одном документе, info@gorstom.ru
# в соседнем") описывала сравнение ДВУХ разных документов с сайта, а у нас
# только один файл (gorstom-policy.docx) — внутри него email везде одинаковый
# (info@www.gorstom.ru), поэтому этот конкретный кейс не воспроизводим на
# одной фикстуре. Вместо него — реальное внутреннее противоречие, которое
# документ действительно содержит: заявление "данные никогда не передаются
# третьим лицам" при одновременном использовании Яндекс.Метрики.
CHECKS = [
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
        "match": lambda v: "трансгранич" in _joined(v),
    },
]


async def run_once(anonymized_text: str, standards: list[str]) -> dict:
    from services.ai_privacy import deepseek_analyze
    return await deepseek_analyze(anonymized_text, standards)


def evaluate(result: dict) -> list[dict]:
    violations = result.get("violations", [])
    outcomes = []
    for check in CHECKS:
        matches = [v for v in violations if check["match"](v)]
        found = len(matches) > 0
        passed = found == check["expect_found"]
        outcomes.append({
            "name": check["name"],
            "expect_found": check["expect_found"],
            "found": found,
            "passed": passed,
            "matches": matches,
        })
    return outcomes


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--runs", type=int, default=3)
    parser.add_argument("--standards", type=str, default="152-ФЗ")
    args = parser.parse_args()
    standards = [s.strip() for s in args.standards.split(",") if s.strip()]

    from dotenv import load_dotenv
    load_dotenv(ROOT / "backend" / ".env")

    if not FIXTURE.exists():
        print(f"Фикстура не найдена: {FIXTURE}", file=sys.stderr)
        sys.exit(1)

    print(f"Компилирую anonymize.ts...")
    compiled_js = compile_anonymize()
    anonymize_out = run_anonymize(compiled_js, FIXTURE)
    anonymized_text = anonymize_out["text"]
    print(f"Анонимизация: {anonymize_out['total']} замен, категории: {anonymize_out['counts']}")
    print(f"Стандарты: {standards}\n")

    all_outcomes = []

    for i in range(1, args.runs + 1):
        print(f"{'=' * 70}\nЗАПУСК {i}/{args.runs}\n{'=' * 70}")
        result = asyncio.run(run_once(anonymized_text, standards))

        print(f"Score: {result.get('score')} ({result.get('risk_label')})")
        print(f"degraded (фолбэк без DeepSeek): {result.get('degraded', False)}")
        print(f"Найдено нарушений: {len(result.get('violations', []))}")
        for v in result.get("violations", []):
            print(f"  - [{v.get('risk_level')}] {v.get('standard')} ({v.get('article')}): {v.get('title')}")
        print(f"scope_note: {result.get('scope_note')}")

        outcomes = evaluate(result)
        all_outcomes.append(outcomes)

        print("\nПроверки:")
        for o in outcomes:
            status = "OK" if o["passed"] else "FAIL"
            expect = "должна быть" if o["expect_found"] else "НЕ должна быть"
            actual = "есть" if o["found"] else "нет"
            print(f"  [{status}] {o['name']} (ожидание: {expect}, факт: {actual})")
            if not o["passed"]:
                for m in o["matches"]:
                    print(f"        -> сработало на: [{m.get('risk_level')}] {m.get('title')}: {m.get('description')}")
        print()

    print(f"{'=' * 70}\nСТАБИЛЬНОСТЬ ПО {args.runs} ПРОГОНАМ\n{'=' * 70}")
    all_ok = True
    for idx, check in enumerate(CHECKS):
        passed_count = sum(1 for run in all_outcomes if run[idx]["passed"])
        marker = "OK" if passed_count == args.runs else "НЕСТАБИЛЬНО"
        if passed_count != args.runs:
            all_ok = False
        print(f"  {passed_count}/{args.runs} [{marker}] — {check['name']}")

    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
