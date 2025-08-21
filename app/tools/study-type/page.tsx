'use client';

import { useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import AIChat from '../../../components/ui/AIChat';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudyTypePage() {
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
      content: `안녕하세요! 공부 유형 진단 AI 어시스턴트입니다. 🔍

**📚 공부 유형 16분류 진단 시스템**

4가지 축으로 당신의 공부 유형을 분석합니다:

**1. 공부 환경**
🏠 솔로형 (Solo) vs 👥 그룹형 (Group)

**2. 공부 접근 방식**  
📅 계획형 (Planner) vs 🔥 즉흥형 (Spontaneous)

**3. 학습 스타일**
🧠 이론형 (Conceptual) vs 🛠️ 실전형 (Practical)

**4. 집중 패턴**
⏳ 장시간 몰입형 (Marathoner) vs ⚡ 단기 집중형 (Sprinter)

진단을 시작하려면 다음 중 하나를 선택해주세요:
- "진단 시작하기" - 질문을 통해 유형 분석
- "유형 설명 보기" - 16개 유형에 대한 상세 설명
- "나의 유형은?" - 간단한 질문으로 빠른 진단`,
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
      const response = await fetch('/api/tools/study-type', {
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
            🔍 공부 유형 진단 AI 어시스턴트
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            16가지 공부 유형 중 당신에게 맞는 유형을 찾아보세요
          </p>
        </div>

        {/* Chat Interface */}
        <Card className="p-6">
          <AIChat
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            placeholder="진단을 시작하거나 질문을 입력하세요..."
            className="h-[600px]"
          />
        </Card>

        {/* Study Type Overview */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            📊 공부 유형 16분류 개요
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🦉 철학자형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                S-P-C-M: 혼자, 계획적, 이론파, 장시간 몰입
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">📚 연구원형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                S-P-C-S: 혼자, 계획적, 이론파, 단기 집중
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🛠 장인형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                S-P-P-M: 혼자, 계획적, 실전파, 장시간 몰입
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🎯 스나이퍼형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                S-P-P-S: 혼자, 계획적, 실전파, 단기 집중
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🔮 몽상가형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                S-S-C-M: 혼자, 즉흥적, 이론파, 장시간 몰입
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🐿 탐구자형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                S-S-C-S: 혼자, 즉흥적, 이론파, 단기 집중
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🏋 도전자형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                S-S-P-M: 혼자, 즉흥적, 실전파, 장시간 몰입
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">⚡ 번개형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                S-S-P-S: 혼자, 즉흥적, 실전파, 단기 집중
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">👩‍🏫 교수형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                G-P-C-M: 그룹, 계획적, 이론파, 장시간 몰입
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">📖 토론가형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                G-P-C-S: 그룹, 계획적, 이론파, 단기 집중
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🏆 전략가형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                G-P-P-M: 그룹, 계획적, 실전파, 장시간 몰입
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🎮 게이머형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                G-P-P-S: 그룹, 계획적, 실전파, 단기 집중
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🎨 창작자형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                G-S-C-M: 그룹, 즉흥적, 이론파, 장시간 몰입
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🎤 디베이터형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                G-S-C-S: 그룹, 즉흥적, 이론파, 단기 집중
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🚀 개척자형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                G-S-P-M: 그룹, 즉흥적, 실전파, 장시간 몰입
              </p>
            </Card>
            <Card className="p-4">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">🔥 파이터형</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                G-S-P-S: 그룹, 즉흥적, 실전파, 단기 집중
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}