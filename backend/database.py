from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, JSON, ForeignKey, Boolean, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

# В проде (Render) обязательно SSL. Локально (например, Postgres в Docker без
# настроенного SSL-сертификата) можно отключить через .env: DB_SSL_MODE=disable
DB_SSL_MODE = os.getenv('DB_SSL_MODE', 'require')

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={
        "sslmode": DB_SSL_MODE,
        "connect_timeout": 10,
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'  # ← ЭТО БЫЛО ПРОПУЩЕНО
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    full_name = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Integer, default=1)
    # Тарифная логика: 'free' — 3 проверки всего (1-я полная, 2-я и 3-я — превью
    # без деталей нарушений). 'basic'/'pro' — подписка на период (plan_expires_at),
    # с лимитом проверок за период (period_checks_used, лимит — см.
    # services/access.py:PLAN_LIMITS). 'paid' — legacy ручной безлимитный грант
    # (проставлялся только напрямую в БД, до появления оплаты через ЮKassa).
    # one_time_credits — куплены отдельно от подписки, не сгорают по времени,
    # расходуются по одному за полный отчёт (см. services/payments.py).
    plan = Column(String(20), default='free')
    free_checks_used = Column(Integer, default=0)
    plan_expires_at = Column(DateTime, nullable=True)
    period_checks_used = Column(Integer, default=0)
    one_time_credits = Column(Integer, default=0)

    # Факт согласия при регистрации (см. migrations/005_add_consent_records.sql) —
    # три отдельных чекбокса на форме регистрации (AuthModal.tsx), NULL у
    # пользователей, зарегистрировавшихся до появления этого трекинга.
    consent_personal_data_at = Column(DateTime, nullable=True)
    consent_terms_at = Column(DateTime, nullable=True)
    consent_us_transfer_at = Column(DateTime, nullable=True)

    reports = relationship("Report", back_populates="user")

class Report(Base):
    __tablename__ = 'reports'  # ← ЭТО БЫЛО ПРОПУЩЕНО
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    file_name = Column(String(255))
    file_url = Column(String(500), nullable=True)
    risk_level = Column(String(50))
    status = Column(String(50))
    text_preview = Column(Text)
    analysis_results = Column(JSON)
    checklist = Column(JSON)
    # Полный это отчёт (все детали нарушений) или урезанное превью (2-я/3-я
    # бесплатная проверка) — фиксируется в момент создания, чтобы при повторном
    # открытии отчёта в истории он не "менялся задним числом", если у
    # пользователя позже поменяется тариф.
    is_full_report = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="reports")

class Payment(Base):
    __tablename__ = 'payments'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    yookassa_payment_id = Column(String(64), unique=True, index=True)
    tariff = Column(String(20))  # 'one_time' | 'basic' | 'pro'
    amount_rub = Column(Numeric(10, 2))
    status = Column(String(20), default='pending')  # pending | succeeded | canceled
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)

# Создаём таблицы
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
