#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sys
import io
import json
import asyncio
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from services.parser import extract_text_from_file
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
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
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
@app.post("/api/analyze", response_model=None)
async def analyze_contract_endpoint(
    file: UploadFile = File(...),
    company_name: str = "Test Company",
    law: str = "152-ФЗ",
    doc_type: str = "contract",
    db = Depends(get_db),
    token: str = Depends(security)
):
    user = await get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный токен")

    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Поддерживаются только PDF и DOCX")

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
        text = await extract_text_from_file(file)

        is_full = should_return_full_report(user)

        analysis = await analyze_contract(text, law=law, doc_type=doc_type)

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
            file_name=file.filename,
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
            "file_name": file.filename,
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
        "analysis": json.loads(decrypt_data(report.analysis_results)),
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
