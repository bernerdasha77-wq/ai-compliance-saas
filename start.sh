#!/bin/bash
set -e

# Каталог, в котором лежит сам скрипт — так работает независимо от имени папки
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Запускаем AI Compliance SaaS..."

# Поднимаем локальный Postgres (порт 5433, см. docker-compose.yml)
cd "$DIR"
docker compose up -d

# Запускаем бекенд
cd "$DIR/backend"
source venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000 &

# Ждём, чтобы бекенд успел запуститься
sleep 2

# Запускаем фронтенд
cd "$DIR/frontend"
npm run dev

echo "✅ Готово! Откройте http://localhost:3000"
