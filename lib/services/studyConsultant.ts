import OpenAI from 'openai';
import type {
  DailyStudyPlan,
  ReflectionMessage,
  ReflectionReport,
  SubjectPlan
} from '@/lib/types/study-plan';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 시스템 프롬프트 템플릿
const SYSTEM_PROMPT = `
당신은 한국 고등학생들을 위한 따뜻하고 친근한 학습 멘토입니다.
마치 좋은 선배나 친구처럼 편안하고 자연스러운 대화를 통해 학습에 대한 진솔한 이야기를 나누고,
실용적인 조언과 격려를 제공하세요.

오늘의 학습 계획:
{studyPlanContext}

대화 원칙:
1. 자연스럽고 편안한 대화 흐름 유지 - 기계적이거나 정형화된 질문 금지
2. 학생의 답변을 주의 깊게 듣고, 그에 맞는 맞춤형 후속 질문이나 반응
3. 이미 답변한 내용에 대해서는 절대 반복 질문하지 않기
4. 친근하지만 존중하는 어조로, "~하셨네요", "그렇구나" 같은 자연스러운 반응
5. 구체적인 상황과 감정에 공감하며 진정성 있는 대화

대화 목표 (순서대로 강요하지 말고 자연스럽게):
- 오늘 학습에 대한 전반적인 기분과 느낌 파악
- 잘했던 점이나 만족스러웠던 순간 발견
- 어려웠거나 아쉬웠던 부분 솔직하게 나누기
- 구체적이고 실행 가능한 개선 아이디어 함께 찾기
- 내일을 위한 동기와 구체적인 계획 세우기

대화 스타일:
- "어떠셨나요?"보다는 "어떤 기분이셨을까요?", "힘들지 않으셨어요?" 같은 다양한 표현
- 학생의 감정과 상황에 맞는 자연스러운 반응 ("아, 그렇구나!", "정말요?", "힘드셨겠어요")
- 일방적인 질문보다는 대화를 통한 자연스러운 탐색
- 학생이 말한 구체적인 내용을 기억하고 그것을 바탕으로 이어가기

절대 하지 말아야 할 것:
- 같은 질문이나 비슷한 질문 반복하기
- 학생이 이미 답변한 내용 다시 묻기
- 기계적이고 정형화된 문구 사용
- 무조건 5가지 주제를 순서대로 다루려고 강요하기
- "오늘의 학습은 어떠셨나요?" 같은 뻔한 질문

대신 이렇게:
- 학생의 말에 진심으로 관심을 갖고 자연스럽게 이어가기
- 상황에 맞는 적절한 공감과 격려
- 학생이 말하지 않은 부분에 대해서만 호기심 갖고 물어보기
- 편안하고 따뜻한 분위기에서 진솔한 대화 유도
`;

// 리포트 생성 프롬프트
const REPORT_PROMPT = `
다음은 학생과의 5턴 대화 내용입니다. 이를 바탕으로 종합적인 학습 피드백 리포트를 작성해주세요.

대화 내용:
{conversationHistory}

오늘의 학습 계획:
{studyPlanContext}

다음 JSON 형식으로 리포트를 작성해주세요:
{
  "strengths": ["잘한 점 1", "잘한 점 2", "잘한 점 3"],
  "improvements": ["개선할 점 1", "개선할 점 2"],
  "tomorrowPlan": "내일 학습을 위한 구체적이고 실행 가능한 제안",
  "motivation": "학생을 격려하고 동기부여하는 메시지",
  "overallScore": 8
}

작성 가이드:
- strengths: 구체적이고 긍정적인 피드백 3가지
- improvements: 건설적이고 실행 가능한 개선점 2가지
- tomorrowPlan: 오늘의 경험을 바탕으로 한 내일의 구체적 학습 계획
- motivation: 따뜻하고 격려하는 메시지
- overallScore: 1-10점 척도로 오늘의 학습 성과 평가

모든 내용은 한국어로 작성하고, 고등학생이 이해하기 쉬운 언어를 사용해주세요.
`;

// 학습 계획 컨텍스트 포맷팅
function formatStudyPlanContext(plan: DailyStudyPlan): string {
  const completedSubjects = plan.plans.filter(p => p.completed);
  const totalSubjects = plan.plans.length;

  const subjectDetails = plan.plans.map(subject =>
    `- ${subject.subject} (${subject.startTime}-${subject.endTime}): ${subject.content} ${subject.completed ? '✅ 완료' : '⏳ 미완료'}`
  ).join('\n');

  return `
날짜: ${plan.date}
전체 학습시간: ${plan.totalStartTime} - ${plan.totalEndTime}
완료율: ${completedSubjects.length}/${totalSubjects} (${Math.round((completedSubjects.length / totalSubjects) * 100)}%)

과목별 세부사항:
${subjectDetails}

동기부여 문구: ${plan.motivationalQuote || '없음'}
`;
}

// 대화 기록 포맷팅
function formatConversationHistory(messages: ReflectionMessage[]): string {
  return messages.map(msg =>
    `${msg.role === 'user' ? '학생' : '컨설턴트'}: ${msg.content}`
  ).join('\n\n');
}

// 첫 번째 메시지 생성
export async function generateFirstMessage(plan: DailyStudyPlan): Promise<string> {
  const context = formatStudyPlanContext(plan);
  const completedCount = plan.plans.filter(p => p.completed).length;
  const totalCount = plan.plans.length;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT.replace('{studyPlanContext}', context)
        },
        {
          role: 'user',
          content: `첫 대화를 자연스럽고 따뜻하게 시작해주세요. 학생은 오늘 ${completedCount}/${totalCount}개의 학습을 완료했습니다. 편안하고 친근한 분위기로 대화를 시작하되, "어떠셨나요" 같은 뻔한 질문은 피해주세요.`
        }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return completion.choices[0]?.message?.content ||
           '안녕하세요! 오늘도 정말 수고하셨어요. 뭔가 뿌듯한 하루였을 것 같은데, 기분이 어떠신가요?';
  } catch (error) {
    console.error('Error generating first message:', error);
    // 다양한 폴백 메시지 중 랜덤 선택
    const fallbackMessages = [
      '안녕하세요! 오늘도 정말 수고하셨어요. 뭔가 뿌듯한 하루였을 것 같은데, 기분이 어떠신가요?',
      '오늘 하루도 열심히 공부하셨군요! 피곤하시진 않으세요? 어떤 기분으로 하루를 마무리하게 되셨나요?',
      '안녕하세요! 오늘도 학습 계획을 성실히 따라가신 모습이 정말 멋져요. 어떤 하루였는지 궁금해요!',
    ];
    return fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
  }
}

// 스트리밍 응답 생성
export async function* streamConsultantResponse(
  messages: ReflectionMessage[],
  plan: DailyStudyPlan
): AsyncGenerator<string, void, unknown> {
  const context = formatStudyPlanContext(plan);

  try {
    // 대화 맥락 분석하여 추가 지침 제공
    const conversationContext = messages.length > 0 ?
      `현재까지의 대화: ${messages.map(m => `${m.role}: ${m.content}`).join(' / ')}` :
      '대화 시작';

    const contextualInstruction = `
    중요: 지금까지 학생이 말한 내용을 절대 반복해서 묻지 마세요.
    이미 답변한 내용: ${messages.filter(m => m.role === 'user').map(m => m.content).join(', ')}

    새로운 관점이나 아직 다루지 않은 부분에 대해서만 자연스럽게 대화를 이어가세요.
    현재 턴: ${Math.ceil(messages.length / 2) + 1}/5
    `;

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT.replace('{studyPlanContext}', context) + contextualInstruction
        },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      ],
      temperature: 0.8,
      max_tokens: 400,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('Error streaming consultant response:', error);
    yield '죄송합니다. 잠시 기술적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }
}

// 최종 리포트 생성
export async function generateReport(
  messages: ReflectionMessage[],
  plan: DailyStudyPlan
): Promise<ReflectionReport> {
  const conversationHistory = formatConversationHistory(messages);
  const studyContext = formatStudyPlanContext(plan);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: REPORT_PROMPT
            .replace('{conversationHistory}', conversationHistory)
            .replace('{studyPlanContext}', studyContext)
        }
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // JSON 파싱 시도
    try {
      const report = JSON.parse(content) as ReflectionReport;

      // 기본값 검증 및 보정
      return {
        strengths: Array.isArray(report.strengths) ? report.strengths.slice(0, 3) : ['오늘 학습에 최선을 다하셨습니다.'],
        improvements: Array.isArray(report.improvements) ? report.improvements.slice(0, 2) : ['꾸준한 복습을 통해 더 나은 결과를 얻을 수 있을 것입니다.'],
        tomorrowPlan: report.tomorrowPlan || '내일도 오늘의 경험을 바탕으로 체계적인 학습 계획을 세워보세요.',
        motivation: report.motivation || '오늘도 정말 수고하셨어요! 꾸준한 노력이 반드시 좋은 결과로 이어질 것입니다.',
        overallScore: typeof report.overallScore === 'number' ? Math.min(Math.max(report.overallScore, 1), 10) : 7
      };
    } catch (parseError) {
      console.error('Error parsing report JSON:', parseError);
      throw new Error('Invalid JSON format from OpenAI');
    }
  } catch (error) {
    console.error('Error generating report:', error);

    // 폴백 리포트 생성
    const completedCount = plan.plans.filter(p => p.completed).length;
    const totalCount = plan.plans.length;
    const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    return {
      strengths: [
        '계획된 학습을 성실히 수행하려고 노력하셨습니다.',
        '체계적인 학습 계획을 세우고 실행하셨습니다.',
        `${completedCount}개의 과목을 완료하는 성과를 거두었습니다.`
      ],
      improvements: [
        '학습 집중도를 높이기 위한 환경 개선을 고려해보세요.',
        '복습 시간을 충분히 확보하여 학습 효과를 극대화해보세요.'
      ],
      tomorrowPlan: '오늘의 학습 경험을 바탕으로 내일은 더욱 효율적인 학습 계획을 세워보세요. 특히 어려웠던 부분에 더 많은 시간을 할애하는 것을 추천합니다.',
      motivation: `오늘 ${Math.round(completionRate)}%의 학습 목표를 달성하셨어요! 꾸준한 노력이 반드시 좋은 결과로 이어질 것입니다. 화이팅!`,
      overallScore: Math.max(Math.round(completionRate / 10), 5)
    };
  }
}

// 대화 품질 체크 헬퍼 함수
export function getConversationInsights(messages: ReflectionMessage[]): {
  coveredTopics: string[];
  missingTopics: string[];
  suggestions: string[];
} {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content.toLowerCase());
  const allUserText = userMessages.join(' ');

  // 다룬 주제들 체크
  const topicChecks = {
    feelings: /기분|느낌|감정|뿌듯|만족|힘들|피곤|좋|나쁨/.test(allUserText),
    achievements: /잘했|성공|완료|달성|뿌듯|만족|자랑/.test(allUserText),
    difficulties: /어려웠|힘들|아쉬웠|실패|부족|못했/.test(allUserText),
    methods: /방법|어떻게|공부|학습|집중/.test(allUserText),
    plans: /내일|계획|목표|하고싶|다음/.test(allUserText)
  };

  const coveredTopics = Object.entries(topicChecks)
    .filter(([_, covered]) => covered)
    .map(([topic, _]) => topic);

  const missingTopics = Object.entries(topicChecks)
    .filter(([_, covered]) => !covered)
    .map(([topic, _]) => topic);

  // 대화 개선 제안
  const suggestions = [];
  if (messages.length < 6) {
    if (missingTopics.includes('achievements')) {
      suggestions.push('학생의 성취나 잘한 점에 대해 더 구체적으로 들어보세요.');
    }
    if (missingTopics.includes('difficulties')) {
      suggestions.push('어려웠던 점이나 개선이 필요한 부분을 자연스럽게 물어보세요.');
    }
    if (missingTopics.includes('plans')) {
      suggestions.push('앞으로의 계획이나 내일에 대한 생각을 들어보세요.');
    }
  }

  return { coveredTopics, missingTopics, suggestions };
}