import { scoreColor } from '../../lib/types';

export default function ProgressBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const { text, bar } = scoreColor(clamped);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-ink-700">{label}</span>
        <span className={`text-sm font-semibold ${text}`}>{clamped}%</span>
      </div>
      <div className="h-2 rounded-pill bg-ink-100 overflow-hidden">
        <div
          className={`h-full rounded-pill ${bar} transition-all duration-500`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
