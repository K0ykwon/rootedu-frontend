/**
 * Analysis Data Processing Utilities
 * 
 * Helper functions to transform raw extracted data from Redis into display-ready formats
 * for the enhanced structured UI components.
 */

import { ExtractedData, ValidationAnalysis, ValidationType } from '@/types/medsky';

// ===========================
// Statistics and Aggregation
// ===========================

/**
 * Overall analysis statistics
 */
export interface AnalysisStatistics {
  totalActivities: number;
  totalActivityHours: number;
  totalSubjects: number;
  activityDomains: string[];
  subjectCount: number;
  validationScore: number; // 0-100 overall score
  categoryScores: Record<ValidationType, number>;
  strengthAreas: string[];
  improvementAreas: string[];
}

/**
 * Calculate comprehensive analysis statistics
 */
export function calculateAnalysisStatistics(
  extractedData: ExtractedData,
  validationAnalysis: ValidationAnalysis
): AnalysisStatistics {
  const activities = extractedData.creativeActivities?.창의적체험활동상황 || [];
  const academics = extractedData.academicDevelopments?.교과학습발달상황 || [];
  const abilities = extractedData.detailedAbilities?.세부특기사항 || [];

  // Activity statistics
  const totalActivities = activities.length;
  const totalActivityHours = activities.reduce((sum, activity) => sum + (activity.시간 || 0), 0);
  const activityDomains = [...new Set(activities.map(a => a.영역))].filter(Boolean);

  // Academic statistics
  const totalSubjects = academics.length;
  const subjectCount = abilities.length;

  // Validation scoring
  const categoryScores = calculateValidationScores(validationAnalysis);
  const validationScore = calculateOverallScore(categoryScores);

  // Strength and improvement areas
  const { strengthAreas, improvementAreas } = identifyKeyAreas(validationAnalysis, extractedData);

  return {
    totalActivities,
    totalActivityHours,
    totalSubjects,
    activityDomains,
    subjectCount,
    validationScore,
    categoryScores,
    strengthAreas,
    improvementAreas
  };
}

/**
 * Calculate scores for each validation category (0-100)
 */
function calculateValidationScores(validationAnalysis: ValidationAnalysis): Record<ValidationType, number> {
  const totalFeedbacks = Object.values(validationAnalysis).reduce(
    (sum, result) => sum + result.Feedbacks.length, 0
  );

  if (totalFeedbacks === 0) {
    return {
      blue_highlight: 0,
      red_line: 0,
      blue_line: 0,
      black_line: 0,
      red_check: 0
    };
  }

  const scores: Record<ValidationType, number> = {} as Record<ValidationType, number>;
  
  Object.entries(validationAnalysis).forEach(([type, result]) => {
    const count = result.Feedbacks.length;
    const percentage = (count / totalFeedbacks) * 100;
    
    // Positive categories (higher is better)
    if (type === 'blue_highlight' || type === 'red_line' || type === 'blue_line') {
      scores[type as ValidationType] = Math.round(percentage);
    } 
    // Negative categories (lower is better, so invert)
    else {
      scores[type as ValidationType] = Math.round(Math.max(0, 100 - percentage * 2));
    }
  });

  return scores;
}

/**
 * Calculate overall validation score (0-100)
 */
function calculateOverallScore(categoryScores: Record<ValidationType, number>): number {
  const positiveWeight = 0.7;
  const negativeWeight = 0.3;

  const positiveScore = (
    (categoryScores.blue_highlight || 0) * 0.4 +
    (categoryScores.red_line || 0) * 0.35 +
    (categoryScores.blue_line || 0) * 0.25
  ) * positiveWeight;

  const negativeScore = (
    (categoryScores.black_line || 0) * 0.6 +
    (categoryScores.red_check || 0) * 0.4
  ) * negativeWeight;

  return Math.round(positiveScore + negativeScore);
}

/**
 * Identify key strength and improvement areas
 */
function identifyKeyAreas(
  validationAnalysis: ValidationAnalysis,
  extractedData: ExtractedData
): { strengthAreas: string[], improvementAreas: string[] } {
  const strengthAreas: string[] = [];
  const improvementAreas: string[] = [];

  // Analyze validation feedback patterns
  const strongCategories = [];
  const weakCategories = [];

  Object.entries(validationAnalysis).forEach(([type, result]) => {
    const feedbackCount = result.Feedbacks.length;
    
    if (type === 'blue_highlight' && feedbackCount > 2) {
      strongCategories.push('진로 역량');
    }
    if (type === 'red_line' && feedbackCount > 2) {
      strongCategories.push('구체적 노력');
    }
    if (type === 'blue_line' && feedbackCount > 1) {
      strongCategories.push('연계성');
    }
    if (type === 'black_line' && feedbackCount > 3) {
      weakCategories.push('구체성 부족');
    }
    if (type === 'red_check' && feedbackCount > 2) {
      weakCategories.push('정보 부족');
    }
  });

  // Add domain diversity as strength if applicable
  const activities = extractedData.creativeActivities?.창의적체험활동상황 || [];
  const domains = [...new Set(activities.map(a => a.영역))];
  if (domains.length >= 3) {
    strengthAreas.push('활동 영역 다양성');
  }

  // Add academic breadth if applicable
  const subjects = extractedData.detailedAbilities?.세부특기사항 || [];
  if (subjects.length >= 5) {
    strengthAreas.push('교과 영역 폭넓음');
  }

  strengthAreas.push(...strongCategories);
  improvementAreas.push(...weakCategories);

  return { strengthAreas, improvementAreas };
}

// ===========================
// Activity Data Processing
// ===========================

/**
 * Enhanced activity data for display
 */
export interface ProcessedActivity {
  영역: string;
  시간: number;
  특기사항: string;
  domain: string; // Normalized domain name
  highlights: string[]; // Key highlights extracted
  competencyAreas: string[]; // Identified competency areas
}

/**
 * Process creative activities for enhanced display
 */
export function processActivities(extractedData: ExtractedData): ProcessedActivity[] {
  const activities = extractedData.creativeActivities?.창의적체험활동상황 || [];
  
  return activities.map(activity => ({
    ...activity,
    domain: normalizeDomainName(activity.영역),
    highlights: extractHighlights(activity.특기사항),
    competencyAreas: identifyCompetencyAreas(activity.특기사항)
  }));
}

/**
 * Get activity statistics by domain
 */
export function getActivityStatsByDomain(activities: ProcessedActivity[]) {
  const stats: Record<string, { count: number; hours: number; activities: ProcessedActivity[] }> = {};
  
  activities.forEach(activity => {
    const domain = activity.domain;
    if (!stats[domain]) {
      stats[domain] = { count: 0, hours: 0, activities: [] };
    }
    stats[domain].count++;
    stats[domain].hours += activity.시간;
    stats[domain].activities.push(activity);
  });

  return stats;
}

/**
 * Normalize domain names for consistent display
 */
function normalizeDomainName(domain: string): string {
  const domainMap: Record<string, string> = {
    '자율활동': '자율활동',
    '동아리활동': '동아리활동', 
    '봉사활동': '봉사활동',
    '진로활동': '진로활동',
    '자율': '자율활동',
    '동아리': '동아리활동',
    '봉사': '봉사활동',
    '진로': '진로활동'
  };
  
  return domainMap[domain] || domain;
}

/**
 * Extract key highlights from activity description
 */
function extractHighlights(description: string): string[] {
  const highlights: string[] = [];
  
  // Look for action verbs and achievements
  const patterns = [
    /(?:개발|설계|구현|제작|창작|기획)(?:함|하였음|했음)/g,
    /(?:발표|참여|주도|리더십|협력)(?:함|하였음|했음)/g,
    /(?:수상|선정|인정|평가)(?:됨|되었음|받음|받았음)/g
  ];
  
  patterns.forEach(pattern => {
    const matches = description.match(pattern);
    if (matches) {
      highlights.push(...matches.slice(0, 2)); // Max 2 per pattern
    }
  });

  return highlights.slice(0, 3); // Max 3 highlights total
}

/**
 * Identify competency areas from activity description
 */
function identifyCompetencyAreas(description: string): string[] {
  const competencies: string[] = [];
  const text = description.toLowerCase();
  
  const competencyKeywords = {
    '창의성': ['창의', '혁신', '아이디어', '새로운'],
    '리더십': ['리더', '주도', '이끌', '책임'],
    '협업': ['협력', '팀워크', '함께', '공동'],
    '문제해결': ['해결', '분석', '탐구', '연구'],
    '의사소통': ['발표', '토론', '소통', '설명'],
    '전문성': ['전문', '깊이', '심화', '고급']
  };
  
  Object.entries(competencyKeywords).forEach(([competency, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      competencies.push(competency);
    }
  });
  
  return competencies;
}

// ===========================
// Academic Data Processing
// ===========================

/**
 * Enhanced academic data for display
 */
export interface ProcessedAcademic {
  과목: string;
  학점수: number;
  score_over_average: string;
  성취도: string;
  석차등급: string;
  category: string; // Subject category (문과/이과/기타)
  performanceLevel: 'excellent' | 'good' | 'average' | 'needs_improvement';
  numericGrade?: number; // Extracted numeric grade if available
}

/**
 * Process academic development data
 */
export function processAcademics(extractedData: ExtractedData): ProcessedAcademic[] {
  const academics = extractedData.academicDevelopments?.교과학습발달상황 || [];
  
  return academics.map(academic => ({
    ...academic,
    category: categorizeSubject(academic.과목),
    performanceLevel: evaluatePerformance(academic.성취도, academic.석차등급),
    numericGrade: extractNumericGrade(academic.score_over_average)
  }));
}

/**
 * Get academic statistics by category
 */
export function getAcademicStatsByCategory(academics: ProcessedAcademic[]) {
  const stats: Record<string, { count: number; subjects: ProcessedAcademic[] }> = {};
  
  academics.forEach(academic => {
    const category = academic.category;
    if (!stats[category]) {
      stats[category] = { count: 0, subjects: [] };
    }
    stats[category].count++;
    stats[category].subjects.push(academic);
  });

  return stats;
}

/**
 * Categorize subjects into broad categories
 */
function categorizeSubject(subject: string): string {
  const categories = {
    '국어/문학': ['국어', '문학', '화법', '작문', '독서'],
    '수학': ['수학', '미적분', '확률', '통계', '기하'],
    '영어': ['영어', 'English', '실용영어'],
    '과학': ['물리', '화학', '생물', '지구과학', '과학'],
    '사회': ['사회', '역사', '지리', '정치', '경제', '윤리', '한국사'],
    '예체능': ['음악', '미술', '체육', '예술'],
    '기타': []
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (category !== '기타' && keywords.some(keyword => subject.includes(keyword))) {
      return category;
    }
  }
  
  return '기타';
}

/**
 * Evaluate academic performance level
 */
function evaluatePerformance(achievement: string, rank: string): ProcessedAcademic['performanceLevel'] {
  // Based on achievement level
  if (achievement === 'A') return 'excellent';
  if (achievement === 'B') return 'good';
  if (achievement === 'C') return 'average';
  
  // Based on rank if available
  const rankNum = parseInt(rank);
  if (!isNaN(rankNum)) {
    if (rankNum <= 2) return 'excellent';
    if (rankNum <= 4) return 'good';
    if (rankNum <= 6) return 'average';
  }
  
  return 'needs_improvement';
}

/**
 * Extract numeric grade from score/average format
 */
function extractNumericGrade(scoreString: string): number | undefined {
  const match = scoreString.match(/^(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

// ===========================
// Detailed Abilities Processing
// ===========================

/**
 * Enhanced detailed abilities data
 */
export interface ProcessedAbility {
  과목: string;
  특기사항: string;
  category: string;
  keyStrengths: string[];
  skillAreas: string[];
  competencyLevel: 'high' | 'medium' | 'basic';
}

/**
 * Process detailed abilities data
 */
export function processDetailedAbilities(extractedData: ExtractedData): ProcessedAbility[] {
  const abilities = extractedData.detailedAbilities?.세부특기사항 || [];
  
  return abilities.map(ability => ({
    ...ability,
    category: categorizeSubject(ability.과목),
    keyStrengths: extractKeyStrengths(ability.특기사항),
    skillAreas: identifySkillAreas(ability.특기사항),
    competencyLevel: evaluateCompetencyLevel(ability.특기사항)
  }));
}

/**
 * Extract key strengths from ability description
 */
function extractKeyStrengths(description: string): string[] {
  const strengths: string[] = [];
  
  // Look for positive descriptors and achievements
  const patterns = [
    /우수한?\s*[\w\s]+/g,
    /뛰어난?\s*[\w\s]+/g,
    /탁월한?\s*[\w\s]+/g,
    /깊이\s*있는?\s*[\w\s]+/g
  ];
  
  patterns.forEach(pattern => {
    const matches = description.match(pattern);
    if (matches) {
      strengths.push(...matches.slice(0, 2).map(m => m.trim()));
    }
  });

  return strengths.slice(0, 3); // Max 3 strengths
}

/**
 * Identify skill areas from ability description
 */
function identifySkillAreas(description: string): string[] {
  const skills: string[] = [];
  const text = description.toLowerCase();
  
  const skillKeywords = {
    '분석력': ['분석', '해석', '논리'],
    '창의력': ['창의', '독창', '아이디어'],
    '탐구력': ['탐구', '연구', '조사'],
    '표현력': ['표현', '발표', '설명'],
    '응용력': ['응용', '활용', '적용'],
    '이해력': ['이해', '파악', '습득']
  };
  
  Object.entries(skillKeywords).forEach(([skill, keywords]) => {
    if (keywords.some(keyword => text.includes(keyword))) {
      skills.push(skill);
    }
  });
  
  return skills;
}

/**
 * Evaluate competency level from description
 */
function evaluateCompetencyLevel(description: string): ProcessedAbility['competencyLevel'] {
  const text = description.toLowerCase();
  
  const highLevelIndicators = ['우수', '뛰어난', '탁월', '깊이', '심화', '고차원'];
  const basicLevelIndicators = ['기초', '기본', '단순', '부족'];
  
  if (highLevelIndicators.some(indicator => text.includes(indicator))) {
    return 'high';
  }
  if (basicLevelIndicators.some(indicator => text.includes(indicator))) {
    return 'basic';
  }
  
  return 'medium';
}

// ===========================
// All utilities are exported individually above
// ===========================