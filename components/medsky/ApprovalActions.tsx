'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface ApprovalActionsProps {
  sessionId: string;
  influencerSlug: string;
  currentStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: string;
  influencerNotes?: string;
  onApprovalChange?: () => void;
}

export default function ApprovalActions({
  sessionId,
  influencerSlug,
  currentStatus = 'pending',
  approvedBy,
  approvedAt,
  influencerNotes,
  onApprovalChange
}: ApprovalActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenModal = (selectedAction: 'approve' | 'reject') => {
    setAction(selectedAction);
    setNotes('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAction(null);
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!action) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/dashboard/${influencerSlug}/approve-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          action,
          notes: notes.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Approval failed');
      }

      const data = await response.json();

      toast.success(
        action === 'approve'
          ? '✅ 분석이 승인되었습니다. 학생이 이제 결과를 볼 수 있습니다!'
          : '❌ 분석이 거부되었습니다.'
      );

      handleCloseModal();

      // Notify parent component to refresh
      if (onApprovalChange) {
        onApprovalChange();
      } else {
        // Fallback: reload page
        window.location.reload();
      }
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(error instanceof Error ? error.message : '승인 처리 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  // Status badge component
  const StatusBadge = () => {
    if (currentStatus === 'approved') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
          <span className="text-2xl">✅</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-green-800 dark:text-green-300">
              승인 완료
            </div>
            {approvedAt && (
              <div className="text-xs text-green-700 dark:text-green-400">
                {new Date(approvedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (currentStatus === 'rejected') {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700">
          <span className="text-2xl">❌</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-red-800 dark:text-red-300">
              거부됨
            </div>
            {approvedAt && (
              <div className="text-xs text-red-700 dark:text-red-400">
                {new Date(approvedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700">
        <span className="text-2xl">⏳</span>
        <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
          승인 대기중
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Status Display */}
      <Card className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <StatusBadge />
            {influencerNotes && (
              <div className="mt-3 text-sm text-[var(--color-text-secondary)]">
                <strong>메모:</strong> {influencerNotes}
              </div>
            )}
            {approvedBy && (
              <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                승인자: {approvedBy}
              </div>
            )}
          </div>

          {/* Action Buttons - only show if pending */}
          {currentStatus === 'pending' && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleOpenModal('reject')}
                className="border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                ❌ 거부
              </Button>
              <Button
                variant="primary"
                onClick={() => handleOpenModal('approve')}
                className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
              >
                ✅ 승인하기
              </Button>
            </div>
          )}

          {/* Info message if already approved */}
          {currentStatus === 'approved' && (
            <div className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              <span>🎉</span>
              <span>학생이 이 분석 결과를 확인할 수 있습니다</span>
            </div>
          )}
        </div>
      </Card>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <div className="p-6">
              {/* Modal Header */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">
                  {action === 'approve' ? '✅' : '❌'}
                </div>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                  {action === 'approve' ? '분석 결과 승인' : '분석 결과 거부'}
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  {action === 'approve'
                    ? '이 분석 결과를 승인하시겠습니까? 승인 후 학생이 결과를 확인할 수 있습니다.'
                    : '이 분석 결과를 거부하시겠습니까? 학생은 결과를 볼 수 없으며 다시 분석을 요청해야 합니다.'
                  }
                </p>
              </div>

              {/* Notes Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  메모 (선택사항)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={action === 'approve' ? '학생에게 전달할 메시지를 입력하세요...' : '거부 사유를 입력하세요...'}
                  className="w-full px-4 py-3 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                  rows={4}
                />
                <div className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                  {notes.length}/500 characters
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`flex-1 ${
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  {submitting ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      처리중...
                    </>
                  ) : (
                    <>
                      {action === 'approve' ? '✅ 승인 확정' : '❌ 거부 확정'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
