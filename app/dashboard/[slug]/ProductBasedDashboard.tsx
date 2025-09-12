'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import { ValidationResults } from '@/components/medsky/ValidationResults'

interface StudentInfo {
  userId: string
  name: string
  email: string
  purchaseDate: string
  purchaseStatus: string
  analysisCount: number
  lastAnalysis?: any
  profileGenerated: boolean
  generatedProfile?: string
}

interface ProductWithStudents {
  productId: string
  productName: string
  productDescription: string
  price: number
  studentCount: number
  students: StudentInfo[]
}

interface ProductBasedDashboardProps {
  influencerSlug: string
}

export default function ProductBasedDashboard({ influencerSlug }: ProductBasedDashboardProps) {
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null)
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [generatingProfile, setGeneratingProfile] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [selectedAnalysisData, setSelectedAnalysisData] = useState<any | null>(null)
  const [modalMode, setModalMode] = useState<'analysis' | 'profile'>('analysis')

  useEffect(() => {
    loadProductsWithStudents()
  }, [influencerSlug])

  const loadProductsWithStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/${influencerSlug}/students-by-product`)
      
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
        
        // Auto-expand first product if it has students
        if (data.products.length > 0 && data.products[0].studentCount > 0) {
          setExpandedProducts(new Set([data.products[0].productId]))
        }
      } else {
        toast.error('학생 정보를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('Error loading products with students:', error)
      toast.error('데이터 로딩 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleProduct = (productId: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  const generateProfile = async (student: StudentInfo, productId: string) => {
    if (!student.lastAnalysis?.sessionId) {
      toast.error('분석 데이터가 없습니다.')
      return
    }

    setGeneratingProfile(`${student.userId}-${productId}`)
    
    try {
      const response = await fetch(`/api/dashboard/${influencerSlug}/generate-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: student.lastAnalysis.sessionId,
          userId: student.userId,
          productId
        })
      })

      if (response.ok) {
        toast.success('프로필이 생성되었습니다!')
        await loadProductsWithStudents() // Reload to show updated profile
      } else {
        toast.error('프로필 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error generating profile:', error)
      toast.error('프로필 생성 중 오류가 발생했습니다.')
    } finally {
      setGeneratingProfile(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const totalStudents = products.reduce((sum, p) => sum + p.studentCount, 0)

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-[var(--color-border-primary)]">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">총 제품 수</h3>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{products.length}개</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border-[var(--color-border-primary)]">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">총 학생 수</h3>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{totalStudents}명</p>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-[var(--color-border-primary)]">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">평균 학생 수</h3>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">
              {products.length > 0 ? (totalStudents / products.length).toFixed(1) : 0}명
            </p>
          </div>
        </Card>
      </div>

      {/* Products and Students */}
      {products.length === 0 ? (
        <Card className="bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]">
          <div className="p-12 text-center">
            <p className="text-[var(--color-text-tertiary)] text-lg">아직 등록된 제품이 없습니다.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <Card key={product.productId} className="bg-[var(--color-bg-secondary)] border-[var(--color-border-primary)]">
              <div className="p-6">
                {/* Product Header */}
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleProduct(product.productId)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-white dark:text-white font-bold text-lg">
                        {product.productName.substring(0, 1)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--color-text-primary)]">
                        {product.productName}
                      </h3>
                      <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                        {product.studentCount}명의 학생 | ₩{product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-3 py-1 bg-[var(--color-bg-tertiary)] rounded-full text-sm text-[var(--color-text-secondary)]">
                      {product.studentCount} 학생
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/influencers/${influencerSlug}/product/${product.productId}`)
                      }}
                    >
                      제품 상세
                    </Button>
                    <div className={`transform transition-transform ${expandedProducts.has(product.productId) ? 'rotate-180' : ''}`}>
                      <svg className="w-5 h-5 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Students List */}
                {expandedProducts.has(product.productId) && (
                  <div className="mt-6 space-y-3">
                    {product.students.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-[var(--color-text-quaternary)]">아직 이 제품을 구매한 학생이 없습니다.</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-3">
                          {product.students.map((student) => (
                            <div
                              key={student.userId}
                              className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 hover:bg-[var(--color-bg-quaternary)] transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                                      <span className="text-white dark:text-white font-semibold">
                                        {student.name.substring(0, 1)}
                                      </span>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-[var(--color-text-primary)]">
                                        {student.name}
                                      </h4>
                                      <p className="text-xs text-[var(--color-text-tertiary)]">
                                        {student.email}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                      <span className="text-[var(--color-text-quaternary)]">구매일:</span>
                                      <p className="text-[var(--color-text-secondary)]">
                                        {new Date(student.purchaseDate).toLocaleDateString('ko-KR')}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[var(--color-text-quaternary)]">상태:</span>
                                      <p className={`font-semibold ${
                                        student.purchaseStatus === 'active' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                                      }`}>
                                        {student.purchaseStatus === 'active' ? '활성' : '만료'}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-[var(--color-text-quaternary)]">분석 횟수:</span>
                                      <p className="text-[var(--color-text-secondary)]">{student.analysisCount}회</p>
                                    </div>
                                    <div>
                                      <span className="text-[var(--color-text-quaternary)]">프로필:</span>
                                      <p className={`font-semibold ${
                                        student.profileGenerated ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--color-text-quaternary)]'
                                      }`}>
                                        {student.profileGenerated ? '생성됨' : '미생성'}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2 ml-4">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={async () => {
                                      setSelectedStudent(student)
                                      setShowStudentModal(true)
                                      setModalMode('analysis')
                                      setSelectedAnalysisData(null)
                                      setAnalysisLoading(true)
                                      try {
                                        const la: any = student.lastAnalysis || {}
                                        
                                        // Try to get analysis data from various possible locations
                                        let analysisData = null
                                        
                                        // Check if the data is directly on lastAnalysis
                                        if (la.textSections && la.extractedData && la.validationAnalysis) {
                                          analysisData = { 
                                            textSections: la.textSections, 
                                            extractedData: la.extractedData, 
                                            validationAnalysis: la.validationAnalysis 
                                          }
                                        }
                                        // Check if it's under analysis property
                                        else if (la.analysis?.textSections && la.analysis?.extractedData && la.analysis?.validationAnalysis) {
                                          analysisData = { 
                                            textSections: la.analysis.textSections, 
                                            extractedData: la.analysis.extractedData, 
                                            validationAnalysis: la.analysis.validationAnalysis 
                                          }
                                        }
                                        // Check if it's under result property
                                        else if (la.result?.textSections && la.result?.extractedData && la.result?.validationAnalysis) {
                                          analysisData = { 
                                            textSections: la.result.textSections, 
                                            extractedData: la.result.extractedData, 
                                            validationAnalysis: la.result.validationAnalysis 
                                          }
                                        }

                                        if (analysisData) {
                                          setSelectedAnalysisData(analysisData)
                                        } else if (la.sessionId) {
                                          // If we have sessionId but no analysis data, fetch from API
                                          const resp = await fetch(`/api/dashboard/${influencerSlug}/analysis-results`)
                                          if (resp.ok) {
                                            const data = await resp.json()
                                            const found = (data.results || []).find((r: any) => r.sessionId === la.sessionId)
                                            if (found?.analysisData) {
                                              setSelectedAnalysisData(found.analysisData)
                                            }
                                          }
                                        }
                                      } catch (error) {
                                        console.error('Error loading analysis data:', error)
                                      } finally {
                                        setAnalysisLoading(false)
                                      }
                                    }}
                                  >
                                    분석 보기
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      if (student.lastAnalysis?.sessionId) {
                                        router.push(`/dashboard/${influencerSlug}/chat?sessionId=${student.lastAnalysis.sessionId}`)
                                      } else {
                                        // Start a new chat for this student
                                        router.push(`/dashboard/${influencerSlug}/chat?userId=${student.userId}`)
                                      }
                                    }}
                                  >
                                    학생 관련 질문하기
                                  </Button>
                                  
                                  {!student.profileGenerated ? (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => {
                                        if (student.lastAnalysis?.sessionId) {
                                          generateProfile(student, product.productId)
                                        } else {
                                          toast.error('분석 데이터가 없습니다. 먼저 생활기록부 분석을 실행해주세요.')
                                        }
                                      }}
                                      disabled={generatingProfile === `${student.userId}-${product.productId}`}
                                    >
                                      {generatingProfile === `${student.userId}-${product.productId}` 
                                        ? '생성중...' 
                                        : '프로필 생성'
                                      }
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedStudent(student)
                                        setModalMode('profile')
                                        setShowStudentModal(true)
                                      }}
                                    >
                                      프로필 보기
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-primary)] rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--color-border-primary)]">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {modalMode === 'analysis' ? '분석 상세 결과' : '생성된 학생 프로필'} - {selectedStudent.name}
                </h3>
                <div className="flex gap-2">
                  {selectedStudent.lastAnalysis && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const analysisUrl = `/dashboard/${influencerSlug}/analysis/${selectedStudent.lastAnalysis.sessionId}`;
                        window.open(analysisUrl, '_blank');
                      }}
                    >
                      새 탭에서 보기
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowStudentModal(false)
                      setSelectedStudent(null)
                      setSelectedAnalysisData(null)
                      setModalMode('analysis')
                    }}
                  >
                    닫기
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {modalMode === 'profile' ? (
                // Show profile directly when in profile mode
                <div className="space-y-6">
                  {selectedStudent.generatedProfile ? (
                    <div className="bg-[var(--color-bg-secondary)] rounded-lg p-6">
                      <div className="prose prose-sm max-w-none text-[var(--color-text-primary)]">
                        {selectedStudent.generatedProfile.split('\n').map((paragraph: string, index: number) => (
                          <p key={index} className="mb-4 last:mb-0 whitespace-pre-wrap">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-[var(--color-text-secondary)]">프로필이 생성되지 않았습니다.</p>
                    </div>
                  )}
                </div>
              ) : analysisLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary-500)] mx-auto mb-4"></div>
                  <p className="text-[var(--color-text-secondary)]">로딩중...</p>
                </div>
              ) : selectedAnalysisData ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                      생활기록부 분석 결과
                    </h4>
                    <p className="text-[var(--color-text-secondary)]">
                      AI가 분석한 진로 역량, 구체적 노력, 연계성 등의 종합 결과입니다
                    </p>
                  </div>

                  <ValidationResults
                    textSections={selectedAnalysisData.textSections}
                    extractedData={selectedAnalysisData.extractedData}
                    validationAnalysis={selectedAnalysisData.validationAnalysis}
                    activeFilters={['blue_highlight', 'red_line', 'blue_line', 'black_line', 'red_check']}
                    onFilterChange={() => {}}
                  />

                  {/* Generated Profile */}
                  {selectedStudent.profileGenerated && selectedStudent.generatedProfile && (
                    <div className="mt-6 border-t border-[var(--color-border-primary)] pt-6">
                      <h4 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">생성된 학생 프로필</h4>
                      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
                        <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed">
                          {selectedStudent.generatedProfile}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Fallback matching analysis view format when no ValidationResults data
                <div className="space-y-6">
                  {selectedStudent.lastAnalysis && (
                    <div>
                      <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-3">분석 데이터</h4>
                      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
                        <pre className="text-sm text-[var(--color-text-secondary)] whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(selectedStudent.lastAnalysis, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {!selectedStudent.lastAnalysis && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📊</div>
                      <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                        분석 데이터가 없습니다
                      </h3>
                      <p className="text-[var(--color-text-secondary)]">
                        이 학생의 분석 결과를 보려면 먼저 생활기록부 분석을 실행해주세요.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}