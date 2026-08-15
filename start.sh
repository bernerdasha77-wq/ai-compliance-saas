#!/bin/bash

echo "🚀 Запускаем AI Compliance SaaS..."

# Запускаем бекенд
cd ~/Desktop/ai-compliance-saas/backend
source venv/bin/activate
uvicorn main:app --reload --host 127.0.0.1 --port 8000 &

# Ждём 2 секунды, чтобы бекенд успел запуститься
sleep 2

# Запускаем фронтенд
cd ~/Desktop/ai-compliance-saas/frontend
npm run dev

echo "✅ Готово! Откройте http://localhost:3000"
