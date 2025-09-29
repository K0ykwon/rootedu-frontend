'use client';

import React, { useEffect, useState } from 'react';
import { MajorAlignmentReport } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

interface MajorAlignmentMatrixProps {
  report?: MajorAlignmentReport;
  editable?: boolean;
  onUpdateTarget?: (payload: { targetUniversity?: string; targetMajor?: string }) => Promise<void>;
  className?: string;
}

export function MajorAlignmentMatrix({ report, editable, onUpdateTarget, className }: MajorAlignmentMatrixProps) {
  const [pending, setPending] = useState(false);
  const [targetUniversity, setTargetUniversity] = useState(report?.target?.university ?? '');
  const [targetMajor, setTargetMajor] = useState(report?.target?.major ?? '');

  useEffect(() => {
    setTargetUniversity(report?.target?.university ?? '');
    setTargetMajor(report?.target?.major ?? '');
  }, [report?.target?.university, report?.target?.major]);

  if (!report) {
    return (
      <Card className={`p-6 text-center ${className ?? ''}`} glass={false}>
        <div className="space-y-2">
          <div className="text-3xl">🎓</div>
          <p className="text-sm text-[var(--color-text-secondary)]">전공 연계 분석 데이터를 확인할 수 없습니다.</p>
        </div>
      </Card>
    );
  }

  const handleSave = async () => {
    if (!onUpdateTarget) return;
    setPending(true);
    try {
      await onUpdateTarget({ targetUniversity, targetMajor });
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className={`p-6 space-y-4 ${className ?? ''}`} glass={false}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">전공 연계 분석</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            필수/권장 과목 충족 여부를 요약합니다.
          </p>
        </div>
        <Badge variant={report.fulfilledCount === report.totalCount ? 'success' : 'default'}>
          {report.fulfilledCount}/{report.totalCount} 충족
        </Badge>
      </div>

      {editable && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">목표 대학</label>
            <input
              className="w-full rounded border border-[var(--color-border-primary)] px-3 py-2 text-sm"
              value={targetUniversity}
              onChange={(event) => setTargetUniversity(event.target.value)}
              placeholder="예: ○○대학교"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">목표 학과</label>
            <input
              className="w-full rounded border border-[var(--color-border-primary)] px-3 py-2 text-sm"
              value={targetMajor}
              onChange={(event) => setTargetMajor(event.target.value)}
              placeholder="예: 생명공학과"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button variant="primary" onClick={handleSave} disabled={pending}>
              {pending ? '저장 중...' : '목표 전공 업데이트'}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-text-tertiary)] border-b border-[var(--color-border-primary)]">
              <th className="py-2 pr-4">과목</th>
              <th className="py-2 pr-4">구분</th>
              <th className="py-2 pr-4">충족 여부</th>
              <th className="py-2 pr-4">비고</th>
            </tr>
          </thead>
          <tbody>
            {report.requirements.map((req, index) => (
              <tr key={`${req.category}-${req.subject}-${index}`} className="border-b border-[var(--color-border-secondary)] last:border-none">
                <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">{req.subject}</td>
                <td className="py-2 pr-4">{req.category === 'required' ? '필수' : '권장'}</td>
                <td className="py-2 pr-4">
                  {req.fulfilled ? (
                    <Badge variant="default" size="sm">충족</Badge>
                  ) : (
                    <Badge variant="error" size="sm">미충족</Badge>
                  )}
                </td>
                <td className="py-2 pr-4 text-[var(--color-text-secondary)]">{req.notes ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {report.recommendations.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] rounded p-4">
          <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">추천 액션</h4>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--color-text-secondary)]">
            {report.recommendations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
