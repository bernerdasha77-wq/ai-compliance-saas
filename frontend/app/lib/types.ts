export type RiskLevel = 'high' | 'medium' | 'low';

export interface Violation {
  id: number;
  risk_level: RiskLevel;
  standard: string;
  article: string | null;
  title: string;
  description: string | null;
  quote: string | null;
  recommendation: string | null;
  suggested_wording: string[] | null;
  /** true для урезанного (превью) отчёта — деталь скрыта за оплатой */
  locked?: boolean;
}

export interface StandardScore {
  name: string;
  score: number;
}

export interface AnalysisResult {
  score: number;
  risk_label: string;
  standards: StandardScore[];
  violations: Violation[];
  action_checklist: string[];
  is_full_report?: boolean;
  error?: string;
}

export const RISK_CONFIG: Record<RiskLevel, { label: string; text: string; bg: string; border: string; dot: string }> = {
  high: {
    label: 'Высокий',
    text: 'text-risk-high',
    bg: 'bg-risk-high-bg',
    border: 'border-risk-high-border',
    dot: 'bg-risk-high',
  },
  medium: {
    label: 'Средний',
    text: 'text-risk-medium',
    bg: 'bg-risk-medium-bg',
    border: 'border-risk-medium-border',
    dot: 'bg-risk-medium',
  },
  low: {
    label: 'Низкий',
    text: 'text-risk-low',
    bg: 'bg-risk-low-bg',
    border: 'border-risk-low-border',
    dot: 'bg-risk-low',
  },
};

/** Цвет по числовому score (0-100) — используется в прогресс-барах и гейдже,
 * пороги совпадают с тем, как backend считает risk_label (services/scoring.py). */
export function scoreColor(score: number): { text: string; bar: string } {
  if (score >= 80) return { text: 'text-risk-low', bar: 'bg-risk-low' };
  if (score >= 50) return { text: 'text-risk-medium', bar: 'bg-risk-medium' };
  return { text: 'text-risk-high', bar: 'bg-risk-high' };
}
