import majors from '@/data/majors.json';
import {
  ExtractedData,
  MajorAlignmentReport,
  MajorRequirementStatus,
  ManualInputState,
} from '@/types/medsky';

interface MajorCatalogEntry {
  university: string;
  major: string;
  required: string[];
  recommended?: string[];
  notes?: string;
}

const catalog = (majors as MajorCatalogEntry[]) || [];

function collectSubjects(extractedData?: ExtractedData): Set<string> {
  const subjects = new Set<string>();
  extractedData?.academicDevelopments?.교과학습발달상황?.forEach((item) => {
    if (item.과목) subjects.add(item.과목.replace(/\s+/g, ''));
  });
  extractedData?.detailedAbilities?.세부특기사항?.forEach((item) => {
    if (item.과목) subjects.add(item.과목.replace(/\s+/g, ''));
  });
  return subjects;
}

function normalizeSubject(subject: string): string {
  return subject.replace(/\s+/g, '');
}

export function buildMajorAlignment(
  extractedData?: ExtractedData,
  manualInputs?: ManualInputState
): MajorAlignmentReport {
  const subjectSet = collectSubjects(extractedData);
  const targetUniversity = manualInputs?.targetUniversity || '기본';
  const targetMajor = manualInputs?.targetMajor || catalog[0]?.major || '일반';

  const catalogEntry = catalog.find(
    (entry) =>
      entry.major === targetMajor && (manualInputs?.targetUniversity ? entry.university === targetUniversity : true)
  );

  const requirements: MajorRequirementStatus[] = [];

  if (catalogEntry) {
    catalogEntry.required.forEach((subject) => {
      const normalized = normalizeSubject(subject);
      const fulfilled = subjectSet.has(normalized);
      requirements.push({
        subject,
        category: 'required',
        fulfilled,
        notes: fulfilled ? undefined : '필수 과목 이수 필요',
      });
    });

    catalogEntry.recommended?.forEach((subject) => {
      const normalized = normalizeSubject(subject);
      const fulfilled = subjectSet.has(normalized);
      requirements.push({
        subject,
        category: 'recommended',
        fulfilled,
        notes: fulfilled ? undefined : '권장 과목 추가 이수 권장',
      });
    });
  }

  const fulfilledCount = requirements.filter((item) => item.fulfilled).length;
  const totalCount = requirements.length;

  const recommendations = requirements
    .filter((item) => !item.fulfilled)
    .map((item) => `${item.subject} (${item.category === 'required' ? '필수' : '권장'}) 이수 권장`);

  return {
    target: {
      university: targetUniversity,
      major: targetMajor,
    },
    requirements,
    fulfilledCount,
    totalCount,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
