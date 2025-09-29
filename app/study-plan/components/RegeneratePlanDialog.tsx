'use client';

import Modal from '@/components/ui/Modal';
import { AlertCircle, Sparkles } from 'lucide-react';

interface RegeneratePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function RegeneratePlanDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: RegeneratePlanDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="새로운 학습 계획 만들기"
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                처리중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                새로 만들기
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              현재 학습 계획을 삭제하시겠습니까?
            </h3>
            <p className="text-gray-600">
              기존 학습 계획과 진행 상태가 삭제되고 새로운 계획을 만들게 됩니다.
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>주의:</strong> 오늘의 학습 기록, 완료 상태, 회고 내용이 모두 삭제됩니다.
          </p>
        </div>
      </div>
    </Modal>
  );
}