import Card from './ui/Card';
import ScoreGauge from './ui/ScoreGauge';
import ProgressBar from './ui/ProgressBar';
import { scoreColor, StandardScore } from '../lib/types';

export default function ScoreSummary({
  score,
  riskLabel,
  standards,
}: {
  score: number;
  riskLabel: string;
  standards: StandardScore[];
}) {
  const { text } = scoreColor(score);

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-10">
        <div className="flex flex-col items-center sm:items-start gap-3 shrink-0">
          <ScoreGauge score={score} />
          <div className="text-center sm:text-left">
            <p className="text-xs text-ink-500 font-medium uppercase tracking-wide">Общий риск</p>
            <p className={`text-lg font-semibold capitalize ${text}`}>{riskLabel}</p>
          </div>
        </div>

        {standards.length > 0 && (
          <div className="flex-1 flex flex-col justify-center gap-4 min-w-0">
            <p className="text-sm font-medium text-ink-700">Соответствие по стандартам</p>
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
              {standards.map((std) => (
                <ProgressBar key={std.name} label={std.name} value={std.score} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
