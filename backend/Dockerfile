# Python 3.12 — версия, на которой реально проверялось всё приложение
# локально (в .python-version записано 3.11.9, но фактический venv все
# фазы этой сессии — 3.12; используем то, что реально протестировано).
FROM python:3.12-slim

WORKDIR /app

# Отдельным слоем — чтобы pip install кэшировался, пока requirements.txt
# не меняется (сборка образов при каждом деплое не будет качать заново
# torch/sentence-transformers, если зависимости не поменялись).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Модель эмбеддингов (~460 МБ) запекаем в образ на этапе сборки —
# иначе первый же реальный RAG-запрос в проде долго и ненадёжно тянул бы
# её с HuggingFace Hub на каждом холодном старте контейнера.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')"

COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
