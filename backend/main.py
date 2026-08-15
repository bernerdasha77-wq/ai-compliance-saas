 #!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import json
from fastapi.responses import JSONResponse

from services.parser import extract_text_from_file
from services.ai_service import analyze_contract
from database import get_db, Report, User
from encryption_utils import encrypt_data, decrypt_data
from auth import get_password_hash, verify_password, create_access_token, decode_access_token, get_user_from_token, security 

# ============================================
# ВРЕМЕННАЯ ЗАГЛУШКА ДЛЯ АВТОРИЗАЦИИ
# ============================================
async def get_current_user_stub():
    """
    Временная заглушка для авторизации.
    Возвращает тестового пользователя с ID=1.
    """
    return {"id": 1, "email": "test@example.com", "full_name": "Test User"}
# ============================================
# 1. НАСТРОЙКА ПРИЛОЖЕНИЯ
# ============================================
app = FastAPI(title="AI Compliance SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://ai-cmpliance.netlify.app"  # ← ВАШ URL ОТ NETLIFY
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Обработчик OPTIONS-запросов для CORS
@app.options("/{path:path}")
async def options_handler():
    return JSONResponse(
        content={"message": "OK"},
        headers={
            "Access-Control-Allow-Origin": "https://ai-cmpliance.netlify.app",  # ← Ваш точный URL!
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
            "Access-Control-Allow-Credentials": "true",
        },
    )
# ============================================
# 2. МОДЕЛИ ДЛЯ АВТОРИЗАЦИИ
# ============================================
class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

# ============================================
# 3. БАЗОВЫЕ ЭНДПОИНТЫ
# ============================================
#@app.get("/")
a#sync def root():
  #  return {"message": "AI Compliance API is working!"}

@app.get("/health")
async def health():
    return {"status": "ok"}

# ============================================
# 4. РЕГИСТРАЦИЯ И ВХОД
# ============================================
@app.post("/api/register")
async def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    
    # Проверяем, не существует ли пользователь
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )
    
    # Создаём пользователя
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Создаём токен
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
    """Вход пользователя"""
    
    # Ищем пользователя
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    
    # Проверяем пароль
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )
    
    # Создаём токен
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
# 5. ПОЛУЧЕНИЕ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
# ============================================
def get_current_user(token: str, db: Session):
    """Получает текущего пользователя по токену (временная заглушка)"""
    # Пока просто возвращаем первого пользователя
# ПОТОМ ЗАМЕНИМ НА РЕАЛЬНУЮ ПРОВЕРКУ ТОКЕНА
    user = db.query(User).first()
    if not user:
        user = User(email="test@example.com", hashed_password="temp", full_name="Test")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# ============================================
# 6. АНАЛИЗ ДОГОВОРА (С СОХРАНЕНИЕМ В БД)
# ============================================
@app.post("/api/analyze", response_model=None)
async def analyze_contract_endpoint(
    file: UploadFile = File(...),
    company_name: str = "Test Company",
    db = Depends(get_db),
    token: str = Depends(security)  # ← Извлекаем токен из заголовка
):
    """Анализирует загруженный договор (с авторизацией через токен)"""
    
    # 1. Проверяем токен и получаем пользователя
    user = await get_user_from_token(token, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный или просроченный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 2. Проверяем файл
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Поддерживаются только PDF и DOCX")
    
    try:
        # 3. Извлекаем текст
        text = await extract_text_from_file(file)
        
        # 4. Отправляем в AI
        analysis = await analyze_contract(text)
        
        # 5. Формируем чек-лист
        checklist = {}
        if analysis.get('rules'):
            for rule in analysis['rules']:
                name = rule.get('name', '')
                status_text = rule.get('status', '')
                checklist[name] = '🟢' in status_text or 'Соответствует' in status_text
        
        # 6. Определяем уровень риска
        total = len(checklist) if checklist else 1
        passed = sum(1 for v in checklist.values() if v)
        risk_ratio = passed / total if total > 0 else 0
        
        if risk_ratio == 1.0:
            risk_level = "low"
        elif risk_ratio >= 0.6:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        # 7. Сохраняем отчёт (привязываем к пользователю из токена!)
        report = Report(
            user_id=user.id,  # ← ТЕПЕРЬ РЕАЛЬНЫЙ ПОЛЬЗОВАТЕЛЬ ИЗ ТОКЕНА
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
        
        # 8. Возвращаем результат
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
# 7. ПОЛУЧЕНИЕ ОТЧЁТОВ
# ============================================
@app.get("/api/reports/{report_id}")
async def get_report(report_id: int, db: Session = Depends(get_db)):
    """Получить отчёт по ID (с расшифровкой)"""
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
    """Получить все отчёты пользователя"""
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

# ============================================
# 8. ТЕСТОВЫЙ ЭНДПОИНТ (ПРОВЕРКА БД)
# ============================================
@app.get("/api/users")
async def get_users(db: Session = Depends(get_db)):
    """Получить всех пользователей (для теста)"""
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "created_at": u.created_at.isoformat()
        }
        for u in users
    ]
