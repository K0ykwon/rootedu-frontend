import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface WeeklyCheckRequest {
  childId: string;
  weekData: {
    homeworkProcrastination: number; // 숙제 미루기 횟수
    averageConcentrationTime: number; // 평균 집중 시간 (분)
    praiseCount: number; // 칭찬 횟수
    feedbackCount: number; // 피드백 횟수
    studyEnvironmentScore: number; // 학습 환경 점수 (1-10)
    moodScore: number; // 자녀 기분 점수 (1-10)
    completedGoals: string[]; // 완료된 목표들
    challenges: string[]; // 이번 주 겪은 어려움들
  };
  previousWeekData?: {
    homeworkProcrastination: number;
    averageConcentrationTime: number;
    praiseCount: number;
    feedbackCount: number;
    studyEnvironmentScore: number;
    moodScore: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: WeeklyCheckRequest = await request.json();
    
    const prompt = `
학부모님의 주간 체크 데이터를 분석하여 피드백 리포트를 생성해주세요.

**이번 주 데이터:**
- 숙제 미루기: ${body.weekData.homeworkProcrastination}회
- 평균 집중 시간: ${body.weekData.averageConcentrationTime}분
- 칭찬 횟수: ${body.weekData.praiseCount}회
- 피드백 횟수: ${body.weekData.feedbackCount}회
- 학습 환경 점수: ${body.weekData.studyEnvironmentScore}/10
- 자녀 기분 점수: ${body.weekData.moodScore}/10
- 완료된 목표: ${body.weekData.completedGoals.join(', ')}
- 겪은 어려움: ${body.weekData.challenges.join(', ')}

${body.previousWeekData ? `
**지난 주 데이터 (비교용):**
- 숙제 미루기: ${body.previousWeekData.homeworkProcrastination}회
- 평균 집중 시간: ${body.previousWeekData.averageConcentrationTime}분
- 칭찬 횟수: ${body.previousWeekData.praiseCount}회
- 피드백 횟수: ${body.previousWeekData.feedbackCount}회
- 학습 환경 점수: ${body.previousWeekData.studyEnvironmentScore}/10
- 자녀 기분 점수: ${body.previousWeekData.moodScore}/10
` : ''}

다음 형식으로 응답해주세요:

{
  "weeklyReport": {
    "overallScore": 85,
    "improvementAreas": ["개선된 영역들"],
    "challenges": ["여전히 어려운 부분들"],
    "achievements": ["이번 주 성과들"],
    "summary": "주간 요약 (2-3문장)"
  },
  "nextWeekPlan": {
    "focusAreas": ["다음 주 집중 영역 3개"],
    "goals": ["구체적인 목표 3개"],
    "dailyRoutine": "일일 루틴 제안",
    "parentActions": ["학부모가 해야 할 행동들"]
  },
  "recommendations": [
    {
      "category": "학습 환경",
      "title": "추천 제목",
      "description": "구체적인 추천 내용",
      "priority": "high" | "medium" | "low"
    }
  ],
  "conversationTopics": [
    {
      "topic": "대화 주제",
      "opening": "대화 시작 방법",
      "keyPoints": ["핵심 포인트들"]
    }
  ],
  "celebrationIdeas": ["칭찬/축하 아이디어들"]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "당신은 교육 심리학자이자 가족 상담 전문가입니다. 학부모에게 주간 학습 진도와 자녀의 변화를 분석하여 실용적인 피드백과 다음 주 계획을 제공합니다."
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
    console.error('주간 체크 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: '주간 체크 처리 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}
