'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Play, Clock, ChevronRight, Search, Filter } from 'lucide-react'
import { motion } from 'framer-motion'
import VideoCard from '@/components/video/VideoCard'
import Card from '@/components/ui/Card'

interface ProductVideo {
  id: string
  url: string
  type: 'youtube'
  title: string
  description?: string
  order: number
  duration?: string
  chapter?: string
  thumbnail?: string
}

interface ProductWithVideos {
  productId: string
  productTitle: string
  influencerSlug: string
  influencerName: string
  videos: ProductVideo[]
  videoCount: number
  purchasedAt: number
  thumbnail?: string
}

interface MyVideosResponse {
  products: ProductWithVideos[]
  totalProducts: number
  totalVideos: number
  userId: string
}

export default function LearningSpacePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<MyVideosResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<ProductVideo | null>(null)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/learning-space')
      return
    }

    // Fetch user's videos
    async function fetchVideos() {
      try {
        setLoading(true)
        const response = await fetch('/api/user/my-videos')

        if (!response.ok) {
          throw new Error('Failed to fetch videos')
        }

        const result: MyVideosResponse = await response.json()
        setData(result)
      } catch (err) {
        console.error('Error fetching videos:', err)
        setError('영상을 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchVideos()
  }, [status, router])

  // Filter videos based on search query
  const filteredProducts = data?.products.filter(product => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    const matchProduct = product.productTitle.toLowerCase().includes(query)
    const matchInfluencer = product.influencerName.toLowerCase().includes(query)
    const matchVideo = product.videos.some(v =>
      v.title.toLowerCase().includes(query) ||
      v.description?.toLowerCase().includes(query)
    )

    return matchProduct || matchInfluencer || matchVideo
  })

  const handleVideoClick = (video: ProductVideo, productId: string) => {
    // Navigate to product detail page with video
    router.push(`/influencers/${data?.products.find(p => p.productId === productId)?.influencerSlug}/product/${productId}?video=${video.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[var(--color-primary-500)] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Card className="text-center py-12">
            <p className="text-red-500 text-lg">{error}</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[var(--color-primary-500)]" />
            나의 학습공간
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg">
            구매하신 강의의 모든 영상을 한 곳에서 확인하세요
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <Card className="text-center">
            <div className="text-3xl font-bold text-[var(--color-primary-500)]">
              {data?.totalProducts || 0}
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)] mt-1">
              구매한 강의
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-[var(--color-primary-500)]">
              {data?.totalVideos || 0}
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)] mt-1">
              전체 영상
            </div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-[var(--color-primary-500)]">
              0%
            </div>
            <div className="text-sm text-[var(--color-text-tertiary)] mt-1">
              평균 진행률
            </div>
          </Card>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="glass-card rounded-xl p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="강의, 선생님, 영상 제목으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            />
          </div>
        </motion.div>

        {/* Products with Videos */}
        {filteredProducts && filteredProducts.length > 0 ? (
          <div className="space-y-8">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.productId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card>
                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-6 pb-4 border-b border-[var(--color-border-secondary)]">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-text-primary)] mb-1">
                        {product.productTitle}
                      </h2>
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        {product.influencerName} · 영상 {product.videoCount}개
                      </p>
                    </div>
                    <Link
                      href={`/influencers/${product.influencerSlug}/product/${product.productId}`}
                      className="text-sm text-[var(--color-primary-500)] hover:text-[var(--color-primary-400)] flex items-center gap-1"
                    >
                      강의 페이지
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Video Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {product.videos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onClick={() => handleVideoClick(video, product.productId)}
                        showProgress={false}
                      />
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : searchQuery ? (
          <Card className="text-center py-12">
            <Search className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--color-text-secondary)] text-lg mb-2">
              검색 결과가 없습니다
            </p>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              다른 검색어로 시도해보세요
            </p>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <BookOpen className="w-16 h-16 text-[var(--color-text-tertiary)] mx-auto mb-4 opacity-50" />
            <p className="text-[var(--color-text-secondary)] text-lg mb-2">
              구매한 영상 강의가 없습니다
            </p>
            <p className="text-[var(--color-text-tertiary)] text-sm mb-6">
              영상이 포함된 강의를 구매하시면 여기에서 확인할 수 있습니다
            </p>
            <Link
              href="/influencers"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-primary-500)] text-white rounded-lg hover:bg-[var(--color-primary-600)] transition-colors"
            >
              <Play className="w-5 h-5" />
              강의 둘러보기
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
