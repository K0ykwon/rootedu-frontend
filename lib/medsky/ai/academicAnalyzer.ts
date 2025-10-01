/**
 * Enhanced Academic Analysis Service
 *
 * This service provides comprehensive analysis of academic performance using the full
 * AcademicDevelopmentSchema including 석차등급 (rank grades), 성취도 (achievement levels),
 * and detailed trend analysis for better understanding of student's academic progression.
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { ExtractedData, AcademicDevelopment } from '@/types/medsky';
import {
  EnhancedAcademicAnalysisSchema,
  EnhancedAcademicAnalysis,
  EnhancedAcademicAnalysisSchemaV2,
  EnhancedAcademicAnalysisV2,
  GradeLevel,
  SemesterNumber
} from '@/types/medsky-enhanced';
import { createLLMConfig } from '../llmService';

// Zod schemas for structured outputs
const SubjectAnalysisResponseSchema = z.object({
  subject: z.string(),
  semester: z.string(),
  performance_trend: z.enum(["상승", "하락", "유지", "불안정"]),
  grade_analysis: z.object({
    raw_score: z.string(),
    achievement_level: z.string(),
    rank_grade: z.string(),
    relative_position: z.enum(["상위권", "중상위권", "중위권", "중하위권", "하위권"])
  }),
  strengths: z.array(z.string()),
  improvements_needed: z.array(z.string()),
  college_readiness: z.number()
});

const CollegeReadinessResponseSchema = z.object({
  recommendations: z.array(z.string())
});

// Academic analysis system prompt
const ACADEMIC_ANALYSIS_PROMPT = `
당신은 한국의 고등학교 학업 성취도 전문 분석가입니다. 생활기록부의 교과학습발달상황 데이터를 종합적으로 분석하여 학생의 학업 역량과 대학 진학 준비도를 평가해야 합니다.

**분석 항목:**

1. **과목별 상세 분석**:
   - 원점수/과목평균: 절대적/상대적 성취도 분석
   - 성취도 (A,B,C,D,E): 학습 목표 달성 수준
   - 석차등급 (1-9등급): 상대적 위치와 경쟁력
   - 성취 추세: 학기별 향상/하락/유지 패턴

2. **상대적 위치 분석**:
   - 1-2등급: 상위권 (상위 11%)
   - 3-4등급: 중상위권 (상위 12-34%)
   - 5-6등급: 중위권 (상위 35-66%)
   - 7-8등급: 중하위권 (상위 67-89%)
   - 9등급: 하위권 (하위 11%)

3. **대학 진학 준비도**:
   - 주요 과목 경쟁력 (국어, 수학, 영어, 탐구)
   - 목표 대학/전공 적합성
   - 수능/학종 대비 현황

**평가 기준:**
- 절대 점수보다 상대적 위치와 개선 추세 중시
- 과목 간 균형과 전공 적합성 고려
- 지속적 성장 가능성과 학습 역량 평가

각 과목의 데이터를 종합하여 정확하고 실용적인 분석을 제공해주세요.`;

// ===========================
// Helper Functions for Hierarchical Analysis
// ===========================

/**
 * Parse semester string to extract grade and semester number
 * Examples: "1학년 1학기" → { grade: "1학년", semester: "1학기" }
 *           "2-1" → { grade: "2학년", semester: "1학기" }
 */
function parseGradeAndSemester(semesterStr: string | null): {
  grade: GradeLevel | null;
  semester: SemesterNumber | null;
} {
  if (!semesterStr) return { grade: null, semester: null };

  // Pattern 1: "1학년 1학기", "2학년 2학기", etc.
  const pattern1 = /([1-3])학년\s*([1-2])학기/;
  const match1 = semesterStr.match(pattern1);
  if (match1) {
    return {
      grade: `${match1[1]}학년` as GradeLevel,
      semester: `${match1[2]}학기` as SemesterNumber
    };
  }

  // Pattern 2: "1-1", "2-2", "3-1", etc.
  const pattern2 = /([1-3])-([1-2])/;
  const match2 = semesterStr.match(pattern2);
  if (match2) {
    return {
      grade: `${match2[1]}학년` as GradeLevel,
      semester: `${match2[2]}학기` as SemesterNumber
    };
  }

  // Pattern 3: Just grade "1학년", "2학년", etc. - assume first semester
  const pattern3 = /([1-3])학년/;
  const match3 = semesterStr.match(pattern3);
  if (match3) {
    return {
      grade: `${match3[1]}학년` as GradeLevel,
      semester: "1학기"
    };
  }

  return { grade: null, semester: null };
}

/**
 * Group academic data hierarchically by Grade → Semester → Subject
 */
function groupByGradeAndSemester(academicData: AcademicDevelopment[]): Map<
  GradeLevel,
  Map<SemesterNumber, Map<string, AcademicDevelopment[]>>
> {
  const hierarchy = new Map<GradeLevel, Map<SemesterNumber, Map<string, AcademicDevelopment[]>>>();

  for (const data of academicData) {
    const { grade, semester } = parseGradeAndSemester(data.학기);

    // Skip if we can't determine grade or semester
    if (!grade || !semester) continue;

    // Get or create grade map
    if (!hierarchy.has(grade)) {
      hierarchy.set(grade, new Map());
    }
    const gradeMap = hierarchy.get(grade)!;

    // Get or create semester map
    if (!gradeMap.has(semester)) {
      gradeMap.set(semester, new Map());
    }
    const semesterMap = gradeMap.get(semester)!;

    // Get or create subject array
    const subject = data.과목;
    if (!semesterMap.has(subject)) {
      semesterMap.set(subject, []);
    }
    semesterMap.get(subject)!.push(data);
  }

  return hierarchy;
}

/**
 * Analyze performance trend for a subject across semesters
 */
function analyzePerformanceTrend(
  subjectGrades: AcademicDevelopment[]
): '상승' | '하락' | '유지' | '불안정' {
  if (subjectGrades.length <= 1) return '유지';

  // Convert rank grades to numbers for trend analysis
  const rankNumbers = subjectGrades
    .map(grade => {
      const rank = grade.석차등급;
      if (!rank || rank === '-') return null;
      const num = parseInt(rank.replace(/[^\d]/g, ''));
      return isNaN(num) ? null : num;
    })
    .filter(num => num !== null) as number[];

  if (rankNumbers.length <= 1) return '유지';

  const firstHalf = rankNumbers.slice(0, Math.ceil(rankNumbers.length / 2));
  const secondHalf = rankNumbers.slice(Math.floor(rankNumbers.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const difference = firstAvg - secondAvg; // Lower rank number = better performance

  if (difference > 0.5) return '상승'; // Improving (rank getting better)
  if (difference < -0.5) return '하락'; // Declining (rank getting worse)

  // Check for instability (high variance)
  const variance = rankNumbers.reduce((sum, rank) => {
    const avg = rankNumbers.reduce((a, b) => a + b, 0) / rankNumbers.length;
    return sum + Math.pow(rank - avg, 2);
  }, 0) / rankNumbers.length;

  return variance > 4 ? '불안정' : '유지';
}

/**
 * Determine relative position based on rank grade
 */
function getRelativePosition(rankGrade: string): '상위권' | '중상위권' | '중위권' | '중하위권' | '하위권' {
  const rank = parseInt(rankGrade.replace(/[^\d]/g, ''));
  if (isNaN(rank)) return '중위권';

  if (rank <= 2) return '상위권';
  if (rank <= 4) return '중상위권';
  if (rank <= 6) return '중위권';
  if (rank <= 8) return '중하위권';
  return '하위권';
}

/**
 * Calculate college readiness score based on academic data
 */
function calculateCollegeReadiness(subject: AcademicDevelopment[]): number {
  if (subject.length === 0) return 0;

  const latestGrade = subject[subject.length - 1];
  const rankScore = (() => {
    const rank = parseInt(latestGrade.석차등급?.replace(/[^\d]/g, '') || '9');
    return Math.max(0, (10 - rank) * 10); // 1등급=90점, 9등급=10점
  })();

  const achievementScore = (() => {
    const achievement = latestGrade.성취도;
    const scoreMap: Record<string, number> = { 'A': 20, 'B': 15, 'C': 10, 'D': 5, 'E': 0 };
    return scoreMap[achievement] || 10;
  })();

  const trendBonus = (() => {
    const trend = analyzePerformanceTrend(subject);
    return trend === '상승' ? 10 : trend === '하락' ? -10 : 0;
  })();

  return Math.min(100, Math.max(0, rankScore + achievementScore + trendBonus));
}

// ===========================
// Semester-Level Analysis Functions (V2)
// ===========================

/**
 * Analyze a single subject within a specific semester
 */
async function analyzeSemesterSubject(
  subject: string,
  semesterData: AcademicDevelopment[],
  grade: GradeLevel,
  semester: SemesterNumber,
  client: OpenAI
): Promise<import('@/types/medsky-enhanced').SemesterSubjectAnalysis | null> {
  if (semesterData.length === 0) return null;

  const latestGrade = semesterData[semesterData.length - 1];
  const trend = analyzePerformanceTrend(semesterData);
  const relativePosition = getRelativePosition(latestGrade.석차등급 || '5');
  const collegeReadiness = calculateCollegeReadiness(semesterData);

  const analysisPrompt = `
**분석 대상**: ${grade} ${semester} - ${subject} 과목
**학기 내 성적 변화**:
${semesterData.map(g => `
- 원점수/과목평균: ${g.score_over_average}
- 성취도: ${g.성취도}
- 석차등급: ${g.석차등급}
`).join('')}

이 학기 동안 ${subject} 과목의 성적 변화를 분석하여 다음을 제공해주세요:
1. 원점수/평균 분석: 절대적 성취도
2. 성취도 분석: A-E 등급 의미
3. 석차등급 분석: 상대적 위치와 경쟁력
4. 강점 2-3개 (구체적으로)
5. 개선 필요 사항 2-3개 (구체적으로)

**현재 계산된 지표**:
- 학기 내 추세: ${trend}
- 상대적 위치: ${relativePosition}
- 대학 준비도: ${collegeReadiness}점`;

  try {
    const response = await client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: ACADEMIC_ANALYSIS_PROMPT },
        { role: 'user', content: analysisPrompt }
      ],
      response_format: zodResponseFormat(
        z.object({
          raw_score: z.string(),
          achievement_level: z.string(),
          rank_grade: z.string(),
          strengths: z.array(z.string()),
          improvements_needed: z.array(z.string())
        }),
        'semester_subject_analysis'
      ),
      temperature: 0.2,
      max_tokens: 1000
    });

    const parsed = response.choices[0]?.message?.parsed;
    if (!parsed) return null;

    return {
      subject,
      performance_trend: trend,
      grade_analysis: {
        raw_score: parsed.raw_score || `${latestGrade.score_over_average} 분석`,
        achievement_level: parsed.achievement_level || `${latestGrade.성취도}등급`,
        rank_grade: parsed.rank_grade || `${latestGrade.석차등급}`,
        relative_position: relativePosition
      },
      strengths: parsed.strengths || [],
      improvements_needed: parsed.improvements_needed || [],
      college_readiness: collegeReadiness
    };
  } catch (error) {
    console.error(`Error analyzing ${grade} ${semester} ${subject}:`, error);
    return null;
  }
}

/**
 * Analyze all subjects in a specific semester and generate semester summary
 */
async function analyzeSemester(
  grade: GradeLevel,
  semester: SemesterNumber,
  subjectsMap: Map<string, AcademicDevelopment[]>,
  client: OpenAI
): Promise<import('@/types/medsky-enhanced').SemesterAcademicAnalysis | null> {
  const subjects: import('@/types/medsky-enhanced').SemesterSubjectAnalysis[] = [];

  // Analyze each subject in this semester
  for (const [subjectName, semesterData] of subjectsMap.entries()) {
    const analysis = await analyzeSemesterSubject(subjectName, semesterData, grade, semester, client);
    if (analysis) subjects.push(analysis);
  }

  if (subjects.length === 0) return null;

  // Calculate semester-level metrics
  const readinessScores = subjects.map(s => s.college_readiness);
  const averageReadiness = Math.round(
    readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length
  );

  const sortedByReadiness = [...subjects].sort((a, b) => b.college_readiness - a.college_readiness);
  const strongSubjects = sortedByReadiness.slice(0, Math.min(3, Math.ceil(subjects.length / 3)))
    .map(s => s.subject);
  const weakSubjects = sortedByReadiness.slice(-Math.min(3, Math.floor(subjects.length / 3)))
    .map(s => s.subject);

  const trends = subjects.map(s => s.performance_trend);
  const risingCount = trends.filter(t => t === '상승').length;
  const fallingCount = trends.filter(t => t === '하락').length;
  const overallTrend = risingCount > fallingCount ? '상승' : fallingCount > risingCount ? '하락' : '유지';

  return {
    semester,
    subjects,
    semester_summary: {
      average_readiness: averageReadiness,
      strong_subjects: strongSubjects,
      weak_subjects: weakSubjects,
      overall_trend: overallTrend
    }
  };
}

/**
 * Analyze entire grade (both semesters) and generate grade-level insights
 */
async function analyzeGrade(
  grade: GradeLevel,
  semestersMap: Map<SemesterNumber, Map<string, AcademicDevelopment[]>>,
  client: OpenAI
): Promise<import('@/types/medsky-enhanced').GradeAcademicAnalysis | null> {
  const semesters: import('@/types/medsky-enhanced').SemesterAcademicAnalysis[] = [];

  // Analyze each semester
  for (const [semesterNum, subjectsMap] of semestersMap.entries()) {
    const analysis = await analyzeSemester(grade, semesterNum, subjectsMap, client);
    if (analysis) semesters.push(analysis);
  }

  if (semesters.length === 0) return null;

  // Sort semesters chronologically
  semesters.sort((a, b) => {
    const semesterOrder = { "1학기": 1, "2학기": 2 };
    return semesterOrder[a.semester] - semesterOrder[b.semester];
  });

  // Calculate grade-level metrics
  const semesterReadiness = semesters.map(s => s.semester_summary.average_readiness);
  const gradeReadiness = Math.round(
    semesterReadiness.reduce((a, b) => a + b, 0) / semesterReadiness.length
  );

  // Compare semesters if we have both
  let semesterComparison = '단일 학기 데이터만 존재';
  let gradeTrend: '상승' | '하락' | '유지' | '불안정' = '유지';

  if (semesters.length === 2) {
    const first = semesters[0].semester_summary;
    const second = semesters[1].semester_summary;
    const readinessDiff = second.average_readiness - first.average_readiness;

    if (readinessDiff > 5) {
      gradeTrend = '상승';
      semesterComparison = `${grade}에서 1학기 대비 2학기 성적이 ${readinessDiff}점 상승하여 긍정적 발전을 보임`;
    } else if (readinessDiff < -5) {
      gradeTrend = '하락';
      semesterComparison = `${grade}에서 1학기 대비 2학기 성적이 ${Math.abs(readinessDiff)}점 하락하여 주의 필요`;
    } else {
      gradeTrend = '유지';
      semesterComparison = `${grade}에서 1학기와 2학기 성적이 ${Math.abs(readinessDiff)}점 차이로 안정적 유지`;
    }

    // Check for instability (opposing trends in different subjects)
    const firstTrends = first.overall_trend;
    const secondTrends = second.overall_trend;
    if (firstTrends !== secondTrends && firstTrends !== '유지' && secondTrends !== '유지') {
      gradeTrend = '불안정';
      semesterComparison += `. 다만 1학기(${firstTrends})와 2학기(${secondTrends})의 추세가 상이하여 불안정함`;
    }
  }

  // Identify key improvements and concerns
  const allSubjects = new Set<string>();
  semesters.forEach(sem => {
    sem.subjects.forEach(subj => allSubjects.add(subj.subject));
  });

  const keyImprovements: string[] = [];
  const areasOfConcern: string[] = [];

  for (const subject of allSubjects) {
    const subjectInSemesters = semesters.map(sem =>
      sem.subjects.find(s => s.subject === subject)
    ).filter(s => s !== undefined);

    if (subjectInSemesters.length === 2) {
      const [first, second] = subjectInSemesters;
      const improvement = second!.college_readiness - first!.college_readiness;

      if (improvement > 10) {
        keyImprovements.push(`${subject}: ${improvement}점 향상`);
      } else if (improvement < -10) {
        areasOfConcern.push(`${subject}: ${Math.abs(improvement)}점 하락`);
      }
    }
  }

  return {
    grade,
    semesters,
    grade_summary: {
      grade_trend: gradeTrend,
      semester_comparison: semesterComparison,
      key_improvements: keyImprovements.slice(0, 5),
      areas_of_concern: areasOfConcern.slice(0, 5),
      grade_readiness: gradeReadiness
    }
  };
}

/**
 * Analyze multi-year trends across all grades
 */
function analyzeMultiYearTrends(
  grades: import('@/types/medsky-enhanced').GradeAcademicAnalysis[]
): import('@/types/medsky-enhanced').EnhancedAcademicAnalysisV2['multi_year_trends'] {
  if (grades.length === 0) {
    return {
      overall_progression: '안정적 유지',
      cross_grade_strong_subjects: [],
      cross_grade_weak_subjects: [],
      grade_transitions: [],
      consistency_score: 0
    };
  }

  // Sort grades chronologically
  const sortedGrades = [...grades].sort((a, b) => {
    const gradeOrder = { "1학년": 1, "2학년": 2, "3학년": 3 };
    return gradeOrder[a.grade] - gradeOrder[b.grade];
  });

  // Analyze overall progression
  const readinessProgression = sortedGrades.map(g => g.grade_summary.grade_readiness);
  const firstGradeReadiness = readinessProgression[0];
  const lastGradeReadiness = readinessProgression[readinessProgression.length - 1];
  const overallChange = lastGradeReadiness - firstGradeReadiness;

  let overallProgression: '지속적 상승' | '지속적 하락' | '등락' | '안정적 유지';

  if (readinessProgression.length === 1) {
    overallProgression = '안정적 유지';
  } else {
    // Check if consistently rising or falling
    let rising = 0, falling = 0;
    for (let i = 1; i < readinessProgression.length; i++) {
      const diff = readinessProgression[i] - readinessProgression[i - 1];
      if (diff > 3) rising++;
      else if (diff < -3) falling++;
    }

    if (rising > 0 && falling === 0) overallProgression = '지속적 상승';
    else if (falling > 0 && rising === 0) overallProgression = '지속적 하락';
    else if (Math.abs(overallChange) < 5) overallProgression = '안정적 유지';
    else overallProgression = '등락';
  }

  // Identify consistently strong/weak subjects across all grades
  const subjectScores = new Map<string, number[]>();

  for (const grade of sortedGrades) {
    for (const semester of grade.semesters) {
      for (const subject of semester.subjects) {
        if (!subjectScores.has(subject.subject)) {
          subjectScores.set(subject.subject, []);
        }
        subjectScores.get(subject.subject)!.push(subject.college_readiness);
      }
    }
  }

  const subjectAverages = Array.from(subjectScores.entries()).map(([subject, scores]) => ({
    subject,
    average: scores.reduce((a, b) => a + b, 0) / scores.length
  }));

  subjectAverages.sort((a, b) => b.average - a.average);

  const crossGradeStrong = subjectAverages.slice(0, Math.min(3, Math.ceil(subjectAverages.length / 3)))
    .map(s => s.subject);
  const crossGradeWeak = subjectAverages.slice(-Math.min(3, Math.floor(subjectAverages.length / 3)))
    .map(s => s.subject);

  // Analyze grade transitions
  const gradeTransitions: import('@/types/medsky-enhanced').EnhancedAcademicAnalysisV2['multi_year_trends']['grade_transitions'] = [];

  for (let i = 1; i < sortedGrades.length; i++) {
    const fromGrade = sortedGrades[i - 1];
    const toGrade = sortedGrades[i];
    const readinessDiff = toGrade.grade_summary.grade_readiness - fromGrade.grade_summary.grade_readiness;

    let transitionAnalysis: string;
    if (readinessDiff > 10) {
      transitionAnalysis = `${fromGrade.grade}에서 ${toGrade.grade}로 진급하면서 ${readinessDiff}점 상승하여 큰 발전을 보임`;
    } else if (readinessDiff > 5) {
      transitionAnalysis = `${fromGrade.grade}에서 ${toGrade.grade}로 진급하면서 ${readinessDiff}점 상승하여 긍정적 발전`;
    } else if (readinessDiff < -10) {
      transitionAnalysis = `${fromGrade.grade}에서 ${toGrade.grade}로 진급하면서 ${Math.abs(readinessDiff)}점 하락하여 심각한 주의 필요`;
    } else if (readinessDiff < -5) {
      transitionAnalysis = `${fromGrade.grade}에서 ${toGrade.grade}로 진급하면서 ${Math.abs(readinessDiff)}점 하락하여 주의 필요`;
    } else {
      transitionAnalysis = `${fromGrade.grade}에서 ${toGrade.grade}로 안정적 이행 (${Math.abs(readinessDiff)}점 차이)`;
    }

    gradeTransitions.push({
      from_grade: fromGrade.grade,
      to_grade: toGrade.grade,
      transition_analysis: transitionAnalysis
    });
  }

  // Calculate consistency score
  const allReadiness = readinessProgression;
  const avgReadiness = allReadiness.reduce((a, b) => a + b, 0) / allReadiness.length;
  const variance = allReadiness.reduce((sum, val) => sum + Math.pow(val - avgReadiness, 2), 0) / allReadiness.length;
  const consistencyScore = Math.max(0, Math.min(100, 100 - Math.sqrt(variance)));

  return {
    overall_progression: overallProgression,
    cross_grade_strong_subjects: crossGradeStrong,
    cross_grade_weak_subjects: crossGradeWeak,
    grade_transitions: gradeTransitions,
    consistency_score: Math.round(consistencyScore)
  };
}

/**
 * Analyze individual subject trajectories across all grades and semesters
 */
function analyzeSubjectTrajectories(
  grades: import('@/types/medsky-enhanced').GradeAcademicAnalysis[]
): import('@/types/medsky-enhanced').EnhancedAcademicAnalysisV2['subject_trajectories'] {
  const subjectData = new Map<string, {
    performances: Array<{ grade: GradeLevel; semester: SemesterNumber; readiness: number }>;
  }>();

  // Collect all subject performances
  for (const grade of grades) {
    for (const semester of grade.semesters) {
      for (const subject of semester.subjects) {
        if (!subjectData.has(subject.subject)) {
          subjectData.set(subject.subject, { performances: [] });
        }
        subjectData.get(subject.subject)!.performances.push({
          grade: grade.grade,
          semester: semester.semester,
          readiness: subject.college_readiness
        });
      }
    }
  }

  // Analyze each subject's trajectory
  const trajectories: import('@/types/medsky-enhanced').EnhancedAcademicAnalysisV2['subject_trajectories'] = [];

  for (const [subjectName, data] of subjectData.entries()) {
    const performances = data.performances;

    if (performances.length < 2) continue;

    // Sort chronologically
    performances.sort((a, b) => {
      const gradeOrder = { "1학년": 1, "2학년": 2, "3학년": 3 };
      const semesterOrder = { "1학기": 1, "2학기": 2 };

      const gradeDiff = gradeOrder[a.grade] - gradeOrder[b.grade];
      if (gradeDiff !== 0) return gradeDiff;
      return semesterOrder[a.semester] - semesterOrder[b.semester];
    });

    // Analyze progression pattern
    const readinessValues = performances.map(p => p.readiness);
    let rising = 0, falling = 0;

    for (let i = 1; i < readinessValues.length; i++) {
      const diff = readinessValues[i] - readinessValues[i - 1];
      if (diff > 5) rising++;
      else if (diff < -5) falling++;
    }

    let progressionPattern: '지속 향상' | '지속 하락' | '등락' | '안정';
    if (rising > falling && falling === 0) progressionPattern = '지속 향상';
    else if (falling > rising && rising === 0) progressionPattern = '지속 하락';
    else if (rising === 0 && falling === 0) progressionPattern = '안정';
    else progressionPattern = '등락';

    // Generate overall assessment
    const firstReadiness = readinessValues[0];
    const lastReadiness = readinessValues[readinessValues.length - 1];
    const avgReadiness = readinessValues.reduce((a, b) => a + b, 0) / readinessValues.length;
    const change = lastReadiness - firstReadiness;

    let overallAssessment: string;
    if (progressionPattern === '지속 향상') {
      overallAssessment = `${subjectName}은 전 학년에 걸쳐 ${change}점 향상되어 꾸준한 발전을 보이는 강점 과목 (평균 ${Math.round(avgReadiness)}점)`;
    } else if (progressionPattern === '지속 하락') {
      overallAssessment = `${subjectName}은 전 학년에 걸쳐 ${Math.abs(change)}점 하락하여 집중적인 보완이 필요한 과목 (평균 ${Math.round(avgReadiness)}점)`;
    } else if (progressionPattern === '등락') {
      overallAssessment = `${subjectName}은 학기별로 기복이 있어 안정적 학습 전략이 필요 (평균 ${Math.round(avgReadiness)}점, 현재 ${lastReadiness}점)`;
    } else {
      overallAssessment = `${subjectName}은 전 학년에 걸쳐 ${Math.round(avgReadiness)}점 수준으로 안정적 유지`;
    }

    trajectories.push({
      subject: subjectName,
      progression_pattern: progressionPattern,
      grade_performances: performances,
      overall_assessment: overallAssessment
    });
  }

  return trajectories;
}

/**
 * Generate college entrance readiness for V2 hierarchical analysis
 */
function generateCollegeReadinessV2(
  grades: import('@/types/medsky-enhanced').GradeAcademicAnalysis[],
  subjectTrajectories: import('@/types/medsky-enhanced').EnhancedAcademicAnalysisV2['subject_trajectories']
): import('@/types/medsky-enhanced').EnhancedAcademicAnalysisV2['college_entrance_readiness'] {
  // Calculate overall readiness from all grades
  const allReadiness = grades.map(g => g.grade_summary.grade_readiness);
  const overallReadiness = Math.round(
    allReadiness.reduce((a, b) => a + b, 0) / allReadiness.length
  );

  // Readiness by grade
  const readinessByGrade = grades.reduce((acc, grade) => {
    acc[grade.grade] = grade.grade_summary.grade_readiness;
    return acc;
  }, {} as Record<string, number>);

  // Subject readiness (average across all performances)
  const subjectReadiness = subjectTrajectories.reduce((acc, traj) => {
    const avgReadiness = Math.round(
      traj.grade_performances.reduce((sum, p) => sum + p.readiness, 0) / traj.grade_performances.length
    );
    acc[traj.subject] = avgReadiness;
    return acc;
  }, {} as Record<string, number>);

  // Determine competitive position
  const competitivePosition = (() => {
    if (overallReadiness >= 85) return '상위권 대학 (SKY 포함) 진학 가능한 우수한 경쟁력';
    if (overallReadiness >= 75) return '중상위권 대학 (인서울 상위권) 적합한 경쟁력';
    if (overallReadiness >= 65) return '중위권 대학 (인서울) 목표 가능';
    if (overallReadiness >= 50) return '중하위권 대학 고려 필요';
    return '기초 학력 보강 후 재도전 권장';
  })();

  // Generate recommendations
  const recommendations: string[] = [];

  // Check for weak subjects
  const weakSubjects = subjectTrajectories
    .filter(t => t.progression_pattern === '지속 하락' ||
                 (t.progression_pattern === '등락' &&
                  t.grade_performances[t.grade_performances.length - 1].readiness < 50))
    .slice(0, 3);

  if (weakSubjects.length > 0) {
    recommendations.push(`${weakSubjects.map(s => s.subject).join(', ')} 과목의 집중 보완이 시급함`);
  }

  // Check for strong subjects to leverage
  const strongSubjects = subjectTrajectories
    .filter(t => t.progression_pattern === '지속 향상')
    .slice(0, 3);

  if (strongSubjects.length > 0) {
    recommendations.push(`${strongSubjects.map(s => s.subject).join(', ')} 과목의 강점을 살려 전공 선택 고려`);
  }

  // Overall strategy
  if (overallReadiness >= 70) {
    recommendations.push('현재 경쟁력을 유지하며 상위권 대학 목표 설정');
  } else if (overallReadiness >= 50) {
    recommendations.push('전 과목 균형적 향상을 통한 중위권 이상 목표');
  } else {
    recommendations.push('기초 학력 강화를 최우선 목표로 설정');
  }

  return {
    overall_readiness: overallReadiness,
    readiness_by_grade: readinessByGrade,
    subject_readiness: subjectReadiness,
    competitive_position: competitivePosition,
    recommendations
  };
}

/**
 * Analyze individual subject performance
 */
async function analyzeSubjectPerformance(
  subject: string,
  grades: AcademicDevelopment[],
  client: OpenAI
): Promise<z.infer<typeof import('@/types/medsky-enhanced').EnhancedAcademicAnalysisSchema>['subject_analysis'][0] | null> {
  if (grades.length === 0) return null;

  const latestGrade = grades[grades.length - 1];
  const trend = analyzePerformanceTrend(grades);
  const relativePosition = getRelativePosition(latestGrade.석차등급 || '5');
  const collegeReadiness = calculateCollegeReadiness(grades);

  const analysisPrompt = `
**과목**: ${subject}
**학기별 성적 데이터**:
${grades.map(g => `
- 학기: ${g.학기 || '미상'}
- 원점수/과목평균: ${g.score_over_average}
- 성취도: ${g.성취도}
- 석차등급: ${g.석차등급}
`).join('')}

**현재 분석 결과**:
- 성취 추세: ${trend}
- 상대적 위치: ${relativePosition}
- 대학 준비도: ${collegeReadiness}점

위 ${subject} 과목의 성적 데이터를 분석하여 다음 형태의 JSON으로 응답해주세요:

{
  "subject": "${subject}",
  "semester": "${latestGrade.학기 || '최근'}",
  "performance_trend": "${trend}",
  "grade_analysis": {
    "raw_score": "원점수/과목평균 분석 내용",
    "achievement_level": "성취도 분석 내용",
    "rank_grade": "석차등급 분석 내용",
    "relative_position": "${relativePosition}"
  },
  "strengths": ["강점1", "강점2"],
  "improvements_needed": ["개선점1", "개선점2"],
  "college_readiness": ${collegeReadiness}
}`;

  try {
    const response = await client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: ACADEMIC_ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      response_format: zodResponseFormat(SubjectAnalysisResponseSchema, 'subject_analysis'),
      temperature: 0.2,
      max_tokens: 1500
    });

    const parsed = response.choices[0]?.message?.parsed;
    if (!parsed) return null;
    return {
      subject: parsed.subject || subject,
      semester: parsed.semester || latestGrade.학기,
      performance_trend: parsed.performance_trend || trend,
      grade_analysis: {
        raw_score: parsed.grade_analysis?.raw_score || `${latestGrade.score_over_average} 분석`,
        achievement_level: parsed.grade_analysis?.achievement_level || `${latestGrade.성취도}등급 달성`,
        rank_grade: parsed.grade_analysis?.rank_grade || `${latestGrade.석차등급} 위치`,
        relative_position: parsed.grade_analysis?.relative_position || relativePosition
      },
      strengths: parsed.strengths || [],
      improvements_needed: parsed.improvements_needed || [],
      college_readiness: parsed.college_readiness || collegeReadiness
    };
  } catch (error) {
    console.error(`Error analyzing subject ${subject}:`, error);
    return null;
  }
}

/**
 * Generate overall academic trends analysis
 */
async function generateOverallTrends(
  subjectAnalyses: any[],
  client: OpenAI
): Promise<{
  gpa_trend: '상승' | '하락' | '유지';
  strong_subjects: string[];
  weak_subjects: string[];
  grade_consistency: number;
  improvement_rate: number;
}> {
  // Calculate overall trends
  const trends = subjectAnalyses.map(s => s.performance_trend);
  const risingCount = trends.filter(t => t === '상승').length;
  const fallingCount = trends.filter(t => t === '하락').length;

  const gpaTrend = risingCount > fallingCount ? '상승' : fallingCount > risingCount ? '하락' : '유지';

  // Identify strong and weak subjects
  const readinessScores = subjectAnalyses.map(s => ({ subject: s.subject, score: s.college_readiness }));
  readinessScores.sort((a, b) => b.score - a.score);

  const strongSubjects = readinessScores.slice(0, Math.min(3, Math.ceil(readinessScores.length / 2)))
    .map(s => s.subject);
  const weakSubjects = readinessScores.slice(-Math.min(3, Math.floor(readinessScores.length / 2)))
    .map(s => s.subject);

  // Calculate consistency (inverse of variance in readiness scores)
  const scores = readinessScores.map(s => s.score);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
  const gradeConsistency = Math.max(0, Math.min(100, 100 - variance));

  // Calculate improvement rate
  const improvementRate = risingCount / trends.length * 100;

  return {
    gpa_trend: gpaTrend,
    strong_subjects: strongSubjects,
    weak_subjects: weakSubjects,
    grade_consistency: Math.round(gradeConsistency),
    improvement_rate: Math.round(improvementRate)
  };
}

/**
 * Generate college entrance readiness analysis
 */
async function generateCollegeReadiness(
  subjectAnalyses: any[],
  client: OpenAI
): Promise<{
  overall_readiness: number;
  subject_readiness: Record<string, number>;
  competitive_position: string;
  recommendations: string[];
}> {
  const subjectReadiness = subjectAnalyses.reduce((acc, analysis) => {
    acc[analysis.subject] = analysis.college_readiness;
    return acc;
  }, {} as Record<string, number>);

  const readinessValues = Object.values(subjectReadiness) as number[];
  const overallReadiness = Math.round(
    readinessValues.reduce((a, b) => a + b, 0) / readinessValues.length
  );

  const competitivePosition = (() => {
    if (overallReadiness >= 85) return '상위권 대학 진학 가능';
    if (overallReadiness >= 70) return '중상위권 대학 적합';
    if (overallReadiness >= 55) return '중위권 대학 목표';
    if (overallReadiness >= 40) return '하위권 대학 고려';
    return '기초 학력 보강 필요';
  })();

  // Generate specific recommendations
  const recommendationsPrompt = `
다음은 학생의 과목별 대학 준비도 점수입니다:

${JSON.stringify(subjectReadiness, null, 2)}

**전체 준비도**: ${overallReadiness}점
**경쟁력 위치**: ${competitivePosition}

위 데이터를 바탕으로 학생의 성적 향상을 위한 구체적인 제안사항을 3-5개 제시해주세요.
JSON 형태의 "recommendations" 배열로 응답해주세요.`;

  try {
    const response = await client.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: ACADEMIC_ANALYSIS_PROMPT
        },
        {
          role: 'user',
          content: recommendationsPrompt
        }
      ],
      response_format: zodResponseFormat(CollegeReadinessResponseSchema, 'college_readiness'),
      temperature: 0.3,
      max_tokens: 1000
    });

    const parsed = response.choices[0]?.message?.parsed;

    return {
      overall_readiness: overallReadiness,
      subject_readiness: subjectReadiness,
      competitive_position: competitivePosition,
      recommendations: parsed?.recommendations || [
        '주요 과목 집중 학습을 통한 등급 향상',
        '약점 과목 보완을 위한 추가 학습',
        '지속적인 성적 관리와 목표 설정'
      ]
    };
  } catch (error) {
    console.error('Error generating college readiness analysis:', error);
    return {
      overall_readiness: overallReadiness,
      subject_readiness: subjectReadiness,
      competitive_position: competitivePosition,
      recommendations: ['성적 향상을 위한 체계적인 학습 계획 수립이 필요합니다.']
    };
  }
}

/**
 * Main function to perform enhanced academic analysis
 */
export async function performEnhancedAcademicAnalysis(
  extractedData: ExtractedData
): Promise<EnhancedAcademicAnalysis> {
  console.log('📚 Starting enhanced academic analysis...');

  if (!extractedData.academicDevelopments?.교과학습발달상황) {
    console.warn('No academic development data found');
    return {
      subject_analysis: [],
      overall_academic_trends: {
        gpa_trend: '유지',
        strong_subjects: [],
        weak_subjects: [],
        grade_consistency: 0,
        improvement_rate: 0
      },
      college_entrance_readiness: {
        overall_readiness: 0,
        subject_readiness: {},
        competitive_position: '데이터 부족',
        recommendations: ['학업 성취 데이터가 충분하지 않습니다.']
      }
    };
  }

  try {
    const llmConfig = createLLMConfig();
    const client = new OpenAI({
      apiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY
    });

    // Group academic data by subject
    const subjectGroups = extractedData.academicDevelopments.교과학습발달상황.reduce((groups, grade) => {
      const subject = grade.과목;
      if (!groups[subject]) groups[subject] = [];
      groups[subject].push(grade);
      return groups;
    }, {} as Record<string, AcademicDevelopment[]>);

    // Analyze each subject
    const subjectAnalyses = await Promise.all(
      Object.entries(subjectGroups).map(([subject, grades]) =>
        analyzeSubjectPerformance(subject, grades, client)
      )
    );

    const validAnalyses = subjectAnalyses.filter(analysis => analysis !== null);

    // Generate overall trends
    const overallTrends = await generateOverallTrends(validAnalyses, client);

    // Generate college readiness analysis
    const collegeReadiness = await generateCollegeReadiness(validAnalyses, client);

    const result: EnhancedAcademicAnalysis = {
      subject_analysis: validAnalyses,
      overall_academic_trends: overallTrends,
      college_entrance_readiness: collegeReadiness
    };

    console.log('✅ Enhanced academic analysis completed:', {
      subjectsAnalyzed: validAnalyses.length,
      overallReadiness: collegeReadiness.overall_readiness,
      gpaTrend: overallTrends.gpa_trend,
      strongSubjects: overallTrends.strong_subjects.length,
      weakSubjects: overallTrends.weak_subjects.length
    });

    return result;
  } catch (error) {
    console.error('❌ Enhanced academic analysis failed:', error);

    // Return fallback result
    return {
      subject_analysis: [],
      overall_academic_trends: {
        gpa_trend: '유지',
        strong_subjects: [],
        weak_subjects: [],
        grade_consistency: 0,
        improvement_rate: 0
      },
      college_entrance_readiness: {
        overall_readiness: 0,
        subject_readiness: {},
        competitive_position: 'AI 분석 오류',
        recommendations: ['AI 분석 중 오류가 발생했습니다. 수동 검토가 필요합니다.']
      }
    };
  }
}

/**
 * Main function to perform enhanced academic analysis with hierarchical structure (V2)
 * Analyzes by Grade → Semester → Subject for more realistic progression tracking
 */
export async function performEnhancedAcademicAnalysisV2(
  extractedData: ExtractedData
): Promise<EnhancedAcademicAnalysisV2> {
  console.log('📚 Starting enhanced academic analysis V2 (hierarchical)...');

  if (!extractedData.academicDevelopments?.교과학습발달상황) {
    console.warn('No academic development data found');
    return {
      grades: [],
      multi_year_trends: {
        overall_progression: '안정적 유지',
        cross_grade_strong_subjects: [],
        cross_grade_weak_subjects: [],
        grade_transitions: [],
        consistency_score: 0
      },
      college_entrance_readiness: {
        overall_readiness: 0,
        readiness_by_grade: {},
        subject_readiness: {},
        competitive_position: '데이터 부족',
        recommendations: ['학업 성취 데이터가 충분하지 않습니다.']
      },
      subject_trajectories: []
    };
  }

  try {
    const llmConfig = createLLMConfig();
    const client = new OpenAI({
      apiKey: llmConfig.apiKey || process.env.OPENAI_API_KEY
    });

    const academicData = extractedData.academicDevelopments.교과학습발달상황;

    // Group data hierarchically: Grade → Semester → Subject
    const hierarchy = groupByGradeAndSemester(academicData);

    console.log(`📊 Hierarchical grouping complete:`, {
      totalGrades: hierarchy.size,
      grades: Array.from(hierarchy.keys())
    });

    // Analyze each grade
    const gradeAnalyses: import('@/types/medsky-enhanced').GradeAcademicAnalysis[] = [];

    for (const [grade, semestersMap] of hierarchy.entries()) {
      console.log(`🔍 Analyzing ${grade}...`);
      const gradeAnalysis = await analyzeGrade(grade, semestersMap, client);
      if (gradeAnalysis) {
        gradeAnalyses.push(gradeAnalysis);
        console.log(`✅ ${grade} analysis complete: ${gradeAnalysis.semesters.length} semesters`);
      }
    }

    if (gradeAnalyses.length === 0) {
      throw new Error('No valid grade analyses produced');
    }

    // Analyze multi-year trends
    console.log('📈 Analyzing multi-year trends...');
    const multiYearTrends = analyzeMultiYearTrends(gradeAnalyses);

    // Analyze subject trajectories
    console.log('📉 Analyzing subject trajectories...');
    const subjectTrajectories = analyzeSubjectTrajectories(gradeAnalyses);

    // Generate college readiness
    console.log('🎓 Generating college entrance readiness...');
    const collegeReadiness = generateCollegeReadinessV2(gradeAnalyses, subjectTrajectories);

    const result: EnhancedAcademicAnalysisV2 = {
      grades: gradeAnalyses,
      multi_year_trends: multiYearTrends,
      college_entrance_readiness: collegeReadiness,
      subject_trajectories: subjectTrajectories
    };

    console.log('✅ Enhanced academic analysis V2 completed:', {
      gradesAnalyzed: gradeAnalyses.length,
      totalSemesters: gradeAnalyses.reduce((sum, g) => sum + g.semesters.length, 0),
      subjectTrajectories: subjectTrajectories.length,
      overallReadiness: collegeReadiness.overall_readiness,
      overallProgression: multiYearTrends.overall_progression
    });

    return result;
  } catch (error) {
    console.error('❌ Enhanced academic analysis V2 failed:', error);

    // Return fallback result
    return {
      grades: [],
      multi_year_trends: {
        overall_progression: '안정적 유지',
        cross_grade_strong_subjects: [],
        cross_grade_weak_subjects: [],
        grade_transitions: [],
        consistency_score: 0
      },
      college_entrance_readiness: {
        overall_readiness: 0,
        readiness_by_grade: {},
        subject_readiness: {},
        competitive_position: 'AI 분석 오류',
        recommendations: ['AI 분석 중 오류가 발생했습니다. 수동 검토가 필요합니다.']
      },
      subject_trajectories: []
    };
  }
}

/**
 * Helper function to get academic analysis status for debugging
 */
export function getAcademicAnalysisStatus(result: EnhancedAcademicAnalysis): {
  isComplete: boolean;
  subjectsAnalyzed: number;
  hasOverallTrends: boolean;
  hasCollegeReadiness: boolean;
  overallReadiness: number;
} {
  return {
    isComplete: result.subject_analysis.length > 0,
    subjectsAnalyzed: result.subject_analysis.length,
    hasOverallTrends: result.overall_academic_trends.strong_subjects.length > 0,
    hasCollegeReadiness: result.college_entrance_readiness.overall_readiness > 0,
    overallReadiness: result.college_entrance_readiness.overall_readiness
  };
}

/**
 * Helper function to get academic analysis status for V2 (hierarchical)
 */
export function getAcademicAnalysisStatusV2(result: EnhancedAcademicAnalysisV2): {
  isComplete: boolean;
  gradesAnalyzed: number;
  totalSemesters: number;
  subjectTrajectoriesCount: number;
  hasMultiYearTrends: boolean;
  hasCollegeReadiness: boolean;
  overallReadiness: number;
  overallProgression: string;
} {
  return {
    isComplete: result.grades.length > 0,
    gradesAnalyzed: result.grades.length,
    totalSemesters: result.grades.reduce((sum, g) => sum + g.semesters.length, 0),
    subjectTrajectoriesCount: result.subject_trajectories.length,
    hasMultiYearTrends: result.multi_year_trends.cross_grade_strong_subjects.length > 0,
    hasCollegeReadiness: result.college_entrance_readiness.overall_readiness > 0,
    overallReadiness: result.college_entrance_readiness.overall_readiness,
    overallProgression: result.multi_year_trends.overall_progression
  };
}