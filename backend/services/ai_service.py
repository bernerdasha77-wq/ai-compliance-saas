from .ai_contract import local_analyze as contract_local
from .ai_contract import deepseek_analyze as contract_deepseek

# Регистрируем все типы документов
ANALYZERS = {
    "contract": {
        "local": contract_local,
        "deepseek": contract_deepseek,
    },
    # "eula": {
    #     "local": eula_local,
    #     "deepseek": eula_deepseek,
    # },
}

async def analyze_contract(
    text: str,
    is_pro: bool = False,
    law: str = "152-ФЗ",
    doc_type: str = "contract"
) -> dict:
    """Главная функция анализа — выбирает нужный тип документа"""
    analyzer = ANALYZERS.get(doc_type, ANALYZERS["contract"])
    if is_pro:
        return await analyzer["deepseek"](text, law)
    else:
        return await analyzer["local"](text)