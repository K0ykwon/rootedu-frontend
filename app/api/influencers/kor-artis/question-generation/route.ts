import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { originalText, title, category } = await request.json()
    
    if (!originalText || !title || !category) {
      return NextResponse.json(
        { error: '원본 텍스트, 제목, 카테고리가 필요합니다.' },
        { status: 400 }
      )
    }
    
    const result = await generateQuestions(originalText, title, category)
    
    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('파생 문제 생성 실패:', error)
    return NextResponse.json(
      { error: '파생 문제 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

async function generateQuestions(originalText: string, title: string, category: string) {
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 수능 국어 문제 출제 전문가입니다. 주어진 지문을 분석하여 수능 스타일의 3가지 유형 문제를 생성해주세요. 각 문제는 4지선다형이며, 정답과 해설을 포함해야 합니다."
        },
        {
          role: "user",
          content: `제목: "${title}"
카테고리: ${category}

원본 지문:
${originalText}

위 지문을 바탕으로 다음 3가지 유형의 문제를 생성해주세요:

1. 주제 파악 문제: "이 지문에서 저자가 말하고자 하는 바는?"
2. 지문 감상 문제: "지문을 감상한 내용으로 가장 적절한 것은?"
3. 사례 매칭 문제: "윗글의 주제와 부합하는 사례로 가장 적절한 것은?"

각 문제는 4지선다형이며, 수능 수준의 난이도로 출제해주세요.

중요한 규칙:
- correctAnswer는 0부터 3까지의 인덱스입니다
- 정답은 지문의 내용을 정확히 반영해야 합니다
- 오답들은 반드시 지문의 내용과 명확히 다른 부분을 근거로 해야 합니다
- 오답 생성 시 "지문에 언급되지 않은 내용", "지문과 반대되는 내용", "지문의 범위를 벗어난 내용" 등을 근거로 사용하세요
- 각 선택지는 구체적이고 현실적인 내용이어야 합니다
- 해설은 왜 그 답이 정답인지, 왜 다른 선택지들이 틀렸는지 명확히 설명해야 합니다
- 수능 비문학 지문의 특성을 반영한 문제를 만들어주세요`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "question_generation",
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    type: { type: "string", enum: ["theme", "appreciation", "example"] },
                    question: { type: "string" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4
                    },
                    correctAnswer: { type: "number", minimum: 0, maximum: 3 },
                    explanation: { type: "string" }
                  },
                  required: ["id", "type", "question", "options", "correctAnswer", "explanation"]
                },
                minItems: 3,
                maxItems: 3
              }
            },
            required: ["questions"]
          }
        }
      }
    })

    return completion.choices[0]?.message?.parsed || { questions: [] }
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return { questions: [] }
  }
}

