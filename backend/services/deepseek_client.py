import os
from openai import AsyncOpenAI

# AsyncOpenAI, а не синхронный OpenAI: раньше .create() блокировал весь
# event loop на всё время запроса к DeepSeek (~60-100с) — из-за этого падали
# health-check'и и параллельные пользователи фактически ставились в очередь
# друг за другом вместо конкурентной обработки (см. main.py, единственный
# uvicorn-воркер). await на асинхронном клиенте отдаёт управление на время
# сетевого ожидания, не меняя саму скорость ответа DeepSeek.
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


async def call_deepseek(system_prompt: str, user_prompt: str) -> str:
    client = _get_client()
    response = await client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=5000,
    )
    return response.choices[0].message.content
