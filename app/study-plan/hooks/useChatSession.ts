'use client';

import { useState, useCallback } from 'react';
import type {
  ChatInitResponse,
  ChatMessageResponse,
  ChatStep,
  DailyStudyPlan,
  ApiResponse,
} from '@/lib/types/study-plan';

export function useChatSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ChatStep>('time_range');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<DailyStudyPlan | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // Initialize chat session
  const initializeChat = useCallback(async (force: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/study-plan/chat/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ force }),
      });

      const data: ApiResponse<ChatInitResponse> = await response.json();

      if (data.success && data.data) {
        setSessionId(data.data.sessionId);
        setCurrentStep(data.data.step);
        setCurrentQuestion(data.data.question);
        setMessages([{ role: 'assistant', content: data.data.question }]);
        return true;
      } else {
        setError(data.error || 'Failed to initialize chat');
        return false;
      }
    } catch (err) {
      setError('Network error');
      console.error('Error initializing chat:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (!sessionId) {
      setError('No active session');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Add user message to history
      setMessages(prev => [...prev, { role: 'user', content: message }]);

      const response = await fetch('/api/study-plan/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });

      const data: ApiResponse<ChatMessageResponse> = await response.json();

      if (data.success && data.data) {
        const responseData = data.data;

        if (responseData.isComplete && responseData.plan) {
          // Plan generated successfully
          setGeneratedPlan(responseData.plan);
          setCurrentStep('completed');
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '✅ 학습 계획이 성공적으로 생성되었습니다!'
          }]);
        } else if (responseData.question) {
          // Next question
          setCurrentStep(responseData.step);
          setCurrentQuestion(responseData.question);
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: responseData.question!
          }]);
        }

        return true;
      } else {
        setError(data.error || 'Failed to send message');
        return false;
      }
    } catch (err) {
      setError('Network error');
      console.error('Error sending message:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Reset chat
  const resetChat = useCallback(() => {
    setSessionId(null);
    setCurrentStep('time_range');
    setCurrentQuestion('');
    setGeneratedPlan(null);
    setMessages([]);
    setError(null);
  }, []);

  // Get step progress
  const getStepProgress = useCallback((): number => {
    const steps: ChatStep[] = [
      'time_range',
      'subjects',
      'subject_details',
      'time_allocation',
      'motivational_quote',
      'generating',
      'completed',
    ];

    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  }, [currentStep]);

  return {
    sessionId,
    currentStep,
    currentQuestion,
    loading,
    error,
    generatedPlan,
    messages,
    initializeChat,
    sendMessage,
    resetChat,
    getStepProgress,
  };
}