'use client';

import React, { useEffect, useState } from 'react';
import { SummaryDraft } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface SummaryEditorProps {
  summary?: SummaryDraft;
  editable?: boolean;
  onSave?: (draft: string) => Promise<void>;
  className?: string;
}

export function SummaryEditor({ summary, editable, onSave, className }: SummaryEditorProps) {
  const [value, setValue] = useState(summary?.consultantDraft ?? summary?.aiDraft ?? '');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setValue(summary?.consultantDraft ?? summary?.aiDraft ?? '');
  }, [summary?.consultantDraft, summary?.aiDraft]);

  const handleSave = async () => {
    if (!onSave) return;
    setPending(true);
    try {
      await onSave(value);
    } finally {
      setPending(false);
    }
  };

  if (!summary) {
    return (
      <Card className={`p-6 text-center ${className ?? ''}`} glass={false}>
        <div className="space-y-2">
          <div className="text-3xl">📝</div>
          <p className="text-sm text-[var(--color-text-secondary)]">요약이 아직 생성되지 않았습니다.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 space-y-4 ${className ?? ''}`} glass={false}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">분석 총평</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">AI 초안과 컨설턴트 수정을 함께 제공합니다.</p>
        </div>
        {!editable && (
          <span className="text-xs text-[var(--color-text-tertiary)]">생성 일시: {new Date(summary.updatedAt).toLocaleString('ko-KR')}</span>
        )}
      </div>

      {summary.strengths && summary.strengths.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] rounded p-4">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">강점 요약</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--color-text-secondary)]">
            {summary.strengths.map((item, index) => (
              <li key={`strength-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {editable ? (
        <div className="space-y-2">
          <textarea
            className="w-full min-h-[160px] rounded border border-[var(--color-border-primary)] px-3 py-2 text-sm"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setValue(summary.aiDraft)}
              disabled={pending}
            >
              AI 초안으로 복원
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={pending}
            >
              {pending ? '저장 중...' : '총평 저장'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-[var(--color-text-primary)] whitespace-pre-wrap">
          {summary.consultantDraft ?? summary.aiDraft}
        </p>
      )}
    </Card>
  );
}
