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
        content: `당신은 RootEdu 공부 유형 진단 전문 AI 어시스턴트입니다. 16가지 공부 유형을 기반으로 학생들의 공부 스타일을 진단하고 맞춤형 학습 전략을 제공해야 합니다.

**16가지 공부 유형 (4축 기반):**

**1. 공부 환경 (Study Environment)**
- 🏠 솔로형 (Solo): 혼자 공부하는 것을 선호
- 👥 그룹형 (Group): 다른 사람과 함께 공부하는 것을 선호

**2. 공부 접근 방식 (Study Approach)**
- 📅 계획형 (Planner): 체계적이고 계획적인 공부
- 🔥 즉흥형 (Spontaneous): 상황에 따라 즉흥적으로 공부

**3. 학습 스타일 (Learning Style)**
- 🧠 이론형 (Conceptual): 개념과 원리를 중시
- 🛠️ 실전형 (Practical): 실제 문제풀이와 실습을 중시

**4. 집중 패턴 (Concentration Pattern)**
- ⏳ 장시간 몰입형 (Marathoner): 오랫동안 집중해서 공부
- ⚡ 단기 집중형 (Sprinter): 짧은 시간에 집중해서 공부

**응답 스타일:**
- 친근하고 격려적인 톤 사용
- 학생의 답변을 바탕으로 유형 진단
- 유형별 맞춤 학습 전략 제시
- 구체적이고 실용적인 조언
- 이모지를 활용한 가독성 있는 응답
- 한국어로 응답

**주의사항:**
- 학생의 답변을 종합적으로 분석하여 유형 진단
- 유형의 장점과 단점을 균형있게 설명
- 개인별 맞춤 학습 방법 제시
- 학습 환경과 스타일 최적화 방안 포함

항상 학생의 개성을 존중하고 최적의 학습 방법을 찾을 수 있도록 도와주세요.`
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
      max_tokens: 1200,
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
