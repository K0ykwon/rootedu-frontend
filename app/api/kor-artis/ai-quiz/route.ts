import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { action, word, meaning, userSentence, example, type, wrongOptions } = await request.json()

    if (action === 'generate') {
      const result = await generateAiQuiz(word, meaning)
      return NextResponse.json({ success: true, data: result })
    } else if (action === 'generateBlank') {
      const result = await generateBlankQuiz(word, meaning, example, wrongOptions || [])
      return NextResponse.json({ success: true, data: result })
    } else if (action === 'generateSynonym') {
      const result = await generateSynonymQuiz(word, meaning, type)
      return NextResponse.json({ success: true, data: result })
    } else if (action === 'generateSentence') {
      const result = await generateSentenceQuiz(word, meaning)
      return NextResponse.json({ success: true, data: result })
    } else if (action === 'evaluate') {
      const result = await evaluateSentence(word, meaning, userSentence)
      return NextResponse.json({ success: true, data: result })
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

async function generateAiQuiz(word: string, meaning: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 수능 국어 어휘 학습을 도와주는 AI 튜터입니다. 주어진 단어를 활용한 창의적이고 교육적인 문장 작성 퀴즈를 만들어주세요."
        },
        {
          role: "user",
          content: `단어: "${word}" (의미: ${meaning})\n\n이 단어를 활용한 문장 작성 퀴즈를 만들어주세요. 다음 형식으로 응답해주세요:\n\n퀴즈: [창의적이고 구체적인 상황을 제시하는 질문]\n힌트: [단어를 사용할 수 있는 맥락이나 상황]\n예시: [올바른 사용 예시 문장]`
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "퀴즈를 생성할 수 없습니다."
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return "AI 퀴즈 생성 중 오류가 발생했습니다."
  }
}

async function evaluateSentence(word: string, meaning: string, userSentence: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 수능 국어 어휘 학습을 도와주는 AI 튜터입니다. 학생이 작성한 문장이 주어진 단어를 올바르게 사용했는지 간단히 평가해주세요."
        },
        {
          role: "user",
          content: `단어: "${word}" (의미: ${meaning})\n학생 문장: "${userSentence}"\n\n이 문장이 주어진 단어를 올바르게 사용했는지 평가해주세요. 다음 형식으로 응답해주세요:\n\n정답/오답: [정답 또는 오답]\n이유: [간단한 이유 설명]`
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    })

    return completion.choices[0]?.message?.content || "평가를 완료할 수 없습니다."
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return "문장 평가 중 오류가 발생했습니다."
  }
}

async function generateBlankQuiz(word: string, meaning: string, example: string, wrongOptions: string[]) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 수능 국어 어휘 학습을 도와주는 AI 튜터입니다. 주어진 단어를 활용한 빈칸 채우기 퀴즈를 만들어주세요. 반드시 한국어 문장과 어휘만 사용하고, 수능 수준에 맞는 내용을 작성해주세요."
        },
        {
          role: "user",
          content: `정답 단어: "${word}" (의미: ${meaning})\n틀린 선지들: ${wrongOptions.join(', ')}\n예문: "${example}"\n\n이 정답 단어만이 들어갈 수 있는 빈칸 채우기 퀴즈를 만들어주세요.\n\n중요한 규칙:\n1. 정답은 반드시 "${word}"여야 합니다\n2. 틀린 선지들(${wrongOptions.join(', ')})은 문맥상 들어갈 수 없어야 합니다\n3. 문장은 자연스럽고 수능 수준이어야 합니다\n4. 정답 단어만이 문맥상 완벽하게 맞아야 합니다\n5. 틀린 선지들은 문맥상 어색하거나 의미가 맞지 않아야 합니다\n\n다음 형식의 JSON으로 반환해주세요:\n{\n  "sentence": "문장에서 단어 부분을 [빈칸]으로 표시한 문장"\n}\n\n예시:\n{\n  "sentence": "그는 매우 [빈칸]한 사람이어서 항상 신중하게 행동한다."\n}`
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    })

    return completion.choices[0]?.message?.content || "빈칸 퀴즈를 생성할 수 없습니다."
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return "빈칸 퀴즈 생성 중 오류가 발생했습니다."
  }
}

async function generateSynonymQuiz(word: string, meaning: string, type: 'synonym' | 'antonym') {
  try {
    const typeNames = {
      synonym: '유의어',
      antonym: '반의어'
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 수능 국어 어휘 학습을 도와주는 AI 튜터입니다. 주어진 단어의 정확한 유의어, 반의어를 찾아 4지선다형 퀴즈를 만들어주세요. 반드시 한국어 어휘만 사용하고, 수능 수준에 맞는 어휘를 선택해주세요."
        },
        {
          role: "user",
          content: `단어: "${word}" (의미: ${meaning})\n\n이 단어의 ${typeNames[type]}를 찾아서 4지선다형 퀴즈를 만들어주세요.\n\n중요한 규칙:\n1. 정답은 반드시 "${word}"의 정확한 ${typeNames[type]}여야 합니다\n2. 오답들은 비슷한 의미이지만 정확하지 않은 단어들이어야 합니다\n3. 모든 선택지는 한국어 단어여야 합니다\n4. 수능 수준의 어휘를 사용해주세요\n5. 정답은 첫 번째 옵션에 배치해주세요\n\n다음 형식의 JSON으로 반환해주세요:\n{\n  "options": ["정답", "오답1", "오답2", "오답3"]\n}\n\n예시:\n- 유의어: "아름답다" → {"options": ["예쁘다", "추하다", "못생기다", "보기싫다"]}\n- 반의어: "크다" → {"options": ["작다", "거대하다", "넓다", "높다"]}`
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    })

    return completion.choices[0]?.message?.content || "유의어 퀴즈를 생성할 수 없습니다."
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return "유의어 퀴즈 생성 중 오류가 발생했습니다."
  }
}

async function generateSentenceQuiz(word: string, meaning: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "당신은 수능 국어 어휘 학습을 도와주는 AI 튜터입니다. 주어진 단어를 활용한 문장 작성 퀴즈를 만들어주세요."
        },
        {
          role: "user",
          content: `단어: "${word}" (의미: ${meaning})\n\n다음 형식으로 문장 작성 퀴즈를 만들어주세요:\n\n"다음 단어를 활용하여 문장을 만들어보세요: [단어] (의미: [의미])"`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    })

    return completion.choices[0]?.message?.content || "문장 퀴즈를 생성할 수 없습니다."
  } catch (error) {
    console.error('OpenAI API Error:', error)
    return "문장 퀴즈 생성 중 오류가 발생했습니다."
  }
}
