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
    console.error('문제 생성 실패:', error)
    return NextResponse.json(
      { error: '문제 생성 중 오류가 발생했습니다.' },
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
          content: "당신은 수능 국어 문제 출제 전문가입니다. 주어진 지문을 분석하여 수능 스타일의 5가지 유형 문제를 생성해주세요. 객관식 3문제와 주관식 2문제를 포함하며, 주관식 문제는 키워드 기반 채점이 가능하도록 설계해야 합니다."
        },
        {
          role: "user",
          content: `제목: "${title}"
카테고리: ${category}

원본 지문:
${originalText}

위 지문을 바탕으로 다음 5가지 유형의 문제를 생성해주세요:

**객관식 문제 (3문제):**
1. 주제 파악 문제: "이 지문에서 저자가 말하고자 하는 바는?"
2. 지문 감상 문제: "지문을 감상한 내용으로 가장 적절한 것은?"
3. 사례 매칭 문제: "윗글의 주제와 부합하는 사례로 가장 적절한 것은?"

**주관식 문제 (2문제):**
4. 핵심 개념 설명 문제: "지문에서 언급된 [핵심 개념]의 의미를 자신의 말로 설명하시오."
5. 단답형 문제: "지문에서 [구체적인 질문]에 대한 답을 한 단어 또는 짧은 구로 답하시오."
   - 예시: "이 지문에서 저자가 제시한 해결책은 무엇인가?"
   - 예시: "지문에서 언급된 현상의 원인은 무엇인가?"
   - 예시: "이 지문의 핵심 주장을 한 단어로 표현하면?"

**중요한 규칙:**
- 객관식 문제는 4지선다형이며, correctAnswer는 0부터 3까지의 인덱스입니다
- 주관식 문제는 키워드 기반 채점을 위해 필수 키워드와 선택 키워드를 명시해야 합니다
- 핵심 개념 설명 문제: 필수 키워드 2-4개, 선택 키워드 3-6개
- 단답형 문제: 정답 키워드 1-2개 (정확한 답), 관련 키워드 2-4개 (부분 점수용)
- 키워드는 지문의 핵심 내용을 정확히 반영해야 합니다
- 정답은 지문의 내용을 정확히 반영해야 합니다
- 오답들은 반드시 지문의 내용과 명확히 다른 부분을 근거로 해야 합니다
- 해설은 왜 그 답이 정답인지, 왜 다른 선택지들이 틀렸는지 명확히 설명해야 합니다
- 수능 비문학 지문의 특성을 반영한 문제를 만들어주세요`
        }
      ],
      max_tokens: 3000,
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
                    type: { 
                      type: "string", 
                      enum: ["theme", "appreciation", "example", "concept_explanation", "short_answer"] 
                    },
                    question: { type: "string" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4
                    },
                    correctAnswer: { type: "number", minimum: 0, maximum: 3 },
                    explanation: { type: "string" },
                    // 주관식 문제용 키워드 정보
                    requiredKeywords: {
                      type: "array",
                      items: { type: "string" }
                    },
                    optionalKeywords: {
                      type: "array",
                      items: { type: "string" }
                    },
                    sampleAnswer: { type: "string" },
                    maxScore: { type: "number" }
                  },
                  required: ["id", "type", "question", "explanation"]
                },
                minItems: 5,
                maxItems: 5
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

