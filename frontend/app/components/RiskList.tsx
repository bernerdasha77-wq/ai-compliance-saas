import RiskItem from './RiskItem';
import Card from './ui/Card';
import { Violation, RiskLevel } from '../lib/types';

const ORDER: Record<RiskLevel, number> = { high: 0, medium: 1, low: 2 };

export default function RiskList({ violations }: { violations: Violation[] }) {
  if (violations.length === 0) {
    return (
      <Card className="p-6 flex items-center gap-3">
        <span className="w-2 h-2 rounded-full bg-risk-low shrink-0" />
        <p className="text-sm text-ink-700">
          Нарушений не обнаружено по проверенным пунктам.
        </p>
      </Card>
    );
  }

  const sorted = [...violations].sort((a, b) => ORDER[a.risk_level] - ORDER[b.risk_level]);

  return (
    <div className="space-y-3">
      {sorted.map((v) => (
        <RiskItem key={v.id} violation={v} />
      ))}
    </div>
  );
}
