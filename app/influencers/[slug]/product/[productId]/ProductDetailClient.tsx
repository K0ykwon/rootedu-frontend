'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Users, Star, Calendar, BookOpen, Award, MessageCircle, Sparkles, GraduationCap, ChevronRight, Zap, Shield, Target, TrendingUp } from 'lucide-react'
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
    process?: Array<{
      step: string
      content: string[]
    }>
    deliverables?: Array<{
      name: string
      description: string
    }>
    idealFor?: string[]
    differentiator?: {
      vs_full_consulting?: string
      vs_self_check?: string
      unique_value?: string
    }
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
  const [hoveredPhase, setHoveredPhase] = useState<number | null>(null)

  // Dynamic service type detection
  const isQuickDiagnostic = product.price < 100000
  const serviceType = isQuickDiagnostic ? "Quick Diagnostic" : "Premium Consulting"
  const badgeColor = isQuickDiagnostic ? "text-green-400" : "text-blue-400"
  const gradientColors = isQuickDiagnostic ? "from-green-900/20 via-teal-900/20 to-black" : "from-blue-900/20 via-purple-900/20 to-black"
  const glowColor1 = isQuickDiagnostic ? "bg-green-500/10" : "bg-blue-500/10"
  const glowColor2 = isQuickDiagnostic ? "bg-teal-500/10" : "bg-purple-500/10"

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Premium Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link 
            href={`/influencers/${influencerSlug}`}
            className="inline-flex items-center text-white/60 hover:text-white transition-all duration-300 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium tracking-wider uppercase">Back to Profile</span>
          </Link>
        </div>
      </div>

      {/* Hero Section with Glass Morphism */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientColors}`}></div>
          <div className={`absolute top-0 left-1/4 w-96 h-96 ${glowColor1} rounded-full blur-3xl animate-pulse`}></div>
          <div className={`absolute bottom-0 right-1/4 w-96 h-96 ${glowColor2} rounded-full blur-3xl animate-pulse delay-1000`}></div>
        </div>

        {/* Glass Card Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-5xl mx-auto px-6 text-center"
        >
          {/* Service Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full mb-8"
          >
            <Sparkles className={`w-4 h-4 ${badgeColor}`} />
            <span className={`text-xs font-semibold tracking-[0.2em] ${badgeColor} uppercase`}>{serviceType}</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent"
          >
            {product.title}
          </motion.h1>
          
          {product.subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl font-normal text-white/70 mb-8 tracking-normal"
            >
              {product.subtitle}
            </motion.p>
          )}
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed font-normal"
          >
            {product.summary}
          </motion.p>
          
          {/* Price and CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
          >
            <div className="text-left">
              <p className="text-xs font-semibold text-white/50 mb-2 tracking-[0.2em] uppercase">Investment</p>
              <p className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">₩{formatPrice(product.price)}</p>
            </div>
            
            <button className="group relative px-12 py-4 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-purple-600/80 rounded-full blur-sm group-hover:blur-md transition-all"></div>
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/20 rounded-full px-12 py-4 group-hover:bg-black/30 transition-all">
                <span className="text-white font-semibold tracking-wider uppercase text-sm">Start Now</span>
              </div>
            </button>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border border-white/20 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1 h-1 bg-white/60 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Features Grid - Glass Morphism */}
      <section className="relative py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { icon: Clock, title: '체계적 관리', desc: '학기별 필수 4회 + 추가 N회', color: 'from-blue-500 to-cyan-500' },
              { icon: Shield, title: '1:1 맞춤 컨설팅', desc: '개인별 맞춤 로드맵', color: 'from-purple-500 to-pink-500' },
              { icon: Zap, title: '실시간 피드백', desc: '상시 채팅 지원', color: 'from-amber-500 to-orange-500' }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/0 rounded-2xl"></div>
                <div className="relative p-8 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-500">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-2.5 mb-6`}>
                    <feature.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline/Process - Adaptive Design */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-20 tracking-tight"
          >
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              {product.description?.timeline ? "커리큘럼 타임라인" : "진단 프로세스"}
            </span>
          </motion.h2>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

            {/* Adaptive Timeline/Process Items */}
            {(() => {
              let timelineData = [];
              
              if (product.description?.timeline) {
                timelineData = product.description.timeline.map((item, i) => ({
                  phase: item.phase,
                  timing: item.timing,
                  icon: String(i + 1).padStart(2, '0'),
                  desc: item.content[0] || item.phase
                }));
              } else if (product.description?.process) {
                timelineData = product.description.process.map((item, i) => ({
                  phase: item.step,
                  timing: `${i + 1}단계`,
                  icon: String(i + 1).padStart(2, '0'),
                  desc: item.content[0] || item.step
                }));
              } else {
                timelineData = [
                  { phase: '진단 & 로드맵', timing: '학기 초', icon: '01', desc: '생기부 구조와 질을 객관적으로 진단' },
                  { phase: '중간점검 1', timing: '5월/10월', icon: '02', desc: '중간고사 성적 분석 및 로드맵 조정' },
                  { phase: '중간점검 2', timing: '7월/12월 초', icon: '03', desc: '기말고사 반영 및 완성도 점검' },
                  { phase: '마감 컨설팅', timing: '7-8월/12월 말', icon: '04', desc: '세특 최종 수정 및 보고서 완성' }
                ];
              }
              
              return timelineData.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex items-center mb-20 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                onMouseEnter={() => setHoveredPhase(i)}
                onMouseLeave={() => setHoveredPhase(null)}
              >
                <div className="flex-1" />
                
                {/* Center Node */}
                <div className="absolute left-1/2 -translate-x-1/2 z-10">
                  <div className="relative">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all duration-300 ${hoveredPhase === i ? 'scale-110' : ''}`}>
                      <span className="text-lg font-bold">{item.icon}</span>
                    </div>
                    {hoveredPhase === i && (
                      <div className="absolute inset-0 rounded-2xl bg-white/10 blur-xl animate-pulse"></div>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className={`flex-1 ${i % 2 === 0 ? 'pr-20 text-right' : 'pl-20'}`}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="inline-block"
                  >
                    <h3 className="text-2xl font-semibold mb-2">{item.phase}</h3>
                    <p className="text-white/50 text-xs font-medium tracking-[0.15em] uppercase mb-3">{item.timing}</p>
                    <p className="text-white/70 leading-relaxed">{item.desc}</p>
                  </motion.div>
                </div>
              </motion.div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* Program Details - Glass Cards */}
      <section className="relative py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-20 tracking-tight"
          >
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              프로그램 구성
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Essential Sessions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 p-2">
                    <BookOpen className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold">필수 세션</h3>
                </div>
                
                <div className="space-y-6">
                  {[
                    '생기부 진단 및 로드맵 설계',
                    '중간 점검 및 성적 분석',
                    '기말 점검 및 보완 전략',
                    '최종 마감 및 세특 완성'
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400"></div>
                      <span className="text-white/80 text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Additional Services */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2">
                    <MessageCircle className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold">추가 서비스</h3>
                </div>
                
                <div className="space-y-6">
                  {[
                    '장기 관리 수업 (N회 추가)',
                    '과목별 심화 보고서 작성',
                    '실시간 채팅 피드백',
                    '수행평가 및 발표 지원'
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-pink-400"></div>
                      <span className="text-white/80 text-sm leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Expected Outcomes - Minimal Grid */}
      <section className="relative py-32">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-20 tracking-tight"
          >
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              기대 효과
            </span>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {[
              { icon: Target, title: '유기적 스토리', desc: '흩어진 활동을 체계적으로 연결' },
              { icon: TrendingUp, title: '품질 향상', desc: '근거 기반 신뢰도 높은 세특' },
              { icon: Shield, title: '시간 효율화', desc: '핵심 시점 개입으로 품질 보장' },
              { icon: Award, title: '경쟁력 극대화', desc: '학생부종합전형 합격률 상승' }
            ].map((outcome, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-6"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center flex-shrink-0">
                  <outcome.icon className="w-5 h-5 text-white/60" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{outcome.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed">{outcome.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* P8 Specific Sections */}
      {product.description?.deliverables && (
        <section className="relative py-32">
          <div className="max-w-6xl mx-auto px-6">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-center mb-20 tracking-tight"
            >
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                제공 자료
              </span>
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {product.description.deliverables.map((deliverable, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-600/20 to-teal-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-teal-500 p-3 mb-6 flex items-center justify-center">
                      <BookOpen className="w-full h-full text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-green-100">{deliverable.name}</h3>
                    <p className="text-white/70 text-sm leading-relaxed">{deliverable.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {product.description?.differentiator && (
        <section className="relative py-32">
          <div className="max-w-4xl mx-auto px-6">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-bold text-center mb-20 tracking-tight"
            >
              <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                차별화 포인트
              </span>
            </motion.h2>

            <div className="space-y-8">
              {product.description.differentiator.vs_full_consulting && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-6 p-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl"
                >
                  <div className="w-2 h-16 bg-gradient-to-b from-green-400 to-teal-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-green-100">vs. 전체 컨설팅</h3>
                    <p className="text-white/70 text-sm">{product.description.differentiator.vs_full_consulting}</p>
                  </div>
                </motion.div>
              )}

              {product.description.differentiator.vs_self_check && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-6 p-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl"
                >
                  <div className="w-2 h-16 bg-gradient-to-b from-teal-400 to-green-400 rounded-full flex-shrink-0"></div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2 text-teal-100">vs. 혼자 점검</h3>
                    <p className="text-white/70 text-sm">{product.description.differentiator.vs_self_check}</p>
                  </div>
                </motion.div>
              )}

              {product.description.differentiator.unique_value && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-center p-8 backdrop-blur-xl bg-gradient-to-br from-green-600/10 to-teal-600/10 border border-green-500/20 rounded-3xl"
                >
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-green-500 to-teal-500 p-4 mx-auto mb-6">
                    <Zap className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-green-100">핵심 가치</h3>
                  <p className="text-white/80 text-lg leading-relaxed">{product.description.differentiator.unique_value}</p>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Target Audience */}
      <section className="relative py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl font-light mb-12 tracking-wide"
          >
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              추천 대상
            </span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4"
          >
            {(product.description?.idealFor || 
              product.description?.targetAudience || [
              '학생부종합전형 준비생',
              '체계적 관리 필요 학생',
              '세특 작성 어려움',
              '대입 경쟁력 향상'
            ]).map((tag, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full text-white/80 font-medium text-sm"
              >
                {tag}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA - Premium */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
        
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto px-6 text-center"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              지금 시작하세요
            </span>
          </h2>
          <p className="text-xl text-white/60 mb-12 font-normal">
            완벽한 생활기록부를 위한 첫 걸음
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-white text-black px-12 py-4 rounded-full font-semibold tracking-wider hover:bg-white/90 transition-all">
                수강 신청하기
              </div>
            </button>
            
            <button className="px-12 py-4 bg-white/5 backdrop-blur-xl border border-white/20 rounded-full font-medium tracking-wide hover:bg-white/10 transition-all">
              무료 상담 예약
            </button>
          </div>
        </motion.div>
      </section>
    </div>
  )
}