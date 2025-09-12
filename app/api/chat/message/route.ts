import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { createClient } from 'redis'
import OpenAI from 'openai'

const redis = createClient({
  url: process.env.DATABASE_URL || process.env.REDIS_URL
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { chatSessionId, message, studentContext } = await request.json()

    if (!chatSessionId || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (!redis.isOpen) {
      await redis.connect()
    }

    // Get chat session info
    const lookupKey = await redis.get(`chat:lookup:${chatSessionId}`)
    if (!lookupKey) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    const chatSession = await redis.hGetAll(lookupKey)
    
    // Verify user has access
    const userRole = (session.user as any)?.role
    const userId = (session.user as any)?.userId
    const userEmail = (session.user as any)?.email
    
    if (chatSession.influencerSlug === 'yaktoon') {
      const isYaktoon = userId === 'yaktoon' || userEmail === 'yaktoon@rootedu.com' || userRole === 'admin'
      if (!isYaktoon) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Store user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }

    const messagesKey = `chat:messages:${chatSessionId}`
    await redis.rPush(messagesKey, JSON.stringify(userMessage))

    // Get conversation history
    const history = await redis.lRange(messagesKey, 0, -1)
    const messages = history.map(msg => JSON.parse(msg))

    // Prepare context for AI with enhanced citation requirements
    const systemPrompt = `You are an expert educational consultant specializing in Korean student record (생활기록부) analysis and personalized academic guidance.

🔴 MANDATORY RESPONSE RULES:
1. EVERY response MUST cite specific data from the student's record using【】brackets
2. NEVER provide generic advice - all recommendations must link to actual student activities
3. If data is insufficient, explicitly state: "생기부 데이터가 부족하여 구체적 조언이 어렵습니다"
4. Use direct quotes from the student's actual records when available
5. Structure all responses with evidence-based reasoning

📊 STUDENT PROFILE:
${studentContext ? `
학생명: ${studentContext.userName}
분석일자: ${new Date(studentContext.createdAt).toLocaleDateString('ko-KR')}

${studentContext.analysisData ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 생활기록부 분석 데이터:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ 창의적체험활동 (${studentContext.analysisData.creativeActivities?.창의적체험활동상황?.length || 0}개):
${studentContext.analysisData.creativeActivities?.창의적체험활동상황 ? 
  JSON.stringify(studentContext.analysisData.creativeActivities.창의적체험활동상황.slice(0, 5), null, 2) : 
  '데이터 없음'}

2️⃣ 교과학습발달상황 (${studentContext.analysisData.academicDevelopments?.교과학습발달상황?.length || 0}개 과목):
${studentContext.analysisData.academicDevelopments?.교과학습발달상황 ? 
  JSON.stringify(studentContext.analysisData.academicDevelopments.교과학습발달상황.slice(0, 5), null, 2) : 
  '데이터 없음'}

3️⃣ 세부능력 및 특기사항 (${studentContext.analysisData.detailedAbilities?.세부특기사항?.length || 0}개):
${studentContext.analysisData.detailedAbilities?.세부특기사항 ? 
  JSON.stringify(studentContext.analysisData.detailedAbilities.세부특기사항.slice(0, 5), null, 2) : 
  '데이터 없음'}

4️⃣ 행동특성 및 종합의견:
${studentContext.analysisData.behavioralCharacteristics ? 
  JSON.stringify(studentContext.analysisData.behavioralCharacteristics, null, 2) : 
  '데이터 없음'}

5️⃣ 진로희망사항:
${studentContext.analysisData.careerAspirations ? 
  JSON.stringify(studentContext.analysisData.careerAspirations, null, 2) : 
  '데이터 없음'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : '⚠️ 생기부 분석 데이터가 없습니다. PDF 업로드가 필요합니다.'}
` : '⚠️ 학생 정보가 없습니다. 로그인 후 생기부를 업로드해주세요.'}

📝 RESPONSE FORMAT REQUIREMENTS:
1. 시작: "【생기부 기반 분석】" 라벨 필수
2. 활동 인용: 【창체: (구체적 활동명과 내용)】
3. 학업 인용: 【교과: (과목명, 성취도, 특기사항)】
4. 특기 인용: 【특기: (구체적 내용 인용)】
5. 진로 연계: 【진로: (희망사항과 활동 연계)】

⚡ CITATION EXAMPLES:
- 올바른 예: "학생은【창체: 2학년 과학동아리 '바이오텍' 부장】으로 활동하며 리더십을 보였습니다."
- 잘못된 예: "학생은 과학 분야에 관심이 있는 것 같습니다." (구체적 근거 없음)

🎯 CONSULTATION FOCUS AREAS:
1. 강점 분석: 생기부에 나타난 구체적 성과와 역량
2. 보완점 제시: 현재 기록에서 부족한 부분과 개선 방안
3. 진로 연계성: 희망 진로와 현재 활동의 일치도
4. 대입 전략: 생기부 내용 기반 입시 전략 제안

모든 답변은 반드시 한국어로 작성하며, 학생의 실제 데이터를 기반으로 한 맞춤형 조언을 제공하세요.
데이터가 없는 경우 "생기부 데이터 부족"을 명시하고 일반적 조언은 제공하지 마세요.`

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    // Store AI response
    const assistantMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    }

    await redis.rPush(messagesKey, JSON.stringify(assistantMessage))

    // Update last message time
    await redis.hSet(lookupKey, {
      lastMessageAt: new Date().toISOString()
    })

    return NextResponse.json({
      response: aiResponse,
      messageId: assistantMessage.id
    })
  } catch (error) {
    console.error('Error processing message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  } finally {
    if (redis.isOpen) {
      await redis.disconnect()
    }
  }
}