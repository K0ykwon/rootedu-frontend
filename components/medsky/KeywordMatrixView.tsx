'use client';

import React, { useEffect, useState } from 'react';
import { KeywordMatrixEntry, KeywordOverride } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const COMPETENCY_OPTIONS = ['학업역량', '진로역량', '공동체역량', '기타'];

interface KeywordMatrixViewProps {
  matrix?: KeywordMatrixEntry[];
  editable?: boolean;
  onSaveOverrides?: (overrides: KeywordOverride[]) => Promise<void>;
  className?: string;
}

interface DraftOverride {
  term: string;
  competency?: string;
}

export function KeywordMatrixView({ matrix, editable, onSaveOverrides, className }: KeywordMatrixViewProps) {
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<Record<string, DraftOverride>>({});

  useEffect(() => {
    if (!matrix) {
      setDraft({});
      return;
    }
    const next: Record<string, DraftOverride> = {};
    matrix.forEach((entry) => {
      entry.entries.forEach((keyword) => {
        next[keyword.term] = {
          term: keyword.term,
          competency: keyword.competency,
        };
      });
    });
    setDraft(next);
  }, [matrix]);

  if (!matrix || matrix.length === 0) {
    return (
      <Card className={`p-6 text-center ${className ?? ''}`} glass={false}>
        <div className="space-y-2">
          <div className="text-3xl">🔑</div>
          <p className="text-sm text-[var(--color-text-secondary)]">추출된 키워드가 없습니다.</p>
        </div>
      </Card>
    );
  }

  const handleCompetencyChange = (term: string, competency?: string) => {
    setDraft((prev) => ({
      ...prev,
      [term]: { term, competency },
    }));
  };

  const handleSave = async () => {
    if (!editable || !onSaveOverrides) return;
    setPending(true);
    try {
      const overrides: KeywordOverride[] = Object.values(draft).map((value) => ({
        term: value.term,
        competency: value.competency,
        action: 'update',
        updatedAt: new Date().toISOString(),
      }));
      await onSaveOverrides(overrides);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className={`p-6 space-y-6 ${className ?? ''}`} glass={false}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">키워드 매트릭스</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">학년/과목별 주요 키워드와 역량 분류를 확인하세요.</p>
        </div>
        {editable && (
          <Button variant="primary" onClick={handleSave} disabled={pending}>
            {pending ? '저장 중...' : '키워드 분류 저장'}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {matrix.map((cluster, clusterIndex) => (
          <div key={`${cluster.grade}-${cluster.subject}-${clusterIndex}`} className="space-y-3">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {cluster.grade} · {cluster.subject}
            </h4>
            <div className="grid gap-3 md:grid-cols-2">
              {cluster.entries.map((keyword, keywordIndex) => (
                <div key={`${cluster.grade}-${cluster.subject}-${keyword.term}-${keywordIndex}`} className="border border-[var(--color-border-primary)] rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--color-text-primary)]">{keyword.term}</span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">{keyword.occurrence}회</span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                    {keyword.references[0]?.sentence?.slice(0, 120) ?? '관련 문장 없음'}
                  </p>
                  {editable ? (
                    <select
                      className="mt-3 w-full rounded border border-[var(--color-border-primary)] px-2 py-1 text-sm"
                      value={draft[keyword.term]?.competency ?? keyword.competency ?? ''}
                      onChange={(event) => handleCompetencyChange(keyword.term, event.target.value || undefined)}
                    >
                      <option value="">자동 분류 유지</option>
                      {COMPETENCY_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                      분류: {keyword.competency ?? '자동 판별'}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
