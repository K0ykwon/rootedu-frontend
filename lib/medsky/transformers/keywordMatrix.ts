import {
  ExtractedData,
  KeywordEntry,
  KeywordMatrixEntry,
  KeywordOverride,
  ManualInputState,
  TextSections,
  ValidationAnalysis,
  ValidationType,
} from '@/types/medsky';

const STOP_WORDS = new Set([
  '그리고',
  '또한',
  '활동',
  '학생',
  '수업',
  '프로그램',
  '참여',
  '통해',
  '관련',
  '내용',
  '진행',
  '발표',
  '작성',
  '함',
  '있음',
]);

function tokenize(text: string): string[] {
  return text
    .replace(/[^가-힣A-Za-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !STOP_WORDS.has(token));
}

function defaultCompetency(subject: string): string {
  const normalized = subject.replace(/\s+/g, '');
  if (normalized.includes('진로') || normalized.includes('활동')) {
    return '진로역량';
  }
  if (normalized.includes('봉사') || normalized.includes('동아리')) {
    return '공동체역량';
  }
  return '학업역량';
}

function extractKeywordsFromDetailedAbilities(
  extractedData?: ExtractedData
): KeywordMatrixEntry[] {
  if (!extractedData?.detailedAbilities?.세부특기사항) return [];

  return extractedData.detailedAbilities.세부특기사항.map((ability) => {
    const tokens = tokenize(ability.특기사항 || '');
    const keywordCounts = new Map<string, number>();
    tokens.forEach((token) => {
      keywordCounts.set(token, (keywordCounts.get(token) || 0) + 1);
    });

    const entries: KeywordEntry[] = Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, occurrence]) => ({
        term,
        competency: defaultCompetency(ability.과목),
        occurrence,
        references: [
          {
            section: 'detailedAbilities',
            sentence: ability.특기사항,
            competency: defaultCompetency(ability.과목),
          },
        ],
        origin: 'ai',
      }));

    return {
      grade: '1학년',
      subject: ability.과목,
      entries,
    };
  });
}

function applyKeywordOverrides(
  matrix: KeywordMatrixEntry[],
  overrides?: KeywordOverride[]
) {
  if (!overrides || overrides.length === 0) return;

  overrides.forEach((override) => {
    matrix.forEach((entry) => {
      const targetIndex = entry.entries.findIndex((item) => item.term === override.term);
      if (override.action === 'remove' && targetIndex >= 0) {
        entry.entries.splice(targetIndex, 1);
      } else if (override.action === 'update' && targetIndex >= 0) {
        entry.entries[targetIndex] = {
          ...entry.entries[targetIndex],
          competency: override.competency || entry.entries[targetIndex].competency,
          origin: 'consultant',
        };
      } else if (override.action === 'add') {
        entry.entries.push({
          term: override.term,
          competency: override.competency,
          occurrence: 1,
          references: [],
          origin: 'consultant',
        });
      }
    });
  });
}

export function buildKeywordMatrix(
  extractedData?: ExtractedData,
  manualInputs?: ManualInputState
): KeywordMatrixEntry[] {
  const matrix = extractKeywordsFromDetailedAbilities(extractedData);
  applyKeywordOverrides(matrix, manualInputs?.keywordOverrides);
  return matrix;
}
