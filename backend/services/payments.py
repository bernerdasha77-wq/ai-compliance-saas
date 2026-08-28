# ============================================
# ОПЛАТА ЧЕРЕЗ ЮKASSA
# ============================================
# Цена и лимиты каждого тарифа — только здесь (TARIFFS), сервер никогда не
# доверяет сумме от клиента: фронт присылает только ключ тарифа.
#
# Проверка платежа через вебхук устроена так: ЮKassa не подписывает тело
# уведомления секретом (в отличие от Stripe), поэтому по payment.id из
# уведомления мы переспрашиваем Payment.find_one() у самой ЮKassa (под своим
# secret_key) и применяем решение только по этому серверному ответу —
# никогда не доверяем статусу из тела вебхука напрямую.

import os
from datetime import datetime, timedelta

from yookassa import Configuration, Payment as YKPayment

from database import SessionLocal, Payment, User

Configuration.account_id = os.getenv("YOOKASSA_SHOP_ID")
Configuration.secret_key = os.getenv("YOOKASSA_SECRET_KEY")

SUBSCRIPTION_PERIOD_DAYS = 30

TARIFFS = {
    "one_time": {"label": "Разовый отчёт", "amount": "1500.00", "kind": "one_time"},
    "basic": {"label": "Базовая подписка", "amount": "2500.00", "kind": "subscription", "checks_per_period": 5},
    "pro": {"label": "Pro подписка", "amount": "5000.00", "kind": "subscription", "checks_per_period": 15},
}


def create_payment(user: User, tariff: str, return_url: str) -> dict:
    """Создаёт платёж в ЮKassa и локальную запись со статусом 'pending'.
    Ничего не начисляет — начисление происходит только в apply_payment(),
    после того как ЮKassa подтвердит реальную оплату через вебхук."""
    if tariff not in TARIFFS:
        raise ValueError(f"Неизвестный тариф: {tariff}")

    config = TARIFFS[tariff]

    yk_payment = YKPayment.create({
        "amount": {"value": config["amount"], "currency": "RUB"},
        "confirmation": {"type": "redirect", "return_url": return_url},
        "capture": True,
        "description": f"{config['label']} — AI Compliance Checker",
        "metadata": {"user_id": str(user.id), "tariff": tariff},
    })

    db = SessionLocal()
    try:
        payment = Payment(
            user_id=user.id,
            yookassa_payment_id=yk_payment.id,
            tariff=tariff,
            amount_rub=config["amount"],
            status="pending",
        )
        db.add(payment)
        db.commit()
    finally:
        db.close()

    return {"confirmation_url": yk_payment.confirmation.confirmation_url, "payment_id": yk_payment.id}


def apply_payment(yookassa_payment_id: str) -> None:
    """Идемпотентно применяет результат оплаты — безопасно вызывать
    повторно для одного и того же payment_id (ЮKassa может прислать
    уведомление больше одного раза)."""
    db = SessionLocal()
    try:
        payment = db.query(Payment).filter(Payment.yookassa_payment_id == yookassa_payment_id).first()
        if not payment:
            print(f"[payments] webhook по неизвестному payment_id={yookassa_payment_id}, игнорирую")
            return
        if payment.status == "succeeded":
            return  # уже применено, повторное уведомление — не начисляем дважды

        yk_payment = YKPayment.find_one(yookassa_payment_id)
        if yk_payment.status != "succeeded":
            payment.status = yk_payment.status
            db.commit()
            return

        user = db.query(User).filter(User.id == payment.user_id).first()
        if not user:
            print(f"[payments] payment_id={yookassa_payment_id} ссылается на несуществующего пользователя")
            return

        config = TARIFFS[payment.tariff]
        if config["kind"] == "one_time":
            user.one_time_credits += 1
        else:
            user.plan = payment.tariff
            user.plan_expires_at = datetime.utcnow() + timedelta(days=SUBSCRIPTION_PERIOD_DAYS)
            user.period_checks_used = 0

        payment.status = "succeeded"
        payment.paid_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()
