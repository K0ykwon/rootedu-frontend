'use client';

import { useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import AIChat from '../../../components/ui/AIChat';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudyPlanPage() {
  type ChatMessage = {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'ai-welcome',
      role: 'ai',
      content: `안녕하세요! 학습 계획 AI 어시스턴트입니다. 📚

다음과 같은 학습 계획 템플릿을 제공합니다:

**📚 월간 학습 계획**
1. 목표 설정 (SMART 기준)
2. 주간 계획 분할  
3. 일일 실행 계획
4. 진도 체크 방법
5. 복습 사이클

원하는 과목이나 목표를 알려주시면 더 구체적인 계획을 도와드릴 수 있습니다.

예시 질문:
- "수학 공부 계획을 세우고 싶어요"
- "영어 단어 암기 계획이 필요해요"
- "과학 실험 준비 계획을 도와주세요"`,
      timestamp: new Date(),
    },
  ]);

  const handleSendMessage = async (message: string) => {
    const now = Date.now();
    
    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: `user-${now}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);

    try {
      // OpenAI API 호출
      const response = await fetch('/api/tools/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          history: chatMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: ChatMessage = {
          id: `ai-${now + 1}`,
          role: 'ai',
          content: data.response,
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('API 호출 실패');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `ai-error-${now + 1}`,
        role: 'ai',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/tools" 
            className="inline-flex items-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            도구 목록으로 돌아가기
          </Link>
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
            📚 학습 계획 AI 어시스턴트
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            AI가 당신의 학습 목표에 맞는 맞춤형 계획을 제공합니다
          </p>
        </div>

        {/* Chat Interface */}
        <Card className="p-6">
          <AIChat
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            placeholder="학습 목표나 과목을 알려주세요..."
            className="h-[600px]"
          />
        </Card>

        {/* Tips */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            💡 효과적인 학습 계획을 위한 팁
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🎯 구체적인 목표 설정</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                "수학을 잘하고 싶다"보다는 "수학 모의고사 80점 이상"처럼 구체적으로
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">⏰ 현실적인 시간 계획</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                하루에 가능한 시간을 정확히 파악하고 계획에 반영하기
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">📊 정기적인 진도 체크</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                주간/월간 단위로 목표 달성도를 확인하고 계획 조정하기
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🔄 유연한 계획 수정</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                상황에 따라 계획을 조정하고 완벽주의에서 벗어나기
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}