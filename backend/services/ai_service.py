from .ai_contract import local_analyze as contract_local
from .ai_contract import deepseek_analyze as contract_deepseek
from .ai_eula import local_analyze as eula_local
from .ai_eula import deepseek_analyze as eula_deepseek
from .ai_privacy import local_analyze as privacy_local      
from .ai_privacy import deepseek_analyze as privacy_deepseek  

ANALYZERS = {
    "contract": {
        "local": contract_local,
        "deepseek": contract_deepseek,
    },
    "eula": {
        "local": eula_local,
        "deepseek": eula_deepseek,
    },
    "privacy": {
        "local": privacy_local,
        "deepseek": privacy_deepseek,
    },
}

async def analyze_contract(
    text: str,
    is_pro: bool = False,
    law: str = "152-ФЗ",
    doc_type: str = "contract"
) -> dict:
    analyzer = ANALYZERS.get(doc_type, ANALYZERS["contract"])
    if is_pro:
        return await analyzer["deepseek"](text, law)
    else:
        return await analyzer["local"](text)