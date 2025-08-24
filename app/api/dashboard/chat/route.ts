import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, analysisData, studentName, messages = [] } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Create a comprehensive context from the analysis data
    let analysisContext = '';
    let evidenceData: {
      activities: any[];
      academicPerformance: any[];
      abilities: any[];
      strengths: any[];
      weaknesses: any[];
      validationInsights: any;
    } = {
      activities: [],
      academicPerformance: [],
      abilities: [],
      strengths: [],
      weaknesses: [],
      validationInsights: {}
    };
    
    if (analysisData) {
      // Basic student information
      analysisContext = `
===== 학생 기본 정보 =====
- 이름: ${studentName || '익명 학생'}
${analysisData.totalActivities ? `- 총 활동 수: ${analysisData.totalActivities}개` : ''}
${analysisData.mainField ? `- 주요 관심 분야: ${analysisData.mainField}` : ''}
${analysisData.recommendedCareer ? `- AI 추천 진로: ${analysisData.recommendedCareer}` : ''}

`;

      // Add extracted data if available
      if (analysisData.extractedData) {
        // Creative activities - Full details for evidence
        if (analysisData.extractedData.creativeActivities?.창의적체험활동상황) {
          analysisContext += '===== 창의적 체험활동 상세 =====\n';
          analysisData.extractedData.creativeActivities.창의적체험활동상황.forEach((activity: any, index: number) => {
            analysisContext += `\n[${index + 1}] ${activity.영역} 활동:\n`;
            analysisContext += `   학년: ${activity.학년 || 'N/A'}\n`;
            analysisContext += `   시간: ${activity.시간 || 'N/A'}\n`;
            analysisContext += `   특기사항: ${activity.특기사항 || '기록 없음'}\n`;
            
            // Store for evidence-based responses
            if (activity.특기사항) {
              evidenceData.activities.push({
                type: activity.영역,
                grade: activity.학년,
                details: activity.특기사항
              });
            }
          });
        }

        // Academic developments - More detailed
        if (analysisData.extractedData.academicDevelopments?.교과학습발달상황) {
          analysisContext += '\n===== 교과 학습 발달 상황 =====\n';
          const subjects = analysisData.extractedData.academicDevelopments.교과학습발달상황;
          
          // Group by subject for trend analysis
          const subjectGroups: any = {};
          subjects.forEach((subject: any) => {
            if (!subjectGroups[subject.과목]) {
              subjectGroups[subject.과목] = [];
            }
            subjectGroups[subject.과목].push(subject);
          });
          
          Object.keys(subjectGroups).forEach(subjectName => {
            analysisContext += `\n${subjectName}:\n`;
            subjectGroups[subjectName].forEach((record: any) => {
              analysisContext += `   - ${record.학년}학년 ${record.학기}학기: 성취도 ${record.성취도}, 석차등급 ${record.석차등급 || 'N/A'}\n`;
            });
          });
        }

        // Detailed abilities - Full text for context
        if (analysisData.extractedData.detailedAbilities?.세부특기사항) {
          analysisContext += '\n===== 세부능력 및 특기사항 (전체) =====\n';
          analysisData.extractedData.detailedAbilities.세부특기사항.forEach((ability: any, index: number) => {
            analysisContext += `\n[${ability.과목}] (${ability.학년}학년 ${ability.학기}학기):\n`;
            analysisContext += `${ability.특기사항}\n`;
            analysisContext += '---\n';
            
            // Store for evidence
            evidenceData.abilities.push({
              subject: ability.과목,
              grade: ability.학년,
              semester: ability.학기,
              details: ability.특기사항
            });
          });
        }

        // Behavioral development
        if (analysisData.extractedData.behaviorDevelopment?.행동특성및종합의견) {
          analysisContext += '\n===== 행동특성 및 종합의견 =====\n';
          analysisData.extractedData.behaviorDevelopment.행동특성및종합의견.forEach((record: any) => {
            analysisContext += `\n${record.학년}학년: ${record.특기사항}\n`;
          });
        }
      }

      // Add detailed validation insights if available
      if (analysisData.validationAnalysis) {
        analysisContext += '\n===== AI 분석 인사이트 상세 =====\n';
        
        if (analysisData.validationAnalysis.blue_highlight?.Feedbacks?.length > 0) {
          analysisContext += '\n[진로 역량 강조 포인트]\n';
          analysisData.validationAnalysis.blue_highlight.Feedbacks.forEach((feedback: any, idx: number) => {
            analysisContext += `${idx + 1}. ${feedback.Text || feedback}\n`;
            if (feedback.Context) analysisContext += `   맥락: ${feedback.Context}\n`;
          });
          evidenceData.strengths.push(...analysisData.validationAnalysis.blue_highlight.Feedbacks);
        }
        
        if (analysisData.validationAnalysis.red_line?.Feedbacks?.length > 0) {
          analysisContext += '\n[구체적 노력 기록]\n';
          analysisData.validationAnalysis.red_line.Feedbacks.forEach((feedback: any, idx: number) => {
            analysisContext += `${idx + 1}. ${feedback.Text || feedback}\n`;
            if (feedback.Context) analysisContext += `   맥락: ${feedback.Context}\n`;
          });
          evidenceData.strengths.push(...analysisData.validationAnalysis.red_line.Feedbacks);
        }
        
        if (analysisData.validationAnalysis.blue_line?.Feedbacks?.length > 0) {
          analysisContext += '\n[연계 탐구 활동]\n';
          analysisData.validationAnalysis.blue_line.Feedbacks.forEach((feedback: any, idx: number) => {
            analysisContext += `${idx + 1}. ${feedback.Text || feedback}\n`;
            if (feedback.Context) analysisContext += `   맥락: ${feedback.Context}\n`;
          });
        }
        
        if (analysisData.validationAnalysis.black_line?.Feedbacks?.length > 0) {
          analysisContext += '\n[개선 필요 사항 - 구체성 부족]\n';
          analysisData.validationAnalysis.black_line.Feedbacks.forEach((feedback: any, idx: number) => {
            analysisContext += `${idx + 1}. ${feedback.Text || feedback}\n`;
            if (feedback.Context) analysisContext += `   맥락: ${feedback.Context}\n`;
          });
          evidenceData.weaknesses.push(...analysisData.validationAnalysis.black_line.Feedbacks);
        }
        
        if (analysisData.validationAnalysis.red_check?.Feedbacks?.length > 0) {
          analysisContext += '\n[추가 검토 필요 사항]\n';
          analysisData.validationAnalysis.red_check.Feedbacks.forEach((feedback: any, idx: number) => {
            analysisContext += `${idx + 1}. ${feedback.Text || feedback}\n`;
          });
        }
      }

      // Add summary statistics
      analysisContext += '\n===== 요약 통계 =====\n';
      analysisContext += `- 강점 포인트: ${evidenceData.strengths.length}개\n`;
      analysisContext += `- 개선 포인트: ${evidenceData.weaknesses.length}개\n`;
      analysisContext += `- 기록된 활동: ${evidenceData.activities.length}개\n`;
      analysisContext += `- 세부능력 기록: ${evidenceData.abilities.length}개\n`;
    }

    // Prepare the conversation history
    const conversationHistory = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    }));

    // Create the system prompt
    const systemPrompt = `당신은 대학 입시 컨설팅 전문가를 지원하는 AI 분석 어시스턴트입니다.
학생의 생활기록부 데이터와 AI 분석 결과를 기반으로 증거 기반(Evidence-Based) 상담 가이드를 제공합니다.

${analysisContext}

===== 핵심 응답 원칙 =====
1. **증거 기반 답변**: 모든 평가와 조언은 반드시 생활기록부의 구체적 데이터를 인용하여 제시
2. **데이터 우선**: "생활기록부에 따르면...", "X학년 Y활동에서 보여준..." 등 구체적 근거 제시
3. **정량적 분석**: 가능한 한 숫자와 통계를 활용 (예: "3년간 총 12개 활동 중 8개가 과학 분야")
4. **균형잡힌 관점**: 강점과 개선점을 모두 객관적 데이터로 뒷받침

===== 답변 구조 가이드 =====
1. **현황 진단**: 생활기록부 데이터 기반 현재 상태 분석
   - 구체적 활동 사례 인용
   - 성적 추이 분석
   - 활동 패턴 파악

2. **강점 분석**: 
   - "세부능력 특기사항에서 [과목]의 [구체적 내용] 확인"
   - "창의적 체험활동 중 [활동명]에서 보여준 [역량]"
   - AI가 식별한 진로역량 포인트 활용

3. **개선 영역**:
   - 구체성이 부족한 활동 지적
   - 연계성이 약한 부분 파악
   - 보완이 필요한 역량 영역

4. **전략적 제안**:
   - 현재 프로필과 목표 진로의 갭 분석
   - 남은 기간 활용 전략
   - 대학별 인재상과의 매칭 분석

5. **상담 포인트**:
   - 학부모/학생에게 전달할 핵심 메시지
   - 동기부여 포인트
   - 실행 가능한 구체적 액션 아이템

===== 응답 시 필수 포함 사항 =====
- 생활기록부 원문 인용 (최소 2-3개)
- 정량적 데이터 (활동 수, 성적 변화율 등)
- AI 분석에서 도출된 인사이트
- 진로 적합성 평가 근거
- 개선 가능 시간과 방법

===== 금지 사항 =====
- 추상적이거나 일반적인 조언
- 데이터 없는 추측이나 가정
- 과도한 낙관이나 비관
- 생활기록부에 없는 내용 추가

모든 답변은 컨설턴트가 학부모/학생 상담 시 즉시 활용 가능하도록 
구체적이고 실용적이어야 하며, 반드시 생활기록부 데이터를 근거로 제시해야 합니다.`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 2000, // Increased for more comprehensive evidence-based responses
    });

    const reply = completion.choices[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.';

    return NextResponse.json({ reply });
    
  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle OpenAI API errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}