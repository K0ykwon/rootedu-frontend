/**
 * PDF Template Generator
 *
 * Server-side HTML template generation for PDF export.
 * This avoids React rendering issues in API routes.
 */

import { EnhancedAcademicAnalysis, EnhancedAcademicAnalysisV2 } from '@/types/medsky-enhanced';

interface AnalysisData {
  textSections?: any;
  extractedData?: any;
  validationAnalysis?: any;
  aiKeywordAnalysis?: any;
  aiSectionScoring?: any;
  aiAcademicAnalysis?: EnhancedAcademicAnalysis;
  aiAcademicAnalysisV2?: EnhancedAcademicAnalysis; // Actually uses legacy schema, not V2
  aiMajorRecommendations?: any;
  nextSemesterPlan?: any;
  consultantSummary?: string;
}

export function generatePDFTemplate(
  sessionId: string,
  userName: string,
  analysisDate: string,
  analysisData: AnalysisData
): string {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTrendColor = (trend: string): string => {
    const colors: Record<string, string> = {
      '상승': '#22c55e',
      '하락': '#ef4444',
      '유지': '#3b82f6',
      '불안정': '#f97316',
    };
    return colors[trend] || '#6b7280';
  };

  const getPositionColor = (position: string): string => {
    const colors: Record<string, string> = {
      '상위권': '#22c55e',
      '중상위권': '#3b82f6',
      '중위권': '#eab308',
      '중하위권': '#f97316',
      '하위권': '#ef4444',
    };
    return colors[position] || '#6b7280';
  };

  const getCategoryColorForPDF = (category: string): string => {
    const colors: Record<string, string> = {
      '학업역량': '#3b82f6',
      '진로역량': '#22c55e',
      '공동체역량': '#a855f7',
      '창의성': '#f97316',
      '리더십': '#ef4444',
      '협력': '#6366f1',
      '문제해결': '#eab308',
      '의사소통': '#ec4899',
    };
    return colors[category] || '#6b7280';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#22c55e';
    if (score >= 80) return '#3b82f6';
    if (score >= 70) return '#eab308';
    if (score >= 60) return '#f97316';
    return '#ef4444';
  };

  const getCriteriaLabel = (criteria: string): string => {
    const labels: Record<string, string> = {
      depth: '깊이',
      relevance: '연관성',
      growth: '성장',
      uniqueness: '독창성',
      leadership: '리더십',
    };
    return labels[criteria] || criteria;
  };

  const getGradeColor = (grade: string): string => {
    const colors: Record<string, string> = {
      'A+': '#22c55e',
      'A': '#22c55e',
      'B+': '#3b82f6',
      'B': '#3b82f6',
      'C+': '#eab308',
      'C': '#eab308',
      'D+': '#f97316',
      'D': '#f97316',
      'F': '#ef4444',
    };
    return colors[grade] || '#6b7280';
  };

  const getGradeDescription = (grade: string): string => {
    const descriptions: Record<string, string> = {
      'A+': '매우 우수한 준비 상태',
      'A': '우수한 준비 상태',
      'B+': '양호한 수준',
      'B': '양호한 수준',
      'C+': '보통 수준',
      'C': '보통 수준',
      'D+': '보완이 필요한 수준',
      'D': '보완이 필요한 수준',
      'F': '상당한 개선이 필요',
    };
    return descriptions[grade] || '평가 중';
  };

  const getTrendIcon = (trend: string): string => {
    const icons: Record<string, string> = {
      '상승': '📈',
      '하락': '📉',
      '유지': '➡️',
      '불안정': '📊'
    };
    return icons[trend] || '➡️';
  };

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>생활기록부 분석 결과 - ${userName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #000;
      background: #fff;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 20mm;
      margin: 0 auto;
      background: white;
    }

    h1 {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 10mm;
      color: #1e293b;
      border-bottom: 3px solid #3b82f6;
      padding-bottom: 5mm;
    }

    h2 {
      font-size: 18pt;
      font-weight: bold;
      margin-top: 8mm;
      margin-bottom: 5mm;
      color: #1e40af;
      page-break-after: avoid;
    }

    h3 {
      font-size: 14pt;
      font-weight: bold;
      margin-top: 5mm;
      margin-bottom: 3mm;
      color: #334155;
    }

    h4 {
      font-size: 12pt;
      font-weight: bold;
      margin-top: 3mm;
      margin-bottom: 2mm;
      color: #475569;
    }

    p {
      margin-bottom: 3mm;
    }

    .cover-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 257mm;
      text-align: center;
      page-break-after: always;
    }

    .cover-title {
      font-size: 32pt;
      font-weight: bold;
      margin-bottom: 10mm;
      color: #1e40af;
    }

    .cover-subtitle {
      font-size: 20pt;
      margin-bottom: 20mm;
      color: #475569;
    }

    .cover-info {
      font-size: 14pt;
      line-height: 2;
      color: #64748b;
    }

    .section {
      margin-bottom: 10mm;
      page-break-inside: avoid;
    }

    .page-break {
      page-break-before: always;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 5mm 0;
      page-break-inside: avoid;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 3mm;
      text-align: left;
    }

    th {
      background-color: #f1f5f9;
      font-weight: bold;
      color: #1e293b;
    }

    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 9pt;
      font-weight: bold;
      color: white;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 5mm;
      margin: 5mm 0;
    }

    .metric-card {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 4mm;
      background: #f8fafc;
    }

    .metric-label {
      font-size: 10pt;
      color: #64748b;
      margin-bottom: 2mm;
    }

    .metric-value {
      font-size: 18pt;
      font-weight: bold;
      color: #1e293b;
    }

    .list-item {
      margin-left: 5mm;
      margin-bottom: 2mm;
    }

    .keyword-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3mm;
      margin: 5mm 0;
    }

    .keyword-item {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 3mm;
      text-align: center;
    }

    .keyword-name {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 1mm;
    }

    .keyword-count {
      font-size: 9pt;
      color: #64748b;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        margin: 0;
        border: none;
        box-shadow: none;
      }

      .page-break {
        page-break-before: always;
      }

      .no-break {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover-page">
    <div class="cover-title">생활기록부 분석 결과</div>
    <div class="cover-subtitle">AI 기반 종합 진로 역량 분석</div>
    <div class="cover-info">
      <div style="margin-bottom: 5mm;">
        <strong>학생명:</strong> ${userName}
      </div>
      <div style="margin-bottom: 5mm;">
        <strong>분석일:</strong> ${formatDate(analysisDate)}
      </div>
      <div>
        <strong>세션 ID:</strong> ${sessionId}
      </div>
    </div>
  </div>

  <!-- Analysis Overview -->
  ${analysisData.aiSectionScoring ? `
  <div class="page page-break">
    <h1>분석 개요</h1>

    <!-- Section 1: Hero Score Display -->
    <div class="section" style="text-align: center; background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); padding: 8mm; border-radius: 4mm; margin-bottom: 5mm;">
      <h2 style="margin-bottom: 5mm;">종합 평가 결과</h2>
      <div style="display: flex; align-items: center; justify-content: center; gap: 10mm;">
        <div style="text-align: center;">
          <div style="width: 35mm; height: 35mm; border-radius: 50%; background: ${getGradeColor(analysisData.aiSectionScoring.grade_equivalent)}; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
            <div>
              <div style="font-size: 28pt; font-weight: bold; color: white;">${analysisData.aiSectionScoring.overall_score}</div>
              <div style="font-size: 8pt; color: rgba(255,255,255,0.9);">/100</div>
            </div>
          </div>
          <div style="margin-top: 3mm;">
            <span class="badge" style="background-color: ${getGradeColor(analysisData.aiSectionScoring.grade_equivalent)}; color: white; padding: 2mm 4mm; border-radius: 3mm; font-weight: bold; font-size: 12pt;">
              ${analysisData.aiSectionScoring.grade_equivalent}
            </span>
          </div>
        </div>
        <div style="text-align: left;">
          <div style="font-size: 12pt; font-weight: 600; margin-bottom: 2mm;">${getGradeDescription(analysisData.aiSectionScoring.grade_equivalent)}</div>
          <div style="font-size: 9pt; color: #64748b; margin-bottom: 1mm;">상위 <strong style="color: #3b82f6;">${analysisData.aiSectionScoring.percentile_rank}%</strong> 수준</div>
          <div style="font-size: 8pt; color: #94a3b8;">종합 평가 점수</div>
        </div>
      </div>
    </div>

    <!-- Section 2: Competency Balance -->
    <div class="section">
      <h2 style="margin-bottom: 4mm;">📊 역량별 균형 분석</h2>
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 3mm;">
        <div style="text-align: center;">
          <div style="font-size: 16pt; margin-bottom: 2mm;">📚</div>
          <div style="font-size: 18pt; font-weight: bold; color: #3b82f6;">${analysisData.aiSectionScoring.competency_balance.academic}</div>
          <div style="font-size: 7pt; color: #64748b; margin: 1mm 0;">학업역량</div>
          <div style="width: 100%; background-color: #e2e8f0; height: 2mm; border-radius: 1mm; overflow: hidden;">
            <div style="width: ${analysisData.aiSectionScoring.competency_balance.academic}%; height: 100%; background: linear-gradient(to right, #3b82f6, #60a5fa);"></div>
          </div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 16pt; margin-bottom: 2mm;">🎯</div>
          <div style="font-size: 18pt; font-weight: bold; color: #a855f7;">${analysisData.aiSectionScoring.competency_balance.career}</div>
          <div style="font-size: 7pt; color: #64748b; margin: 1mm 0;">진로역량</div>
          <div style="width: 100%; background-color: #e2e8f0; height: 2mm; border-radius: 1mm; overflow: hidden;">
            <div style="width: ${analysisData.aiSectionScoring.competency_balance.career}%; height: 100%; background: linear-gradient(to right, #a855f7, #c084fc);"></div>
          </div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 16pt; margin-bottom: 2mm;">🤝</div>
          <div style="font-size: 18pt; font-weight: bold; color: #22c55e;">${analysisData.aiSectionScoring.competency_balance.community}</div>
          <div style="font-size: 7pt; color: #64748b; margin: 1mm 0;">공동체역량</div>
          <div style="width: 100%; background-color: #e2e8f0; height: 2mm; border-radius: 1mm; overflow: hidden;">
            <div style="width: ${analysisData.aiSectionScoring.competency_balance.community}%; height: 100%; background: linear-gradient(to right, #22c55e, #4ade80);"></div>
          </div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 16pt; margin-bottom: 2mm;">💡</div>
          <div style="font-size: 18pt; font-weight: bold; color: #f97316;">${analysisData.aiSectionScoring.competency_balance.creativity}</div>
          <div style="font-size: 7pt; color: #64748b; margin: 1mm 0;">창의역량</div>
          <div style="width: 100%; background-color: #e2e8f0; height: 2mm; border-radius: 1mm; overflow: hidden;">
            <div style="width: ${analysisData.aiSectionScoring.competency_balance.creativity}%; height: 100%; background: linear-gradient(to right, #f97316, #fb923c);"></div>
          </div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 16pt; margin-bottom: 2mm;">💪</div>
          <div style="font-size: 18pt; font-weight: bold; color: #ec4899;">${analysisData.aiSectionScoring.competency_balance.character}</div>
          <div style="font-size: 7pt; color: #64748b; margin: 1mm 0;">인성역량</div>
          <div style="width: 100%; background-color: #e2e8f0; height: 2mm; border-radius: 1mm; overflow: hidden;">
            <div style="width: ${analysisData.aiSectionScoring.competency_balance.character}%; height: 100%; background: linear-gradient(to right, #ec4899, #f472b6);"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 3: Quick Insights Grid -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; margin: 5mm 0;">
      <div style="text-align: center; padding: 3mm; background-color: #dbeafe; border: 2px solid #bfdbfe; border-radius: 3mm;">
        <div style="font-size: 20pt; margin-bottom: 1mm;">🔑</div>
        <div style="font-size: 18pt; font-weight: bold;">${analysisData.aiKeywordAnalysis?.overall_keywords?.length || 0}<span style="font-size: 9pt; color: #64748b; margin-left: 1mm;">개</span></div>
        <div style="font-size: 7pt; font-weight: 600; color: #1e40af; margin: 1mm 0;">핵심 키워드</div>
        <div style="font-size: 6pt; color: #64748b;">추출된 역량 키워드</div>
      </div>
      <div style="text-align: center; padding: 3mm; background-color: #dcfce7; border: 2px solid #bbf7d0; border-radius: 3mm;">
        <div style="font-size: 20pt; margin-bottom: 1mm;">📖</div>
        <div style="font-size: 18pt; font-weight: bold;">${analysisData.aiAcademicAnalysisV2?.subject_analysis?.length || 0}<span style="font-size: 9pt; color: #64748b; margin-left: 1mm;">과목</span></div>
        <div style="font-size: 7pt; font-weight: 600; color: #15803d; margin: 1mm 0;">교과목 분석</div>
        <div style="font-size: 6pt; color: #64748b;">학업 성취도 분석</div>
      </div>
      <div style="text-align: center; padding: 3mm; background-color: #f3e8ff; border: 2px solid #e9d5ff; border-radius: 3mm;">
        <div style="font-size: 20pt; margin-bottom: 1mm;">🎓</div>
        <div style="font-size: 18pt; font-weight: bold;">${analysisData.aiMajorRecommendations?.top_recommendations?.[0]?.match_score || 0}<span style="font-size: 9pt; color: #64748b; margin-left: 1mm;">%</span></div>
        <div style="font-size: 7pt; font-weight: 600; color: #7e22ce; margin: 1mm 0;">전공 적합도</div>
        <div style="font-size: 6pt; color: #64748b;">${analysisData.aiMajorRecommendations?.top_recommendations?.[0]?.major_name || '분석 대기중'}</div>
      </div>
      <div style="text-align: center; padding: 3mm; background-color: #e0e7ff; border: 2px solid #c7d2fe; border-radius: 3mm;">
        <div style="font-size: 20pt; margin-bottom: 1mm;">🏆</div>
        <div style="font-size: 18pt; font-weight: bold;">${analysisData.aiSectionScoring.overall_score}<span style="font-size: 9pt; color: #64748b; margin-left: 1mm;">점</span></div>
        <div style="font-size: 7pt; font-weight: 600; color: #4338ca; margin: 1mm 0;">종합 평가</div>
        <div style="font-size: 6pt; color: #64748b;">${analysisData.aiSectionScoring.grade_equivalent} 등급</div>
      </div>
    </div>

    <!-- Section 4: Top Keywords -->
    ${analysisData.aiKeywordAnalysis?.overall_keywords?.length > 0 ? `
    <div class="section">
      <h2 style="margin-bottom: 3mm;">🔑 핵심 역량 키워드 (Top ${Math.min(10, analysisData.aiKeywordAnalysis.overall_keywords.length)})</h2>
      <div style="display: flex; flex-wrap: wrap; gap: 2mm;">
        ${analysisData.aiKeywordAnalysis.overall_keywords.slice(0, 10).map((keyword: any) => `
          <div style="padding: 2mm 3mm; border-radius: 3mm; border: 2px solid ${getCategoryColorForPDF(keyword.category)}20; background-color: ${getCategoryColorForPDF(keyword.category)}10;">
            <span style="font-weight: 600; font-size: 9pt;">${keyword.keyword}</span>
            <span style="font-size: 7pt; color: #64748b; margin-left: 1mm;">${Math.round(keyword.relevance_score * 100)}%</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Section 5: Strengths & Improvement Areas -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin: 5mm 0;">
      ${analysisData.aiKeywordAnalysis?.student_strengths?.length > 0 ? `
      <div style="background-color: #dcfce7; padding: 4mm; border-radius: 3mm; border: 2px solid #bbf7d0;">
        <h3 style="color: #15803d; margin-bottom: 3mm; font-size: 11pt;">✨ 주요 강점 영역</h3>
        <div style="font-size: 8pt;">
          ${analysisData.aiKeywordAnalysis.student_strengths.slice(0, 5).map((strength: string, idx: number) => `
            <div style="display: flex; align-items: start; margin-bottom: 2mm;">
              <span style="width: 5mm; height: 5mm; background-color: #22c55e; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 6pt; font-weight: bold; margin-right: 2mm; flex-shrink: 0;">${idx + 1}</span>
              <span style="color: #15803d;">${strength}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : '<div></div>'}
      ${analysisData.aiKeywordAnalysis?.improvement_areas?.length > 0 ? `
      <div style="background-color: #fed7aa; padding: 4mm; border-radius: 3mm; border: 2px solid #fdba74;">
        <h3 style="color: #c2410c; margin-bottom: 3mm; font-size: 11pt;">🎯 중점 개선 영역</h3>
        <div style="font-size: 8pt;">
          ${analysisData.aiKeywordAnalysis.improvement_areas.slice(0, 5).map((area: string, idx: number) => `
            <div style="display: flex; align-items: start; margin-bottom: 2mm;">
              <span style="width: 5mm; height: 5mm; background-color: #f97316; color: white; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 6pt; font-weight: bold; margin-right: 2mm; flex-shrink: 0;">${idx + 1}</span>
              <span style="color: #c2410c;">${area}</span>
            </div>
          `).join('')}
        </div>
      </div>
      ` : '<div></div>'}
    </div>

    <!-- Section 6: Overall Feedback -->
    <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); padding: 5mm; border-radius: 3mm; border: 2px solid #93c5fd;">
      <h2 style="color: #1e3a8a; margin-bottom: 3mm; font-size: 12pt;">📝 전문가 종합 의견</h2>
      <p style="font-size: 9pt; color: #1e293b; line-height: 1.6; white-space: pre-line;">
        ${analysisData.aiSectionScoring.overall_feedback}
      </p>
    </div>
  </div>
  ` : `
  <div class="page">
    <h1>분석 개요</h1>
    <div class="section">
      <p>AI 분석이 아직 완료되지 않았습니다. 세부 분석을 먼저 진행해주세요.</p>
    </div>
  </div>
  `}

  ${analysisData.aiKeywordAnalysis ? `
  <div class="page page-break">
    <h1>키워드 분석</h1>

    ${analysisData.aiKeywordAnalysis.overall_keywords?.length > 0 ? `
    <div class="section">
      <h2>핵심 키워드 (전체)</h2>
      <div class="keyword-grid">
        ${analysisData.aiKeywordAnalysis.overall_keywords.map((keyword: any) => `
          <div class="keyword-item" style="border-left: 3px solid ${getCategoryColorForPDF(keyword.category)};">
            <div class="keyword-name">${keyword.keyword}</div>
            <div style="font-size: 7pt; color: #64748b; margin: 1mm 0;">
              <span class="badge" style="background-color: ${getCategoryColorForPDF(keyword.category)}; padding: 1mm 2mm; border-radius: 2mm; color: white; font-size: 7pt;">
                ${keyword.category}
              </span>
              <span style="margin-left: 2mm;">${Math.round(keyword.relevance_score * 100)}%</span>
            </div>
            <div style="font-size: 7pt; color: #475569; margin-top: 1mm;">${keyword.competency_indicator || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${analysisData.aiKeywordAnalysis.student_strengths?.length > 0 || analysisData.aiKeywordAnalysis.improvement_areas?.length > 0 ? `
    <div class="section">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5mm;">
        ${analysisData.aiKeywordAnalysis.student_strengths?.length > 0 ? `
        <div>
          <h3 style="color: #059669; margin-bottom: 3mm;">💪 주요 강점</h3>
          <ul style="margin-left: 5mm;">
            ${analysisData.aiKeywordAnalysis.student_strengths.map((strength: string) => `
              <li style="margin-bottom: 2mm;">${strength}</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
        ${analysisData.aiKeywordAnalysis.improvement_areas?.length > 0 ? `
        <div>
          <h3 style="color: #ea580c; margin-bottom: 3mm;">🎯 개선 영역</h3>
          <ul style="margin-left: 5mm;">
            ${analysisData.aiKeywordAnalysis.improvement_areas.map((area: string) => `
              <li style="margin-bottom: 2mm;">${area}</li>
            `).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${analysisData.aiKeywordAnalysis.sections?.length > 0 ? `
    <div class="section">
      <h2>섹션별 키워드 분석</h2>
      ${analysisData.aiKeywordAnalysis.sections.map((section: any) => `
        <div style="margin-bottom: 5mm; page-break-inside: avoid;">
          <h3 style="color: #3b82f6; border-bottom: 1px solid #cbd5e1; padding-bottom: 2mm; margin-bottom: 2mm;">
            ${section.section_name}
          </h3>
          ${section.section_summary ? `<p style="font-size: 9pt; color: #64748b; margin-bottom: 3mm;">${section.section_summary}</p>` : ''}
          ${section.keywords?.length > 0 ? `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2mm;">
              ${section.keywords.slice(0, 9).map((keyword: any) => `
                <div style="font-size: 8pt; padding: 2mm; background-color: #f8fafc; border-radius: 2mm;">
                  <strong>${keyword.keyword}</strong>
                  <br/>
                  <span style="color: #64748b; font-size: 7pt;">${keyword.category}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${analysisData.aiSectionScoring && analysisData.aiSectionScoring.section_scores?.length > 0 ? `
  <div class="page page-break">
    <h1>영역별 점수</h1>

    <!-- Overall Score Summary -->
    <div class="section" style="text-align: center; background-color: #f8fafc; padding: 5mm; border-radius: 3mm; margin-bottom: 5mm;">
      <div style="display: flex; justify-content: center; gap: 10mm; align-items: center;">
        <div>
          <div style="font-size: 36pt; font-weight: bold; color: ${getScoreColor(analysisData.aiSectionScoring.overall_score)};">
            ${analysisData.aiSectionScoring.overall_score}
          </div>
          <div style="font-size: 9pt; color: #64748b;">종합 점수</div>
        </div>
        <div>
          <div style="font-size: 24pt; font-weight: bold; color: ${getGradeColor(analysisData.aiSectionScoring.grade_equivalent)};">
            ${analysisData.aiSectionScoring.grade_equivalent}
          </div>
          <div style="font-size: 9pt; color: #64748b;">등급</div>
        </div>
        <div>
          <div style="font-size: 24pt; font-weight: bold; color: #3b82f6;">
            ${analysisData.aiSectionScoring.percentile_rank}%
          </div>
          <div style="font-size: 9pt; color: #64748b;">상위 백분위</div>
        </div>
      </div>
    </div>

    <!-- Competency Balance -->
    <div class="section">
      <h2 style="margin-bottom: 4mm;">📊 역량별 점수</h2>
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 3mm; margin-bottom: 5mm;">
        <div style="text-align: center; padding: 3mm; background-color: #f8fafc; border-radius: 3mm;">
          <div style="font-size: 18pt; font-weight: bold; color: #3b82f6;">${analysisData.aiSectionScoring.competency_balance.academic}</div>
          <div style="font-size: 7pt; color: #64748b; margin-top: 1mm;">학업역량</div>
        </div>
        <div style="text-align: center; padding: 3mm; background-color: #f8fafc; border-radius: 3mm;">
          <div style="font-size: 18pt; font-weight: bold; color: #a855f7;">${analysisData.aiSectionScoring.competency_balance.career}</div>
          <div style="font-size: 7pt; color: #64748b; margin-top: 1mm;">진로역량</div>
        </div>
        <div style="text-align: center; padding: 3mm; background-color: #f8fafc; border-radius: 3mm;">
          <div style="font-size: 18pt; font-weight: bold; color: #22c55e;">${analysisData.aiSectionScoring.competency_balance.community}</div>
          <div style="font-size: 7pt; color: #64748b; margin-top: 1mm;">공동체역량</div>
        </div>
        <div style="text-align: center; padding: 3mm; background-color: #f8fafc; border-radius: 3mm;">
          <div style="font-size: 18pt; font-weight: bold; color: #f97316;">${analysisData.aiSectionScoring.competency_balance.creativity}</div>
          <div style="font-size: 7pt; color: #64748b; margin-top: 1mm;">창의역량</div>
        </div>
        <div style="text-align: center; padding: 3mm; background-color: #f8fafc; border-radius: 3mm;">
          <div style="font-size: 18pt; font-weight: bold; color: #ec4899;">${analysisData.aiSectionScoring.competency_balance.character}</div>
          <div style="font-size: 7pt; color: #64748b; margin-top: 1mm;">인성역량</div>
        </div>
      </div>
    </div>

    <!-- Section Detailed Scores -->
    <div class="section">
      <h2 style="margin-bottom: 4mm;">📋 섹션별 상세 채점</h2>
      ${analysisData.aiSectionScoring.section_scores.map((section: any) => `
        <div style="page-break-inside: avoid; margin-bottom: 6mm; border: 1px solid #e2e8f0; border-radius: 3mm; padding: 4mm;">
          <!-- Section Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3mm; padding-bottom: 2mm; border-bottom: 2px solid #cbd5e1;">
            <h3 style="font-size: 12pt; color: #1e293b; margin: 0;">${section.section_name}</h3>
            <div style="font-size: 20pt; font-weight: bold; color: ${getScoreColor(section.score)};">
              ${section.score}점
            </div>
          </div>

          <!-- Criteria Scores -->
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 2mm; margin-bottom: 3mm;">
            ${Object.entries(section.criteria_scores).map(([criteria, score]: [string, any]) => `
              <div style="text-align: center; padding: 2mm; border: 1px solid #e2e8f0; border-radius: 2mm;">
                <div style="font-size: 14pt; font-weight: bold; color: ${getScoreColor(score)};">
                  ${score}
                </div>
                <div style="font-size: 7pt; color: #64748b;">${getCriteriaLabel(criteria)}</div>
              </div>
            `).join('')}
          </div>

          <!-- Strengths, Weaknesses, Improvements -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 3mm;">
            <!-- Strengths -->
            <div>
              <h4 style="font-size: 9pt; color: #059669; margin-bottom: 2mm; display: flex; align-items: center;">
                <span style="margin-right: 1mm;">✅</span> 강점
              </h4>
              <ul style="margin: 0; padding-left: 5mm; font-size: 8pt;">
                ${section.strengths.map((strength: string) => `
                  <li style="margin-bottom: 1mm; color: #1e293b;">
                    <span style="display: inline-block; width: 1mm; height: 1mm; background-color: #22c55e; border-radius: 50%; margin-right: 1mm;"></span>
                    ${strength}
                  </li>
                `).join('')}
              </ul>
            </div>

            <!-- Weaknesses -->
            <div>
              <h4 style="font-size: 9pt; color: #c2410c; margin-bottom: 2mm; display: flex; align-items: center;">
                <span style="margin-right: 1mm;">⚠️</span> 약점
              </h4>
              <ul style="margin: 0; padding-left: 5mm; font-size: 8pt;">
                ${section.weaknesses.map((weakness: string) => `
                  <li style="margin-bottom: 1mm; color: #1e293b;">
                    <span style="display: inline-block; width: 1mm; height: 1mm; background-color: #f97316; border-radius: 50%; margin-right: 1mm;"></span>
                    ${weakness}
                  </li>
                `).join('')}
              </ul>
            </div>
          </div>

          <!-- Improvement Suggestions -->
          <div>
            <h4 style="font-size: 9pt; color: #1e40af; margin-bottom: 2mm; display: flex; align-items: center;">
              <span style="margin-right: 1mm;">💡</span> 개선 제안
            </h4>
            <ul style="margin: 0; padding-left: 5mm; font-size: 8pt;">
              ${section.improvement_suggestions.map((suggestion: string) => `
                <li style="margin-bottom: 1mm; color: #1e293b;">
                  <span style="display: inline-block; width: 1mm; height: 1mm; background-color: #3b82f6; border-radius: 50%; margin-right: 1mm;"></span>
                  ${suggestion}
                </li>
              `).join('')}
            </ul>
          </div>

          <!-- Evidence Highlights -->
          ${section.evidence_highlights?.length > 0 && section.evidence_highlights[0] !== '' ? `
          <div style="margin-top: 3mm;">
            <h4 style="font-size: 9pt; color: #7e22ce; margin-bottom: 2mm; display: flex; align-items: center;">
              <span style="margin-right: 1mm;">⭐</span> 높은 평가 활동
            </h4>
            <ul style="margin: 0; padding-left: 5mm; font-size: 8pt;">
              ${section.evidence_highlights.map((highlight: string) => `
                <li style="margin-bottom: 1mm; color: #1e293b;">
                  <span style="display: inline-block; width: 1mm; height: 1mm; background-color: #a855f7; border-radius: 50%; margin-right: 1mm;"></span>
                  ${highlight}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${analysisData.aiAcademicAnalysisV2 ? `
  <div class="page page-break">
    <h1>학업 성취도 분석</h1>

    ${analysisData.aiAcademicAnalysisV2.overall_academic_trends ? `
    <div class="section" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 5mm; border-radius: 3mm; margin-bottom: 5mm;">
      <h2 style="color: #065f46; margin-bottom: 4mm;">📈 전체 학업 추세</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; margin-bottom: 4mm;">
        ${analysisData.aiAcademicAnalysisV2.overall_academic_trends.gpa_trend ? `
        <div style="text-align: center; padding: 3mm; background-color: white; border-radius: 3mm; border: 2px solid #6ee7b7;">
          <div style="font-size: 8pt; color: #64748b; margin-bottom: 1mm;">성적 추세</div>
          <div style="font-size: 20pt; font-weight: bold; margin: 2mm 0;">
            ${getTrendIcon(analysisData.aiAcademicAnalysisV2.overall_academic_trends.gpa_trend)}
          </div>
          <div style="font-size: 12pt; font-weight: bold; color: ${getTrendColor(analysisData.aiAcademicAnalysisV2.overall_academic_trends.gpa_trend)};">
            ${analysisData.aiAcademicAnalysisV2.overall_academic_trends.gpa_trend}
          </div>
        </div>
        ` : ''}
        ${analysisData.aiAcademicAnalysisV2.overall_academic_trends.improvement_rate !== undefined ? `
        <div style="text-align: center; padding: 3mm; background-color: white; border-radius: 3mm; border: 2px solid #6ee7b7;">
          <div style="font-size: 8pt; color: #64748b; margin-bottom: 1mm;">향상도</div>
          <div style="font-size: 24pt; font-weight: bold; color: ${analysisData.aiAcademicAnalysisV2.overall_academic_trends.improvement_rate >= 0 ? '#22c55e' : '#ef4444'}; margin: 2mm 0;">
            ${analysisData.aiAcademicAnalysisV2.overall_academic_trends.improvement_rate > 0 ? '+' : ''}${analysisData.aiAcademicAnalysisV2.overall_academic_trends.improvement_rate.toFixed(1)}
          </div>
          <div style="font-size: 8pt; color: #64748b;">포인트 변화</div>
        </div>
        ` : ''}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5mm;">
        ${analysisData.aiAcademicAnalysisV2.overall_academic_trends.strong_subjects?.length > 0 ? `
        <div style="background-color: white; padding: 3mm; border-radius: 3mm; border: 2px solid #6ee7b7;">
          <h4 style="color: #059669; font-size: 10pt; margin-bottom: 2mm;">💪 강점 과목</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 1mm;">
            ${analysisData.aiAcademicAnalysisV2.overall_academic_trends.strong_subjects.map((subject: string) => `
              <span style="padding: 1mm 2mm; background-color: #d1fae5; color: #065f46; border-radius: 2mm; font-size: 8pt; font-weight: 600;">
                ${subject}
              </span>
            `).join('')}
          </div>
        </div>
        ` : ''}
        ${analysisData.aiAcademicAnalysisV2.overall_academic_trends.weak_subjects?.length > 0 ? `
        <div style="background-color: white; padding: 3mm; border-radius: 3mm; border: 2px solid #fed7aa;">
          <h4 style="color: #c2410c; font-size: 10pt; margin-bottom: 2mm;">🎯 개선 필요 과목</h4>
          <div style="display: flex; flex-wrap: wrap; gap: 1mm;">
            ${analysisData.aiAcademicAnalysisV2.overall_academic_trends.weak_subjects.map((subject: string) => `
              <span style="padding: 1mm 2mm; background-color: #fed7aa; color: #9a3412; border-radius: 2mm; font-size: 8pt; font-weight: 600;">
                ${subject}
              </span>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}

    ${analysisData.aiAcademicAnalysisV2.subject_analysis?.length > 0 ? `
    <div class="section">
      <h2 style="margin-bottom: 4mm;">📚 과목별 상세 분석</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3mm;">
        ${analysisData.aiAcademicAnalysisV2.subject_analysis.map((subject: any) => `
          <div style="border: 1px solid #e2e8f0; border-radius: 3mm; padding: 3mm; background-color: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; padding-bottom: 2mm; border-bottom: 1px solid #cbd5e1;">
              <strong style="font-size: 10pt; color: #1e293b;">${subject.subject || '-'}</strong>
              <span style="font-size: 7pt; color: #64748b;">${subject.semester || '-'}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2mm; margin-bottom: 2mm;">
              <div style="text-align: center; padding: 1.5mm; background-color: white; border-radius: 2mm;">
                <div style="font-size: 16pt; font-weight: bold; color: ${getScoreColor(subject.college_readiness || 0)};">
                  ${subject.college_readiness || 0}%
                </div>
                <div style="font-size: 6pt; color: #64748b;">준비도</div>
              </div>
              <div style="text-align: center; padding: 1.5mm; background-color: white; border-radius: 2mm;">
                ${subject.performance_trend ? `
                  <div style="font-size: 14pt; margin-bottom: 0.5mm;">
                    ${getTrendIcon(subject.performance_trend)}
                  </div>
                  <div style="font-size: 6pt; color: ${getTrendColor(subject.performance_trend)}; font-weight: 600;">
                    ${subject.performance_trend}
                  </div>
                ` : '<div style="font-size: 7pt; color: #94a3b8;">-</div>'}
              </div>
            </div>

            ${subject.grade_analysis?.relative_position ? `
            <div style="text-align: center; padding: 1.5mm; background-color: ${getPositionColor(subject.grade_analysis.relative_position)}20; border-radius: 2mm;">
              <span style="font-size: 8pt; font-weight: 600; color: ${getPositionColor(subject.grade_analysis.relative_position)};">
                ${subject.grade_analysis.relative_position}
              </span>
            </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${analysisData.aiAcademicAnalysisV2.college_entrance_readiness ? `
    <div class="section" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 5mm; border-radius: 3mm; margin-top: 5mm;">
      <h2 style="color: #1e3a8a; margin-bottom: 4mm;">🎓 대학 진학 준비도</h2>

      <div style="text-align: center; margin-bottom: 5mm;">
        ${analysisData.aiAcademicAnalysisV2.college_entrance_readiness.overall_readiness ? `
        <div style="display: inline-block; padding: 5mm; background-color: white; border-radius: 50%; border: 4px solid #3b82f6; margin-bottom: 2mm;">
          <div style="font-size: 32pt; font-weight: bold; color: #3b82f6;">
            ${analysisData.aiAcademicAnalysisV2.college_entrance_readiness.overall_readiness}
          </div>
        </div>
        <div style="font-size: 10pt; color: #1e40af; font-weight: 600;">전체 준비도</div>
        ` : ''}
      </div>

      ${analysisData.aiAcademicAnalysisV2.college_entrance_readiness.competitive_position ? `
      <div style="text-align: center; padding: 3mm; background-color: white; border-radius: 3mm; margin-bottom: 4mm; border: 2px solid #93c5fd;">
        <div style="font-size: 14pt; font-weight: bold; color: #2563eb; margin-bottom: 1mm;">
          ${analysisData.aiAcademicAnalysisV2.college_entrance_readiness.competitive_position}
        </div>
        <div style="font-size: 7pt; color: #64748b;">경쟁력 위치</div>
      </div>
      ` : ''}

      ${analysisData.aiAcademicAnalysisV2.college_entrance_readiness.recommendations?.length > 0 ? `
      <div style="background-color: white; padding: 4mm; border-radius: 3mm; border: 2px solid #93c5fd;">
        <h3 style="color: #1e40af; font-size: 10pt; margin-bottom: 3mm;">💡 맞춤 제안 사항</h3>
        <ul style="margin: 0; padding-left: 5mm; font-size: 8pt;">
          ${analysisData.aiAcademicAnalysisV2.college_entrance_readiness.recommendations.map((rec: string) => `
            <li style="margin-bottom: 2mm; color: #1e293b; line-height: 1.4;">
              <span style="display: inline-block; width: 1mm; height: 1mm; background-color: #3b82f6; border-radius: 50%; margin-right: 2mm;"></span>
              ${rec}
            </li>
          `).join('')}
        </ul>
      </div>
      ` : ''}
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${analysisData.aiMajorRecommendations && analysisData.aiMajorRecommendations.top_recommendations?.length > 0 ? `
  <div class="page page-break">
    <h1>전공 추천</h1>

    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); padding: 4mm; border-radius: 3mm; margin-bottom: 5mm;">
      <div style="display: flex; align-items: center; gap: 3mm; margin-bottom: 2mm;">
        <div style="width: 10mm; height: 10mm; border-radius: 50%; background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%); display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 14pt;">🎓</span>
        </div>
        <div>
          <h2 style="color: #7e22ce; margin: 0; font-size: 14pt;">전공 적성 평가</h2>
          <p style="font-size: 8pt; color: #64748b; margin: 1mm 0 0 0;">학생 프로필 기반 맞춤형 전공 및 진로 추천</p>
        </div>
      </div>
    </div>

    <!-- Top Recommendations -->
    <div class="section">
      <h2 style="margin-bottom: 4mm;">🏆 추천 전공 TOP 3</h2>
      ${analysisData.aiMajorRecommendations.top_recommendations.map((major: any, index: number) => `
        <div style="page-break-inside: avoid; margin-bottom: 5mm; padding: 4mm; border-radius: 3mm; background: linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%); border: 2px solid #e9d5ff;">
          <!-- Major Header -->
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 3mm;">
            <div style="display: flex; align-items: start; gap: 3mm;">
              <div style="width: 8mm; height: 8mm; border-radius: 50%; background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                <span style="color: white; font-weight: bold; font-size: 10pt;">${index + 1}</span>
              </div>
              <div>
                <h3 style="font-size: 12pt; color: #6b21a8; margin: 0 0 1mm 0;">${major.major_name}</h3>
                <div style="display: flex; gap: 2mm; margin-top: 1mm;">
                  <span style="padding: 1mm 2mm; background-color: ${getScoreColor(major.match_score)}; color: white; border-radius: 2mm; font-size: 7pt; font-weight: 600;">
                    적합도 ${major.match_score}%
                  </span>
                  <span style="padding: 1mm 2mm; background-color: ${getScoreColor(major.current_preparation_level)}; color: white; border-radius: 2mm; font-size: 7pt; font-weight: 600;">
                    준비도 ${major.current_preparation_level}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Universities -->
          ${major.university_examples?.length > 0 ? `
          <div style="margin-bottom: 3mm;">
            <h4 style="font-size: 8pt; color: #64748b; margin-bottom: 1.5mm;">추천 대학교</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 1mm;">
              ${major.university_examples.map((university: string) => `
                <span style="padding: 1mm 2mm; background-color: #dbeafe; color: #1e40af; border-radius: 2mm; font-size: 7pt;">
                  ${university}
                </span>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Match Reasons -->
          ${major.match_reasons?.length > 0 ? `
          <div style="margin-bottom: 3mm;">
            <h4 style="font-size: 8pt; color: #059669; margin-bottom: 1.5mm; display: flex; align-items: center;">
              <span style="margin-right: 1mm;">✨</span> 추천 이유
            </h4>
            <ul style="margin: 0; padding-left: 5mm; font-size: 7pt;">
              ${major.match_reasons.map((reason: string) => `
                <li style="margin-bottom: 1mm; color: #1e293b; line-height: 1.4;">
                  <span style="display: inline-block; width: 1mm; height: 1mm; background-color: #22c55e; border-radius: 50%; margin-right: 1mm;"></span>
                  ${reason}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3mm;">
            <!-- Required Subjects -->
            ${major.required_subjects?.length > 0 ? `
            <div>
              <h4 style="font-size: 8pt; color: #1e40af; margin-bottom: 1.5mm; display: flex; align-items: center;">
                <span style="margin-right: 1mm;">📚</span> 필수 과목
              </h4>
              <div style="display: flex; flex-wrap: wrap; gap: 1mm;">
                ${major.required_subjects.map((subject: string) => `
                  <span style="padding: 1mm 2mm; background-color: #dbeafe; color: #1e40af; border: 1px solid #93c5fd; border-radius: 2mm; font-size: 7pt;">
                    ${subject}
                  </span>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <!-- Career Prospects -->
            ${major.career_prospects?.length > 0 ? `
            <div>
              <h4 style="font-size: 8pt; color: #7e22ce; margin-bottom: 1.5mm; display: flex; align-items: center;">
                <span style="margin-right: 1mm;">🚀</span> 진로 전망
              </h4>
              <ul style="margin: 0; padding-left: 5mm; font-size: 7pt;">
                ${major.career_prospects.slice(0, 3).map((career: string) => `
                  <li style="margin-bottom: 0.5mm; color: #1e293b;">
                    <span style="display: inline-block; width: 0.8mm; height: 0.8mm; background-color: #a855f7; border-radius: 50%; margin-right: 1mm;"></span>
                    ${career}
                  </li>
                `).join('')}
              </ul>
            </div>
            ` : ''}
          </div>

          <!-- Related Activities -->
          ${major.related_activities?.length > 0 ? `
          <div style="margin-top: 3mm; padding-top: 2mm; border-top: 1px solid #e9d5ff;">
            <h4 style="font-size: 8pt; color: #c2410c; margin-bottom: 1.5mm; display: flex; align-items: center;">
              <span style="margin-right: 1mm;">🎯</span> 추천 활동
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 1mm;">
              ${major.related_activities.map((activity: string) => `
                <span style="padding: 1mm 2mm; background-color: #fed7aa; color: #9a3412; border: 1px solid #fdba74; border-radius: 2mm; font-size: 7pt;">
                  ${activity}
                </span>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>

    <!-- Alternative Options -->
    ${analysisData.aiMajorRecommendations.alternative_options?.length > 0 ? `
    <div class="section" style="margin-top: 5mm;">
      <h2 style="margin-bottom: 3mm; color: #64748b; font-size: 11pt;">📌 대안 전공</h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3mm;">
        ${analysisData.aiMajorRecommendations.alternative_options.slice(0, 4).map((major: any) => `
          <div style="padding: 3mm; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 2mm;">
            <h4 style="font-size: 9pt; color: #1e293b; margin-bottom: 1mm;">${major.major_name}</h4>
            <div style="display: flex; gap: 2mm; margin-bottom: 2mm;">
              <span style="font-size: 7pt; color: #64748b;">적합도: <strong style="color: ${getScoreColor(major.match_score)};">${major.match_score}%</strong></span>
            </div>
            ${major.university_examples?.length > 0 ? `
            <div style="font-size: 6pt; color: #64748b;">
              ${major.university_examples.slice(0, 3).join(', ')}
            </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${analysisData.nextSemesterPlan ? `
  <div class="page page-break">
    <h1>차학기 학습 계획</h1>

    <div style="background: linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%); padding: 4mm; border-radius: 3mm; margin-bottom: 5mm;">
      <div style="display: flex; align-items: center; gap: 3mm;">
        <div style="width: 10mm; height: 10mm; border-radius: 50%; background: linear-gradient(135deg, #a855f7 0%, #3b82f6 100%); display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 14pt;">📋</span>
        </div>
        <div>
          <h2 style="color: #7e22ce; margin: 0; font-size: 14pt;">AI 차학기 학습 계획</h2>
          <p style="font-size: 8pt; color: #64748b; margin: 1mm 0 0 0;">개인 맞춤형 학습 전략 및 역량 개발 로드맵</p>
        </div>
      </div>
    </div>

    ${analysisData.nextSemesterPlan.academic_plan?.semester_goals?.length > 0 ? `
    <div class="section" style="background-color: #f0f9ff; padding: 4mm; border-radius: 3mm; border: 2px solid #bae6fd; margin-bottom: 5mm;">
      <h2 style="color: #0c4a6e; margin-bottom: 3mm; font-size: 12pt; display: flex; align-items: center;">
        <span style="margin-right: 2mm;">🎯</span> 학기 목표
      </h2>
      <div style="display: grid; grid-template-columns: 1fr; gap: 2mm;">
        ${analysisData.nextSemesterPlan.academic_plan.semester_goals.map((goal: string, index: number) => `
          <div style="display: flex; align-items: start; padding: 2mm; background-color: white; border-radius: 2mm; border-left: 3px solid #0ea5e9;">
            <div style="width: 6mm; height: 6mm; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 7pt; font-weight: bold; margin-right: 2mm; flex-shrink: 0;">
              ${index + 1}
            </div>
            <span style="font-size: 8pt; color: #1e293b; line-height: 1.5;">${goal}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    ${analysisData.nextSemesterPlan.academic_plan?.priority_subjects?.length > 0 ? `
    <div class="section">
      <h2 style="color: #7e22ce; margin-bottom: 4mm; font-size: 12pt; display: flex; align-items: center;">
        <span style="margin-right: 2mm;">📚</span> 우선 개선 과목
      </h2>
      ${analysisData.nextSemesterPlan.academic_plan.priority_subjects.map((subject: any) => `
        <div style="page-break-inside: avoid; margin-bottom: 4mm; padding: 4mm; border-radius: 3mm; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 2px solid #e9d5ff;">
          <!-- Subject Header -->
          <div style="margin-bottom: 3mm; padding-bottom: 2mm; border-bottom: 2px solid #d8b4fe;">
            <h3 style="font-size: 11pt; color: #6b21a8; margin: 0;">${subject.subject}</h3>
          </div>

          <!-- Current Level & Target -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; margin-bottom: 3mm;">
            ${subject.current_level ? `
            <div style="padding: 2mm; background-color: white; border-radius: 2mm; border: 1px solid #e9d5ff;">
              <div style="font-size: 7pt; color: #64748b; margin-bottom: 1mm;">현재 수준</div>
              <div style="font-size: 9pt; font-weight: 600; color: #7c3aed;">${subject.current_level}</div>
            </div>
            ` : ''}
            ${subject.target_improvement ? `
            <div style="padding: 2mm; background-color: white; border-radius: 2mm; border: 1px solid #d1fae5;">
              <div style="font-size: 7pt; color: #64748b; margin-bottom: 1mm;">목표</div>
              <div style="font-size: 9pt; font-weight: 600; color: #059669;">${subject.target_improvement}</div>
            </div>
            ` : ''}
          </div>

          <!-- Strategies -->
          ${subject.specific_strategies?.length > 0 ? `
          <div style="background-color: white; padding: 3mm; border-radius: 2mm; border: 1px solid #e9d5ff;">
            <h4 style="font-size: 9pt; color: #7e22ce; margin-bottom: 2mm; display: flex; align-items: center;">
              <span style="margin-right: 1mm;">💡</span> 학습 전략
            </h4>
            <ul style="margin: 0; padding-left: 5mm; font-size: 7pt;">
              ${subject.specific_strategies.map((strategy: string) => `
                <li style="margin-bottom: 1.5mm; color: #1e293b; line-height: 1.4;">
                  <span style="display: inline-block; width: 1mm; height: 1mm; background-color: #a855f7; border-radius: 50%; margin-right: 1mm;"></span>
                  ${strategy}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <!-- Time Allocation -->
          ${subject.time_allocation ? `
          <div style="margin-top: 2mm; padding: 2mm; background-color: #fef3c7; border-radius: 2mm; border: 1px solid #fde047;">
            <div style="font-size: 7pt; color: #92400e;">
              <strong>⏰ 권장 학습 시간:</strong> ${subject.time_allocation}
            </div>
          </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Extracurricular Recommendations -->
    ${analysisData.nextSemesterPlan.academic_plan?.extracurricular_recommendations?.length > 0 ? `
    <div class="section" style="margin-top: 5mm;">
      <h2 style="color: #c2410c; margin-bottom: 4mm; font-size: 12pt; display: flex; align-items: center;">
        <span style="margin-right: 2mm;">🌟</span> 추천 비교과 활동
      </h2>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3mm;">
        ${analysisData.nextSemesterPlan.academic_plan.extracurricular_recommendations.map((activity: any) => `
          <div style="padding: 3mm; background-color: #fff7ed; border: 2px solid #fed7aa; border-radius: 3mm;">
            <h4 style="font-size: 9pt; color: #9a3412; margin-bottom: 2mm;">${activity.activity_type}</h4>
            ${activity.purpose ? `
            <p style="font-size: 7pt; color: #64748b; margin-bottom: 2mm; line-height: 1.4;">${activity.purpose}</p>
            ` : ''}
            ${activity.specific_activities?.length > 0 ? `
            <div style="font-size: 7pt;">
              ${activity.specific_activities.map((act: string) => `
                <div style="margin-bottom: 1mm; color: #1e293b;">
                  <span style="color: #f97316; margin-right: 1mm;">▸</span>${act}
                </div>
              `).join('')}
            </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <!-- Timeline -->
    ${analysisData.nextSemesterPlan.academic_plan?.timeline?.length > 0 ? `
    <div class="section" style="margin-top: 5mm; background-color: #f1f5f9; padding: 4mm; border-radius: 3mm;">
      <h2 style="color: #334155; margin-bottom: 3mm; font-size: 12pt; display: flex; align-items: center;">
        <span style="margin-right: 2mm;">📅</span> 학기 타임라인
      </h2>
      <div style="display: grid; grid-template-columns: 1fr; gap: 2mm;">
        ${analysisData.nextSemesterPlan.academic_plan.timeline.map((period: any, index: number) => `
          <div style="display: flex; align-items: start; gap: 2mm;">
            <div style="width: 25mm; padding: 2mm; background-color: #475569; color: white; border-radius: 2mm; text-align: center; flex-shrink: 0;">
              <div style="font-size: 8pt; font-weight: 600;">${period.period}</div>
            </div>
            <div style="flex: 1; padding: 2mm; background-color: white; border-radius: 2mm; border: 1px solid #cbd5e1;">
              ${period.tasks?.length > 0 ? `
              <div style="font-size: 7pt;">
                ${period.tasks.map((task: string) => `
                  <div style="margin-bottom: 1mm; color: #1e293b;">
                    <span style="color: #3b82f6; margin-right: 1mm;">✓</span>${task}
                  </div>
                `).join('')}
              </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${analysisData.consultantSummary ? `
  <div class="page page-break">
    <h1>컨설턴트 종합 의견</h1>
    <div class="section">
      <p style="white-space: pre-wrap; line-height: 1.8;">
        ${analysisData.consultantSummary}
      </p>
    </div>
  </div>
  ` : ''}

  <div class="page page-break">
    <div style="text-align: center; margin-top: 100mm; color: #64748b;">
      <p style="font-size: 10pt;">본 보고서는 AI 기반 분석 결과이며, 참고 자료로 활용하시기 바랍니다.</p>
      <p style="font-size: 10pt;">보고서 생성일: ${formatDate(analysisDate)}</p>
      <p style="font-size: 10pt;">세션 ID: ${sessionId}</p>
    </div>
  </div>
</body>
</html>`;
}
