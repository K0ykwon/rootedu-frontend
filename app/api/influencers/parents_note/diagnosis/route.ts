import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface DiagnosisRequest {
  childAge: number;
  studyHabits: {
    concentrationTime: number; // 집중 시간 (분)
    smartphoneUsage: number; // 스마트폰 사용 시간 (시간)
    studyTime: number; // 하루 공부 시간 (시간)
    procrastination: 'often' | 'sometimes' | 'rarely'; // 숙제 미루기 빈도
    studyEnvironment: 'good' | 'average' | 'poor'; // 학습 환경
  };
  personality: {
    activity: 'high' | 'medium' | 'low'; // 활동성
    independence: 'high' | 'medium' | 'low'; // 독립성
    social: 'high' | 'medium' | 'low'; // 사회성
    emotional: 'stable' | 'sensitive' | 'volatile'; // 감정 상태
  };
  familyEnvironment: {
    supportLevel: 'high' | 'medium' | 'low'; // 가족 지원 수준
    communication: 'good' | 'average' | 'poor'; // 의사소통
    rules: 'strict' | 'moderate' | 'loose'; // 규칙 수준
    stressLevel: 'high' | 'medium' | 'low'; // 가정 내 스트레스
  };
  currentChallenges: string[]; // 현재 겪고 있는 문제들
}

export async function POST(request: NextRequest) {
  try {
    const body: DiagnosisRequest = await request.json();
    
    const prompt = `
학부모님의 자녀 교육 진단을 위한 AI 상담사입니다. 다음 정보를 바탕으로 맞춤형 교육 가이드를 제공해주세요.

**자녀 정보:**
- 나이: ${body.childAge}세
- 집중 시간: ${body.studyHabits.concentrationTime}분
- 스마트폰 사용: 하루 ${body.studyHabits.smartphoneUsage}시간
- 공부 시간: 하루 ${body.studyHabits.studyTime}시간
- 숙제 미루기: ${body.studyHabits.procrastination === 'often' ? '자주' : body.studyHabits.procrastination === 'sometimes' ? '가끔' : '거의 안함'}
- 학습 환경: ${body.studyHabits.studyEnvironment === 'good' ? '양호' : body.studyHabits.studyEnvironment === 'average' ? '보통' : '개선 필요'}

**성격 특성:**
- 활동성: ${body.personality.activity === 'high' ? '높음' : body.personality.activity === 'medium' ? '보통' : '낮음'}
- 독립성: ${body.personality.independence === 'high' ? '높음' : body.personality.independence === 'medium' ? '보통' : '낮음'}
- 사회성: ${body.personality.social === 'high' ? '높음' : body.personality.social === 'medium' ? '보통' : '낮음'}
- 감정 상태: ${body.personality.emotional === 'stable' ? '안정적' : body.personality.emotional === 'sensitive' ? '민감함' : '변동적'}

**가정 환경:**
- 가족 지원: ${body.familyEnvironment.supportLevel === 'high' ? '높음' : body.familyEnvironment.supportLevel === 'medium' ? '보통' : '낮음'}
- 의사소통: ${body.familyEnvironment.communication === 'good' ? '원활' : body.familyEnvironment.communication === 'average' ? '보통' : '개선 필요'}
- 규칙 수준: ${body.familyEnvironment.rules === 'strict' ? '엄격' : body.familyEnvironment.rules === 'moderate' ? '적당' : '느슨'}
- 스트레스: ${body.familyEnvironment.stressLevel === 'high' ? '높음' : body.familyEnvironment.stressLevel === 'medium' ? '보통' : '낮음'}

**현재 겪고 있는 문제:**
${body.currentChallenges.join(', ')}

다음 형식으로 응답해주세요. 문제점이나 강점의 개수는 실제 상황에 맞게 조정하고, 진단 결과 요약은 충분히 상세하게 작성해주세요:

{
  "diagnosis": {
    "mainIssues": ["실제로 발견된 주요 문제점들 (1-5개, 문제가 없으면 빈 배열)"],
    "strengths": ["자녀의 실제 강점들 (1-5개, 강점이 적으면 적게)"],
    "priorityAreas": ["우선적으로 개선해야 할 영역들 (1-3개)"],
    "overallAssessment": "전반적인 자녀의 학습 상태와 특성에 대한 종합적인 평가 (3-4문장)"
  },
  "customGuide": {
    "title": "우리 집 맞춤 지도 전략",
    "summary": "진단 결과를 바탕으로 한 상세한 요약과 핵심 포인트 (5-7문장으로 충분히 설명)",
    "todayAction": {
      "title": "오늘의 실행 가이드 (15분)",
      "steps": [
        "구체적이고 실행 가능한 방법들 (3-5개)"
      ]
    },
    "weeklyPlan": {
      "title": "이번 주 집중 개선 영역",
      "goals": ["구체적인 목표들 (2-4개)"],
      "dailyRoutine": "일일 루틴 제안 (상세한 설명 포함)"
    },
    "conversationScripts": {
      "title": "부모-자녀 대화 스크립트",
      "scenarios": [
        {
          "situation": "구체적인 상황 설명",
          "parentScript": "부모가 할 말 (실제 대화체로)",
          "expectedResponse": "자녀 예상 반응",
          "followUp": "후속 대화 및 팁"
        }
      ]
    },
    "environmentChecklist": {
      "title": "학습 환경 체크리스트",
      "items": [
        {"item": "체크 항목", "status": "check", "description": "상세한 설명"},
        {"item": "체크 항목", "status": "warning", "description": "주의사항 및 개선방법"}
      ]
    }
  },
  "weeklyTracking": {
    "metrics": ["추적할 구체적인 지표들"],
    "questions": ["주간 체크를 위한 질문들"]
  }
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "당신은 20년 경력의 교육 전문가이자 가족 상담사입니다. 학부모에게 실용적이고 구체적인 교육 가이드를 제공합니다. 한국의 교육 환경과 문화를 잘 이해하고 있습니다.\n\n중요한 지침:\n1. 문제점이 전혀 없다면 mainIssues를 빈 배열로 반환하세요\n2. 문제점이 많다면 가장 중요한 것들만 5개까지 선별하세요\n3. 강점이 적다면 있는 것만 정확히 진단하세요\n4. summary는 5-7문장으로 충분히 상세하게 작성하세요\n5. 모든 답변은 실제 상황에 맞게 유연하게 조정하세요"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;
    
    try {
      const parsedResponse = JSON.parse(response || '{}');
      return NextResponse.json({
        success: true,
        data: parsedResponse
      });
    } catch (parseError) {
      return NextResponse.json({
        success: false,
        error: 'AI 응답 파싱 실패',
        rawResponse: response
      });
    }

  } catch (error) {
    console.error('진단 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '진단 처리 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
