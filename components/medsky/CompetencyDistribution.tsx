'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { CompetencyScorePayload, ManualCompetencyInput } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface CompetencyDistributionProps {
  data?: CompetencyScorePayload;
  editable?: boolean;
  onSave?: (inputs: ManualCompetencyInput[]) => Promise<void>;
  className?: string;
}

export function CompetencyDistribution({ data, editable, onSave, className }: CompetencyDistributionProps) {
  const [pending, setPending] = useState(false);
  const [draftScores, setDraftScores] = useState<ManualCompetencyInput[]>(() =>
    data?.scores.map((score) => ({
      competency: score.competency,
      score: score.manualScore ?? score.autoScore ?? 0,
      notes: score.notes,
      updatedAt: score.lastUpdatedAt ?? new Date().toISOString(),
    })) || []
  );

  useEffect(() => {
    if (!data) {
      setDraftScores([]);
      return;
    }
    setDraftScores(
      data.scores.map((score) => ({
        competency: score.competency,
        score: score.manualScore ?? score.autoScore ?? 0,
        notes: score.notes,
        updatedAt: score.lastUpdatedAt ?? new Date().toISOString(),
      }))
    );
  }, [data]);

  const distributionLabel = data?.distribution?.label ?? '기본 분포';

  const handleChange = (competency: string, value: number) => {
    setDraftScores((prev) => {
      const next = [...prev];
      const index = next.findIndex((item) => item.competency === competency);
      if (index >= 0) {
        next[index] = { ...next[index], score: value, updatedAt: new Date().toISOString() };
      } else {
        next.push({ competency, score: value, updatedAt: new Date().toISOString() });
      }
      return next;
    });
  };

  const handleNotesChange = (competency: string, value: string) => {
    setDraftScores((prev) => prev.map((item) =>
      item.competency === competency ? { ...item, notes: value, updatedAt: new Date().toISOString() } : item
    ));
  };

  const handleSave = async () => {
    if (!onSave) return;
    try {
      setPending(true);
      await onSave(draftScores);
    } finally {
      setPending(false);
    }
  };

  const rows = useMemo(() => data?.scores ?? [], [data]);

  if (!data || rows.length === 0) {
    return (
      <Card className={`p-6 text-center ${className ?? ''}`} glass={false}>
        <div className="space-y-2">
          <div className="text-3xl">🎯</div>
          <p className="text-sm text-[var(--color-text-secondary)]">역량 점수 데이터를 생성할 수 없습니다.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 space-y-4 ${className ?? ''}`} glass={false}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">역량 점수 분포</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">{distributionLabel} 기준</p>
        </div>
        <Badge variant={data.source === 'mixed' ? 'primary' : 'default'}>
          {data.source === 'mixed' ? 'AI + 컨설턴트' : 'AI 자동 계산'}
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-text-tertiary)] border-b border-[var(--color-border-primary)]">
              <th className="py-2 pr-4">역량</th>
              <th className="py-2 pr-4">AI 점수</th>
              <th className="py-2 pr-4">컨설턴트 점수</th>
              <th className="py-2 pr-4">백분위</th>
              {editable && <th className="py-2 pr-4">메모</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((score) => {
              const draft = draftScores.find((item) => item.competency === score.competency);
              return (
                <tr key={score.competency} className="border-b border-[var(--color-border-secondary)] last:border-none align-top">
                  <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">
                    {score.label}
                  </td>
                  <td className="py-2 pr-4">{score.autoScore ?? '-'}</td>
                  <td className="py-2 pr-4">
                    {editable ? (
                      <input
                        type="number"
                        className="w-24 rounded border border-[var(--color-border-primary)] px-2 py-1 text-sm"
                        value={draft?.score ?? score.manualScore ?? score.autoScore ?? 0}
                        min={0}
                        max={100}
                        onChange={(event) => handleChange(score.competency, Number(event.target.value))}
                      />
                    ) : (
                      score.manualScore ?? score.autoScore ?? '-'
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    {score.normalized?.percentile != null ? `${score.normalized.percentile} %` : '-'}
                  </td>
                  {editable && (
                    <td className="py-2 pr-4">
                      <textarea
                        className="w-full rounded border border-[var(--color-border-primary)] px-2 py-1 text-sm"
                        rows={2}
                        value={draft?.notes ?? score.notes ?? ''}
                        onChange={(event) => handleNotesChange(score.competency, event.target.value)}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editable && (
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleSave} disabled={pending}>
            {pending ? '저장 중...' : '점수 저장'}
          </Button>
        </div>
      )}
    </Card>
  );
}
