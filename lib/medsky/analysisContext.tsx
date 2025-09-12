'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface MedskyAnalysisState {
  isAnalyzing: boolean
  progress: number
  currentStep: string
  result: any | null
  error: string | null
  startTime: number | null
  endTime: number | null
}

interface MedskyAnalysisContextType {
  analysisState: MedskyAnalysisState
  startAnalysis: (data: any) => void
  updateProgress: (progress: number, currentStep: string) => void
  completeAnalysis: (result: any) => void
  failAnalysis: (error: string) => void
  clearAnalysis: () => void
}

const MedskyAnalysisContext = createContext<MedskyAnalysisContextType | undefined>(undefined)

export const MedskyAnalysisProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [analysisState, setAnalysisState] = useState<MedskyAnalysisState>({
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    result: null,
    error: null,
    startTime: null,
    endTime: null
  })

  const startAnalysis = useCallback((data: any) => {
    setAnalysisState({
      isAnalyzing: true,
      progress: 0,
      currentStep: 'Initializing analysis...',
      result: null,
      error: null,
      startTime: Date.now(),
      endTime: null
    })
  }, [])

  const updateProgress = useCallback((progress: number, currentStep: string) => {
    setAnalysisState(prev => ({
      ...prev,
      progress,
      currentStep
    }))
  }, [])

  const completeAnalysis = useCallback((result: any) => {
    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: false,
      progress: 100,
      currentStep: 'Analysis complete!',
      result,
      endTime: Date.now()
    }))
  }, [])

  const failAnalysis = useCallback((error: string) => {
    setAnalysisState(prev => ({
      ...prev,
      isAnalyzing: false,
      progress: 0,
      currentStep: '',
      error,
      endTime: Date.now()
    }))
  }, [])

  const clearAnalysis = useCallback(() => {
    setAnalysisState({
      isAnalyzing: false,
      progress: 0,
      currentStep: '',
      result: null,
      error: null,
      startTime: null,
      endTime: null
    })
  }, [])

  return (
    <MedskyAnalysisContext.Provider value={{
      analysisState,
      startAnalysis,
      updateProgress,
      completeAnalysis,
      failAnalysis,
      clearAnalysis
    }}>
      {children}
    </MedskyAnalysisContext.Provider>
  )
}

export const useMedskyAnalysis = () => {
  const context = useContext(MedskyAnalysisContext)
  if (context === undefined) {
    throw new Error('useMedskyAnalysis must be used within a MedskyAnalysisProvider')
  }
  return context
}