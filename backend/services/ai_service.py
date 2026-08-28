from .ai_contract import deepseek_analyze as contract_analyze
from .ai_eula import deepseek_analyze as eula_analyze
from .ai_privacy import deepseek_analyze as privacy_analyze

# Все тарифы (бесплатный и платный) идут через DeepSeek — разница между ними
# теперь не в качестве анализа, а в лимите проверок и в том, показываются ли
# все детали или урезанное превью (см. services/access.py). local_analyze в
# каждом ai_*.py остаётся как запасной вариант на случай сбоя DeepSeek.
ANALYZERS = {
    "contract": contract_analyze,
    "eula": eula_analyze,
    "privacy": privacy_analyze,
}


async def analyze_contract(text: str, law: str = "152-ФЗ", doc_type: str = "contract") -> dict:
    analyzer = ANALYZERS.get(doc_type, ANALYZERS["contract"])
    return await analyzer(text, law)
