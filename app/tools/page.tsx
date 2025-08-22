'use client';

import { useState } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Link from 'next/link';
import { BookOpen, Brain, Target, ArrowRight } from 'lucide-react';

const tools = [
  {
    id: 'study-plan',
    title: '📚 학습 계획 AI 어시스턴트',
    description: 'AI가 당신의 학습 목표에 맞는 맞춤형 계획을 제공합니다',
    features: [
      'SMART 기준 목표 설정',
      '월간/주간/일일 계획 수립',
      '과목별 맞춤 학습 방법',
      '진도 체크와 복습 사이클',
      '현실적이고 지속 가능한 계획'
    ],
    icon: BookOpen,
    href: '/tools/study-plan',
    color: 'bg-blue-500'
  },
  {
    id: 'study-type',
    title: '🔍 공부 유형 진단 AI',
    description: '16가지 공부 유형 중 당신에게 맞는 유형을 찾아보세요',
    features: [
      '4가지 축 기반 유형 분석',
      '16개 세부 유형 진단',
      '유형별 맞춤 학습 전략',
      '개인별 학습 환경 설정',
      '유형의 장점 활용 방안'
    ],
    icon: Brain,
    href: '/tools/study-type',
    color: 'bg-green-500'
  },
  {
    id: 'course-recommendation',
    title: '🎯 강좌 추천 AI',
    description: 'AI가 당신에게 맞는 최적의 인플루언서 강좌를 추천합니다',
    features: [
      '학습 목표와 수준 분석',
      '과목별 맞춤 강좌 추천',
      '인플루언서 강좌 데이터베이스 활용',
      '학습 스타일과 선호도 반영',
      '성공 가능성 높은 강좌 선택'
    ],
    icon: Target,
    href: '/tools/course-recommendation',
    color: 'bg-purple-500'
  }
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
            AI 학습 도구
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            OpenAI 기반 AI 어시스턴트로 효율적인 학습을 시작하세요
          </p>
        </div>

        {/* Notice */}
        <Alert variant="info" className="mb-8">
          <strong>안내:</strong> 모든 AI 도구는 OpenAI GPT-4 모델을 활용하여 실시간으로 맞춤형 응답을 제공합니다. 
          각 도구는 특화된 전문 지식을 바탕으로 최적의 학습 가이드를 제시합니다.
        </Alert>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {tools.map((tool) => (
            <Card key={tool.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <Link 
                  href={tool.href}
                  className="text-[var(--color-primary-500)] hover:text-[var(--color-primary-600)] transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-3">
                {tool.title}
              </h3>
              
              <p className="text-[var(--color-text-secondary)] mb-4">
                {tool.description}
              </p>
              
              <ul className="space-y-2 mb-6">
                {tool.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-[var(--color-text-tertiary)]">
                    <div className="w-1.5 h-1.5 bg-[var(--color-primary-500)] rounded-full mr-2"></div>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <Link href={tool.href}>
                <Button className="w-full">
                  도구 사용하기
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {/* How to Use */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
            🚀 AI 도구 사용 방법
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-[var(--color-primary-100)] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">도구 선택</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                학습 목표에 맞는 AI 도구를 선택하세요
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-[var(--color-primary-100)] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">질문 입력</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                구체적인 질문이나 상황을 자세히 설명하세요
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-[var(--color-primary-100)] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h4 className="font-medium text-[var(--color-text-primary)] mb-2">맞춤 응답</h4>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                AI가 당신에게 최적화된 답변을 제공합니다
              </p>
            </Card>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
            ✨ AI 도구의 장점
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-3">🎯 개인 맞춤형</h4>
              <p className="text-[var(--color-text-tertiary)]">
                당신의 수준, 목표, 선호도를 고려한 맞춤형 학습 가이드를 제공합니다.
              </p>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-3">⚡ 실시간 응답</h4>
              <p className="text-[var(--color-text-tertiary)]">
                질문에 즉시 답변하여 학습 흐름을 방해하지 않습니다.
              </p>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-3">🧠 전문 지식</h4>
              <p className="text-[var(--color-text-tertiary)]">
                각 도구별로 특화된 전문 지식을 바탕으로 정확한 정보를 제공합니다.
              </p>
            </Card>
            
            <Card className="p-6">
              <h4 className="font-medium text-[var(--color-text-primary)] mb-3">🔄 지속적 개선</h4>
              <p className="text-[var(--color-text-tertiary)]">
                대화를 통해 더 정확한 답변을 제공하고 학습 효과를 극대화합니다.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="p-8 bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] text-white">
            <h3 className="text-2xl font-semibold mb-4">
              지금 바로 AI 학습 도구를 체험해보세요!
            </h3>
            <p className="text-[var(--color-primary-100)] mb-6">
              위의 도구 중 하나를 선택하여 AI와 함께 학습 계획을 세우고, 
              공부 유형을 진단하고, 최적의 강좌를 찾아보세요.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {tools.map((tool) => (
                <Link key={tool.id} href={tool.href}>
                  <Button variant="secondary" className="bg-white text-[var(--color-primary-600)] hover:bg-gray-100">
                    {tool.title.split(' ')[0]} 시작하기
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}