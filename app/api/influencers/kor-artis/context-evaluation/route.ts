import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { originalText, userSummary, title, category } = await request.json()
    
    if (!originalText || !userSummary) {
      return NextResponse.json(
        { error: '원본 텍스트와 사용자 요약이 필요합니다.' },
        { status: 400 }
      )
    }
    
    const result = await generateContextEvaluation(originalText, userSummary, title, category)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('문맥 평가 실패:', error)
    return NextResponse.json(
      { error: '문맥 평가 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

async function generateContextEvaluation(originalText: string, userSummary: string, title: string, category: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 수능 국어 문해력 평가 전문가입니다. 학생의 요약문을 평가하고 개선 방향을 제시해주세요. 수능 비문학 지문의 핵심을 정확히 파악하고, 갈등 구조와 가치 논의를 포함한 완성도 높은 요약문을 만들어주세요."
        },
        {
          role: "user",
          content: `제목: "${title}"
카테고리: ${category}

원본 지문:
${originalText}

사용자 요약:
${userSummary}

위 지문에 대한 사용자의 요약을 평가하고 개선된 요약문을 제안해주세요.

평가 기준:
1. 핵심 내용의 정확성
2. 갈등 구조나 대립 관계 파악
3. 가치 논의나 시사점 포함
4. 문장의 완성도와 간결성

다음 형식의 JSON으로 반환해주세요:
{
  "feedback": "사용자 요약에 대한 구체적인 피드백 (칭찬과 개선점 포함)",
  "improvedSummary": "개선된 요약문 (갈등 구조와 가치 논의 포함)"
}

예시 피드백:
- "👍 좋습니다! 핵심을 잘 짚었어요. 다만 지문에서는 A와 B의 갈등, 그리고 C의 필요성과 한계까지 강조하고 있으니 그 부분을 보완하면 더 완성도가 높아져요."

예시 개선된 요약:
- "A는 B의 문제를 해결하기 위해 C를 도입하고 있지만, D와 E 사이의 갈등과 F의 한계로 인해 G라는 사회적 과제를 안고 있다."`
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    })

    return completion.choices[0]?.message?.content || "문맥 평가를 생성할 수 없습니다."
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return "문맥 평가 생성 중 오류가 발생했습니다."
  }
}

