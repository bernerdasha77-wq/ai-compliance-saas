# Python 3.12 — версия, на которой реально проверялось всё приложение
# локально (в .python-version записано 3.11.9, но фактический venv все
# фазы этой сессии — 3.12; используем то, что реально протестировано).
FROM python:3.12-slim

WORKDIR /app

# Отдельным слоем — чтобы pip install кэшировался, пока requirements.txt
# не меняется.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Раньше здесь запекался sentence-transformers/torch (эмбеддинги для RAG
# считались на лету) — теперь эмбеддинги query_text предвычислены офлайн
# и просто читаются из БД (см. services/retrieval.py, scripts/
# precompute_focus_embeddings.py), рабочий образ модель вообще не держит.

COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
