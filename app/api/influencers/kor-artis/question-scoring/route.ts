import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// AI 채점 및 키워드 분석 함수
async function getAIScore(
  question: string,
  answer: string,
  sampleAnswer: string,
  maxScore: number,
  requiredKeywords: string[],
  optionalKeywords: string[]
) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 수능 국어 주관식 문제 채점 전문가입니다. 
          주어진 문제와 학생의 답안을 분석하여 0점부터 ${maxScore}점까지 점수를 매겨주세요.
          
          채점 기준:
          - 내용의 정확성 (핵심 내용 포함 여부)
          - 표현의 적절성 (명확하고 정확한 표현)
          - 논리적 일관성 (논리적 연결성)
          - 완성도 (답안의 완성도)
          - 키워드 포함 여부 (직접적이든 간접적이든 의미상 포함)
          
          점수별 기준:
          - ${Math.round(maxScore * 0.9)}-${maxScore}점: 매우 우수 (거의 완벽한 답안)
          - ${Math.round(maxScore * 0.8)}-${Math.round(maxScore * 0.89)}점: 우수 (핵심 내용을 잘 포함)
          - ${Math.round(maxScore * 0.7)}-${Math.round(maxScore * 0.79)}점: 양호 (대부분의 내용 포함)
          - ${Math.round(maxScore * 0.6)}-${Math.round(maxScore * 0.69)}점: 보통 (일부 내용 포함)
          - ${Math.round(maxScore * 0.4)}-${Math.round(maxScore * 0.59)}점: 미흡 (핵심 내용 부족)
          - 0-${Math.round(maxScore * 0.39)}점: 매우 미흡 (내용 부족 또는 오답)
          
          피드백 작성 가이드:
          1. 점수와 함께 구체적인 평가 근거 제시
          2. 포함된 키워드와 누락된 키워드를 명확히 구분하여 설명
          3. 답안의 장점과 부족한 점을 구체적으로 지적
          4. 개선 방향과 학습 조언을 제시
          5. 다음에 더 좋은 답안을 작성할 수 있도록 도움
          
          피드백 구조:
          - 점수 및 백분율 표시
          - 포함된 키워드와 누락된 키워드 명시
          - 답안의 구체적인 장점과 단점 지적
          - 개선을 위한 구체적인 조언 제시
          - 다음 답안 작성 시 참고할 점 안내
          
          답변 형식: {
            "score": 점수, 
            "reasoning": "채점 근거", 
            "feedback": "구체적이고 교육적인 피드백 (점수, 키워드 분석, 장단점, 개선방안 포함)",
            "matchedRequiredKeywords": ["포함된 필수 키워드들"],
            "matchedOptionalKeywords": ["포함된 선택 키워드들"],
            "missingRequiredKeywords": ["누락된 필수 키워드들"]
          }`
        },
        {
          role: "user",
          content: `문제: ${question}
          
          학생 답안: ${answer}
          
          모범 답안: ${sampleAnswer}
          
          필수 키워드: ${requiredKeywords.join(', ')}
          선택 키워드: ${optionalKeywords.join(', ')}
          
          위 답안을 ${maxScore}점 만점으로 채점하고, 키워드 포함 여부도 분석해주세요.
          키워드는 직접적으로 언급되지 않더라도 의미상 포함되어 있으면 포함된 것으로 판단해주세요.
          
          피드백 예시:
          - "2/3점 (67%) - '탄소 중립' 개념은 잘 설명했지만, '온실가스 감축'과 '재생에너지' 키워드가 누락되었습니다. 더 구체적인 방법론을 제시하면 좋겠습니다."
          - "3/3점 (100%) - 모든 필수 키워드를 포함하여 완벽하게 설명했습니다. 특히 '지속가능한 발전'과의 연관성을 잘 설명한 점이 인상적입니다."
          - "1/3점 (33%) - 기본적인 개념은 언급했지만, 핵심 키워드들이 대부분 누락되었습니다. 구체적인 방법과 효과를 더 자세히 설명해보세요."`
        }
      ],
      temperature: 0.3,
      max_tokens: 800
    })

    const response = completion.choices[0]?.message?.content
    if (response) {
      try {
        const parsed = JSON.parse(response)
        return {
          score: Math.min(Math.max(parsed.score, 0), maxScore),
          reasoning: parsed.reasoning || '',
          feedback: parsed.feedback || '',
          matchedRequiredKeywords: parsed.matchedRequiredKeywords || [],
          matchedOptionalKeywords: parsed.matchedOptionalKeywords || [],
          missingRequiredKeywords: parsed.missingRequiredKeywords || []
        }
      } catch (e) {
        console.error('AI 채점 응답 파싱 실패:', e)
        return null
      }
    }
    return null
  } catch (error) {
    console.error('AI 채점 오류:', error)
    return null
  }
}

// 주관식 답안 AI 기반 채점 함수
async function scoreSubjectiveAnswer(
  answer: string, 
  requiredKeywords: string[], 
  optionalKeywords: string[], 
  maxScore: number,
  question?: string,
  sampleAnswer?: string
) {
  try {
    // AI 채점 (question과 sampleAnswer가 있는 경우)
    let aiScore = null
    if (question && sampleAnswer) {
      aiScore = await getAIScore(question, answer, sampleAnswer, maxScore, requiredKeywords, optionalKeywords)
    }
    
    // AI 채점이 성공한 경우 AI 결과 사용
    if (aiScore) {
      return {
        score: aiScore.score,
        maxScore: maxScore,
        percentage: Math.round((aiScore.score / maxScore) * 100),
        matchedRequiredKeywords: aiScore.matchedRequiredKeywords,
        matchedOptionalKeywords: aiScore.matchedOptionalKeywords,
        missingRequiredKeywords: aiScore.missingRequiredKeywords,
        aiScore: aiScore.score,
        keywordScore: null,
        feedback: aiScore.feedback
      }
    }
    
    // AI 채점 실패 시 기본 키워드 매칭 사용 (fallback)
    const normalizedAnswer = answer.toLowerCase().trim()
    const matchedRequiredKeywords = requiredKeywords.filter(keyword => 
      normalizedAnswer.includes(keyword.toLowerCase())
    )
    const matchedOptionalKeywords = optionalKeywords.filter(keyword => 
      normalizedAnswer.includes(keyword.toLowerCase())
    )
    
    const requiredScore = (matchedRequiredKeywords.length / requiredKeywords.length) * (maxScore * 0.7)
    const optionalScore = (matchedOptionalKeywords.length / Math.max(optionalKeywords.length, 1)) * (maxScore * 0.3)
    const keywordScore = Math.round(requiredScore + optionalScore)
    
    return {
      score: keywordScore,
      maxScore: maxScore,
      percentage: Math.round((keywordScore / maxScore) * 100),
      matchedRequiredKeywords,
      matchedOptionalKeywords,
      missingRequiredKeywords: requiredKeywords.filter(keyword => 
        !matchedRequiredKeywords.includes(keyword)
      ),
      aiScore: null,
      keywordScore: keywordScore,
      feedback: generateFeedback(
        matchedRequiredKeywords.length, 
        requiredKeywords.length,
        matchedOptionalKeywords.length,
        optionalKeywords.length,
        keywordScore,
        maxScore,
        matchedRequiredKeywords,
        matchedOptionalKeywords,
        requiredKeywords.filter(keyword => !matchedRequiredKeywords.includes(keyword))
      )
    }
  } catch (error) {
    console.error('채점 오류:', error)
    return {
      score: 0,
      maxScore: maxScore,
      percentage: 0,
      matchedRequiredKeywords: [],
      matchedOptionalKeywords: [],
      missingRequiredKeywords: requiredKeywords,
      aiScore: null,
      keywordScore: 0,
      feedback: '채점 중 오류가 발생했습니다.'
    }
  }
}

// 채점 피드백 생성 함수 (fallback용)
function generateFeedback(
  matchedRequired: number,
  totalRequired: number,
  matchedOptional: number,
  totalOptional: number,
  score: number,
  maxScore: number,
  matchedRequiredKeywords: string[] = [],
  matchedOptionalKeywords: string[] = [],
  missingRequiredKeywords: string[] = []
): string {
  const requiredPercentage = Math.round((matchedRequired / totalRequired) * 100)
  const optionalPercentage = totalOptional > 0 ? Math.round((matchedOptional / totalOptional) * 100) : 0
  
  let feedback = `총 ${maxScore}점 만점에 ${score}점을 받았습니다. (${Math.round((score / maxScore) * 100)}%)\n\n`
  
  feedback += `📊 키워드 분석 결과:\n`
  
  // 필수 키워드 피드백
  if (matchedRequired === totalRequired) {
    feedback += `✅ 필수 키워드를 모두 포함했습니다. (${matchedRequired}/${totalRequired})\n`
    if (matchedRequiredKeywords.length > 0) {
      feedback += `   포함된 키워드: ${matchedRequiredKeywords.join(', ')}\n`
    }
  } else {
    feedback += `⚠️ 필수 키워드 ${matchedRequired}/${totalRequired}개를 포함했습니다. (${requiredPercentage}%)\n`
    if (matchedRequiredKeywords.length > 0) {
      feedback += `   포함된 키워드: ${matchedRequiredKeywords.join(', ')}\n`
    }
    if (missingRequiredKeywords.length > 0) {
      feedback += `   누락된 키워드: ${missingRequiredKeywords.join(', ')}\n`
    }
  }
  
  // 선택 키워드 피드백
  if (totalOptional > 0) {
    if (matchedOptional === totalOptional) {
      feedback += `✅ 선택 키워드를 모두 포함했습니다. (${matchedOptional}/${totalOptional})\n`
    } else {
      feedback += `ℹ️ 선택 키워드 ${matchedOptional}/${totalOptional}개를 포함했습니다. (${optionalPercentage}%)\n`
    }
    if (matchedOptionalKeywords.length > 0) {
      feedback += `   포함된 키워드: ${matchedOptionalKeywords.join(', ')}\n`
    }
  }
  
  // 추가 조언
  if (score < maxScore * 0.6) {
    feedback += `\n💡 더 높은 점수를 받으려면 필수 키워드를 더 많이 포함하고, 핵심 내용을 더 구체적으로 설명해보세요.`
  } else if (score < maxScore * 0.8) {
    feedback += `\n💡 좋은 답안입니다! 선택 키워드를 더 포함하면 완벽한 답안이 될 것입니다.`
  } else {
    feedback += `\n🎉 훌륭한 답안입니다! 핵심 내용을 잘 이해하고 표현했습니다.`
  }
  
  return feedback
}

export async function POST(request: NextRequest) {
  try {
    const { answer, questionId, requiredKeywords, optionalKeywords, maxScore, question, sampleAnswer } = await request.json()
    
    if (!answer || !questionId || !requiredKeywords) {
      return NextResponse.json(
        { error: '답안, 문제 ID, 필수 키워드가 필요합니다.' },
        { status: 400 }
      )
    }
    
    const scoreResult = await scoreSubjectiveAnswer(
      answer, 
      requiredKeywords, 
      optionalKeywords || [], 
      maxScore || 10,
      question,
      sampleAnswer
    )
    
    return NextResponse.json({
      success: true,
      data: scoreResult
    })
  } catch (error) {
    console.error('채점 API 처리 실패:', error)
    return NextResponse.json(
      { error: '채점 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
