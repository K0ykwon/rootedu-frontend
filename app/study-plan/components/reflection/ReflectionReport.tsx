'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Target,
  TrendingUp,
  Heart,
  Star,
  Download,
  Share2,
  Calendar
} from 'lucide-react';
import type { ReflectionReport } from '@/lib/types/study-plan';

interface ReflectionReportProps {
  report: ReflectionReport;
  onClose: () => void;
  onSave?: () => void;
}

export default function ReflectionReport({ report, onClose, onSave }: ReflectionReportProps) {
  // 점수에 따른 색상 및 이모지 결정
  const getScoreInfo = (score: number) => {
    if (score >= 9) return { color: 'text-emerald-600', bg: 'bg-emerald-50', emoji: '🌟', text: '훌륭해요!' };
    if (score >= 7) return { color: 'text-blue-600', bg: 'bg-blue-50', emoji: '👏', text: '잘했어요!' };
    if (score >= 5) return { color: 'text-yellow-600', bg: 'bg-yellow-50', emoji: '💪', text: '괜찮아요!' };
    return { color: 'text-gray-600', bg: 'bg-gray-50', emoji: '🎯', text: '힘내세요!' };
  };

  const scoreInfo = getScoreInfo(report.overallScore);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-3xl"
              >
                🎓
              </motion.div>
              <div>
                <h2 className="text-2xl font-bold">오늘의 학습 회고</h2>
                <p className="text-purple-100 text-sm">
                  AI 컨설턴트가 분석한 맞춤형 피드백
                </p>
              </div>
            </div>

            {/* 액션 버튼들 */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                title="리포트 저장"
                onClick={onSave}
              >
                <Download className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                title="공유하기"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* 스크롤 가능한 컨텐츠 */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* 전체 점수 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`${scoreInfo.bg} rounded-2xl p-6 mb-6 text-center`}
          >
            <div className="text-4xl mb-2">{scoreInfo.emoji}</div>
            <div className={`text-3xl font-bold ${scoreInfo.color} mb-1`}>
              {report.overallScore}/10
            </div>
            <div className={`text-lg font-semibold ${scoreInfo.color} mb-2`}>
              {scoreInfo.text}
            </div>

            {/* 점수 바 */}
            <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
              <motion.div
                className={`h-full ${scoreInfo.color.replace('text-', 'bg-').replace('-600', '-500')} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${report.overallScore * 10}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </motion.div>

          {/* 잘한 점 */}
          <motion.section
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-bold text-gray-800">오늘 잘한 점</h3>
            </div>
            <div className="space-y-3">
              {report.strengths.map((strength, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <Star className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 leading-relaxed">{strength}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* 개선할 점 */}
          <motion.section
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-bold text-gray-800">개선할 점</h3>
            </div>
            <div className="space-y-3">
              {report.improvements.map((improvement, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3"
                >
                  <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 leading-relaxed">{improvement}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* 내일 계획 */}
          <motion.section
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">내일을 위한 제안</h3>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-gray-700 leading-relaxed">{report.tomorrowPlan}</p>
            </div>
          </motion.section>

          {/* 동기부여 메시지 */}
          <motion.section
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 text-center">
              <Heart className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-purple-800 mb-2">응원 메시지</h3>
              <p className="text-purple-700 leading-relaxed italic">
                "{report.motivation}"
              </p>
            </div>
          </motion.section>
        </div>

        {/* 푸터 */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>AI 컨설턴트가 생성한 리포트</span>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              닫기
            </motion.button>
            {onSave && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSave}
                className="px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
              >
                저장하기
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}