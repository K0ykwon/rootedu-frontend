'use client';

import React from 'react';
import { GradeTrendReport } from '@/types/medsky';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface GradeTrendChartProps {
  report?: GradeTrendReport;
  className?: string;
}

export function GradeTrendChart({ report, className }: GradeTrendChartProps) {
  if (!report || report.series.length === 0) {
    return (
      <Card className={`p-6 text-center ${className ?? ''}`} glass={false}>
        <div className="space-y-2">
          <div className="text-3xl">📈</div>
          <p className="text-sm text-[var(--color-text-secondary)]">성적 추이 데이터를 생성할 수 없습니다.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      {report.series.map((series) => (
        <Card key={series.id} className="p-6" glass={false}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">{series.name}</h3>
              {series.notes && (
                <p className="text-sm text-[var(--color-text-secondary)]">{series.notes}</p>
              )}
            </div>
            <Badge variant="default">{series.points.length}개 학기</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--color-text-tertiary)] border-b border-[var(--color-border-primary)]">
                  <th className="py-2 pr-4">학기</th>
                  <th className="py-2 pr-4">학생 점수</th>
                  <th className="py-2 pr-4">과목 평균</th>
                  <th className="py-2 pr-4">차이</th>
                </tr>
              </thead>
              <tbody>
                {series.points.map((point) => (
                  <tr key={`${series.id}-${point.semester}`} className="border-b border-[var(--color-border-secondary)] last:border-none">
                    <td className="py-2 pr-4 font-medium text-[var(--color-text-primary)]">{point.semester}</td>
                    <td className="py-2 pr-4">{point.score ?? '-'}</td>
                    <td className="py-2 pr-4">{point.average ?? '-'}</td>
                    <td className={`py-2 pr-4 ${
                      point.delta != null
                        ? point.delta >= 0
                          ? 'text-green-600'
                          : 'text-red-500'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                    >
                      {point.delta != null ? (point.delta > 0 ? `+${point.delta}` : point.delta) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
