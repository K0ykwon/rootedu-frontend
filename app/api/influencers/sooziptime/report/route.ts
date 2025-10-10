import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const g = globalThis as unknown as { __SOOZIP_DAILY?: Map<string, { date: string; items: any[]; quote?: string }> };
if (!g.__SOOZIP_DAILY) g.__SOOZIP_DAILY = new Map();

function getToday(): string { return new Date().toISOString().split('T')[0]; }
function calcDuration(start: string, end: string): number { const [sh, sm] = start.split(':').map(Number); const [eh, em] = end.split(':').map(Number); return eh*60+em - (sh*60+sm); }
function extractBullets(text: string): string[] { return text.split('\n').filter(l => l.startsWith('-') || l.startsWith('•')).map(s => s.replace(/^[-•]\s*/, '')).slice(0,5); }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const clientId: string = body?.clientId || 'anon';
    const goals: string[] = Array.isArray(body?.goals) ? body.goals : [];
    const goalsText: string = typeof body?.goalsText === 'string' ? body.goalsText : '';
    const date = getToday();
    const plan = g.__SOOZIP_DAILY!.get(`${clientId}:${date}`);

    const totalMinutes = (plan?.items||[]).reduce((s, i) => s + calcDuration(i.startTime, i.endTime), 0);
    const totalHours = Math.round((totalMinutes/60)*100)/100;
    const completedCount = (plan?.items||[]).filter(i => i.completed).length;
    const completionRate = (plan?.items||[]).length ? Math.round((completedCount/(plan?.items||[]).length)*10000)/100 : 0;
    const bySubject: Record<string, number> = {};
    (plan?.items||[]).forEach(i => { bySubject[i.subject] = (bySubject[i.subject]||0) + calcDuration(i.startTime, i.endTime)/60; });
    const subjectBreakdown = Object.entries(bySubject).map(([subject, hours]) => ({ subject, hours: Math.round((hours as number)*100)/100 }));

    const system = '너는 학습 코치다. 간결 한국어로 작성: 목표 요약 3-5개, 수치 분석(총시간/완료율/과목별 시간), 종합 평가 5-7문장.';
    const goalsSummary = goalsText || (goals.length ? goals.join(', ') : '없음');
    const userPrompt = `목표: ${goalsSummary}\n오늘 계획 항목 수: ${(plan?.items||[]).length}\n완료 항목: ${completedCount}\n총 학습시간: ${totalHours}h\n완료율: ${completionRate}%\n과목별 시간: ${subjectBreakdown.map(v=>`${v.subject}:${v.hours}h`).join(', ')}`;

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [ { role: 'system', content: system }, { role: 'user', content: userPrompt } ] });
    const content = completion.choices[0]?.message?.content || '';

    const report = {
      date,
      goalSummary: extractBullets(content),
      numericAnalysis: { totalStudyHours: totalHours, completionRate, subjectBreakdown },
      overallAssessment: content
    };

    return NextResponse.json({ success: true, data: report });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}

// duplicate helper definitions removed above


