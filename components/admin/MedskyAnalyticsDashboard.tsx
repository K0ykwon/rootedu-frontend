'use client';

/**
 * Medsky Analytics Admin Dashboard
 * 
 * This component allows administrators to view all medsky analysis data
 * including user information, analysis results, and manage the data.
 */

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface AnalysisData {
  sessionId: string;
  userInfo: {
    id: string;
    name: string;
    email: string;
    analyzedAt: string;
  };
  completedAt: string;
  processingTime: number;
  result: {
    textSections: any;
    extractedData: any;
    validationAnalysis: any;
    status: any;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function MedskyAnalyticsDashboard() {
  const { data: session } = useSession();
  const [analyses, setAnalyses] = useState<AnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisData | null>(null);

  // Check if user is admin
  const isAdmin = (session?.user as any)?.role === 'admin';

  const fetchAnalyses = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/medsky-analytics?page=${page}&limit=20`);
      const data = await response.json();

      if (data.success) {
        setAnalyses(data.data);
        setPagination(data.pagination);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch analyses');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Failed to fetch analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnalysis = async (sessionId: string) => {
    if (!confirm('정말로 이 분석 데이터를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/medsky-analytics?sessionId=${sessionId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (data.success) {
        // Refresh the list
        fetchAnalyses(pagination.page);
        setSelectedAnalysis(null);
      } else {
        alert('삭제 실패: ' + data.error);
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
      console.error('Failed to delete analysis:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const formatProcessingTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}분 ${remainingSeconds}초`;
    }
    return `${remainingSeconds}초`;
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAnalyses();
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <Card className="p-8 text-center" glass={false}>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            관리자 권한이 필요합니다
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            이 페이지는 관리자만 접근할 수 있습니다.
          </p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-[var(--color-text-primary)]">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
              생기부 분석 관리 대시보드
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-2">
              알약툰 생기부 AI 분석 사용자 데이터 및 결과 관리
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6" glass={false}>
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {pagination.total}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  총 분석 건수
                </div>
              </div>
            </Card>
            <Card className="p-6" glass={false}>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analyses.filter(a => a.result.status.stage === 'completed').length}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  완료된 분석
                </div>
              </div>
            </Card>
            <Card className="p-6" glass={false}>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(analyses.map(a => a.userInfo.email)).size}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  고유 사용자
                </div>
              </div>
            </Card>
            <Card className="p-6" glass={false}>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analyses.length > 0 ? Math.round(analyses.reduce((acc, a) => acc + a.processingTime, 0) / analyses.length / 1000) : 0}초
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  평균 처리 시간
                </div>
              </div>
            </Card>
          </div>

          {error && (
            <Card className="p-4 border-red-500 bg-red-50 dark:bg-red-900/20" glass={false}>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </Card>
          )}

          {/* Analysis List */}
          <Card className="p-6" glass={false}>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                분석 기록
              </h2>
              
              {analyses.length === 0 ? (
                <p className="text-[var(--color-text-secondary)] text-center py-8">
                  분석 데이터가 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <div
                      key={analysis.sessionId}
                      className="flex items-center justify-between p-4 border border-[var(--color-border-primary)] rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
                      onClick={() => setSelectedAnalysis(analysis)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium text-[var(--color-text-primary)]">
                              {analysis.userInfo.name || analysis.userInfo.email}
                            </div>
                            <div className="text-sm text-[var(--color-text-secondary)]">
                              {analysis.userInfo.email}
                            </div>
                          </div>
                          <Badge variant="default" size="sm">
                            {analysis.result.status.stage === 'completed' ? '완료' : '진행중'}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-[var(--color-text-tertiary)]">
                          분석 완료: {formatDate(analysis.completedAt)} | 
                          처리 시간: {formatProcessingTime(analysis.processingTime)} |
                          세션 ID: {analysis.sessionId}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedAnalysis(analysis);
                          }}
                          variant="secondary"
                          size="sm"
                        >
                          상세보기
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAnalysis(analysis.sessionId);
                          }}
                          variant="secondary"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  <Button
                    onClick={() => fetchAnalyses(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    variant="secondary"
                    size="sm"
                  >
                    이전
                  </Button>
                  <span className="px-3 py-1 text-[var(--color-text-primary)]">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    onClick={() => fetchAnalyses(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    variant="secondary"
                    size="sm"
                  >
                    다음
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Selected Analysis Details Modal */}
          {selectedAnalysis && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" glass={false}>
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                      분석 상세 정보
                    </h3>
                    <Button
                      onClick={() => setSelectedAnalysis(null)}
                      variant="secondary"
                      size="sm"
                    >
                      닫기
                    </Button>
                  </div>

                  {/* User Info */}
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-3">사용자 정보</h4>
                    <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-[var(--color-text-secondary)]">이름:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">{selectedAnalysis.userInfo.name}</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-text-secondary)]">이메일:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">{selectedAnalysis.userInfo.email}</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-text-secondary)]">분석 시작:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">{formatDate(selectedAnalysis.userInfo.analyzedAt)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-text-secondary)]">분석 완료:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">{formatDate(selectedAnalysis.completedAt)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-text-secondary)]">처리 시간:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">{formatProcessingTime(selectedAnalysis.processingTime)}</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-text-secondary)]">세션 ID:</span>
                          <span className="ml-2 text-[var(--color-text-primary)] font-mono text-xs">{selectedAnalysis.sessionId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Results Summary */}
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-3">분석 결과 요약</h4>
                    <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-[var(--color-text-secondary)]">창의적 체험활동:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">
                            {selectedAnalysis.result.extractedData.creativeActivities?.창의적체험활동상황?.length || 0}개 항목
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--color-text-secondary)]">교과학습발달:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">
                            {selectedAnalysis.result.extractedData.academicDevelopments?.교과학습발달상황?.length || 0}개 항목
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--color-text-secondary)]">세부특기사항:</span>
                          <span className="ml-2 text-[var(--color-text-primary)]">
                            {selectedAnalysis.result.extractedData.detailedAbilities?.세부특기사항?.length || 0}개 항목
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Analysis Summary */}
                  <div>
                    <h4 className="font-medium text-[var(--color-text-primary)] mb-3">검증 분석 요약</h4>
                    <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        {Object.entries(selectedAnalysis.result.validationAnalysis).map(([type, result]) => (
                          <div key={type}>
                            <span className="text-[var(--color-text-secondary)]">{type}:</span>
                            <span className="ml-2 text-[var(--color-text-primary)]">
                              {(result as any).Feedbacks?.length || 0}개 피드백
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-2">
                    <Button
                      onClick={() => {
                        const dataStr = JSON.stringify(selectedAnalysis, null, 2);
                        const blob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `medsky_analysis_${selectedAnalysis.sessionId}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      데이터 다운로드
                    </Button>
                    <Button
                      onClick={() => deleteAnalysis(selectedAnalysis.sessionId)}
                      variant="secondary"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      분석 데이터 삭제
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}