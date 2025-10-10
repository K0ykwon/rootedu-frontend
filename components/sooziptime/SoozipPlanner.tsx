'use client';

import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

type TimeRange = { start: string; end: string };
type DailyItem = { id: string; subject: string; content: string; startTime: string; endTime: string; completed: boolean };

export default function SoozipPlanner() {
  const [clientId, setClientId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user'|'assistant'; content: string }>>([]);
  const [prompt, setPrompt] = useState('');
  const [availability, setAvailability] = useState<TimeRange[]>([{ start: '18:00', end: '21:00' }]);
  const [sending, setSending] = useState(false);
  const [followUp, setFollowUp] = useState<string>('');
  const [canGenerate, setCanGenerate] = useState(false);
  const [lastPreview, setLastPreview] = useState<string>('');

  const [plan, setPlan] = useState<{ date: string; items: DailyItem[]; quote?: string } | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  const [reportGoals, setReportGoals] = useState('');
  const [report, setReport] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    const id = typeof window !== 'undefined' ? (localStorage.getItem('soozip_client_id') || crypto.randomUUID()) : 'anon';
    setClientId(id);
    if (typeof window !== 'undefined') localStorage.setItem('soozip_client_id', id);
  }, []);

  const sendChat = async () => {
    if (!clientId) return;
    if (!prompt.trim()) return; // 빈 메시지 전송 방지
    setSending(true);
    setCanGenerate(false);
    try {
      const res = await fetch('/api/influencers/sooziptime/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, prompt, availability, history: chatHistory })
      });
      const data = await res.json();
      if (data.success && data.needMoreInfo) {
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: prompt },
          ...(data.followUp ? [{ role: 'assistant' as const, content: data.followUp }] : [])
        ]);
        setFollowUp('');
        setPrompt('');
        setCanGenerate(false);
        return;
      }
      if (data.success && data.canGenerate) {
        setChatHistory(prev => [
          ...prev,
          { role: 'user', content: prompt },
          ...(data.hint ? [{ role: 'assistant' as const, content: data.hint }] : []),
          ...(data.preview ? [{ role: 'assistant' as const, content: data.preview }] : [])
        ]);
        // preview가 오면 즉시 오늘 시간표에 반영
        if (data.preview) {
          setLastPreview(data.preview);
          try {
            await fetch('/api/influencers/sooziptime/daily', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clientId, preview: data.preview, availability, history: [...chatHistory, { role: 'user', content: prompt }, ...(data.hint ? [{ role: 'assistant', content: data.hint }] : []), { role: 'assistant', content: data.preview }] })
            });
            await fetchPlan();
          } catch (_) { /* ignore */ }
        }
        setPrompt('');
        setCanGenerate(true);
      } else {
        alert(data.error || '생성 실패');
      }
    } catch (e) {
      alert('요청 중 오류가 발생했습니다.');
    } finally {
      setSending(false);
    }
  };

  const fetchPlan = async () => {
    setLoadingPlan(true);
    try {
      const res = await fetch(`/api/influencers/sooziptime/daily?clientId=${encodeURIComponent(clientId)}`);
      const data = await res.json();
      if (data.success) setPlan(data.data || null);
    } catch (e) {
      // ignore
    } finally {
      setLoadingPlan(false);
    }
  };

  const toggleComplete = async (itemId: string, next: boolean) => {
    try {
      const res = await fetch('/api/influencers/sooziptime/daily', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, itemId, updates: { completed: next } })
      });
      const data = await res.json();
      if (data.success) setPlan(data.data);
    } catch (e) {
      // ignore
    }
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch('/api/influencers/sooziptime/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, goalsText: (reportGoals.trim() ? reportGoals : prompt) })
      });
      const data = await res.json();
      if (data.success) setReport(data.data); else alert(data.error || '리포트 생성 실패');
    } catch (e) {
      alert('리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/40 dark:to-blue-900/40 border-teal-200 dark:border-teal-500/30">
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-teal-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-4xl">🗓️</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Soozip AI Study Planner</h2>
          <p className="text-gray-600 dark:text-teal-100">자유 프롬프트 + 시간 → 일간 계획 생성 · 완료 체크 · 일간 리포트</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <Badge variant="primary" size="sm">채팅 생성</Badge>
            <Badge variant="success" size="sm">시간표</Badge>
            <Badge variant="warning" size="sm">일간 리포트</Badge>
          </div>
        </div>
      </Card>

      {/* Chat section */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">채팅</h3>
        <div className="space-y-3">
          {/* chat window */}
          {chatHistory.length > 0 && (
            <div className="max-h-64 overflow-auto border rounded p-3 bg-[var(--color-bg-secondary)] space-y-2">
              {chatHistory.map((m, idx) => (
                <div key={idx} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className={`${m.role==='user'?'bg-blue-600 text-white':'bg-white dark:bg-gray-800 text-[var(--color-text-primary)]'} px-3 py-2 rounded-2xl max-w-[80%]`}> 
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* 입력창 + 전송 버튼 나란히 */}
          <div className="flex items-center gap-2">
            <input
              value={prompt}
              onChange={e=>setPrompt(e.target.value)}
              onKeyDown={e=>{ if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
              placeholder="메시지를 입력하세요"
              className="flex-1 px-4 py-2 border rounded-2xl bg-[var(--color-bg-primary)] h-11"
              type="text"
            />
            <Button onClick={sendChat} disabled={sending} className="bg-blue-600 text-white h-11 px-5">{sending?'전송 중...':'전송'}</Button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {availability.map((r, i) => (
              <div key={i} className="flex gap-1 items-center">
                <input type="time" value={r.start} onChange={e=>updateRange(i,'start',e.target.value)} className="p-2 border rounded"/>
                <span className="text-sm text-[var(--color-text-secondary)]">-</span>
                <input type="time" value={r.end} onChange={e=>updateRange(i,'end',e.target.value)} className="p-2 border rounded"/>
                <Button onClick={()=>removeRange(i)} className="bg-red-600 text-white">삭제</Button>
              </div>
            ))}
            <Button onClick={()=>setAvailability([...availability,{ start:'18:00', end:'19:00'}])} className="bg-gray-600 text-white">시간대 추가</Button>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={async()=>{
                setSending(true);
                try {
                  // 1) 강제 미리보기 생성 (채팅에 먼저 노출)
                  const chatRes = await fetch('/api/influencers/sooziptime/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId, prompt, availability, history: chatHistory, forcePreview: true })
                  });
                  const chatData = await chatRes.json();
                  if (!chatData.success) throw new Error(chatData.error || '미리보기 실패');
                  const previewText = chatData.preview || '';
                  setChatHistory(prev => ([...prev, { role: 'user', content: prompt }, ...(chatData.hint ? [{ role: 'assistant' as const, content: chatData.hint }] : []), ...(previewText ? [{ role: 'assistant' as const, content: previewText }] : [])]));
                  // 2) 동일 텍스트를 daily에 반영
                  const res = await fetch('/api/influencers/sooziptime/daily', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId, preview: previewText, availability, history: [...chatHistory, { role: 'user', content: prompt }, ...(chatData.hint ? [{ role: 'assistant', content: chatData.hint }] : []), ...(previewText ? [{ role: 'assistant', content: previewText }] : [])] })
                  });
                  const data = await res.json();
                  if (data.success) {
                    await fetchPlan();
                    setCanGenerate(false);
                    setLastPreview('');
                    setPrompt('');
                  } else { alert(data.error || '생성 실패'); }
                } catch (e) { alert('생성 중 오류가 발생했습니다.'); }
                finally { setSending(false); }
              }}
              className={`text-white ${canGenerate ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 opacity-40'} transition-colors`}
              disabled={!canGenerate}
            >일간 계획 생성</Button>
          </div>
          {/* followUp 별도 배너는 제거(대화 내 표시) */}
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">📅 오늘 시간표</h3>
        {loadingPlan ? (
          <div className="text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
        ) : !plan ? (
          <div className="text-sm text-[var(--color-text-secondary)]">아직 생성된 계획이 없습니다. 프롬프트로 계획을 생성하세요.</div>
        ) : (
          <div className="space-y-3">
            {plan.items.map(item => (
              <div key={item.id} className="p-3 border rounded-lg bg-[var(--color-bg-primary)] flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm text-[var(--color-text-secondary)]">{item.startTime} - {item.endTime}</div>
                  <div className="font-semibold text-[var(--color-text-primary)]">{item.subject}</div>
                  <div className="text-[var(--color-text-secondary)]">{item.content}</div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="w-5 h-5 accent-green-600 cursor-pointer" checked={item.completed} onChange={e=>toggleComplete(item.id, e.target.checked)} /> 완료
                </label>
              </div>
            ))}
            {plan.quote && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">{plan.quote}</div>
            )}
          </div>
        )}
      </Card>

      {/* Daily report */}
      <Card className="p-6" glass={false}>
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">🧾 일간 분석 리포트</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <div className="md:col-span-3">
            <label className="block text-sm text-[var(--color-text-secondary)] mb-2">오늘 목표</label>
            <input type="text" value={reportGoals} onChange={e=>setReportGoals(e.target.value)} placeholder="예: 수학 함수 마스터, 영어 어법 2세트" className="w-full p-2 border rounded"/>
          </div>
        </div>
        <Button onClick={generateReport} disabled={generatingReport} className="bg-purple-600 text-white">{generatingReport?'생성 중...':'AI로 일간 리포트 생성'}</Button>

        {report && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg">
              <div className="text-sm text-[var(--color-text-secondary)]">날짜: {report.date}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">목표 요약</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {report.goalSummary.map((s:string,i:number)=>(<li key={i}>{s}</li>))}
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">수치 기반 분석</h4>
                <div className="text-sm text-[var(--color-text-secondary)]">총학습시간: {report.numericAnalysis.totalStudyHours}h / 완료율: {report.numericAnalysis.completionRate}%</div>
                <div className="mt-2 space-y-1">
                  {report.numericAnalysis.subjectBreakdown.map((b:any,i:number)=>(
                    <div key={i} className="flex justify-between text-sm">
                      <span>{b.subject}</span>
                      <span>{b.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border rounded-lg md:col-span-2">
                <h4 className="font-semibold mb-2">종합 평가</h4>
                <p className="text-[var(--color-text-primary)] whitespace-pre-line">{report.overallAssessment}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* (주간 평가는 요구사항 범위 밖으로 제거) */}
    </div>
  );

  function splitByComma(text: string): string[] {
    return text.split(',').map(s => s.trim()).filter(Boolean);
  }

  function updateRange(index: number, key: 'start'|'end', value: string) {
    setAvailability(prev => prev.map((r, i) => i===index ? { ...r, [key]: value } : r));
  }

  function removeRange(index: number) {
    setAvailability(prev => prev.filter((_, i) => i!==index));
  }
}

