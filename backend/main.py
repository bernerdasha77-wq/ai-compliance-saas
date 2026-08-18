#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import io
import json
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from services.parser import extract_text_from_file
from services.ai_service import analyze_contract
from database import get_db, Report, User
from encryption_utils import encrypt_data, decrypt_data
from auth import get_password_hash, verify_password, create_access_token, decode_access_token, get_user_from_token, security

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# ============================================
# АДМИНИСТРАТОР
# ============================================
ADMIN_EMAIL = "bernerdasha@yandex.ru"  

# ============================================
# ПРИЛОЖЕНИЕ
# ============================================
app = FastAPI(title="AI Compliance SaaS")

# ============================================
# РУЧНОЙ КОНТРОЛЬ CORS (ДЛЯ ВСЕХ ЗАПРОСОВ)
# ============================================
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        response = JSONResponse(content={"message": "OK"})
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, X-Admin-Email"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        return response

    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# ============================================
# МОДЕЛИ ДЛЯ АВТОРИЗАЦИИ
# ============================================
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

# ============================================
# БАЗОВЫЕ ЭНДПОИНТЫ
# ============================================
@app.get("/")
async def root():
    return {"message": "AI Compliance API is working!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

# ============================================
# РЕГИСТРАЦИЯ И ВХОД
# ============================================
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

# ============================================
# АНАЛИЗ ДОГОВОРА (С АВТОРИЗАЦИЕЙ)
# ============================================
@app.post("/api/analyze", response_model=None)
async def analyze_contract_endpoint(
    file: UploadFile = File(...),
    company_name: str = "Test Company",
    db = Depends(get_db),
    token: str = Depends(security)
):
    user = await get_user_from_token(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Неверный или просроченный токен")
    
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Поддерживаются только PDF и DOCX")
    
    try:
        text = await extract_text_from_file(file)
        analysis = await analyze_contract(text)
        
        checklist = {}
        if analysis.get('rules'):
            for rule in analysis['rules']:
                name = rule.get('name', '')
                status_text = rule.get('status', '')
                checklist[name] = '🟢' in status_text or 'Соответствует' in status_text
        
        total = len(checklist) if checklist else 1
        passed = sum(1 for v in checklist.values() if v)
        risk_ratio = passed / total if total > 0 else 0
        
        if risk_ratio == 1.0:
            risk_level = "low"
        elif risk_ratio >= 0.6:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        report = Report(
            user_id=user.id,
            file_name=file.filename,
            risk_level=risk_level,
            status="processed",
            text_preview=encrypt_data(text[:500] + "..." if len(text) > 500 else text),
            analysis_results=encrypt_data(json.dumps(analysis, ensure_ascii=False)),
            checklist=checklist,
            created_at=datetime.utcnow()
        )
        db.add(report)
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
            "created_at": report.created_at.isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")

# ============================================
# ПОЛУЧЕНИЕ ОТЧЁТОВ
# ============================================
@app.get("/api/reports/{report_id}")
async def get_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Отчёт не найден")
    
    return {
        "id": report.id,
        "file_name": report.file_name,
        "risk_level": report.risk_level,
        "analysis": json.loads(decrypt_data(report.analysis_results)),
        "checklist": report.checklist,
        "created_at": report.created_at.isoformat()
    }

@app.get("/api/reports/user/{user_id}")
async def get_user_reports(user_id: int, db: Session = Depends(get_db)):
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

@app.get("/api/users")
async def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,"full_name": u.full_name,
            "created_at": u.created_at.isoformat()
        }
        for u in users
    ]

# ============================================
# АДМИН-ПАНЕЛЬ (ТОЛЬКО ДЛЯ ВАС)
# ============================================
@app.get("/api/admin/users")
async def get_all_users(
    x_admin_email: str = Header(...),
    db: Session = Depends(get_db)
):
    if x_admin_email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    
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
async def get_all_reports(
    x_admin_email: str = Header(...),
    db: Session = Depends(get_db)
):
    if x_admin_email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    
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
async def get_stats(
    x_admin_email: str = Header(...),
    db: Session = Depends(get_db)
):
    if x_admin_email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Доступ запрещён")
    
    total_users = db.query(User).count()
    total_reports = db.query(Report).count()
    active_users = db.query(User).filter(User.is_active == 1).count()
    return {
        "total_users": total_users,
        "total_reports": total_reports,
        "active_users": active_users,
    }