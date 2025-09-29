import { CompetencyScore, CompetencyScorePayload, ManualInputState, ValidationAnalysis, ValidationType } from '@/types/medsky';

const DEFAULT_DISTRIBUTION = {
  mean: 65,
  stdDev: 12,
  label: '기본 분포',
};

type CompetencyKey = '학업역량' | '진로역량' | '공동체역량';

const CATEGORY_COMPETENCY_MAP: Record<CompetencyKey, ValidationType[]> = {
  학업역량: ['red_line'],
  진로역량: ['blue_highlight'],
  공동체역량: ['blue_line'],
};

const NEGATIVE_WEIGHTS: Partial<Record<ValidationType, number>> = {
  black_line: 8,
  red_check: 12,
};

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function computeAutoScore(
  competency: CompetencyKey,
  validationAnalysis: ValidationAnalysis
): number {
  const categories = CATEGORY_COMPETENCY_MAP[competency];
  const positive = categories.reduce((sum, type) => sum + (validationAnalysis[type]?.Feedbacks.length ?? 0), 0);
  const negatives = Object.entries(NEGATIVE_WEIGHTS).reduce((sum, [type, weight]) => {
    return sum + ((validationAnalysis[type as ValidationType]?.Feedbacks.length ?? 0) * (weight ?? 0));
  }, 0);

  const raw = 55 + positive * 6 - negatives;
  return clampScore(raw);
}

function computeNormalized(score?: number | null) {
  if (score === undefined || score === null) {
    return undefined;
  }
  const zScore = (score - DEFAULT_DISTRIBUTION.mean) / DEFAULT_DISTRIBUTION.stdDev;
  const percentile = Math.max(0, Math.min(100, Math.round(50 + zScore * 15)));
  return {
    zScore: Math.round(zScore * 100) / 100,
    percentile,
  };
}

function findManualInput(
  competency: string,
  manualInputs?: ManualInputState
): { score?: number; notes?: string } | undefined {
  if (!manualInputs?.competencyInputs) return undefined;
  const match = manualInputs.competencyInputs.find((input) => input.competency === competency);
  if (!match) return undefined;
  return {
    score: match.score,
    notes: match.notes,
  };
}

export function buildCompetencyScores(
  validationAnalysis: ValidationAnalysis,
  manualInputs?: ManualInputState
): CompetencyScorePayload {
  const now = new Date().toISOString();

  const competencyOrder: CompetencyKey[] = ['학업역량', '진로역량', '공동체역량'];

  const scores: CompetencyScore[] = competencyOrder.map((competency) => {
    const autoScore = computeAutoScore(competency, validationAnalysis);
    const manual = findManualInput(competency, manualInputs);
    const preferredScore = manual?.score ?? autoScore;
    return {
      competency,
      label: competency,
      autoScore,
      manualScore: manual?.score,
      normalized: computeNormalized(preferredScore),
      notes: manual?.notes,
      lastUpdatedAt: now,
    };
  });

  const hasManual = manualInputs?.competencyInputs?.length;

  return {
    scores,
    distribution: DEFAULT_DISTRIBUTION,
    updatedAt: now,
    source: hasManual ? 'mixed' : 'auto',
  };
}
