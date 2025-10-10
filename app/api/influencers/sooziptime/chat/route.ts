import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

type TimeRange = { start: string; end: string };
type DailyItem = { id: string; subject: string; content: string; startTime: string; endTime: string; completed: boolean };

const g = globalThis as unknown as { __SOOZIP_DAILY?: Map<string, { date: string; items: DailyItem[]; quote?: string }> };
if (!g.__SOOZIP_DAILY) g.__SOOZIP_DAILY = new Map();

function getToday(): string { return new Date().toISOString().split('T')[0]; }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId: string = body?.clientId || 'anon';
    const prompt: string = body?.prompt || '';
    const availability: TimeRange[] = Array.isArray(body?.availability) ? body.availability : [];
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = Array.isArray(body?.history) ? body.history : [];
    const forcePreview: boolean = Boolean(body?.forcePreview);

    // 하드코딩 제거: 부족 시에도 아래 LLM 판정/팔로업 생성 로직으로 일관 처리

    // 충분 정보 여부를 LLM이 판정 (엄격한 출력 포맷)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const system = '너는 학습 코치다. 아래 대화 맥락을 보고 오늘 계획 생성에 필요한 정보(목표/과목/시간대)가 충분한지 판정한다.\n- 시간대가 이미 주어졌다면 그대로 사용하고, 추가 질문 금지.\n- PREVIEW는 다음 두 조건 중 하나일 때만 yes: (1) 사용자가 미리보기/예시/샘플/보여줘 등으로 명시 요청, (2) 목표/과목/시간대가 명확하고 세부가 충분하여 미리보기가 유의미할 때. 그 외에는 no.\n- MESSAGE에는 친절한 안내 또는 팔로업 질문(부족한 항목)을 한국어 한두 문장으로 작성.\n정확히 세 줄로 출력: \nCAN: yes|no\nPREVIEW: yes|no\nMESSAGE: ...';
    const availText = availability.map(r => `${r.start}-${r.end}`).join(', ');
    const messages = [
      { role: 'system' as const, content: system },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: `프롬프트: ${prompt}\n가용 시간: ${availText}` }
    ];
    const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages });
    const resp = completion.choices[0]?.message?.content || '';
    const parts = resp.split('\n');
    const canLine = parts.find(l => /CAN\s*:/i.test(l)) || '';
    const previewLine = parts.find(l => /PREVIEW\s*:/i.test(l)) || '';
    const messageLineRaw = parts.find(l => /MESSAGE\s*:/i.test(l)) || '';
    const msgLine = messageLineRaw.replace(/^MESSAGE:\s*/i, '').trim();
    const canGenerate = /CAN:\s*yes/i.test(canLine);
    const wantPreview = /PREVIEW:\s*yes/i.test(previewLine) || forcePreview;

    if (canGenerate) {
      if (wantPreview) {
        const previewPrompt = `대화 히스토리:\n${history.map(m=>`${m.role}: ${m.content}`).join('\n')}\nuser: ${prompt}\n가용 시간: ${availText}\n요청: 아래 형식으로 간결한 미리보기 시간표를 작성하라. 각 줄은 다음 포맷:\nHH:MM - HH:MM\n과목/활동\n상세 내용\n(완료 체크는 표시하지 말 것)\n줄 간 공백 없이 연속적으로 출력.`;
        const previewComp = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: '너는 학습 코치다. 간단한 텍스트 시간표로 빠르게 미리보기를 제공한다. 각 블록은 최소 20분.' },
            ...history.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: previewPrompt }
          ]
        });
        const preview = previewComp.choices[0]?.message?.content || '';
        return NextResponse.json({ success: true, canGenerate: true, hint: msgLine || '', preview });
      }
      // 미리보기를 원하지 않는 경우, 힌트만 반환
      return NextResponse.json({ success: true, canGenerate: true, hint: msgLine || '' });
    }
    // If MESSAGE가 비어 있으면 LLM에 팔로업 질문만 재요청 (하드코딩 금지)
    if (!msgLine) {
      const followPrompt = `지금까지 대화:\n${history.map(m=>`${m.role}: ${m.content}`).join('\n')}\nuser: ${prompt}\n가용 시간: ${availText || '없음'}\n부족한 정보(목표/과목/시간대 등)를 빠르게 수집하기 위한 한국어 질문 한 문장만 출력하세요. 예시는 금지, 질문만.`;
      const fu = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '너는 간결한 팔로업 질문을 생성하는 비서다. 반드시 한 문장 질문만 출력한다.' },
          { role: 'user', content: followPrompt }
        ]
      });
      const fuMsg = fu.choices[0]?.message?.content?.trim() || '';
      return NextResponse.json({ success: true, needMoreInfo: true, followUp: fuMsg });
    }
    return NextResponse.json({ success: true, needMoreInfo: true, followUp: msgLine });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to generate via chat' }, { status: 500 });
  }
}


