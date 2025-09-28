'use client';

/**
 * Christine AI Learning Tool
 *
 * 3가지 핵심 기능:
 * 1. Core Phrase 패턴 연습 - 보유 데이터 기반 빈칸/문장 생성 연습
 * 2. Role-play 대화 - 상황 입력 기반 자연스러운 대화 루틴 습득
 * 3. 단어 암기 시스템 - SRS 기반 체계적 단어 학습
 */

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { CorePhrasePatternPractice } from './CorePhrasePatternPractice';
import { RolePlayConversation } from './RolePlayConversation';
import { ChristineVocabulary } from './ChristineVocabulary';

type ToolType = 'menu' | 'core-phrase' | 'role-play' | 'vocabulary';

export function ChristineAILearningTool() {
  const { data: session, status: sessionStatus } = useSession();
  const [currentTool, setCurrentTool] = useState<ToolType>('menu');

  // Show loading while checking authentication
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-[var(--color-text-primary)]">로딩 중...</div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!session) {
    return (
      <Card className="p-8 text-center" glass={false}>
        <div className="space-y-4">
          <span className="text-6xl">🔒</span>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            로그인이 필요합니다
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Christine의 무료 AI 영어 학습 도구를 이용하려면 먼저 로그인해주세요.
          </p>
          <Button
            onClick={() => signIn()}
            variant="primary"
            size="lg"
          >
            로그인하기
          </Button>
        </div>
      </Card>
    );
  }

  // Render tool selection menu
  if (currentTool === 'menu') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6" glass={false}>
          <div className="text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
              <span className="text-5xl">💬</span>
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Christine AI 영어 학습 도구
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto">
              Christine과 함께하는 실용적인 영어 회화 학습!
              체계적인 패턴 연습부터 실전 대화까지 완벽 마스터하세요.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="primary" size="sm">무료 제공</Badge>
              <Badge variant="success" size="sm">AI 맞춤 학습</Badge>
              <Badge variant="warning" size="sm">실전 회화 특화</Badge>
            </div>
          </div>
        </Card>

        {/* Tool Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Core Phrase Pattern Practice */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" glass={false}
                onClick={() => setCurrentTool('core-phrase')}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Core Phrase 패턴 연습
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                여행, 스몰토크, 비즈니스 핵심 패턴을 체계적으로 연습하고 변형 학습하세요.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="info" size="sm">패턴 변형</Badge>
                <Badge variant="success" size="sm">빈칸 채우기</Badge>
                <Badge variant="warning" size="sm">문장 생성</Badge>
              </div>
              <Button variant="primary" className="w-full">
                📝 패턴 연습 시작하기
              </Button>
            </div>
          </Card>

          {/* Role-play Conversation */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" glass={false}
                onClick={() => setCurrentTool('role-play')}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">🎭</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                Role-play 대화 연습
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                상황을 입력하면 AI가 맞춤형 대화를 생성해 자연스러운 회화 루틴을 습득하세요.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="primary" size="sm">상황별 대화</Badge>
                <Badge variant="success" size="sm">실시간 피드백</Badge>
                <Badge variant="warning" size="sm">자연스러운 표현</Badge>
              </div>
              <Button variant="primary" className="w-full">
                🎭 Role-play 시작하기
              </Button>
            </div>
          </Card>

          {/* Vocabulary Memorization */}
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" glass={false}
                onClick={() => setCurrentTool('vocabulary')}>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                실용 단어 암기 시스템
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                여행, 비즈니스, 일상 회화에 꼭 필요한 단어들을 체계적으로 암기하세요.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Badge variant="primary" size="sm">SRS 복습</Badge>
                <Badge variant="success" size="sm">실용 단어</Badge>
                <Badge variant="warning" size="sm">상황별 분류</Badge>
              </div>
              <Button variant="primary" className="w-full">
                📚 단어 암기 시작하기
              </Button>
            </div>
          </Card>
        </div>

        {/* Features Comparison */}
        <Card className="p-6" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            💡 도구별 특징 비교
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-3">📝 Core Phrase 패턴 연습</h4>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li>• 3개월차 체계적 커리큘럼 기반</li>
                <li>• 여행/스몰토크/비즈니스 핵심 패턴</li>
                <li>• AI 자동 변형 문제 생성</li>
                <li>• 빈칸 채우기 + 문장 완성</li>
                <li>• 단계별 난이도 조절</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-3">🎭 Role-play 대화 연습</h4>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li>• 사용자 입력 상황 기반 대화 생성</li>
                <li>• AI와 실시간 대화 연습</li>
                <li>• 자연스러운 표현 학습</li>
                <li>• 맞춤형 피드백 제공</li>
                <li>• 실전 회화 능력 향상</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-3">📚 실용 단어 암기</h4>
              <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li>• SRS 알고리즘 기반 효율적 암기</li>
                <li>• 상황별 분류된 실용 단어</li>
                <li>• 문맥 중심 예문 제공</li>
                <li>• 개인 맞춤 복습 일정</li>
                <li>• 진도 추적 및 성취 분석</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Christine's Specialties */}
        <Card className="p-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20" glass={false}>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <span>💎</span> Christine만의 특별함
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-pink-600 dark:text-pink-400 mb-2">🌟 실전 중심 학습</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                교과서적인 영어가 아닌, 실제 원어민들이 사용하는 자연스러운 표현을 중심으로 학습합니다.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">🎯 상황별 맞춤 학습</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                여행, 비즈니스, 일상 대화 등 구체적인 상황에 따라 필요한 표현을 효과적으로 학습할 수 있습니다.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-pink-600 dark:text-pink-400 mb-2">🤖 AI 맞춤형 피드백</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                개인의 학습 수준과 약점을 분석해 맞춤형 문제와 피드백을 제공합니다.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 dark:text-purple-400 mb-2">📈 체계적 진도 관리</h4>
              <p className="text-sm text-[var(--color-text-secondary)]">
                학습 진도와 성취도를 체계적으로 추적하여 효과적인 학습 경로를 제시합니다.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Render Core Phrase Pattern Practice
  if (currentTool === 'core-phrase') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setCurrentTool('menu')}
            variant="outline"
            size="sm"
          >
            ← 도구 선택으로
          </Button>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            📝 Core Phrase 패턴 연습
          </h2>
        </div>
        <CorePhrasePatternPractice />
      </div>
    );
  }

  // Render Role-play Conversation
  if (currentTool === 'role-play') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setCurrentTool('menu')}
            variant="outline"
            size="sm"
          >
            ← 도구 선택으로
          </Button>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            🎭 Role-play 대화 연습
          </h2>
        </div>
        <RolePlayConversation />
      </div>
    );
  }

  // Render Vocabulary Memorization
  if (currentTool === 'vocabulary') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setCurrentTool('menu')}
            variant="outline"
            size="sm"
          >
            ← 도구 선택으로
          </Button>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            📚 실용 단어 암기 시스템
          </h2>
        </div>
        <ChristineVocabulary />
      </div>
    );
  }

  return null;
}