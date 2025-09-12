'use client'

import React from 'react'
import { useMedskyAnalysis } from '@/lib/medsky/analysisContext'
import { useRouter } from 'next/navigation'

export default function MedskyResultsPage() {
  const { analysisState } = useMedskyAnalysis()
  const router = useRouter()

  if (!analysisState.result) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">
            분석 결과가 없습니다
          </h1>
          <p className="text-white/60">
            먼저 생활기록부 분석을 진행해주세요.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            대시보드로 이동 
          </button>
        </div>
      </div>
    )
  }

  const { result } = analysisState
  const elapsedTime = analysisState.startTime && analysisState.endTime
    ? Math.floor((analysisState.endTime - analysisState.startTime) / 1000)
    : 0

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            생활기록부 AI 분석 결과
          </h1>
          <p className="text-white/60">
            분석 소요 시간: {Math.floor(elapsedTime / 60)}분 {elapsedTime % 60}초
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {result.creativeActivities && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">창의적 체험활동</h3>
              <p className="text-3xl font-bold text-blue-400">
                {result.creativeActivities.창의적체험활동상황?.length || 0}
              </p>
              <p className="text-white/60 text-sm mt-1">항목 분석 완료</p>
            </div>
          )}

          {result.academicDevelopments && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">교과학습 발달상황</h3>
              <p className="text-3xl font-bold text-green-400">
                {result.academicDevelopments.교과학습발달상황?.length || 0}
              </p>
              <p className="text-white/60 text-sm mt-1">과목 분석 완료</p>
            </div>
          )}

          {result.detailedAbilities && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">세부 특기사항</h3>
              <p className="text-3xl font-bold text-purple-400">
                {result.detailedAbilities.세부특기사항?.length || 0}
              </p>
              <p className="text-white/60 text-sm mt-1">항목 분석 완료</p>
            </div>
          )}
        </div>

        {/* Detailed Results */}
        <div className="space-y-8">
          {/* Creative Activities */}
          {result.creativeActivities && result.creativeActivities.창의적체험활동상황?.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">창의적 체험활동 상세</h2>
              <div className="space-y-4">
                {result.creativeActivities.창의적체험활동상황.map((item: any, index: number) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-blue-400">
                        {item.학년}학년
                      </span>
                      {item.영역 && (
                        <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/80">
                          {item.영역}
                        </span>
                      )}
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {item.특기사항}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Development */}
          {result.academicDevelopments && result.academicDevelopments.교과학습발달상황?.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">교과학습 발달상황</h2>
              <div className="space-y-4">
                {result.academicDevelopments.교과학습발달상황.map((item: any, index: number) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-green-400">
                        {item.학년}학년 - {item.과목}
                      </span>
                      {item.성취도 && (
                        <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/80">
                          성취도: {item.성취도}
                        </span>
                      )}
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {item.세부능력및특기사항}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Abilities */}
          {result.detailedAbilities && result.detailedAbilities.세부특기사항?.length > 0 && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">세부 특기사항</h2>
              <div className="space-y-4">
                {result.detailedAbilities.세부특기사항.map((item: any, index: number) => (
                  <div key={index} className="bg-white/5 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-semibold text-purple-400">
                        {item.학년}학년 {item.학기 && `- ${item.학기}학기`}
                      </span>
                      {item.과목 && (
                        <span className="text-xs px-2 py-1 bg-white/10 rounded text-white/80">
                          {item.과목}
                        </span>
                      )}
                    </div>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {item.내용}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Analysis */}
          {result.validationAnalysis && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white mb-4">검증 분석 결과</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(result.validationAnalysis).map(([type, data]: [string, any]) => (
                  <div key={type} className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-white/80 mb-2">
                      {type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p className="text-xs text-white/60">
                      {data.Feedbacks?.length || 0} 피드백 항목
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
          >
            대시보드로 이동
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
          >
            결과 출력
          </button>
        </div>
      </div>
    </div>
  )
}