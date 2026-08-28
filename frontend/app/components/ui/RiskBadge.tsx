import { RiskLevel, RISK_CONFIG } from '../../lib/types';

export default function RiskBadge({ level }: { level: RiskLevel }) {
  const config = RISK_CONFIG[level] ?? RISK_CONFIG.medium;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label} риск
    </span>
  );
}
