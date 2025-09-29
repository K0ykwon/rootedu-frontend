import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';
import type { ChatResponses, SubjectPlan, TimeRange, ChatStep } from '@/lib/types/study-plan';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Zod schemas for OpenAI Structured Output
const SubjectPlanSchema = z.object({
  subject: z.string().describe('과목명'),
  content: z.string().describe('학습할 구체적인 내용'),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .describe('시작 시간 (HH:mm)'),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .describe('종료 시간 (HH:mm)'),
});

const StudyPlanResponseSchema = z.object({
  plans: z.array(SubjectPlanSchema).describe('과목별 학습 계획'),
  motivationalQuote: z.string().nullable().describe('동기부여 문구'),
});

type StudyPlanResponse = z.infer<typeof StudyPlanResponseSchema>;

export class OpenAIPlannerService {
  // Enforce minimum duration for all activities
  private static enforceMinimumDuration(plan: StudyPlanResponse): StudyPlanResponse {
    const MIN_DURATION_MINUTES = 20;
    const validatedPlans = [...plan.plans];

    for (let i = 0; i < validatedPlans.length; i++) {
      const currentPlan = validatedPlans[i];
      const startTime = this.parseTimeToMinutes(currentPlan.startTime);
      const endTime = this.parseTimeToMinutes(currentPlan.endTime);
      const duration = endTime - startTime;

      // If duration is less than minimum, extend the end time
      if (duration < MIN_DURATION_MINUTES) {
        const newEndTime = startTime + MIN_DURATION_MINUTES;
        currentPlan.endTime = this.formatMinutesToTime(newEndTime);

        // Adjust all following plans to prevent overlap
        for (let j = i + 1; j < validatedPlans.length; j++) {
          const nextPlan = validatedPlans[j];
          const nextStart = this.parseTimeToMinutes(nextPlan.startTime);
          const nextEnd = this.parseTimeToMinutes(nextPlan.endTime);
          const nextDuration = nextEnd - nextStart;

          // If the next plan starts before our extended end time, push it forward
          if (nextStart < newEndTime) {
            const adjustment = newEndTime - nextStart;
            nextPlan.startTime = this.formatMinutesToTime(nextStart + adjustment);
            nextPlan.endTime = this.formatMinutesToTime(nextEnd + adjustment);
          }
        }
      }
    }

    return {
      ...plan,
      plans: validatedPlans
    };
  }

  // Helper: Convert HH:mm to minutes since midnight
  private static parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper: Convert minutes since midnight to HH:mm
  private static formatMinutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Generate a study plan based on user responses
  static async generateStudyPlan(responses: ChatResponses): Promise<StudyPlanResponse> {
    const prompt = this.buildPrompt(responses);

    try {
      const response = await openai.chat.completions.parse({
        model: 'gpt-4o-2024-08-06',
        messages: [
          {
            role: 'system',
            content: `당신은 학생들의 학습 계획을 도와주는 전문 교육 컨설턴트입니다.
학생이 제공한 정보를 바탕으로 효과적이고 실행 가능한 일일 학습 계획을 수립해주세요.

다음 원칙을 반드시 지켜주세요:
1. 각 과목별로 적절한 휴식 시간(20-30분)을 포함하여 계획을 수립합니다.
2. 학습 효율을 고려하여 어려운 과목과 쉬운 과목을 적절히 배치합니다.
3. 제공된 시간대 내에서만 계획을 수립하고, 절대 시간대를 벗어나지 않습니다.
4. 여러 시간대가 제공된 경우 (예: 09:00-12:00, 14:00-18:00), 각 시간대 내에서만 계획을 수립하고 그 사이 시간은 비워둡니다.
5. 모든 시간은 24시간 형식(HH:mm)으로 작성합니다. 예: 09:00, 14:30, 20:00
6. 각 과목의 시작 시간과 종료 시간이 겹치지 않도록 순차적으로 배치합니다.
7. 각 과목의 학습 내용은 구체적이고 명확하게 작성합니다.
8. 동기부여 문구는 학생에게 격려가 되는 따뜻한 메시지로 작성합니다.
9. 모든 활동(학습 및 휴식 포함)은 최소 20분 이상으로 설정합니다. 짧은 활동은 UI에서 겹쳐 보일 수 있습니다.

중요: 시간 계획은 제공된 시간대를 정확히 준수하며, 시간대 간 공백이 있는 경우 그 시간에는 아무 계획도 배치하지 않습니다.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: zodResponseFormat(StudyPlanResponseSchema, 'study_plan'),
      });

      const message = response.choices[0]?.message;
      if (!message?.parsed) {
        throw new Error('Failed to parse study plan response');
      }
      const plan = message.parsed;
      if (!plan) {
        throw new Error('Failed to parse OpenAI response');
      }

      // Validate and fix minimum durations
      const validatedPlan = this.enforceMinimumDuration(plan);

      return validatedPlan;
    } catch (error) {
      console.error('Error generating study plan:', error);
      throw error;
    }
  }

  // Build prompt from user responses
  private static buildPrompt(responses: ChatResponses): string {
    const parts: string[] = [];

    if (responses.timeRanges && responses.timeRanges.length > 0) {
      const timeStrings = responses.timeRanges
        .map(range => `${range.start} ~ ${range.end}`)
        .join(', ');
      parts.push(`학습 가능 시간대: ${timeStrings}`);
      parts.push('주의: 각 시간대는 분리되어 있으며, 그 사이 시간은 학습할 수 없습니다.');
    }

    if (responses.subjects && responses.subjects.length > 0) {
      parts.push(`학습할 과목: ${responses.subjects.join(', ')}`);
    }

    if (responses.subjectDetails && responses.subjectDetails.length > 0) {
      const details = responses.subjectDetails
        .map(d => `- ${d.subject}: ${d.content}`)
        .join('\n');
      parts.push(`각 과목별 학습 내용:\n${details}`);
    }

    if (responses.timeAllocation && responses.timeAllocation.length > 0) {
      const allocations = responses.timeAllocation
        .map(a => `- ${a.subject}: ${a.duration}분`)
        .join('\n');
      parts.push(`각 과목별 학습 시간:\n${allocations}`);
    }

    if (responses.motivationalQuote) {
      parts.push(`희망하는 동기부여 문구 스타일: ${responses.motivationalQuote}`);
    } else {
      parts.push('동기부여 문구: 학생에게 격려가 되는 따뜻한 메시지를 작성해주세요.');
    }

    parts.push('\n위 정보를 바탕으로 효과적인 일일 학습 계획을 수립해주세요.');
    parts.push('과목 간 20-30분의 휴식 시간을 포함해주세요.');
    parts.push('모든 활동(학습 및 휴식)은 최소 20분 이상으로 설정해주세요.');
    parts.push('시간은 반드시 제공된 시간대 내에서만 설정해주세요.');
    parts.push('여러 시간대가 제공된 경우, 각 시간대 내에서만 계획을 수립하고 시간대 사이는 비워두세요.');
    parts.push('시간은 24시간 형식(HH:mm)으로 작성해주세요.');

    return parts.join('\n\n');
  }

  // Get next question based on current step
  static getQuestion(step: string): string {
    const questions: Record<string, string> = {
      time_range: '오늘 몇시부터 몇시 사이에 공부를 하실 건가요? (예: 09:00부터 18:00까지)',
      subjects: '오늘 어떤 과목들을 공부하실 건가요? (쉼표로 구분해서 입력해주세요. 예: 수학, 영어, 과학)',
      subject_details: '각 과목별로 어떤 내용을 공부하고자 하시나요?',
      time_allocation: '각 과목별로 공부하는데 시간은 얼마나 쓸 생각이신가요? (분 단위로 입력해주세요)',
      motivational_quote: '오늘 플래너의 글귀에는 어떤 내용이 담기면 좋겠나요? (선택사항 - 건너뛰려면 "skip"을 입력하세요)',
      generating: '계획을 생성 중입니다...',
      completed: '계획이 완성되었습니다!',
    };

    return questions[step] || '알 수 없는 단계입니다.';
  }

  // Parse user message based on current step
  static parseUserResponse(step: string, message: string, responses: ChatResponses): ChatResponses {
    const updatedResponses = { ...responses };

    switch (step) {
      case 'time_range': {
        // Parse multiple time ranges separated by commas
        // Examples: "09:00-12:00, 14:00-18:00" or "오전 9시-12시, 오후 2시-6시"
        const ranges: TimeRange[] = [];

        // Split by comma and process each range
        const rangeParts = message.split(',').map(s => s.trim());

        for (const part of rangeParts) {
          // Handle AM/PM indicators
          const hasAM = part.includes('오전') || part.toLowerCase().includes('am');
          const hasPM = part.includes('오후') || part.toLowerCase().includes('pm');

          // Extract time numbers
          const timeMatch = part.match(/(\d{1,2}):?(\d{0,2})\D*(\d{1,2}):?(\d{0,2})/);

          if (timeMatch) {
            let startHour = parseInt(timeMatch[1], 10);
            const startMin = timeMatch[2] || '00';
            let endHour = parseInt(timeMatch[3], 10);
            const endMin = timeMatch[4] || '00';

            // Adjust for PM times (but not for 12 PM which stays as 12)
            if (hasPM && startHour !== 12 && startHour < 12) {
              startHour += 12;
            }
            if (hasPM && endHour !== 12 && endHour < 12) {
              endHour += 12;
            }

            // Adjust for 12 AM which should be 0
            if (hasAM && startHour === 12) {
              startHour = 0;
            }
            if (hasAM && endHour === 12) {
              endHour = 0;
            }

            // If no AM/PM specified and hour is small, assume PM for afternoon times
            if (!hasAM && !hasPM) {
              // If a small hour follows a larger hour in the same message, assume PM
              if (ranges.length > 0 && startHour < 12) {
                const lastEnd = parseInt(ranges[ranges.length - 1].end.split(':')[0]);
                if (lastEnd > startHour) {
                  startHour += 12;
                }
              }
              if (startHour < endHour && endHour < 12 && startHour >= 12) {
                endHour += 12;
              }
            }

            ranges.push({
              start: `${startHour.toString().padStart(2, '0')}:${startMin}`,
              end: `${endHour.toString().padStart(2, '0')}:${endMin}`,
            });
          }
        }

        if (ranges.length > 0) {
          updatedResponses.timeRanges = ranges;
        }
        break;
      }

      case 'subjects': {
        // Parse subjects (comma-separated for backward compatibility)
        const subjects = message
          .split(/[,，]/)
          .map(s => s.trim())
          .filter(s => s.length > 0);
        if (subjects.length > 0) {
          updatedResponses.subjects = subjects;
        }
        break;
      }

      case 'subject_details': {
        // Parse subject details
        const details: { subject: string; content: string }[] = [];

        if (updatedResponses.subjects) {
          // Try to parse structured format (e.g., "수학: 미적분, 영어: 문법")
          const lines = message.split(/[,\n]/).map(s => s.trim()).filter(s => s);

          for (const subject of updatedResponses.subjects) {
            // Find content for this subject
            let content = '';
            for (const line of lines) {
              if (line.toLowerCase().includes(subject.toLowerCase())) {
                const parts = line.split(/[:：-]/);
                if (parts.length > 1) {
                  content = parts.slice(1).join(':').trim();
                } else {
                  content = line.replace(subject, '').trim();
                }
                break;
              }
            }

            // If no specific content found, use the generic input
            if (!content && lines.length === 1) {
              content = lines[0];
            }

            if (content) {
              details.push({ subject, content });
            }
          }

          // If we couldn't match subjects, create generic entries
          if (details.length === 0 && updatedResponses.subjects.length > 0) {
            for (let i = 0; i < updatedResponses.subjects.length; i++) {
              details.push({
                subject: updatedResponses.subjects[i],
                content: lines[i] || '일반 학습',
              });
            }
          }
        }

        updatedResponses.subjectDetails = details;
        break;
      }

      case 'time_allocation': {
        // Parse time allocations
        const allocations: { subject: string; duration: number }[] = [];

        if (updatedResponses.subjects) {
          // Try to parse structured format (e.g., "수학: 120분, 영어: 90분")
          const parts = message.split(/[,，]/).map(s => s.trim());

          // Look for subject: duration pattern
          for (const part of parts) {
            const match = part.match(/^(.+?):\s*(\d+)분?$/);
            if (match) {
              const [, subjectName, durationStr] = match;
              const subject = subjectName.trim();
              const duration = parseInt(durationStr, 10);

              // Verify this subject exists in our list
              if (updatedResponses.subjects.includes(subject)) {
                allocations.push({ subject, duration });
              }
            }
          }

          // Fallback: if no structured format found, use numbers only
          if (allocations.length === 0) {
            const numbers = message.match(/\d+/g);
            if (numbers) {
              for (let i = 0; i < updatedResponses.subjects.length && i < numbers.length; i++) {
                allocations.push({
                  subject: updatedResponses.subjects[i],
                  duration: parseInt(numbers[i], 10),
                });
              }
            }
          }
        }

        updatedResponses.timeAllocation = allocations;
        break;
      }

      case 'motivational_quote': {
        // Parse motivational quote preference
        if (message.toLowerCase() !== 'skip' && message.trim().length > 0) {
          updatedResponses.motivationalQuote = message.trim();
        }
        break;
      }
    }

    return updatedResponses;
  }

  // Get next step based on current step
  static getNextStep(currentStep: string): ChatStep {
    const stepOrder: ChatStep[] = [
      'time_range',
      'subjects',
      'subject_details',
      'time_allocation',
      'motivational_quote',
      'generating',
      'completed',
    ];

    const currentIndex = stepOrder.indexOf(currentStep as ChatStep);
    if (currentIndex === -1 || currentIndex >= stepOrder.length - 1) {
      return 'completed';
    }

    return stepOrder[currentIndex + 1];
  }

  // Validate responses are complete
  static validateResponses(responses: ChatResponses): boolean {
    return !!(
      responses.timeRanges &&
      responses.timeRanges.length > 0 &&
      responses.subjects &&
      responses.subjects.length > 0 &&
      responses.subjectDetails &&
      responses.subjectDetails.length > 0 &&
      responses.timeAllocation &&
      responses.timeAllocation.length > 0
    );
  }
}