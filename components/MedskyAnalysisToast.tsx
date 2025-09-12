'use client'

import React, { useEffect, useState } from 'react'
import { useMedskyAnalysis } from '@/lib/medsky/analysisContext'

export default function MedskyAnalysisToast() {
  const { analysisState, clearAnalysis } = useMedskyAnalysis()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (analysisState.isAnalyzing || analysisState.result || analysisState.error) {
      setIsVisible(true)
    }
  }, [analysisState])

  const handleClose = () => {
    setIsVisible(false)
    setIsExpanded(false)
    setTimeout(() => {
      clearAnalysis()
    }, 300)
  }

  if (!isVisible) return null

  const getElapsedTime = () => {
    if (!analysisState.startTime) return '0s'
    const endTime = analysisState.endTime || Date.now()
    const elapsed = Math.floor((endTime - analysisState.startTime) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div 
        className={`
          bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl 
          shadow-2xl transition-all duration-300 overflow-hidden
          ${isExpanded ? 'w-96' : 'w-80'}
        `}
      >
        {/* Header */}
        <div 
          className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {analysisState.isAnalyzing ? (
                <div className="relative">
                  <div className="w-8 h-8 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-0 w-8 h-8 rounded-full bg-blue-500/20 animate-pulse" />
                </div>
              ) : analysisState.error ? (
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400 font-bold">!</span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400">✓</span>
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-sm">
                  Medsky Analysis
                </p>
                <p className="text-white/60 text-xs">
                  {analysisState.isAnalyzing ? 'Processing...' : 
                   analysisState.error ? 'Failed' : 'Complete'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/40 text-xs">{getElapsedTime()}</span>
              {!analysisState.isAnalyzing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClose()
                  }}
                  className="text-white/40 hover:text-white/60 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {analysisState.isAnalyzing && (
          <div className="px-4 pb-2">
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${analysisState.progress}%` }}
              />
            </div>
            <p className="text-white/40 text-xs mt-2 truncate">
              {analysisState.currentStep}
            </p>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-white/10 p-4 max-h-96 overflow-y-auto">
            {analysisState.isAnalyzing ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Progress</span>
                  <span className="text-white">{analysisState.progress}%</span>
                </div>
                <div className="space-y-2">
                  <p className="text-white/60 text-sm">Current Step:</p>
                  <p className="text-white text-sm">{analysisState.currentStep}</p>
                </div>
              </div>
            ) : analysisState.error ? (
              <div className="space-y-2">
                <p className="text-red-400 font-semibold text-sm">Error Occurred</p>
                <p className="text-white/60 text-sm">{analysisState.error}</p>
              </div>
            ) : analysisState.result ? (
              <div className="space-y-3">
                <p className="text-green-400 font-semibold text-sm">Analysis Complete</p>
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/80 text-sm mb-2">Results Summary:</p>
                  {analysisState.result.creativeActivities && (
                    <p className="text-white/60 text-xs">
                      • Creative Activities: {analysisState.result.creativeActivities.창의적체험활동상황?.length || 0} items
                    </p>
                  )}
                  {analysisState.result.academicDevelopments && (
                    <p className="text-white/60 text-xs">
                      • Academic Development: {analysisState.result.academicDevelopments.교과학습발달상황?.length || 0} items
                    </p>
                  )}
                  {analysisState.result.detailedAbilities && (
                    <p className="text-white/60 text-xs">
                      • Detailed Abilities: {analysisState.result.detailedAbilities.세부특기사항?.length || 0} items
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    // Navigate to results page or open modal
                    window.location.href = '/medsky/results'
                  }}
                  className="w-full py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  View Full Results
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}