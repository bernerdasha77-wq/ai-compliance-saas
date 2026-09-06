import Link from 'next/link';
import Card from './ui/Card';

export type AccountStatus =
  | { kind: 'admin' }
  | { kind: 'unlimited' }
  | { kind: 'subscription'; plan: string; checks_used: number; checks_limit: number; expires_at: string }
  | { kind: 'one_time'; credits: number }
  | { kind: 'free'; checks_used: number; checks_limit: number };

const PLAN_NAMES: Record<string, string> = { basic: 'Базовая подписка', pro: 'Pro подписка' };

export function AccountStatusCard({ account }: { account: AccountStatus }) {
  if (account.kind === 'admin') {
    return (
      <Card className="p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-medium text-ink-900">Админ-доступ</p>
        <span className="text-xs text-ink-500">Без ограничений</span>
      </Card>
    );
  }

  if (account.kind === 'unlimited') {
    return (
      <Card className="p-4 mb-6">
        <p className="text-sm font-medium text-ink-900">Безлимитный доступ</p>
      </Card>
    );
  }

  if (account.kind === 'subscription') {
    const expiresDate = new Date(account.expires_at);
    const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const expiringSoon = daysLeft <= 5;
    return (
      <Card className={`p-4 mb-6 flex items-center justify-between gap-4 flex-wrap ${expiringSoon ? 'border-risk-medium-border bg-risk-medium-bg' : ''}`}>
        <div>
          <p className="text-sm font-medium text-ink-900">{PLAN_NAMES[account.plan] || account.plan}</p>
          <p className="text-xs text-ink-500">
            Осталось {Math.max(0, account.checks_limit - account.checks_used)} из {account.checks_limit} проверок ·
            действует до {expiresDate.toLocaleDateString('ru-RU')}
            {expiringSoon && ' — скоро закончится, автопродления нет'}
          </p>
        </div>
        <Link href="/pricing" className="text-sm font-medium text-brand hover:text-brand-hover transition whitespace-nowrap">
          Продлить →
        </Link>
      </Card>
    );
  }

  if (account.kind === 'one_time') {
    return (
      <Card className="p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm font-medium text-ink-900">Доступен разовый отчёт: {account.credits}</p>
        <Link href="/pricing" className="text-sm font-medium text-brand hover:text-brand-hover transition">
          Все тарифы →
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm font-medium text-ink-900">Бесплатный тариф</p>
        <p className="text-xs text-ink-500">
          Осталось {Math.max(0, account.checks_limit - account.checks_used)} из {account.checks_limit} проверок
        </p>
      </div>
      <Link href="/pricing" className="text-sm font-medium text-brand hover:text-brand-hover transition">
        Тарифы →
      </Link>
    </Card>
  );
}
