import os
from openai import AsyncOpenAI

# AsyncOpenAI, а не синхронный OpenAI: раньше .create() блокировал весь
# event loop на всё время запроса к DeepSeek (~60-100с) — из-за этого падали
# health-check'и и параллельные пользователи фактически ставились в очередь
# друг за другом вместо конкурентной обработки (см. main.py, единственный
# uvicorn-воркер). await на асинхронном клиенте отдаёт управление на время
# сетевого ожидания, не меняя саму скорость ответа DeepSeek.
# Низкая temperature — меньше случайности в том, какие нарушения модель решает
# найти на одном и том же входном тексте между прогонами (см. историю: тот же
# документ с чисто позитивными правками формулировок один раз дал явно худший
# score, чем оригинал — при 0.3 это статистически ожидаемо).
#
# Реально измерено на одном документе, 5 прогонов на каждое значение:
#   temperature=0.3: score 0-47 (разброс 47), находок 6-10 (разброс 4)
#   temperature=0.1: score 24-47 (разброс 23), находок 6-10 (разброс 4)
#   temperature=0:   score 32-47 (разброс 15), находок 6-7  (разброс 1)
# При 0 качество/содержательность находок не хуже, чем при 0.3 (сверялись
# конкретные формулировки, не только score) — полной детерминированности
# всё равно нет (DeepSeek не гарантирует byte-for-byte воспроизводимость
# даже при temperature=0), но разброс существенно уже.
DEFAULT_TEMPERATURE = 0

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            raise RuntimeError(
                "DEEPSEEK_API_KEY не задан в .env — добавьте ключ с "
                "platform.deepseek.com, чтобы анализ через AI заработал."
            )
        _client = AsyncOpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
    return _client


async def call_deepseek(system_prompt: str, user_prompt: str, temperature: float = DEFAULT_TEMPERATURE) -> str:
    client = _get_client()
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=5000,
    )
    return response.choices[0].message.content
