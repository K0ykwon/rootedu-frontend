'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, CheckCircle, Star, Calendar, BookOpen, Target, Award, MessageCircle, TrendingUp, FileText, Sparkles, GraduationCap, PenTool, ChevronRight, Heart } from 'lucide-react'
import { motion } from 'framer-motion'

interface Product {
  id: string
  title: string
  subtitle?: string
  price: number
  level: string
  thumbnail: string
  summary: string
  duration?: string
  format?: string
  features?: string[]
  description?: {
    overview?: string
    timeline?: Array<{
      phase: string
      timing: string
      duration: string
      content: string[]
      deliverables: string[]
    }>
    additionalServices?: {
      longTermManagement?: {
        title: string
        description: string
        modules: string[]
        duration: string
      }
      continuousFeedback?: {
        title: string
        description: string
        services: string[]
      }
    }
    expectedOutcomes?: string[]
    methodology?: {
      principle: string
      approach: string[]
    }
    targetAudience?: string[]
  }
}

interface ProductDetailClientProps {
  product: Product
  influencerSlug: string
}

export default function ProductDetailClient({ product, influencerSlug }: ProductDetailClientProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link 
            href={`/influencer/${influencerSlug}`}
            className="inline-flex items-center text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            돌아가기
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full opacity-5"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-white rounded-full opacity-5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">2024 최신 커리큘럼</span>
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              {product.title}
            </h1>
            
            {product.subtitle && (
              <p className="text-2xl text-white/90 mb-8 font-light">
                {product.subtitle}
              </p>
            )}
            
            <p className="text-lg text-white/80 mb-10 max-w-3xl mx-auto leading-relaxed">
              {product.summary}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-8 py-4">
                <p className="text-sm text-white/70 mb-1">수강료</p>
                <p className="text-4xl font-bold">₩{formatPrice(product.price)}</p>
              </div>
              
              <button className="px-10 py-4 bg-white text-indigo-600 rounded-full font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl">
                지금 신청하기
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Key Features */}
      <div className="relative -mt-10 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-4"
              >
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">체계적인 관리</h3>
                  <p className="text-sm text-gray-600">학기별 필수 4회 + 추가 N회</p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-start gap-4"
              >
                <div className="p-3 bg-green-100 rounded-xl">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">1:1 맞춤 컨설팅</h3>
                  <p className="text-sm text-gray-600">개인별 맞춤 로드맵 제공</p>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-start gap-4"
              >
                <div className="p-3 bg-purple-100 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">상시 피드백</h3>
                  <p className="text-sm text-gray-600">수업 사이 채팅 지원</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Timeline */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-indigo-600" />
                학기 타임라인
              </h2>
              
              <div className="space-y-4">
                {[
                  { icon: '🎯', title: '1회차', subtitle: '진단 & 로드맵', time: '시기 무관' },
                  { icon: '📊', title: '중간점검 1', subtitle: '중간고사 직후', time: '5월/10월' },
                  { icon: '📈', title: '중간점검 2', subtitle: '기말고사 직후', time: '7월/12월 초' },
                  { icon: '🎓', title: '마감 컨설팅', subtitle: '생기부 마감', time: '7-8월/12월 말' }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-indigo-500"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.subtitle}</p>
                        <p className="text-xs text-indigo-600 mt-1">{item.time}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-2">
            {/* Session Details */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    프로그램 상세 내용
                  </h2>
                </div>
                
                <div className="p-8 space-y-8">
                  {/* 1회차 */}
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                      1회차: 생기부 진단 & 로드맵 작성
                    </h3>
                    <p className="text-gray-600 mb-4">
                      현재 생기부의 구조와 질을 객관적으로 진단하고, 학기 내 실행 가능한 개인 맞춤 로드맵을 수립합니다.
                    </p>
                    <div className="space-y-2">
                      {[
                        '생기부 작성 요령 및 평가자 관점 이해',
                        '학생 스토리 파악 및 내러티브 점검',
                        '과목별 세특 및 성적 세부 진단',
                        '생기부 종합 평가 및 우선순위 선정'
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                          <span className="text-sm text-gray-700">{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {['개인 진단서', '종합평가 리포트', '과목별 진단표', '학기별 로드맵'].map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 중간점검 */}
                  <div className="border-l-4 border-green-500 pl-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                      중간점검 컨설팅 (1차 & 2차)
                    </h3>
                    <p className="text-gray-600 mb-4">
                      중간/기말 성적과 실제 실행도를 점검하여 로드맵을 현실화하고, 보고서/세특 품질을 끌어올립니다.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">중간점검 1</h4>
                        <p className="text-sm text-gray-600">중간고사 직후 실시</p>
                        <p className="text-xs text-gray-500 mt-1">5월 초 / 10월 초~중순</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">중간점검 2</h4>
                        <p className="text-sm text-gray-600">기말고사 직후 실시</p>
                        <p className="text-xs text-gray-500 mt-1">7월 초 / 12월 초~중순</p>
                      </div>
                    </div>
                  </div>

                  {/* 마감 컨설팅 */}
                  <div className="border-l-4 border-purple-500 pl-6">
                    <h3 className="text-xl font-bold mb-3 text-gray-900">
                      마감 컨설팅
                    </h3>
                    <p className="text-gray-600 mb-4">
                      로드맵을 최종 점검하고, 과목별 세특과 보고서를 마감 기준에 맞춰 완성합니다.
                    </p>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-900 font-medium">
                        💡 원칙: 세특은 대필하지 않습니다
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        컨설턴트는 가이드와 증빙을 준비하고, 학생과 함께 최종 문장을 완성합니다
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Additional Services */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  추가 서비스
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-600" />
                      장기 관리 수업 (N회)
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      필수 4회 외 추가 세션으로 과목별 보고서 작성과 세특 준비에 집중
                    </p>
                    <ul className="space-y-2">
                      {['과목별 심화 보고서 작성', '세특 준비 및 증빙 정리', '수행평가/발표 보조'].map((item, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-indigo-500 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      상시 피드백
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      수업 사이 채팅 지원으로 빠른 질의응답
                    </p>
                    <ul className="space-y-2">
                      {['보고서 주제 추천', '세특 문구 빠른 수정', '계획 점검 및 일정 조정'].map((item, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                          <ChevronRight className="w-4 h-4 text-green-500 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>

              {/* Expected Outcomes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6 text-orange-500" />
                  기대 효과
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { icon: '🎯', title: '유기적 스토리 설계', desc: '흩어진 활동을 체계적 구조로 연결' },
                    { icon: '📈', title: '기록 품질 향상', desc: '근거와 결과가 연결된 신뢰도 높은 세특' },
                    { icon: '⏰', title: '시간 관리 효율화', desc: '핵심 시점 개입으로 막판 품질 저하 방지' },
                    { icon: '🏆', title: '학생부종합전형 경쟁력', desc: '대입 경쟁력 극대화' }
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-2xl">{item.icon}</span>
                      <div>
                        <h3 className="font-bold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Target Audience */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-indigo-600" />
                  이런 학생에게 추천해요
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    '학생부종합전형 준비 학생',
                    '체계적 생기부 관리가 필요한 학생',
                    '세특 작성에 어려움을 겪는 학생',
                    '대입 경쟁력을 높이고자 하는 학생'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-indigo-50 transition-colors">
                      <Heart className="w-5 h-5 text-red-400" />
                      <span className="text-gray-800">{item}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              지금 바로 시작하세요! 🚀
            </h2>
            <p className="text-xl mb-10 text-white/90">
              체계적인 관리로 완벽한 생활기록부를 만들어보세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-indigo-600 rounded-full font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all shadow-xl">
                수강 신청하기
              </button>
              <button className="px-8 py-4 bg-white/20 backdrop-blur-md text-white rounded-full font-bold text-lg hover:bg-white/30 transition-all">
                무료 상담 신청
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}