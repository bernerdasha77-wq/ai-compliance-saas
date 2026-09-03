#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import io
import json
import asyncio
from datetime import datetime
from fastapi import FastAPI, Form, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from services.ai_service import analyze_contract
from services.access import (
    FREE_CHECKS_LIMIT,
    can_run_check,
    consume_check,
    should_return_full_report,
    strip_violation_details,
    account_status,
)
from services.payments import TARIFFS, create_payment, apply_payment
from services.scoring import build_error_result
from database import get_db, Report, User
from encryption_utils import encrypt_data, decrypt_data
from auth import get_password_hash, verify_password, needs_rehash, create_access_token, decode_access_token, get_user_from_token, security

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# АДМИНИСТРАТОР
ADMIN_EMAIL = "bernerdasha@yandex.ru"

# Куда редиректить пользователя после оплаты (см. /api/payments/create) —
# сама выдача оплаченного тарифа идёт не через этот редирект, а через
# /api/payments/webhook, независимо от того, вернулся ли пользователь на сайт.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Временная приостановка функции анализа (и новых платежей за неё) — см. тот
# же флаг на фронтенде: frontend/app/lib/maintenance.ts. Переключать оба
# синхронно при возобновлении работы.
ANALYZE_SUSPENDED = False
ANALYZE_SUSPENDED_MESSAGE = "Сервис временно приостановлен для технического обслуживания"

# ПРИЛОЖЕНИЕ
app = FastAPI(title="AI Compliance SaaS")

# РУЧНОЙ КОНТРОЛЬ CORS — раньше был "*" (любой сайт в интернете мог слать
# запросы к API из браузера пользователя); список ограничен явно известными
# origin'ами вместо звёздочки.
ALLOWED_ORIGINS = {
    FRONTEND_URL,
    "https://www.ai-compliance.online",
    "https://ai-compliance.online",
    "http://localhost:3000",
}

@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin")
    allow_origin = origin if origin in ALLOWED_ORIGINS else None

    if request.method == "OPTIONS":
        response = JSONResponse(content={"message": "OK"})
        if allow_origin:
            response.headers["Access-Control-Allow-Origin"] = allow_origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
        return response

    response = await call_next(request)
    if allow_origin:
        response.headers["Access-Control-Allow-Origin"] = allow_origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# МОДЕЛИ ДЛЯ АВТОРИЗАЦИИ
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    consent_personal_data: bool
    consent_terms: bool
    consent_us_transfer: bool

class UserLogin(BaseModel):
    email: str
    password: str

# БАЗОВЫЕ ЭНДПОИНТЫ
@app.get("/")
async def root():
    return {"message": "AI Compliance API is working!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

# РЕГИСТРАЦИЯ И ВХОД
@app.post("/api/register")
async def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    # Все три согласия обязательны для регистрации (152-ФЗ ст. 9, ч. 3 ст. 12 —
    # см. app/(marketing)/privacy и /consent) — проверяем на бэкенде, а не
    # полагаемся только на disabled-кнопку на фронтенде.
    if not (user_data.consent_personal_data and user_data.consent_terms and user_data.consent_us_transfer):
        raise HTTPException(status_code=400, detail="Необходимо принять все условия для регистрации")

    hashed_password = get_password_hash(user_data.password)
    consent_at = datetime.utcnow()
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        consent_personal_data_at=consent_at,
        consent_terms_at=consent_at,
        consent_us_transfer_at=consent_at,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
    
    return {
        "message": "Пользователь зарегистрирован",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

@app.post("/api/login")
async def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    if needs_rehash(user.hashed_password):
        user.hashed_password = get_password_hash(user_data.password)
        db.commit()

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    
    return {
        "message": "Вход выполнен",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

# АНАЛИЗ ДОГОВОРА
ALLOWED_STANDARDS = {"152-ФЗ", "GDPR", "ISO 27001", "NIS2"}

@app.post("/api/analyze", response_model=None)
async def analyze_contract_endpoint(
    file_name: str = Form(...),
    text: str = Form(...),
    company_name: str = "Test Company",
    standards: list[str] = Form(...),
    doc_type: str = "contract",
    db = Depends(get_db),
    token: str = Depends(security)
):
    if ANALYZE_SUSPENDED:
        raise HTTPException(status_code=503, detail=ANALYZE_SUSPENDED_MESSAGE)

    user = await get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный токен")

    if not file_name.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Поддерживаются только PDF и DOCX")

    # Текст извлекается и (опционально) обезличивается в браузере — см.
    # frontend/app/lib/extractText.ts, anonymize.ts — сюда приходит уже
    # готовый текст, а не файл, именно чтобы исходный файл не покидал
    # браузер пользователя. Пустой текст здесь означает сбой извлечения на
    # клиенте (например, скан PDF без текстового слоя) — фронтенд уже не
    # должен был позволить отправку в этом случае, но проверяем и на бэкенде.
    if not text.strip():
        raise HTTPException(status_code=400, detail="Не удалось извлечь текст из документа")

    if not standards:
        raise HTTPException(status_code=400, detail="Выберите хотя бы один стандарт")
    if not set(standards) <= ALLOWED_STANDARDS:
        raise HTTPException(status_code=400, detail="Недопустимый стандарт в списке")

    # Лимит проверяем ДО вызова DeepSeek — чтобы не тратить деньги на запрос,
    # который всё равно не покажем пользователю.
    if not can_run_check(user):
        raise HTTPException(
            status_code=402,
            detail={
                "message": "Лимит бесплатных проверок исчерпан",
                "checks_used": user.free_checks_used,
                "checks_limit": FREE_CHECKS_LIMIT,
            },
        )

    try:
        is_full = should_return_full_report(user)

        analysis = await analyze_contract(text, standards=standards, doc_type=doc_type)

        # score/risk_label считаются детерминированно на бэкенде (services/scoring.py)
        # из уровней риска найденных нарушений — см. analysis["score"] и analysis["risk_label"]
        RISK_LABEL_TO_LEVEL = {"низкий": "low", "средний": "medium", "высокий": "high"}
        risk_level = RISK_LABEL_TO_LEVEL.get(analysis.get("risk_label"), "medium")

        # Чек-лист по стандартам (для обратной совместимости и истории отчётов):
        # стандарт считается пройденным, если его score >= 80
        checklist = {
            std["name"]: std["score"] >= 80
            for std in analysis.get("standards", [])
        }

        analysis["is_full_report"] = is_full
        if not is_full:
            analysis = strip_violation_details(analysis)

        report = Report(
            user_id=user.id,
            file_name=file_name,
            risk_level=risk_level,
            status="processed",
            text_preview=encrypt_data(text[:500] + "..." if len(text) > 500 else text),
            analysis_results=encrypt_data(json.dumps(analysis, ensure_ascii=False)),
            checklist=checklist,
            is_full_report=is_full,
            created_at=datetime.utcnow()
        )
        db.add(report)

        # Проверка списывается из подходящего "кармана" пользователя
        # (подписка → разовый кредит → бесплатный лимит, см. services/access.py)
        # только после успешного анализа — не тратим лимит на упавшие запросы.
        consume_check(user)

        db.commit()
        db.refresh(report)

        return {
            "status": "processed",
            "report_id": report.id,
            "company": company_name,
            "file_name": file_name,
            "text_preview": text[:500] + "..." if len(text) > 500 else text,
            "analysis": analysis,
            "checklist": checklist,
            "risk_level": risk_level,
            "is_full_report": is_full,
            "account": account_status(user),
            "created_at": report.created_at.isoformat()
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")

# ИНФОРМАЦИЯ О ТАРИФЕ И ОСТАВШИХСЯ ПРОВЕРКАХ
@app.get("/api/usage")
async def get_usage(db = Depends(get_db), token: str = Depends(security)):
    user = await get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный токен")

    return account_status(user)

# ОПЛАТА (ЮKassa)
@app.post("/api/payments/create")
async def create_payment_endpoint(tariff: str, db: Session = Depends(get_db), token: str = Depends(security)):
    if ANALYZE_SUSPENDED:
        raise HTTPException(status_code=503, detail=ANALYZE_SUSPENDED_MESSAGE)

    user = await get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный токен")
    if tariff not in TARIFFS:
        raise HTTPException(status_code=400, detail="Неизвестный тариф")

    # to_thread: yookassa-sdk синхронный, .create() — блокирующий HTTP-запрос;
    # без этого он блокировал бы event loop так же, как раньше блокировал
    # DeepSeek (см. services/deepseek_client.py).
    result = await asyncio.to_thread(create_payment, user, tariff, f"{FRONTEND_URL}/payment-result")
    return result

# Вебхук ЮKassa — вызывается сервером ЮKassa, не залогиненным пользователем,
# поэтому без Depends(security). Статусу из тела запроса не доверяем — см.
# services/payments.py:apply_payment (переспрашивает статус у самой ЮKassa).
@app.get("/api/payments/webhook")
async def payments_webhook_ping():
    return {"status": "ok"}

@app.post("/api/payments/webhook")
async def payments_webhook(request: Request):
    # Никогда не 500'им сюда: пустое тело, невалидный JSON или проверочный
    # пинг от ЮKassa/панели не должны выглядеть как сбой на нашей стороне.
    try:
        body = await request.json()
    except Exception:
        return {"status": "ok"}

    payment_id = body.get("object", {}).get("id")
    if payment_id:
        await asyncio.to_thread(apply_payment, payment_id)
    return {"status": "ok"}

def _decode_analysis(encrypted: str) -> dict:
    """Расшифровывает и парсит analysis_results отчёта.

    Отчёты, созданные до того, как ENCRYPTION_KEY стал обязательным
    постоянным секретом (см. encryption_utils.py), были зашифрованы ключом,
    который менялся при каждом рестарте процесса — сейчас decrypt_data()
    для них тихо возвращает исходный шифротекст (InvalidToken), и
    json.loads либо падает, либо (если шифротекст сам оказался валидным
    JSON-значением, как в найденном случае) возвращает не dict, а строку.
    Контент таких отчётов физически не восстановить — возвращаем ту же
    форму ошибки, что и parse_and_score при сбое разбора ответа модели, а
    не отдаём сырой шифротекст на фронтенд (там он ломал ScoreSummary,
    ожидающий analysis.standards)."""
    try:
        data = json.loads(decrypt_data(encrypted))
    except (json.JSONDecodeError, TypeError):
        data = None
    if not isinstance(data, dict):
        return build_error_result(
            "Этот отчёт зашифрован ключом, который больше не действует "
            "(создан до перехода на постоянный ключ шифрования) — "
            "содержимое невозможно восстановить."
        )
    return data


# ПОЛУЧЕНИЕ ОТЧЁТОВ
@app.get("/api/reports/{report_id}")
async def get_report(report_id: int, db: Session = Depends(get_db), token: str = Depends(security)):
    user = await get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный токен")

    report = db.query(Report).filter(Report.id == report_id).first()
    # 404 и для несуществующего, и для чужого отчёта — иначе по коду ответа
    # можно было бы угадывать, какие ID вообще существуют у других людей.
    if not report or (report.user_id != user.id and user.email != ADMIN_EMAIL):
        raise HTTPException(status_code=404, detail="Отчёт не найден")

    return {
        "id": report.id,
        "file_name": report.file_name,
        "risk_level": report.risk_level,
        "analysis": _decode_analysis(report.analysis_results),
        "checklist": report.checklist,
        "is_full_report": report.is_full_report,
        "created_at": report.created_at.isoformat()
    }

@app.get("/api/reports/user/{user_id}")
async def get_user_reports(user_id: int, db: Session = Depends(get_db), token: str = Depends(security)):
    user = await get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный токен")
    if user_id != user.id and user.email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    reports = db.query(Report).filter(Report.user_id == user_id).all()
    return [
        {
            "id": r.id,
            "file_name": r.file_name,
            "risk_level": r.risk_level,
            "created_at": r.created_at.isoformat()
        }
        for r in reports
    ]

# АДМИН-ПАНЕЛЬ
# Раньше "проверкой" был заголовок X-Admin-Email, который клиент выставляет
# сам — при этом сам admin-email открыто лежит в этом же публичном репо.
# Теперь админ-доступ определяется email'ом из подписанного JWT, а не тем,
# что клиент написал в заголовке.
async def require_admin(db: Session, token: str) -> User:
    user = await get_user_from_token(token, db)
    if not user or user.email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    return user

@app.get("/api/admin/users")
async def get_all_users(db: Session = Depends(get_db), token: str = Depends(security)):
    await require_admin(db, token)

    users = db.query(User).all()
    result = []
    for user in users:
        reports_count = db.query(Report).filter(Report.user_id == user.id).count()
        result.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "created_at": user.created_at.isoformat(),
            "reports_count": reports_count,
            "is_active": user.is_active
        })
    return result

@app.get("/api/admin/reports")
async def get_all_reports(db: Session = Depends(get_db), token: str = Depends(security)):
    await require_admin(db, token)

    reports = db.query(Report).order_by(Report.created_at.desc()).limit(50).all()
    result = []
    for report in reports:
        user = db.query(User).filter(User.id == report.user_id).first()
        result.append({
            "id": report.id,
            "file_name": report.file_name,
            "user_email": user.email if user else "неизвестно",
            "risk_level": report.risk_level,
            "created_at": report.created_at.isoformat(),
            "status": report.status
        })
    return result

@app.get("/api/admin/stats")
async def get_stats(db: Session = Depends(get_db), token: str = Depends(security)):
    await require_admin(db, token)

    total_users = db.query(User).count()
    total_reports = db.query(Report).count()
    active_users = db.query(User).filter(User.is_active == 1).count()
    return {
        "total_users": total_users,
        "total_reports": total_reports,
        "active_users": active_users,
    }
