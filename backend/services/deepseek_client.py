import os
from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            raise RuntimeError(
                "DEEPSEEK_API_KEY не задан в .env — добавьте ключ с "
                "platform.deepseek.com, чтобы анализ через AI заработал."
            )
        _client = OpenAI(api_key=api_key, base_url="https://api.deepseek.com/v1")
    return _client


async def call_deepseek(system_prompt: str, user_prompt: str) -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=5000,
    )
    return response.choices[0].message.content
