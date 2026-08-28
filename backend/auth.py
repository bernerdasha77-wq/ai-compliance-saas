
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt
from dotenv import load_dotenv
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db, User
import hashlib
import os

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY не задан в .env — сгенерируйте случайную строку (например, "
        "`python3 -c \"import secrets; print(secrets.token_urlsafe(32))\"`) и добавьте "
        "в .env. Без этого JWT-токены подписывались бы известным всем значением."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

security = HTTPBearer()

# bcrypt (напрямую, без passlib — passlib 1.7.4 не обновлялась с 2020 и не
# совместима с bcrypt 4+, там свой сломанный self-test при инициализации).
# Пароли новых пользователей и всех, кто перелогинится, хешируются bcrypt;
# старые пароли (до этого фикса) были на голом SHA-256 без соли —
# verify_password распознаёт старый формат по длине/алфавиту и один раз
# перехеширует в bcrypt прямо при следующем успешном логине (см. main.py:
# login_user), так что никто не вылетает из аккаунта.
# bcrypt поддерживает пароль не длиннее 72 байт — обрезаем на входе, как
# рекомендует сама библиотека, вместо падения на длинных паролях.
BCRYPT_MAX_BYTES = 72


def get_password_hash(password: str) -> str:
    pw_bytes = password.encode("utf-8")[:BCRYPT_MAX_BYTES]
    return bcrypt.hashpw(pw_bytes, bcrypt.gensalt()).decode("utf-8")


def _is_legacy_sha256_hash(hashed_password: str) -> bool:
    return len(hashed_password) == 64 and all(c in "0123456789abcdef" for c in hashed_password.lower())


def needs_rehash(hashed_password: str) -> bool:
    return _is_legacy_sha256_hash(hashed_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if _is_legacy_sha256_hash(hashed_password):
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
    try:
        pw_bytes = plain_password.encode("utf-8")[:BCRYPT_MAX_BYTES]
        return bcrypt.checkpw(pw_bytes, hashed_password.encode("utf-8"))
    except ValueError:
        return False

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

# =========================================================
# ИСПРАВЛЕННАЯ ФУНКЦИЯ — ПРИНИМАЕТ HTTPAuthorizationCredentials
# =========================================================
async def get_user_from_token(credentials: HTTPAuthorizationCredentials, db: Session):
    """
    Получает пользователя из объекта HTTPAuthorizationCredentials.
    """
    token = credentials.credentials  # Извлекаем строку токена
    payload = decode_access_token(token)
    if not payload:
        return None
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        return None
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    return user

# =========================================================
# СТАРАЯ ВЕРСИЯ (ОСТАВЛЯЕМ ДЛЯ СОВМЕСТИМОСТИ)
# =========================================================
async def get_current_user(
    token: str = Depends(security),
    db: Session = Depends(get_db)
):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный или просроченный токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный формат токена",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный ID пользователя",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь не найден",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user
