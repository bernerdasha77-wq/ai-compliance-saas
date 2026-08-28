# ============================================
# ТАРИФНАЯ ЛОГИКА: лимит бесплатных проверок + урезание деталей превью
# ============================================
# Модель:
#   - 'free' план: 3 проверки всего на пользователя (не в сутки — навсегда).
#     1-я проверка — полный отчёт (это "вау-момент", чтобы показать качество
#     сервиса). 2-я и 3-я — превью: score и список рисков видны, но детали
#     (статья закона, описание, рекомендация, готовая формулировка) скрыты.
#     После 3-й — эндпоинт отказывает с 402 и вернуться можно только оплатой.
#   - 'basic'/'pro' план: подписка на период в 30 дней (plan_expires_at),
#     с лимитом проверок за период (PLAN_LIMITS), всегда полный отчёт, пока
#     подписка активна и лимит периода не исчерпан. Оформляется через
#     ЮKassa — см. services/payments.py.
#   - one_time_credits: разовые покупки полного отчёта, не привязаны к
#     подписке и не сгорают по времени — расходуются по одному.
#   - 'paid' план: legacy ручной безлимитный грант (до появления оплаты
#     через ЮKassa план проставлялся только напрямую в БД).
#
# Порядок списания одной проверки (см. consume_check): сначала активная
# подписка (уже оплачена, ограничена по времени — не должна "простаивать"),
# потом разовые кредиты, и только потом — бесплатные попытки.

from datetime import datetime

FREE_CHECKS_LIMIT = 3
PLAN_LIMITS = {"basic": 5, "pro": 15}

# Та же почта, что используется для доступа к /admin (main.py) и в сайдбаре
# фронтенда (Sidebar.tsx) — админ всегда безлимитный и с полным отчётом,
# без покупки тарифа.
ADMIN_EMAIL = "bernerdasha@yandex.ru"

# Поля нарушения, которые скрываются в урезанном (превью) отчёте.
TEASER_HIDDEN_FIELDS = ["article", "description", "quote", "recommendation", "suggested_wording"]


def _is_admin(user) -> bool:
    return user.email == ADMIN_EMAIL


def is_first_free_check(user) -> bool:
    return user.plan != "paid" and user.free_checks_used == 0


def _subscription_active(user) -> bool:
    return (
        user.plan in PLAN_LIMITS
        and user.plan_expires_at is not None
        and user.plan_expires_at > datetime.utcnow()
        and user.period_checks_used < PLAN_LIMITS[user.plan]
    )


def checks_remaining(user) -> int | None:
    """None означает 'без лимита' (legacy 'paid' план или админ)."""
    if _is_admin(user) or user.plan == "paid":
        return None
    if _subscription_active(user):
        return max(0, PLAN_LIMITS[user.plan] - user.period_checks_used)
    if user.one_time_credits > 0:
        return user.one_time_credits
    return max(0, FREE_CHECKS_LIMIT - user.free_checks_used)


def can_run_check(user) -> bool:
    if _is_admin(user) or user.plan == "paid":
        return True
    if _subscription_active(user):
        return True
    if user.one_time_credits > 0:
        return True
    return user.free_checks_used < FREE_CHECKS_LIMIT


def consume_check(user) -> None:
    """Списывает одну проверку из подходящего "кармана" пользователя —
    вызывается один раз после успешно проведённого анализа."""
    if _is_admin(user) or user.plan == "paid":
        return
    if _subscription_active(user):
        user.period_checks_used += 1
    elif user.one_time_credits > 0:
        user.one_time_credits -= 1
    else:
        user.free_checks_used += 1


def should_return_full_report(user) -> bool:
    """Полный отчёт: legacy 'paid' — всегда; активная подписка с неисчерпанным
    лимитом периода — всегда; есть разовый кредит — всегда; иначе (free) —
    только на первой из трёх бесплатных проверок."""
    if _is_admin(user) or user.plan == "paid":
        return True
    if _subscription_active(user):
        return True
    if user.one_time_credits > 0:
        return True
    return is_first_free_check(user)


def strip_violation_details(analysis: dict) -> dict:
    """Возвращает урезанную копию анализа для превью-отчёта: score и
    сводка по стандартам остаются как есть (это то, что должно "зацепить"
    пользователя), а по каждому нарушению остаётся только уровень риска,
    стандарт и заголовок — конкретика скрыта за оплатой."""
    stripped = dict(analysis)

    stripped_violations = []
    for v in analysis.get("violations", []):
        sv = {
            "id": v.get("id"),
            "risk_level": v.get("risk_level"),
            "standard": v.get("standard"),
            "title": v.get("title"),
            "locked": True,
        }
        for field in TEASER_HIDDEN_FIELDS:
            sv[field] = None
        stripped_violations.append(sv)

    stripped["violations"] = stripped_violations
    stripped["action_checklist"] = []  # чек-лист действий — тоже часть платной ценности
    stripped["is_full_report"] = False
    return stripped
