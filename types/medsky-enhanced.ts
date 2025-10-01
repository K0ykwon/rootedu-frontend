/**
 * Enhanced Medsky Types - AI-Powered Analysis Extensions
 *
 * This file contains enhanced TypeScript types for the upgraded medsky functionality
 * with LLM-based keyword extraction, AI scoring, and intelligent recommendations.
 */

import { z } from "zod";
import { AcademicDevelopment, TextSections } from "./medsky";

// ===========================
// Enhanced Keyword Extraction
// ===========================

/**
 * AI-extracted keyword with contextual relevance
 */
export const AIKeywordSchema = z.object({
  keyword: z.string().describe("키워드 (LLM이 문맥상 중요하다고 판단한 단어/구문)"),
  relevance_score: z.number().min(0).max(1).describe("관련성 점수 (0-1, 문맥상 중요도)"),
  category: z.enum(["학업역량", "진로역량", "공동체역량", "창의성", "리더십", "협력", "문제해결", "의사소통"])
    .describe("키워드가 나타내는 역량 카테고리"),
  evidence_text: z.string().describe("해당 키워드를 추출한 근거가 되는 원문 텍스트"),
  competency_indicator: z.string().describe("이 키워드가 나타내는 구체적인 역량 지표")
});

export const SectionKeywordsSchema = z.object({
  section_name: z.string().describe("분석한 섹션명 (예: 창의적체험활동상황, 세부특기사항)"),
  keywords: z.array(AIKeywordSchema).describe("해당 섹션에서 추출한 키워드 목록"),
  section_summary: z.string().describe("해당 섹션의 전체적인 특징과 강점을 요약한 설명")
});

export const AIKeywordExtractionSchema = z.object({
  sections: z.array(SectionKeywordsSchema).describe("각 섹션별 키워드 추출 결과"),
  overall_keywords: z.array(AIKeywordSchema).describe("전체 생활기록부에서 가장 중요한 상위 키워드들"),
  student_strengths: z.array(z.string()).describe("학생의 주요 강점 영역 (키워드 분석 기반)"),
  improvement_areas: z.array(z.string()).describe("보완이 필요한 영역 (키워드 분석 기반)")
});

// ===========================
// Enhanced Section Scoring
// ===========================

/**
 * AI-powered section scoring with detailed analysis
 */
export const SectionScoreSchema = z.object({
  section_name: z.string().describe("채점 대상 섹션명"),
  score: z.number().min(0).max(100).describe("해당 섹션의 점수 (0-100)"),
  criteria_scores: z.object({
    depth: z.number().min(0).max(100).describe("내용의 깊이와 구체성 점수"),
    relevance: z.number().min(0).max(100).describe("진로/전공과의 연관성 점수"),
    growth: z.number().min(0).max(100).describe("성장과 발전 양상 점수"),
    uniqueness: z.number().min(0).max(100).describe("독창성과 차별성 점수"),
    leadership: z.number().min(0).max(100).describe("리더십과 주도성 점수")
  }).describe("세부 채점 기준별 점수"),
  strengths: z.array(z.string()).describe("해당 섹션의 강점"),
  weaknesses: z.array(z.string()).describe("해당 섹션의 약점"),
  improvement_suggestions: z.array(z.string()).describe("개선 제안사항"),
  evidence_highlights: z.array(z.string()).describe("높은 점수를 받은 구체적인 활동/내용")
});

export const AIScoreAnalysisSchema = z.object({
  section_scores: z.array(SectionScoreSchema).describe("각 섹션별 상세 채점 결과"),
  overall_score: z.number().min(0).max(100).describe("전체 종합 점수"),
  grade_equivalent: z.enum(["A+", "A", "B+", "B", "C+", "C", "D+", "D", "F"])
    .describe("점수에 해당하는 등급"),
  percentile_rank: z.number().min(0).max(100).describe("상위 몇 % 수준인지 추정"),
  competency_balance: z.object({
    academic: z.number().min(0).max(100).describe("학업역량 점수"),
    career: z.number().min(0).max(100).describe("진로역량 점수"),
    community: z.number().min(0).max(100).describe("공동체역량 점수"),
    creativity: z.number().min(0).max(100).describe("창의역량 점수"),
    character: z.number().min(0).max(100).describe("인성역량 점수")
  }).describe("역량별 균형 분석"),
  overall_feedback: z.string().describe("전체적인 피드백과 총평")
});

// ===========================
// Enhanced Academic Analysis (Semester & Grade Based)
// ===========================

/**
 * Helper type for grade levels
 */
export const GradeLevelSchema = z.enum(["1학년", "2학년", "3학년"]).describe("학년");

/**
 * Helper type for semesters
 */
export const SemesterNumberSchema = z.enum(["1학기", "2학기"]).describe("학기");

/**
 * Subject analysis for a single semester
 */
export const SemesterSubjectAnalysisSchema = z.object({
  subject: z.string().describe("과목명"),
  performance_trend: z.enum(["상승", "하락", "유지", "불안정"]).describe("학기 내 성취 추세"),
  grade_analysis: z.object({
    raw_score: z.string().describe("원점수/과목평균 분석"),
    achievement_level: z.string().describe("성취도 (A,B,C,D,E) 분석"),
    rank_grade: z.string().describe("석차등급 분석"),
    relative_position: z.enum(["상위권", "중상위권", "중위권", "중하위권", "하위권"])
      .describe("상대적 위치")
  }).describe("성적 상세 분석"),
  strengths: z.array(z.string()).describe("해당 과목의 강점"),
  improvements_needed: z.array(z.string()).describe("개선이 필요한 부분"),
  college_readiness: z.number().min(0).max(100).describe("대학 진학 준비도 (0-100)")
}).describe("학기별 과목 분석");

/**
 * Single semester academic analysis within a grade
 */
export const SemesterAcademicAnalysisSchema = z.object({
  semester: SemesterNumberSchema.describe("학기 (1학기/2학기)"),
  subjects: z.array(SemesterSubjectAnalysisSchema).describe("학기별 과목 분석"),
  semester_summary: z.object({
    average_readiness: z.number().min(0).max(100).describe("학기 평균 준비도"),
    strong_subjects: z.array(z.string()).describe("학기 강점 과목"),
    weak_subjects: z.array(z.string()).describe("학기 약점 과목"),
    overall_trend: z.enum(["상승", "하락", "유지"]).describe("학기 전체 추세")
  }).describe("학기 종합 요약")
}).describe("학기별 학업 분석");

/**
 * Grade-level academic analysis (contains 1-2 semesters)
 */
export const GradeAcademicAnalysisSchema = z.object({
  grade: GradeLevelSchema.describe("학년"),
  semesters: z.array(SemesterAcademicAnalysisSchema).describe("학기별 분석 (1-2개)"),
  grade_summary: z.object({
    grade_trend: z.enum(["상승", "하락", "유지", "불안정"]).describe("학년 전체 추세"),
    semester_comparison: z.string().describe("학기 간 비교 분석 (1학기 vs 2학기)"),
    key_improvements: z.array(z.string()).describe("학년 내 주요 개선사항"),
    areas_of_concern: z.array(z.string()).describe("학년 내 우려사항"),
    grade_readiness: z.number().min(0).max(100).describe("학년 평균 준비도")
  }).describe("학년 종합 분석")
}).describe("학년별 학업 분석");

/**
 * Comprehensive multi-year academic analysis (NEW HIERARCHICAL STRUCTURE)
 */
export const EnhancedAcademicAnalysisSchemaV2 = z.object({
  grades: z.array(GradeAcademicAnalysisSchema).describe("학년별 분석 (1-3학년)"),

  multi_year_trends: z.object({
    overall_progression: z.enum(["지속적 상승", "지속적 하락", "등락", "안정적 유지"])
      .describe("다년간 전체 추세"),
    cross_grade_strong_subjects: z.array(z.string()).describe("전 학년 강점 과목"),
    cross_grade_weak_subjects: z.array(z.string()).describe("전 학년 약점 과목"),
    grade_transitions: z.array(z.object({
      from_grade: GradeLevelSchema,
      to_grade: GradeLevelSchema,
      transition_analysis: z.string().describe("학년 전환 시 변화 분석")
    })).describe("학년 간 전환 분석"),
    consistency_score: z.number().min(0).max(100).describe("전체 성적 일관성 점수")
  }).describe("다년간 종합 추세 분석"),

  college_entrance_readiness: z.object({
    overall_readiness: z.number().min(0).max(100).describe("전체 대학 진학 준비도"),
    readiness_by_grade: z.record(z.string(), z.number()).describe("학년별 준비도"),
    subject_readiness: z.record(z.string(), z.number()).describe("과목별 준비도"),
    competitive_position: z.string().describe("경쟁력 위치 분석"),
    recommendations: z.array(z.string()).describe("성적 향상을 위한 구체적 제안")
  }).describe("대학 진학 준비도 종합 분석"),

  subject_trajectories: z.array(z.object({
    subject: z.string().describe("과목명"),
    progression_pattern: z.enum(["지속 향상", "지속 하락", "등락", "안정"])
      .describe("과목별 진행 패턴"),
    grade_performances: z.array(z.object({
      grade: GradeLevelSchema,
      semester: SemesterNumberSchema,
      readiness: z.number().min(0).max(100)
    })).describe("학년/학기별 성과"),
    overall_assessment: z.string().describe("과목 전체 평가")
  })).describe("과목별 다년간 궤적 분석")
}).describe("학년별·학기별 종합 학업 분석 (신규 구조)");

/**
 * @deprecated Use EnhancedAcademicAnalysisSchemaV2 for new implementations
 * Legacy schema for backward compatibility
 */
export const EnhancedAcademicAnalysisSchema = z.object({
  subject_analysis: z.array(z.object({
    subject: z.string().describe("과목명"),
    semester: z.string().nullable().describe("학기"),
    performance_trend: z.enum(["상승", "하락", "유지", "불안정"]).describe("성취 추세"),
    grade_analysis: z.object({
      raw_score: z.string().describe("원점수/과목평균 분석"),
      achievement_level: z.string().describe("성취도 (A,B,C,D,E) 분석"),
      rank_grade: z.string().describe("석차등급 분석"),
      relative_position: z.enum(["상위권", "중상위권", "중위권", "중하위권", "하위권"])
        .describe("상대적 위치")
    }).describe("성적 상세 분석"),
    strengths: z.array(z.string()).describe("해당 과목의 강점"),
    improvements_needed: z.array(z.string()).describe("개선이 필요한 부분"),
    college_readiness: z.number().min(0).max(100).describe("대학 진학 준비도 (0-100)")
  })).describe("과목별 상세 분석"),

  overall_academic_trends: z.object({
    gpa_trend: z.enum(["상승", "하락", "유지"]).describe("전체 성적 추세"),
    strong_subjects: z.array(z.string()).describe("강점 과목들"),
    weak_subjects: z.array(z.string()).describe("약점 과목들"),
    grade_consistency: z.number().min(0).max(100).describe("성적 일관성 점수"),
    improvement_rate: z.number().describe("학기별 향상도")
  }).describe("전체 학업 성취 추세"),

  college_entrance_readiness: z.object({
    overall_readiness: z.number().min(0).max(100).describe("전체 대학 진학 준비도"),
    subject_readiness: z.record(z.number()).describe("과목별 준비도"),
    competitive_position: z.string().describe("경쟁력 위치 분석"),
    recommendations: z.array(z.string()).describe("성적 향상을 위한 구체적 제안")
  }).describe("대학 진학 준비도 분석")
});

// ===========================
// AI Major Recommendations
// ===========================

/**
 * AI-driven major recommendation system
 */
export const MajorRecommendationSchema = z.object({
  major_name: z.string().describe("추천 전공명"),
  university_examples: z.array(z.string()).describe("해당 전공이 강한 대학교 예시"),
  match_score: z.number().min(0).max(100).describe("학생과의 적합도 점수"),
  match_reasons: z.array(z.string()).describe("추천하는 구체적인 이유들"),
  required_subjects: z.array(z.string()).describe("해당 전공 진학을 위해 필요한 과목들"),
  current_preparation_level: z.number().min(0).max(100).describe("현재 준비 수준"),
  career_prospects: z.array(z.string()).describe("졸업 후 진로 전망"),
  related_activities: z.array(z.string()).describe("전공과 연관된 추천 활동들")
});

export const AIMajorRecommendationsSchema = z.object({
  top_recommendations: z.array(MajorRecommendationSchema).length(3)
    .describe("상위 3개 추천 전공"),
  alternative_options: z.array(MajorRecommendationSchema)
    .describe("추가 고려할 만한 전공들"),
  interdisciplinary_suggestions: z.array(z.string())
    .describe("융복합 전공 추천"),
  analysis_summary: z.string().describe("전공 추천 분석 종합 의견")
});

// ===========================
// Next-Semester Study Planning
// ===========================

/**
 * AI-powered next semester study planning
 */
export const StudyPlanRecommendationSchema = z.object({
  priority_subjects: z.array(z.object({
    subject: z.string().describe("우선 개선 대상 과목"),
    current_level: z.string().describe("현재 수준 평가"),
    target_improvement: z.string().describe("목표 개선 수준"),
    specific_strategies: z.array(z.string()).describe("구체적인 학습 전략"),
    time_allocation: z.string().describe("권장 학습 시간 배분")
  })).describe("우선 개선 대상 과목들"),

  extracurricular_recommendations: z.array(z.object({
    activity_type: z.string().describe("활동 유형"),
    specific_activities: z.array(z.string()).describe("구체적인 활동 예시"),
    purpose: z.string().describe("해당 활동의 목적과 기대 효과"),
    documentation_tips: z.array(z.string()).describe("생활기록부 기재 시 팁")
  })).describe("비교과 활동 추천"),

  semester_goals: z.array(z.string()).describe("다음 학기 구체적 목표"),
  timeline: z.array(z.object({
    period: z.string().describe("시기 (예: 3월 첫째 주)"),
    tasks: z.array(z.string()).describe("해당 시기 수행할 과제들")
  })).describe("학기별 타임라인"),

  preparation_checklist: z.array(z.string()).describe("준비 체크리스트"),
  success_metrics: z.array(z.string()).describe("성공 측정 지표들")
});

export const NextSemesterPlanSchema = z.object({
  academic_plan: StudyPlanRecommendationSchema.describe("학업 개선 계획"),
  character_development: z.object({
    target_competencies: z.array(z.string()).describe("개발할 역량들"),
    development_activities: z.array(z.string()).describe("역량 개발 활동들"),
    reflection_questions: z.array(z.string()).describe("성찰을 위한 질문들")
  }).describe("인성 및 역량 개발 계획"),
  documentation_strategy: z.object({
    monthly_goals: z.array(z.string()).describe("월별 기록 목표"),
    writing_tips: z.array(z.string()).describe("생활기록부 작성 팁"),
    evidence_collection: z.array(z.string()).describe("근거 자료 수집 방법")
  }).describe("생활기록부 작성 전략")
});

// ===========================
// Enhanced Processing Result
// ===========================

/**
 * Enhanced processing result with AI-powered analysis
 */
export interface EnhancedProcessingResult {
  // Existing fields from ProcessingResult
  status: any;
  parsedText?: string;
  textSections?: any;
  extractedData?: any;
  validationAnalysis?: any;

  // Enhanced AI-powered analysis
  ai_keyword_analysis?: z.infer<typeof AIKeywordExtractionSchema>;
  ai_section_scoring?: z.infer<typeof AIScoreAnalysisSchema>;
  enhanced_academic_analysis?: z.infer<typeof EnhancedAcademicAnalysisSchema>;
  ai_major_recommendations?: z.infer<typeof AIMajorRecommendationsSchema>;
  next_semester_plan?: z.infer<typeof NextSemesterPlanSchema>;

  // Metadata
  ai_analysis_timestamp?: string;
  ai_model_versions?: {
    keyword_model: string;
    scoring_model: string;
    recommendation_model: string;
  };
}

// Export types
export type AIKeywordExtraction = z.infer<typeof AIKeywordExtractionSchema>;
export type AIScoreAnalysis = z.infer<typeof AIScoreAnalysisSchema>;

// New hierarchical academic analysis types
export type GradeLevel = z.infer<typeof GradeLevelSchema>;
export type SemesterNumber = z.infer<typeof SemesterNumberSchema>;
export type SemesterSubjectAnalysis = z.infer<typeof SemesterSubjectAnalysisSchema>;
export type SemesterAcademicAnalysis = z.infer<typeof SemesterAcademicAnalysisSchema>;
export type GradeAcademicAnalysis = z.infer<typeof GradeAcademicAnalysisSchema>;
export type EnhancedAcademicAnalysisV2 = z.infer<typeof EnhancedAcademicAnalysisSchemaV2>;

// Legacy type for backward compatibility
/** @deprecated Use EnhancedAcademicAnalysisV2 for new implementations */
export type EnhancedAcademicAnalysis = z.infer<typeof EnhancedAcademicAnalysisSchema>;

export type AIMajorRecommendations = z.infer<typeof AIMajorRecommendationsSchema>;
export type NextSemesterPlan = z.infer<typeof NextSemesterPlanSchema>;