/**
 * PrintableAnalysisReport Component
 *
 * PDF-optimized print view for Medsky analysis reports.
 * Renders all analysis sections in a print-friendly layout with proper page breaks.
 */

'use client';

import React from 'react';
import { EnhancedAcademicAnalysis, EnhancedAcademicAnalysisV2 } from '@/types/medsky-enhanced';

interface PrintableAnalysisReportProps {
  sessionId: string;
  userName: string;
  analysisDate: string;
  analysisData: {
    textSections?: any;
    extractedData?: any;
    validationAnalysis?: any;
    aiKeywordAnalysis?: any;
    aiSectionScoring?: any;
    aiAcademicAnalysis?: EnhancedAcademicAnalysis;
    aiAcademicAnalysisV2?: EnhancedAcademicAnalysisV2;
    aiMajorRecommendations?: any;
    aiStudyPlan?: any;
    consultantSummary?: string;
  };
}

export function PrintableAnalysisReport({
  sessionId,
  userName,
  analysisDate,
  analysisData,
}: PrintableAnalysisReportProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTrendBadge = (trend: string) => {
    const colors: Record<string, string> = {
      '상승': '#22c55e',
      '하락': '#ef4444',
      '유지': '#3b82f6',
      '불안정': '#f97316',
    };
    return colors[trend] || '#6b7280';
  };

  const getPositionBadge = (position: string) => {
    const colors: Record<string, string> = {
      '상위권': '#22c55e',
      '중상위권': '#3b82f6',
      '중위권': '#eab308',
      '중하위권': '#f97316',
      '하위권': '#ef4444',
    };
    return colors[position] || '#6b7280';
  };

  return (
    <html>
      <head>
        <meta charSet="UTF-8" />
        <title>생활기록부 분석 결과 - {userName}</title>
        <style>{`
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

          .chart-placeholder {
            width: 100%;
            height: 80mm;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            margin: 5mm 0;
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
        `}</style>
      </head>
      <body>
        {/* Cover Page */}
        <div className="page cover-page">
          <div className="cover-title">생활기록부 분석 결과</div>
          <div className="cover-subtitle">AI 기반 종합 진로 역량 분석</div>
          <div className="cover-info">
            <div style={{ marginBottom: '5mm' }}>
              <strong>학생명:</strong> {userName}
            </div>
            <div style={{ marginBottom: '5mm' }}>
              <strong>분석일:</strong> {formatDate(analysisDate)}
            </div>
            <div>
              <strong>세션 ID:</strong> {sessionId}
            </div>
          </div>
        </div>

        {/* Analysis Overview */}
        <div className="page">
          <h1>분석 개요</h1>

          <div className="section">
            <p>
              본 보고서는 학생의 학교생활기록부를 AI 기반으로 종합 분석하여
              진로 역량, 학업 성취도, 전공 적합성 등을 평가한 결과입니다.
            </p>
          </div>

          {analysisData.validationAnalysis && (
            <div className="section">
              <h2>검증 결과</h2>
              <div className="metric-grid">
                <div className="metric-card">
                  <div className="metric-label">전체 검증 점수</div>
                  <div className="metric-value">
                    {analysisData.validationAnalysis.overallValidationScore || 'N/A'}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">분석 상태</div>
                  <div className="metric-value" style={{ fontSize: '14pt' }}>
                    {analysisData.validationAnalysis.status || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Keyword Analysis */}
        {analysisData.aiKeywordAnalysis && (
          <div className="page page-break">
            <h1>키워드 분석</h1>

            <div className="section">
              <h2>핵심 키워드</h2>
              {analysisData.aiKeywordAnalysis.keywords && (
                <div className="keyword-grid">
                  {analysisData.aiKeywordAnalysis.keywords.slice(0, 12).map((keyword: any, idx: number) => (
                    <div key={idx} className="keyword-item">
                      <div className="keyword-name">{keyword.keyword}</div>
                      <div className="keyword-count">언급 {keyword.frequency}회</div>
                      {keyword.category && (
                        <div style={{ fontSize: '8pt', color: '#94a3b8', marginTop: '1mm' }}>
                          {keyword.category}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {analysisData.aiKeywordAnalysis.insights && (
              <div className="section">
                <h2>키워드 인사이트</h2>
                {analysisData.aiKeywordAnalysis.insights.map((insight: string, idx: number) => (
                  <p key={idx} className="list-item">• {insight}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section Scoring */}
        {analysisData.aiSectionScoring && (
          <div className="page page-break">
            <h1>영역별 점수</h1>

            <div className="section">
              <h2>역량 분석</h2>
              <table>
                <thead>
                  <tr>
                    <th>영역</th>
                    <th>점수</th>
                    <th>평가</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.aiSectionScoring.sections?.map((section: any, idx: number) => (
                    <tr key={idx}>
                      <td><strong>{section.name}</strong></td>
                      <td>{section.score}/100</td>
                      <td>{section.assessment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {analysisData.aiSectionScoring.overallAssessment && (
              <div className="section">
                <h2>종합 평가</h2>
                <p>{analysisData.aiSectionScoring.overallAssessment}</p>
              </div>
            )}
          </div>
        )}

        {/* Academic Analysis V2 (Hierarchical) */}
        {analysisData.aiAcademicAnalysisV2 && (
          <div className="page page-break">
            <h1>학업 성취도 분석</h1>

            {/* Multi-year Overview */}
            <div className="section">
              <h2>전체 학년 추세</h2>
              <div className="metric-grid">
                <div className="metric-card">
                  <div className="metric-label">전체 진행 패턴</div>
                  <div className="metric-value" style={{ fontSize: '14pt' }}>
                    {analysisData.aiAcademicAnalysisV2.multi_year_trends.overall_progression}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">일관성 점수</div>
                  <div className="metric-value">
                    {analysisData.aiAcademicAnalysisV2.multi_year_trends.consistency_score}
                  </div>
                </div>
              </div>

              {analysisData.aiAcademicAnalysisV2.multi_year_trends.cross_grade_strong_subjects.length > 0 && (
                <div style={{ marginTop: '5mm' }}>
                  <h4>전 학년 강점 과목</h4>
                  <p>{analysisData.aiAcademicAnalysisV2.multi_year_trends.cross_grade_strong_subjects.join(', ')}</p>
                </div>
              )}

              {analysisData.aiAcademicAnalysisV2.multi_year_trends.cross_grade_weak_subjects.length > 0 && (
                <div style={{ marginTop: '3mm' }}>
                  <h4>개선 필요 과목</h4>
                  <p>{analysisData.aiAcademicAnalysisV2.multi_year_trends.cross_grade_weak_subjects.join(', ')}</p>
                </div>
              )}
            </div>

            {/* Grade Transitions */}
            {analysisData.aiAcademicAnalysisV2.multi_year_trends.grade_transitions.length > 0 && (
              <div className="section page-break">
                <h2>학년별 전환 분석</h2>
                {analysisData.aiAcademicAnalysisV2.multi_year_trends.grade_transitions.map((transition: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '4mm' }}>
                    <h4>{transition.from_grade} → {transition.to_grade}</h4>
                    <p>{transition.transition_analysis}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Grade-by-Grade Details */}
            {analysisData.aiAcademicAnalysisV2.grades.map((grade: any, gradeIdx: number) => (
              <div key={gradeIdx} className="page-break">
                <h2>{grade.grade} 분석</h2>

                {/* Grade Summary */}
                <div className="section">
                  <div className="metric-grid">
                    <div className="metric-card">
                      <div className="metric-label">학년 추세</div>
                      <div className="metric-value" style={{ fontSize: '14pt' }}>
                        {grade.grade_summary.grade_trend}
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-label">학년 준비도</div>
                      <div className="metric-value">
                        {grade.grade_summary.grade_readiness}
                      </div>
                    </div>
                  </div>
                  <p style={{ marginTop: '3mm' }}><strong>학기 비교:</strong> {grade.grade_summary.semester_comparison}</p>
                </div>

                {/* Semester Details */}
                {grade.semesters.map((semester: any, semIdx: number) => (
                  <div key={semIdx} className="section">
                    <h3>{semester.semester}</h3>

                    <table>
                      <thead>
                        <tr>
                          <th>과목</th>
                          <th>추세</th>
                          <th>등급</th>
                          <th>준비도</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semester.subjects.map((subject: any, subIdx: number) => (
                          <tr key={subIdx}>
                            <td><strong>{subject.subject}</strong></td>
                            <td>
                              <span
                                className="badge"
                                style={{ backgroundColor: getTrendBadge(subject.performance_trend) }}
                              >
                                {subject.performance_trend}
                              </span>
                            </td>
                            <td>
                              <span
                                className="badge"
                                style={{ backgroundColor: getPositionBadge(subject.grade_analysis.relative_position) }}
                              >
                                {subject.grade_analysis.relative_position}
                              </span>
                            </td>
                            <td>{subject.college_readiness}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div style={{ marginTop: '3mm' }}>
                      <p><strong>학기 평균 준비도:</strong> {semester.semester_summary.average_readiness}</p>
                      <p><strong>강점 과목:</strong> {semester.semester_summary.strong_subjects.join(', ')}</p>
                      <p><strong>약점 과목:</strong> {semester.semester_summary.weak_subjects.join(', ')}</p>
                    </div>
                  </div>
                ))}

                {/* Grade Improvements & Concerns */}
                {(grade.grade_summary.key_improvements.length > 0 || grade.grade_summary.areas_of_concern.length > 0) && (
                  <div className="section">
                    {grade.grade_summary.key_improvements.length > 0 && (
                      <div>
                        <h4>주요 개선 사항</h4>
                        {grade.grade_summary.key_improvements.map((improvement: string, idx: number) => (
                          <p key={idx} className="list-item">• {improvement}</p>
                        ))}
                      </div>
                    )}
                    {grade.grade_summary.areas_of_concern.length > 0 && (
                      <div style={{ marginTop: '3mm' }}>
                        <h4>주의 필요 영역</h4>
                        {grade.grade_summary.areas_of_concern.map((concern: string, idx: number) => (
                          <p key={idx} className="list-item">• {concern}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* College Readiness */}
            <div className="page-break">
              <h2>대학 진학 준비도</h2>

              <div className="metric-grid">
                <div className="metric-card">
                  <div className="metric-label">전체 준비도</div>
                  <div className="metric-value">
                    {analysisData.aiAcademicAnalysisV2.college_entrance_readiness.overall_readiness}
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">경쟁력 위치</div>
                  <div className="metric-value" style={{ fontSize: '12pt' }}>
                    {analysisData.aiAcademicAnalysisV2.college_entrance_readiness.competitive_position}
                  </div>
                </div>
              </div>

              <div className="section">
                <h3>학년별 준비도</h3>
                <table>
                  <thead>
                    <tr>
                      <th>학년</th>
                      <th>준비도 점수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(analysisData.aiAcademicAnalysisV2.college_entrance_readiness.readiness_by_grade).map(([grade, score]) => (
                      <tr key={grade}>
                        <td><strong>{grade}</strong></td>
                        <td>{score as number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {analysisData.aiAcademicAnalysisV2.college_entrance_readiness.recommendations.length > 0 && (
                <div className="section">
                  <h3>제안 사항</h3>
                  {analysisData.aiAcademicAnalysisV2.college_entrance_readiness.recommendations.map((rec: string, idx: number) => (
                    <p key={idx} className="list-item">• {rec}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fallback to V1 Academic Analysis if V2 not available */}
        {!analysisData.aiAcademicAnalysisV2 && analysisData.aiAcademicAnalysis && (
          <div className="page page-break">
            <h1>학업 성취도 분석</h1>

            <div className="section">
              <h2>과목별 분석</h2>
              <table>
                <thead>
                  <tr>
                    <th>과목</th>
                    <th>추세</th>
                    <th>준비도</th>
                    <th>상대적 위치</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.aiAcademicAnalysis.subject_analysis.map((subject: any, idx: number) => (
                    <tr key={idx}>
                      <td><strong>{subject.subject}</strong></td>
                      <td>
                        <span
                          className="badge"
                          style={{ backgroundColor: getTrendBadge(subject.performance_trend) }}
                        >
                          {subject.performance_trend}
                        </span>
                      </td>
                      <td>{subject.college_readiness}</td>
                      <td>
                        <span
                          className="badge"
                          style={{ backgroundColor: getPositionBadge(subject.grade_analysis.relative_position) }}
                        >
                          {subject.grade_analysis.relative_position}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="section">
              <h2>전체 학업 추세</h2>
              <p><strong>GPA 추세:</strong> {analysisData.aiAcademicAnalysis.overall_academic_trends.gpa_trend}</p>
              <p><strong>강점 과목:</strong> {analysisData.aiAcademicAnalysis.overall_academic_trends.strong_subjects.join(', ')}</p>
              <p><strong>약점 과목:</strong> {analysisData.aiAcademicAnalysis.overall_academic_trends.weak_subjects.join(', ')}</p>
              {/* <p><strong>성적 일관성:</strong> {analysisData.aiAcademicAnalysis.overall_academic_trends.grade_consistency}</p> */}
            </div>

            <div className="section">
              <h2>대학 진학 준비도</h2>
              <div className="metric-card" style={{ marginBottom: '5mm' }}>
                <div className="metric-label">전체 준비도</div>
                <div className="metric-value">
                  {analysisData.aiAcademicAnalysis.college_entrance_readiness.overall_readiness}
                </div>
              </div>
              <p><strong>경쟁력 위치:</strong> {analysisData.aiAcademicAnalysis.college_entrance_readiness.competitive_position}</p>

              {analysisData.aiAcademicAnalysis.college_entrance_readiness.recommendations.length > 0 && (
                <div style={{ marginTop: '5mm' }}>
                  <h3>제안 사항</h3>
                  {analysisData.aiAcademicAnalysis.college_entrance_readiness.recommendations.map((rec: string, idx: number) => (
                    <p key={idx} className="list-item">• {rec}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Major Recommendations */}
        {analysisData.aiMajorRecommendations && (
          <div className="page page-break">
            <h1>전공 추천</h1>

            {analysisData.aiMajorRecommendations.recommendations?.map((major: any, idx: number) => (
              <div key={idx} className="section">
                <h2>{idx + 1}. {major.major}</h2>
                <div className="metric-card">
                  <div className="metric-label">적합도 점수</div>
                  <div className="metric-value">{major.alignmentScore}/100</div>
                </div>
                <div style={{ marginTop: '3mm' }}>
                  <h4>추천 이유</h4>
                  <p>{major.reasoning}</p>
                </div>
                {major.strengths && major.strengths.length > 0 && (
                  <div style={{ marginTop: '3mm' }}>
                    <h4>강점</h4>
                    {major.strengths.map((strength: string, sIdx: number) => (
                      <p key={sIdx} className="list-item">• {strength}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Study Plan */}
        {analysisData.aiStudyPlan && (
          <div className="page page-break">
            <h1>다음 학기 학습 계획</h1>

            {analysisData.aiStudyPlan.goals && (
              <div className="section">
                <h2>학습 목표</h2>
                {analysisData.aiStudyPlan.goals.map((goal: string, idx: number) => (
                  <p key={idx} className="list-item">• {goal}</p>
                ))}
              </div>
            )}

            {analysisData.aiStudyPlan.strategies && (
              <div className="section">
                <h2>학습 전략</h2>
                {analysisData.aiStudyPlan.strategies.map((strategy: any, idx: number) => (
                  <div key={idx} style={{ marginBottom: '4mm' }}>
                    <h4>{strategy.area || `전략 ${idx + 1}`}</h4>
                    <p>{strategy.description || strategy}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Consultant Summary */}
        {analysisData.consultantSummary && (
          <div className="page page-break">
            <h1>컨설턴트 종합 의견</h1>

            <div className="section">
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8' }}>
                {analysisData.consultantSummary}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="page page-break">
          <div style={{ textAlign: 'center', marginTop: '100mm', color: '#64748b' }}>
            <p style={{ fontSize: '10pt' }}>본 보고서는 AI 기반 분석 결과이며, 참고 자료로 활용하시기 바랍니다.</p>
            <p style={{ fontSize: '10pt' }}>보고서 생성일: {formatDate(analysisDate)}</p>
            <p style={{ fontSize: '10pt' }}>세션 ID: {sessionId}</p>
          </div>
        </div>
      </body>
    </html>
  );
}
