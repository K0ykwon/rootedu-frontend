import { ExtractedData, GradeTrendPoint, GradeTrendReport, GradeTrendSeries, AcademicDevelopment } from '@/types/medsky';

const CORE_SUBJECTS = ['국어', '수학', '영어'];
const CORE_WITH_SOCIAL = [...CORE_SUBJECTS, '통합사회', '사회', '한국사'];

function parseScorePair(value?: string): { score?: number; average?: number } {
  if (!value) return {};
  const [rawScore, rest] = value.split('/');
  const score = parseFloat(rawScore.replace(/[^0-9.-]/g, ''));
  const avgMatch = rest?.match(/([0-9]+(?:\.[0-9]+)?)/);
  const average = avgMatch ? parseFloat(avgMatch[1]) : undefined;
  return {
    score: Number.isFinite(score) ? score : undefined,
    average: Number.isFinite(average ?? NaN) ? average : undefined,
  };
}

function ensureSemester(entry: AcademicDevelopment, index: number, total: number): string {
  if (entry.학기 && entry.학기.trim()) {
    return entry.학기.trim();
  }
  if (total <= 1) return '전체';
  const halfway = Math.ceil(total / 2);
  return index < halfway ? '1학기' : '2학기';
}

function aggregateSeries(
  label: string,
  entries: Array<{ semester: string; score?: number; average?: number }>,
  availableSemesters: string[],
  notes?: string
): GradeTrendSeries {
  const points: GradeTrendPoint[] = availableSemesters.map((semester) => {
    const filtered = entries.filter((item) => item.semester === semester);
    if (filtered.length === 0) {
      return { semester, score: null, average: null, delta: null };
    }
    const scoreSum = filtered.reduce((sum, item) => sum + (item.score ?? 0), 0);
    const averageSum = filtered.reduce((sum, item) => sum + (item.average ?? 0), 0);
    const scoreCount = filtered.filter((item) => item.score !== undefined).length;
    const averageCount = filtered.filter((item) => item.average !== undefined).length;
    const score = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : null;
    const average = averageCount > 0 ? Math.round((averageSum / averageCount) * 10) / 10 : null;
    const delta = score !== null && average !== null ? Math.round((score - average) * 10) / 10 : null;
    return { semester, score, average, delta };
  });

  return {
    id: label,
    name: label,
    points,
    notes,
  };
}

export function buildGradeTrendReport(
  extractedData?: ExtractedData
): GradeTrendReport | undefined {
  const academicDevelopments = extractedData?.academicDevelopments?.교과학습발달상황;
  if (!academicDevelopments || academicDevelopments.length === 0) {
    return undefined;
  }

  const enriched = academicDevelopments.map((entry, index) => {
    const semester = ensureSemester(entry, index, academicDevelopments.length);
    const { score, average } = parseScorePair(entry.score_over_average);
    return {
      semester,
      subject: entry.과목,
      score,
      average,
    };
  });

  const availableSemesters = Array.from(
    new Set(enriched.map((item) => item.semester || '전체'))
  );

  const overallSeries = aggregateSeries('전체 과목', enriched, availableSemesters);

  const coreSeries = aggregateSeries(
    '국영수',
    enriched.filter((item) => CORE_SUBJECTS.includes(item.subject.replace(/\s+/g, ''))),
    availableSemesters,
    '국어, 영어, 수학 평균'
  );

  const coreWithSoc = aggregateSeries(
    '국영수사',
    enriched.filter((item) => CORE_WITH_SOCIAL.includes(item.subject.replace(/\s+/g, ''))),
    availableSemesters,
    '국어, 영어, 수학, 사회 계열 평균'
  );

  const series = [overallSeries];
  if (coreSeries.points.some((point) => point.score !== null)) {
    series.push(coreSeries);
  }
  if (coreWithSoc.points.some((point) => point.score !== null)) {
    series.push(coreWithSoc);
  }

  return {
    series,
    availableSemesters,
    generatedAt: new Date().toISOString(),
  };
}
