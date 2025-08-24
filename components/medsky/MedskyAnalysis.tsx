'use client';

import React, { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { MedskyAnalyzer } from './MedskyAnalyzer';
import { ProcessingResult } from '@/types/medsky';
import { toast } from 'react-hot-toast';

interface MedskyAnalysisProps {
  onAnalysisComplete?: () => void;
  influencerSlug?: string;
  className?: string;
}

export default function MedskyAnalysis({ 
  onAnalysisComplete, 
  influencerSlug, 
  className 
}: MedskyAnalysisProps) {
  const { data: session } = useSession();
  const [isCompletingAnalysis, setIsCompletingAnalysis] = useState(false);

  const handleAnalysisComplete = useCallback(async (result: ProcessingResult) => {
    // If we're in an influencer dashboard context, save the result
    if (influencerSlug && session) {
      setIsCompletingAnalysis(true);
      
      try {
        // Generate a unique session ID for this analysis
        const analysisSessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Prepare analysis data for storage
        const analysisData = {
          sessionId: analysisSessionId,
          userId: session.user?.id || 'unknown',
          userName: session.user?.name || session.user?.email || '익명 사용자',
          analysis: {
            extractedData: result.extractedData,
            validationAnalysis: result.validationAnalysis,
            textSections: result.textSections,
            totalActivities: result.extractedData?.creativeActivities?.창의적체험활동상황?.length || 0,
            mainField: result.validationAnalysis?.blue_highlight?.Feedbacks?.[0]?.sentence || '미분류',
            recommendedCareer: result.validationAnalysis?.blue_line?.Feedbacks?.[0]?.sentence || '추가 분석 필요'
          },
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        };

        // Save to Redis with influencer-specific key
        const response = await fetch('/api/medsky/save-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            influencerSlug,
            sessionId: analysisSessionId,
            analysisData
          }),
        });

        if (response.ok) {
          toast.success('분석 결과가 저장되었습니다!');
          onAnalysisComplete?.();
        } else {
          toast.error('분석 결과 저장에 실패했습니다.');
        }
      } catch (error) {
        console.error('Error saving analysis:', error);
        toast.error('분석 결과 저장 중 오류가 발생했습니다.');
      } finally {
        setIsCompletingAnalysis(false);
      }
    }
  }, [influencerSlug, session, onAnalysisComplete]);

  return (
    <div className={className}>
      <MedskyAnalyzer 
        onComplete={handleAnalysisComplete}
        className="min-h-0"
      />
      
      {isCompletingAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">분석 결과 저장 중</h3>
              <p className="text-gray-600">잠시만 기다려주세요...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}