import os
from cryptography.fernet import Fernet, InvalidToken
from dotenv import load_dotenv

load_dotenv()

ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')

if not ENCRYPTION_KEY:
    # Раньше здесь молча генерировался новый ключ и печатался в логи — при
    # рестарте процесса без ENCRYPTION_KEY в окружении это (а) навсегда
    # теряло доступ ко всем ранее зашифрованным данным (ключ менялся на
    # каждый рестарт) и (б) светило свежесгенерированный ключ в логах
    # хостинга. Лучше падать сразу и явно.
    raise RuntimeError(
        "ENCRYPTION_KEY не задан в .env — сгенерируйте: "
        "`python3 -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"` "
        "и добавьте в .env. Никогда не меняйте его на проде без миграции — "
        "иначе все ранее сохранённые отчёты станут нерасшифровываемыми."
    )

cipher = Fernet(ENCRYPTION_KEY.encode())

def encrypt_data(data: str) -> str:
    if not data:
        return ""
    return cipher.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str) -> str:
    if not encrypted_data:
        return ""
    try:
        return cipher.decrypt(encrypted_data.encode()).decode()
    except InvalidToken:
        return encrypted_data
