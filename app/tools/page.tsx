'use client';

import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import AIChat from '../../components/ui/AIChat';

const presetPrompts = [
  {
    id: 'study-plan',
    title: '학습 계획 템플릿',
    description: '효율적인 학습 계획을 세워보세요',
    prompt: '안녕하세요! 다음과 같은 학습 계획 템플릿을 제공합니다:\n\n📚 **월간 학습 계획**\n1. 목표 설정 (SMART 기준)\n2. 주간 계획 분할\n3. 일일 실행 계획\n4. 진도 체크 방법\n5. 복습 사이클\n\n원하는 과목이나 목표를 알려주시면 더 구체적인 계획을 도와드릴 수 있습니다.'
  },
  {
    id: 'subject-questions',
    title: '과목별 질문 가이드',
    description: '각 과목별 핵심 질문들을 확인하세요',
    prompt: '📖 **과목별 핵심 질문 가이드**\n\n**수학**: 개념 이해도, 문제 유형 분석, 풀이 과정\n**과학**: 실험 원리, 개념 연결, 응용 능력\n**언어**: 독해력, 어휘력, 표현력\n**사회**: 사건 연관성, 비판적 사고, 시사 연결\n\n어떤 과목에 대해 더 자세한 질문 리스트를 원하시나요?'
  },
  {
    id: 'course-recommendation',
    title: '강좌 추천 질문',
    description: '나에게 맞는 강좌를 찾는 질문들',
    prompt: '🎯 **강좌 선택 가이드**\n\n다음 질문들을 통해 최적의 강좌를 찾아보세요:\n\n1. 현재 실력 수준은?\n2. 목표하는 성취 수준은?\n3. 선호하는 학습 방식은?\n4. 가능한 학습 시간은?\n5. 특별히 보완하고 싶은 부분은?\n\n이 정보를 바탕으로 RootEdu의 인플루언서 강좌 중 적합한 것을 추천해드릴 수 있습니다.'
  }
];

export default function ToolsPage() {
  type ChatMessage = {
    id: string;
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
  };

  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const handleToolSelect = (toolId: string) => {
    const tool = presetPrompts.find(p => p.id === toolId);
    if (tool) {
      setSelectedTool(toolId);
      setChatMessages([
        {
          id: `ai-${Date.now()}`,
          role: 'ai',
          content: tool.prompt,
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleSendMessage = (message: string) => {
    const now = Date.now();
    setChatMessages(prev => [
      ...prev,
      {
        id: `user-${now}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      },
      {
        id: `ai-${now + 1}`,
        role: 'ai',
        content:
          '죄송합니다. 현재는 템플릿 기반 응답만 제공됩니다. 고도화된 AI 기능은 멘토 상품과 연동하여 제공될 예정입니다.',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
            AI 학습 도구
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            AI 기반 학습 도구로 효율적인 학습을 시작하세요
          </p>
        </div>

        {/* Notice */}
        <Alert variant="info" className="mb-8">
          <strong>안내:</strong> 고도화된 AI 기능은 멘토 상품과 연동됩니다. 
          현재는 기본 템플릿을 체험해보실 수 있습니다.
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tool Selection */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              도구 선택
            </h3>
            <div className="space-y-4">
              {presetPrompts.map((tool) => (
                <Card 
                  key={tool.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTool === tool.id 
                      ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-50)]' 
                      : 'hover:border-[var(--color-border-secondary)]'
                  }`}
                  onClick={() => handleToolSelect(tool.id)}
                >
                  <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                    {tool.title}
                  </h4>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    {tool.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              AI 어시스턴트
            </h3>
            
            {selectedTool ? (
              <AIChat
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                placeholder="질문을 입력하세요..."
                className="h-96"
              />
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[var(--color-bg-tertiary)] rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-[var(--color-text-quaternary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                    도구를 선택하세요
                  </h4>
                  <p className="text-[var(--color-text-tertiary)]">
                    왼쪽에서 사용할 AI 도구를 선택하면 채팅을 시작할 수 있습니다.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Feature Preview */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
            향후 제공 예정인 기능
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <div className="w-12 h-12 bg-[var(--color-primary-500)] rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                개인 맞춤 분석
              </h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                학습 패턴을 분석하여 개인 맞춤 학습 계획을 제공합니다.
              </p>
            </Card>

            <Card>
              <div className="w-12 h-12 bg-[var(--color-primary-500)] rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                스마트 문제 추천
              </h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                실력 수준과 약점을 분석하여 최적의 문제를 추천합니다.
              </p>
            </Card>

            <Card>
              <div className="w-12 h-12 bg-[var(--color-primary-500)] rounded-lg mb-4 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">
                실시간 튜터링
              </h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                AI 튜터와 실시간으로 질문하고 답변을 받을 수 있습니다.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}