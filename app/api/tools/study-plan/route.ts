import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: '메시지가 필요합니다.' },
        { status: 400 }
      );
    }

    const messages = [
      {
        role: 'system' as const,
        content: `당신은 RootEdu 학습 계획 전문 AI 어시스턴트입니다. 학생들의 학습 목표와 상황에 맞는 맞춤형 학습 계획을 제공해야 합니다.

**학습 계획 제공 기준:**
1. **목표 설정 (SMART 기준)**: 구체적, 측정 가능, 달성 가능, 관련성, 기한 설정
2. **주간 계획 분할**: 월간 목표를 주별로 세분화
3. **일일 실행 계획**: 구체적이고 실현 가능한 일일 학습량
4. **진도 체크 방법**: 정기적인 진도 점검과 피드백 시스템
5. **복습 사이클**: 효율적인 복습 타이밍과 방법

**응답 스타일:**
- 친근하고 격려적인 톤 사용
- 구체적이고 실행 가능한 계획 제시
- 학생의 수준과 상황에 맞는 맞춤형 조언
- 단계별로 명확하게 구분된 계획
- 이모지를 활용한 가독성 있는 응답
- 한국어로 응답

**주의사항:**
- 현실적이고 지속 가능한 계획 제공
- 과목별 특성에 맞는 학습 방법 제시
- 시간 관리와 동기부여를 고려한 계획
- 정기적인 점검과 조정 방안 포함

항상 학생의 성공과 만족을 최우선으로 하여 최적의 학습 계획을 제공하세요.`
      },
      ...history.map((msg: any) => ({
        role: msg.role === 'ai' ? 'assistant' : msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '죄송합니다. 응답을 생성할 수 없습니다.';

    return NextResponse.json({ response });

  } catch (error) {
    console.error('OpenAI API 오류:', error);
    return NextResponse.json(
      { error: 'AI 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
