import { NextRequest, NextResponse } from 'next/server';

type DailyItem = { id: string; subject: string; content: string; startTime: string; endTime: string; completed: boolean };

const g = globalThis as unknown as { __SOOZIP_DAILY?: Map<string, { date: string; items: DailyItem[]; quote?: string }> };
if (!g.__SOOZIP_DAILY) g.__SOOZIP_DAILY = new Map();

function getToday(): string { return new Date().toISOString().split('T')[0]; }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || 'anon';
  const date = getToday();
  const data = g.__SOOZIP_DAILY!.get(`${clientId}:${date}`) || null;
  return NextResponse.json({ success: true, data });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId: string = body?.clientId || 'anon';
    const itemId: string = body?.itemId;
    const updates: Partial<DailyItem> = body?.updates || {};
    const key = `${clientId}:${getToday()}`;
    const plan = g.__SOOZIP_DAILY!.get(key);
    if (!plan) return NextResponse.json({ success: false, error: 'No plan for today' }, { status: 404 });
    const idx = plan.items.findIndex(i => i.id === itemId);
    if (idx === -1) return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    plan.items[idx] = { ...plan.items[idx], ...updates };
    g.__SOOZIP_DAILY!.set(key, plan);
    return NextResponse.json({ success: true, data: plan });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId: string = body?.clientId || 'anon';
    const prompt: string = body?.prompt || '';
    const goals: string[] = Array.isArray(body?.goals) ? body.goals : [];
    const edits: string[] = Array.isArray(body?.edits) ? body.edits : [];
    const completedBlocks: string[] = Array.isArray(body?.completed) ? body.completed : [];
    const availability: Array<{ start: string; end: string }> = Array.isArray(body?.availability) ? body.availability : [];
    const history: Array<{ role: 'user'|'assistant'; content: string }> = Array.isArray(body?.history) ? body.history : [];
    const previewRaw: string = typeof body?.preview === 'string' ? body.preview : '';
    const date = getToday();

    const userPrompt = `${prompt}\n목표(선택): ${goals.join(', ') || '없음'}\n수정사항: ${edits.join('; ')}\n가용시간: ${availability.map(r=>`${r.start}-${r.end}`).join(', ')}`;
    let text: string = '';
    if (previewRaw) {
      text = previewRaw;
    } else {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '너는 학습 코치다. 아래 대화 히스토리와 사용자의 요청만을 근거로 일간 학습 계획을 작성하라. 출력 포맷만 엄격히 지켜라: 1) 각 블록은 최소 20분. 2) 시간 라인은 "HH:MM - HH:MM" 형식. 3) 다음 줄에 과목/활동, 다음 줄에 구체적 내용(예: 문제집 몇 문제, 개념/유형 등). 4) 완료/체크/상태 텍스트는 포함 금지. 5) 휴식은 과목/활동을 "휴식"으로 표기. 6) 모든 블록 출력 후 마지막 줄에 "동기부여: ..." 한 줄 포함.'
          },
          ...history.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userPrompt }
        ]
      });
      text = completion.choices[0]?.message?.content || '';
    }
    // Fallback: 빈 문자열이면 안전 종료
    if (!text) text = '';
    const lines: string[] = text.split('\n').map((l: string) => l.trim()).filter((val: string) => Boolean(val));
    const timePattern = /^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})(?:\s*(.*))?$/;
    const isTimeLine = (s: string) => timePattern.test(s);

    const items: DailyItem[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!isTimeLine(line)) continue;
      const match = line.match(timePattern);
      const start = match?.[1] || '09:00';
      const end = match?.[2] || '10:00';
      let tail = (match?.[3] || '').trim();

      // Lookahead to collect subject/content lines until next time block
      const detailLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && !isTimeLine(lines[j])) {
        const t = lines[j].trim();
        if (t && t !== '완료') detailLines.push(t);
        j++;
      }
      // Move index to last consumed detail line
      i = j - 1;

      // Derive subject/content
      let subject = '학습';
      let content = '';
      if (tail) {
        const [s1, ...restParts] = tail.split(/[:\-]/).map((v: string) => v.trim()).filter(Boolean);
        if (s1) subject = s1;
        if (restParts.length) content = restParts.join(':');
      }
      if (detailLines.length > 0) {
        subject = detailLines[0] || subject;
        if (detailLines[1]) content = detailLines.slice(1).join(' / ');
      }

      // Normalize generics
      if (/휴식/i.test(subject) || /rest/i.test(subject)) {
        subject = '휴식';
      }
      if (/완료/i.test(content)) content = '';

      const id = `d_${items.length + 1}`;
      const completed = completedBlocks.includes(`${start}-${end}`);
      items.push({ id, subject, content, startTime: start, endTime: end, completed });
    }
    let quote = lines.find((l: string) => /^동기부여\s*:|^동기\s*:/i.test(l)) || '';
    quote = quote.replace(/^동기부여\s*:|^동기\s*:/i, '').trim();
    // 덮어쓰기: 새로 생성 시 기존 것을 완전히 교체
    g.__SOOZIP_DAILY!.set(`${clientId}:${date}`, { date, items, quote });
    return NextResponse.json({ success: true, data: { date, items, quote } });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to generate daily plan' }, { status: 500 });
  }
}
